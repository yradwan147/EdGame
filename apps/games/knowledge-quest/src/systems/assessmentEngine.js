/**
 * assessmentEngine.js -- Stealth assessment engine for Knowledge Quest.
 *
 * Computes learning analytics from accumulated gameplay data across
 * six dimensions:
 *
 *   D1  Cognitive Knowledge  -- accuracy, speed, speed-accuracy profile, mastery by subject
 *   D2  Behavioral Engagement -- play time, chapters completed, voluntary replays, exploration
 *   D3  Strategic Behavior   -- spell diversity, combat strategy, difficulty selection, hint efficiency
 *   D4  Social Interaction   -- companion trust changes, NPC interactions
 *   D5  Affective (PRIMARY)  -- dialogue empathy, hint-seeking pattern, persistence,
 *                                growth mindset, emotional regulation
 *   D6  Temporal             -- chapter performance trend, learning velocity, response time improvement
 *
 * Adapted from Concept Cascade's assessment engine with RPG-specific metrics.
 */

export function createAssessmentEngine({ gameStateStore, telemetry }) {

    /* ------------------------------------------------------------------ */
    /*  Helpers                                                            */
    /* ------------------------------------------------------------------ */

    /** Shannon entropy of a distribution array, normalised to 0-1. */
    function shannonEntropy(counts) {
        const total = counts.reduce((s, c) => s + c, 0);
        if (total === 0) return 0;
        const maxEntropy = Math.log2(counts.length || 1);
        if (maxEntropy === 0) return 0;

        let entropy = 0;
        for (const c of counts) {
            if (c === 0) continue;
            const p = c / total;
            entropy -= p * Math.log2(p);
        }
        return entropy / maxEntropy;
    }

    /** Extract events of a given type from the current telemetry session. */
    function eventsOfType(type) {
        const session = telemetry.getCurrentSession();
        if (!session) return [];
        return session.events.filter((e) => e.type === type);
    }

    function questionEvents() {
        return eventsOfType("question_answered");
    }

    /* ------------------------------------------------------------------ */
    /*  D1 -- Cognitive Knowledge                                          */
    /* ------------------------------------------------------------------ */

    function computeD1() {
        const state = gameStateStore.getState();
        const qEvents = questionEvents();

        const correctnessRate = state.questionsAnswered > 0
            ? state.questionsCorrect / state.questionsAnswered
            : 0;

        const totalResponseMs = qEvents.reduce(
            (sum, e) => sum + (e.payload.responseTimeMs || 0), 0,
        );
        const avgResponseTimeMs = qEvents.length > 0
            ? Math.round(totalResponseMs / qEvents.length)
            : 0;

        // Speed-accuracy profile
        const fast = avgResponseTimeMs < 5000;
        const accurate = correctnessRate >= 0.7;
        let speedAccuracyProfile;
        if (fast && accurate) speedAccuracyProfile = "fast_accurate";
        else if (fast && !accurate) speedAccuracyProfile = "fast_inaccurate";
        else if (!fast && accurate) speedAccuracyProfile = "slow_accurate";
        else speedAccuracyProfile = "slow_inaccurate";

        // Mastery by subject
        const masteryBySubject = {};
        const subjectTotals = {};
        const subjectCorrect = {};
        for (const e of qEvents) {
            const subj = e.payload.subject || "unknown";
            subjectTotals[subj] = (subjectTotals[subj] || 0) + 1;
            if (e.payload.correct) {
                subjectCorrect[subj] = (subjectCorrect[subj] || 0) + 1;
            }
        }
        for (const subj of Object.keys(subjectTotals)) {
            masteryBySubject[subj] = Math.round(
                ((subjectCorrect[subj] || 0) / subjectTotals[subj]) * 100,
            ) / 100;
        }

        return { correctnessRate, avgResponseTimeMs, speedAccuracyProfile, masteryBySubject };
    }

    /* ------------------------------------------------------------------ */
    /*  D2 -- Behavioral Engagement                                        */
    /* ------------------------------------------------------------------ */

    function computeD2() {
        const state = gameStateStore.getState();

        const totalPlayTimeMs = state.elapsedMs || (Date.now() - state.startedAt);
        const chaptersCompleted = state.chapter - 1; // chapters fully completed before current

        // Voluntary replays -- count "combat_ended" events with result "defeat"
        // followed by another combat in the same node (retry)
        const combatEndEvents = eventsOfType("combat_ended");
        const voluntaryReplays = combatEndEvents.filter(
            (e) => e.payload.result === "defeat",
        ).length;

        // Exploration thoroughness: visited nodes vs total available
        // We track visitedNodes in state; total nodes would come from map config.
        // Approximate: ratio of visited to total (assume 10 per chapter as baseline).
        const expectedNodesPerChapter = 10;
        const totalExpected = expectedNodesPerChapter * state.chapter;
        const explorationThoroughness = totalExpected > 0
            ? Math.min(1, Math.round((state.visitedNodes.length / totalExpected) * 100) / 100)
            : 0;

        return { totalPlayTimeMs, chaptersCompleted, voluntaryReplays, explorationThoroughness };
    }

    /* ------------------------------------------------------------------ */
    /*  D3 -- Strategic Behavior                                           */
    /* ------------------------------------------------------------------ */

    function computeD3() {
        const state = gameStateStore.getState();

        // Spell diversity (Shannon entropy of spells cast)
        const spellChoiceEvents = eventsOfType("spell_choice");
        const spellCounts = {};
        for (const e of spellChoiceEvents) {
            const id = e.payload.spellId || "unknown";
            spellCounts[id] = (spellCounts[id] || 0) + 1;
        }
        const spellCountValues = Object.values(spellCounts);
        const spellDiversity = spellCountValues.length > 1
            ? shannonEntropy(spellCountValues)
            : 0;

        // Combat strategy: offensive vs defensive ratio
        const totalOffensive = state.spellsCast;
        const totalDefensive = state.defendActions;
        const totalCombatActions = totalOffensive + totalDefensive;
        let combatStrategy;
        if (totalCombatActions === 0) {
            combatStrategy = "none";
        } else {
            const offenseRatio = totalOffensive / totalCombatActions;
            if (offenseRatio >= 0.75) combatStrategy = "aggressive";
            else if (offenseRatio >= 0.5) combatStrategy = "balanced_offensive";
            else if (offenseRatio >= 0.25) combatStrategy = "balanced_defensive";
            else combatStrategy = "defensive";
        }

        // Difficulty selection -- average requested difficulty from spell choices
        const difficulties = spellChoiceEvents
            .map((e) => e.payload.difficulty)
            .filter((d) => d != null);
        const avgDifficulty = difficulties.length > 0
            ? Math.round((difficulties.reduce((s, d) => s + d, 0) / difficulties.length) * 100) / 100
            : 0;
        let difficultySelection;
        if (avgDifficulty >= 4) difficultySelection = "risk_taking";
        else if (avgDifficulty >= 2.5) difficultySelection = "moderate";
        else difficultySelection = "cautious";

        // Hint efficiency: hints used vs questions answered correctly after hints
        const hintEvents = eventsOfType("hint_requested");
        const hintCount = hintEvents.length;
        // Approximate: look at questions answered within 30s after a hint
        const qEvents = questionEvents();
        let correctAfterHint = 0;
        for (const hint of hintEvents) {
            const nextQ = qEvents.find((q) => q.ts > hint.ts && q.ts - hint.ts < 30000);
            if (nextQ && nextQ.payload.correct) correctAfterHint += 1;
        }
        const hintEfficiency = hintCount > 0
            ? Math.round((correctAfterHint / hintCount) * 100) / 100
            : 0;

        return {
            spellDiversity,
            combatStrategy,
            difficultySelection,
            hintEfficiency,
            offenseDefenseRatio: totalCombatActions > 0
                ? Math.round((totalOffensive / totalCombatActions) * 100) / 100
                : 0,
        };
    }

    /* ------------------------------------------------------------------ */
    /*  D4 -- Social Interaction                                           */
    /* ------------------------------------------------------------------ */

    function computeD4() {
        const dialogueChoiceEvents = eventsOfType("dialogue_choice");

        // Trust changes from companion/NPC dialogues
        let totalTrustChange = 0;
        for (const e of dialogueChoiceEvents) {
            totalTrustChange += e.payload.trustChange || 0;
        }

        const npcInteractions = dialogueChoiceEvents.length;

        // Count unique dilemmas interacted with
        const uniqueDilemmas = new Set(dialogueChoiceEvents.map((e) => e.payload.dilemmaId));

        return {
            companionTrustChanges: totalTrustChange,
            npcInteractions,
            uniqueDilemmasEncountered: uniqueDilemmas.size,
        };
    }

    /* ------------------------------------------------------------------ */
    /*  D5 -- Affective (PRIMARY)                                          */
    /* ------------------------------------------------------------------ */

    function computeD5() {
        const state = gameStateStore.getState();
        const dialogueChoiceEvents = eventsOfType("dialogue_choice");
        const hintEvents = eventsOfType("hint_requested");
        const qEvents = questionEvents();
        const combatEndEvents = eventsOfType("combat_ended");

        // --- Dialogue empathy score ---
        let prosocialCount = 0;
        let selfInterestCount = 0;
        for (const e of dialogueChoiceEvents) {
            if (e.payload.choiceCategory === "prosocial") prosocialCount += 1;
            else if (e.payload.choiceCategory === "self_interest") selfInterestCount += 1;
        }
        const totalMoralChoices = prosocialCount + selfInterestCount;
        const dialogueEmpathyScore = totalMoralChoices > 0
            ? Math.round((prosocialCount / totalMoralChoices) * 100) / 100
            : 0;

        // --- Hint seeking pattern ---
        // "proactive": hints requested early in combat (turn 1-2)
        // "reactive": hints requested after wrong answers
        let proactiveHints = 0;
        let reactiveHints = 0;
        for (const hint of hintEvents) {
            // Check if there was a wrong answer within 15s before the hint
            const recentWrong = qEvents.find(
                (q) => !q.payload.correct && hint.ts - q.ts > 0 && hint.ts - q.ts < 15000,
            );
            if (recentWrong) {
                reactiveHints += 1;
            } else {
                proactiveHints += 1;
            }
        }
        let hintSeekingPattern;
        const totalHints = proactiveHints + reactiveHints;
        if (totalHints === 0) hintSeekingPattern = "none";
        else if (proactiveHints > reactiveHints) hintSeekingPattern = "proactive";
        else if (reactiveHints > proactiveHints) hintSeekingPattern = "reactive";
        else hintSeekingPattern = "balanced";

        // --- Persistence after combat loss ---
        const defeats = combatEndEvents.filter((e) => e.payload.result === "defeat");
        const questionsAfterDefeat = defeats.length > 0
            ? qEvents.filter((q) => q.ts > defeats[defeats.length - 1].ts).length
            : 0;
        const persistenceAfterCombatLoss = qEvents.length > 0
            ? Math.round((questionsAfterDefeat / Math.max(1, qEvents.length)) * 100) / 100
            : 0;

        // --- Growth mindset ---
        // Indicators: chose harder paths (higher avg difficulty), retried after loss,
        // sought help (hints) then tried alone
        const retries = defeats.length; // Each defeat implies a retry if play continued
        const avgDiff = qEvents.length > 0
            ? qEvents.reduce((s, e) => s + (e.payload.difficulty || 3), 0) / qEvents.length
            : 3;
        // Did they use hints AND then answer correctly without hints?
        let soloSuccessAfterHint = 0;
        for (const hint of hintEvents) {
            const laterQ = qEvents
                .filter((q) => q.ts > hint.ts + 30000)
                .slice(0, 3);
            const soloCorrect = laterQ.filter((q) => q.payload.correct).length;
            if (soloCorrect > 0) soloSuccessAfterHint += 1;
        }
        const growthMindset = {
            avgDifficultyChosen: Math.round(avgDiff * 100) / 100,
            retriesAfterDefeat: retries,
            hintThenSoloSuccess: soloSuccessAfterHint,
            score: Math.min(1, Math.round((
                (avgDiff / 5) * 0.3
                + Math.min(retries, 3) / 3 * 0.3
                + (totalHints > 0 ? soloSuccessAfterHint / totalHints : 0) * 0.4
            ) * 100) / 100),
        };

        // --- Emotional regulation ---
        // Compare accuracy when HP is low (<=30%) vs healthy (>30%)
        const combatQEvents = qEvents.filter((e) => e.payload.playerHp != null);
        const lowHpEvents = combatQEvents.filter(
            (e) => (e.payload.playerHp / (e.payload.playerMaxHp || 100)) <= 0.3,
        );
        const healthyEvents = combatQEvents.filter(
            (e) => (e.payload.playerHp / (e.payload.playerMaxHp || 100)) > 0.3,
        );

        const lowHpAccuracy = lowHpEvents.length > 0
            ? lowHpEvents.filter((e) => e.payload.correct).length / lowHpEvents.length
            : null;
        const healthyAccuracy = healthyEvents.length > 0
            ? healthyEvents.filter((e) => e.payload.correct).length / healthyEvents.length
            : null;

        let emotionalRegulation;
        if (lowHpAccuracy == null || healthyAccuracy == null) {
            emotionalRegulation = { profile: "insufficient_data", delta: 0 };
        } else {
            const delta = Math.round((lowHpAccuracy - healthyAccuracy) * 100) / 100;
            let profile;
            if (delta >= 0.05) profile = "resilient"; // performs better under pressure
            else if (delta >= -0.1) profile = "steady"; // consistent
            else profile = "pressure_sensitive"; // accuracy drops under pressure
            emotionalRegulation = {
                profile,
                delta,
                lowHpAccuracy: Math.round(lowHpAccuracy * 100) / 100,
                healthyAccuracy: Math.round(healthyAccuracy * 100) / 100,
            };
        }

        return {
            dialogueEmpathyScore,
            hintSeekingPattern,
            persistenceAfterCombatLoss,
            growthMindset,
            emotionalRegulation,
        };
    }

    /* ------------------------------------------------------------------ */
    /*  D6 -- Temporal                                                     */
    /* ------------------------------------------------------------------ */

    function computeD6() {
        const qEvents = questionEvents();

        // --- Chapter performance trend ---
        const chapterAccuracy = {};
        for (const e of qEvents) {
            const ch = e.payload.chapter || 1;
            if (!chapterAccuracy[ch]) chapterAccuracy[ch] = { total: 0, correct: 0 };
            chapterAccuracy[ch].total += 1;
            if (e.payload.correct) chapterAccuracy[ch].correct += 1;
        }
        const chapterPerformanceTrend = {};
        for (const [ch, data] of Object.entries(chapterAccuracy)) {
            chapterPerformanceTrend[ch] = Math.round((data.correct / data.total) * 100) / 100;
        }

        // --- Learning velocity (first half vs second half accuracy) ---
        if (qEvents.length < 4) {
            return {
                chapterPerformanceTrend,
                learningVelocity: 0,
                responseTimeImprovement: 0,
            };
        }

        const midpoint = Math.floor(qEvents.length / 2);
        const firstHalf = qEvents.slice(0, midpoint);
        const secondHalf = qEvents.slice(midpoint);

        const firstAccuracy = firstHalf.filter((e) => e.payload.correct).length / firstHalf.length;
        const secondAccuracy = secondHalf.filter((e) => e.payload.correct).length / secondHalf.length;
        const learningVelocity = Math.round((secondAccuracy - firstAccuracy) * 100) / 100;

        // --- Response time improvement ---
        const avgFirst = firstHalf.reduce(
            (s, e) => s + (e.payload.responseTimeMs || 0), 0,
        ) / firstHalf.length;
        const avgSecond = secondHalf.reduce(
            (s, e) => s + (e.payload.responseTimeMs || 0), 0,
        ) / secondHalf.length;
        const responseTimeImprovement = Math.round(avgFirst - avgSecond);

        return {
            chapterPerformanceTrend,
            learningVelocity,
            responseTimeImprovement,
        };
    }

    /* ------------------------------------------------------------------ */
    /*  Public API                                                         */
    /* ------------------------------------------------------------------ */

    function computeSessionMetrics() {
        const d1 = computeD1();
        const d2 = computeD2();
        const d3 = computeD3();
        const d4 = computeD4();
        const d5 = computeD5();
        const d6 = computeD6();

        return {
            cognitive: d1,
            engagement: d2,
            strategic: d3,
            social: d4,
            affective: d5,
            temporal: d6,
        };
    }

    function emitMetrics() {
        const metrics = computeSessionMetrics();

        telemetry.event("assessment_cognitive", metrics.cognitive);
        telemetry.event("assessment_engagement", metrics.engagement);
        telemetry.event("assessment_strategic", metrics.strategic);
        telemetry.event("assessment_social", metrics.social);
        telemetry.event("assessment_affective", metrics.affective);
        telemetry.event("assessment_temporal", metrics.temporal);
        telemetry.event("assessment_complete", {
            summary: {
                correctnessRate: metrics.cognitive.correctnessRate,
                speedAccuracyProfile: metrics.cognitive.speedAccuracyProfile,
                masteryBySubject: metrics.cognitive.masteryBySubject,
                spellDiversity: metrics.strategic.spellDiversity,
                combatStrategy: metrics.strategic.combatStrategy,
                dialogueEmpathyScore: metrics.affective.dialogueEmpathyScore,
                growthMindsetScore: metrics.affective.growthMindset.score,
                emotionalRegulation: metrics.affective.emotionalRegulation.profile,
                learningVelocity: metrics.temporal.learningVelocity,
                explorationThoroughness: metrics.engagement.explorationThoroughness,
            },
        });

        return metrics;
    }

    return {
        computeSessionMetrics,
        emitMetrics,
    };
}
