/**
 * assessmentEngine.js — Stealth assessment that computes learning
 * analytics from accumulated gameplay data.
 *
 * Called at game end to produce a metrics object covering 5 dimensions:
 *   D1  Cognitive Knowledge  — accuracy, speed, speed-accuracy profile
 *   D2  Behavioral Engagement — play time, actions/min, completion
 *   D3  Strategic Behavior   — diversity, shifts, efficiency, synergies  (PRIMARY)
 *   D5  Affective            — persistence, frustration signals
 *   D6  Temporal             — learning velocity, response-time trends
 *
 * The metrics object is returned for the postGame scene and also
 * emitted as telemetry for backend storage.
 */

import { WAVES } from "../config/waves.js";

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
        return entropy / maxEntropy; // normalise to 0-1
    }

    /** Extract question-answered events from telemetry session. */
    function questionEvents() {
        const session = telemetry.getCurrentSession();
        if (!session) return [];
        return session.events.filter((e) => e.type === "question_answered");
    }

    /** Extract tower-placed events. */
    function towerPlacedEvents() {
        const session = telemetry.getCurrentSession();
        if (!session) return [];
        return session.events.filter((e) => e.type === "tower_placed");
    }

    /** Extract wave-started events. */
    function waveStartedEvents() {
        const session = telemetry.getCurrentSession();
        if (!session) return [];
        return session.events.filter((e) => e.type === "wave_started");
    }

    /* ------------------------------------------------------------------ */
    /*  D1 — Cognitive Knowledge                                           */
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

        // Speed-accuracy profile classification
        const fast = avgResponseTimeMs < 4000;
        const accurate = correctnessRate >= 0.7;
        let speedAccuracyProfile;
        if (fast && accurate) speedAccuracyProfile = "fast_accurate";
        else if (fast && !accurate) speedAccuracyProfile = "fast_inaccurate";
        else if (!fast && accurate) speedAccuracyProfile = "slow_accurate";
        else speedAccuracyProfile = "slow_inaccurate";

        return { correctnessRate, avgResponseTimeMs, speedAccuracyProfile };
    }

    /* ------------------------------------------------------------------ */
    /*  D2 — Behavioral Engagement                                         */
    /* ------------------------------------------------------------------ */

    function computeD2() {
        const state = gameStateStore.getState();
        const qEvents = questionEvents();
        const tEvents = towerPlacedEvents();

        const totalPlayTimeMs = state.elapsedMs || 0;
        const totalPlayTimeMin = totalPlayTimeMs / 60_000;

        // Actions = tower builds + upgrades + study questions
        const session = telemetry.getCurrentSession();
        const upgradeEvents = session
            ? session.events.filter((e) => e.type === "tower_upgraded").length
            : 0;

        const totalActions = tEvents.length + upgradeEvents + (state.studyQuestionsThisPrep || 0) + qEvents.length;
        const actionsPerMinute = totalPlayTimeMin > 0
            ? Math.round((totalActions / totalPlayTimeMin) * 100) / 100
            : 0;

        const completionRate = WAVES.length > 0
            ? Math.min(1, state.wave / WAVES.length)
            : 0;

        return { totalPlayTimeMs, actionsPerMinute, completionRate };
    }

    /* ------------------------------------------------------------------ */
    /*  D3 — Strategic Behavior (PRIMARY)                                  */
    /* ------------------------------------------------------------------ */

    function computeD3() {
        const state = gameStateStore.getState();
        const tEvents = towerPlacedEvents();

        // --- Tower diversity (Shannon entropy of types placed) ---
        const typeCounts = {};
        for (const e of tEvents) {
            const t = e.payload.towerType;
            if (t) typeCounts[t] = (typeCounts[t] || 0) + 1;
        }
        const towerTypeKeys = [
            "numberBastion", "operationCannon", "fractionFreezer", "geometryGuard",
        ];
        const countsArray = towerTypeKeys.map((k) => typeCounts[k] || 0);
        const towerDiversity = shannonEntropy(countsArray);

        // --- Strategy shifts between waves ---
        // Group placements by wave, compute distribution delta
        const waveDistributions = {};
        for (const e of tEvents) {
            const wave = e.payload.wave ?? findWaveAtTime(e.ts);
            if (!waveDistributions[wave]) {
                waveDistributions[wave] = {};
            }
            const t = e.payload.towerType;
            if (t) waveDistributions[wave][t] = (waveDistributions[wave][t] || 0) + 1;
        }
        const waveKeys = Object.keys(waveDistributions).sort((a, b) => a - b);
        let strategyShifts = 0;
        for (let i = 1; i < waveKeys.length; i++) {
            const prev = waveDistributions[waveKeys[i - 1]];
            const curr = waveDistributions[waveKeys[i]];
            if (distributionChanged(prev, curr, towerTypeKeys)) {
                strategyShifts += 1;
            }
        }

        // --- Resource efficiency ---
        const resourceEfficiency = state.totalGoldEarned > 0
            ? Math.round((state.totalGoldSpent / state.totalGoldEarned) * 100) / 100
            : 0;

        // --- Savings rate (interest / total gold) ---
        const session = telemetry.getCurrentSession();
        let interestEarned = 0;
        if (session) {
            for (const e of session.events) {
                if (e.type === "interest_earned") {
                    interestEarned += e.payload.amount || 0;
                }
            }
        }
        const savingsRate = state.totalGoldEarned > 0
            ? Math.round((interestEarned / state.totalGoldEarned) * 100) / 100
            : 0;

        // --- Early call usage ---
        const totalWavesPlayed = Math.max(1, state.wave);
        const earlyCallUsage = Math.round((state.earlyCallsUsed / totalWavesPlayed) * 100) / 100;

        // --- Synergy count ---
        const synergyCount = state.discoveredSynergies.length;

        return {
            towerDiversity,
            strategyShifts,
            resourceEfficiency,
            savingsRate,
            earlyCallUsage,
            synergyCount,
        };
    }

    /** Check whether two wave distributions differ significantly. */
    function distributionChanged(prev, curr, keys) {
        let delta = 0;
        for (const key of keys) {
            delta += Math.abs((prev[key] || 0) - (curr[key] || 0));
        }
        return delta >= 2; // at least 2 placements difference
    }

    /** Best-effort: find which wave was active at a given timestamp. */
    function findWaveAtTime(ts) {
        const wEvents = waveStartedEvents();
        let wave = 0;
        for (const e of wEvents) {
            if (e.ts <= ts) wave = e.payload.waveNumber || wave;
        }
        return wave;
    }

    /* ------------------------------------------------------------------ */
    /*  D5 — Affective                                                     */
    /* ------------------------------------------------------------------ */

    function computeD5() {
        const state = gameStateStore.getState();
        const qEvents = questionEvents();

        // --- Persistence after leak ---
        // How many questions were attempted after the player first lost lives
        const session = telemetry.getCurrentSession();
        let firstLeakTs = null;
        if (session) {
            for (const e of session.events) {
                if (e.type === "enemy_leaked" || e.type === "lives_lost") {
                    firstLeakTs = e.ts;
                    break;
                }
            }
        }
        let questionsAfterLeak = 0;
        if (firstLeakTs) {
            questionsAfterLeak = qEvents.filter((e) => e.ts > firstLeakTs).length;
        }
        const persistenceAfterLeak = qEvents.length > 0
            ? Math.round((questionsAfterLeak / qEvents.length) * 100) / 100
            : 0;

        // --- Frustration index ---
        // Count sequences of 3+ consecutive wrong answers
        let frustrationIndex = 0;
        let wrongStreak = 0;
        for (const e of qEvents) {
            if (!e.payload.correct) {
                wrongStreak += 1;
                // Count each run of 3+ as one frustration event
                if (wrongStreak === 3) frustrationIndex += 1;
                else if (wrongStreak > 3) frustrationIndex += 0.5; // continuing streak
            } else {
                wrongStreak = 0;
            }
        }
        frustrationIndex = Math.round(frustrationIndex * 100) / 100;

        return { persistenceAfterLeak, frustrationIndex };
    }

    /* ------------------------------------------------------------------ */
    /*  D6 — Temporal                                                      */
    /* ------------------------------------------------------------------ */

    function computeD6() {
        const qEvents = questionEvents();

        if (qEvents.length < 4) {
            return { learningVelocity: 0, responseTimeImprovement: 0 };
        }

        const midpoint = Math.floor(qEvents.length / 2);
        const firstHalf = qEvents.slice(0, midpoint);
        const secondHalf = qEvents.slice(midpoint);

        // --- Learning velocity ---
        const firstAccuracy = firstHalf.filter((e) => e.payload.correct).length / firstHalf.length;
        const secondAccuracy = secondHalf.filter((e) => e.payload.correct).length / secondHalf.length;
        const learningVelocity = Math.round((secondAccuracy - firstAccuracy) * 100) / 100;

        // --- Response time improvement ---
        const avgFirst = firstHalf.reduce((s, e) => s + (e.payload.responseTimeMs || 0), 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((s, e) => s + (e.payload.responseTimeMs || 0), 0) / secondHalf.length;
        // Positive value means player got faster
        const responseTimeImprovement = Math.round(avgFirst - avgSecond);

        return { learningVelocity, responseTimeImprovement };
    }

    /* ------------------------------------------------------------------ */
    /*  Public API                                                         */
    /* ------------------------------------------------------------------ */

    function computeSessionMetrics() {
        const d1 = computeD1();
        const d2 = computeD2();
        const d3 = computeD3();
        const d5 = computeD5();
        const d6 = computeD6();

        return {
            cognitive: d1,
            engagement: d2,
            strategic: d3,
            affective: d5,
            temporal: d6,
        };
    }

    function emitMetrics() {
        const metrics = computeSessionMetrics();

        telemetry.event("assessment_cognitive", metrics.cognitive);
        telemetry.event("assessment_engagement", metrics.engagement);
        telemetry.event("assessment_strategic", metrics.strategic);
        telemetry.event("assessment_affective", metrics.affective);
        telemetry.event("assessment_temporal", metrics.temporal);
        telemetry.event("assessment_complete", {
            summary: {
                correctnessRate: metrics.cognitive.correctnessRate,
                speedAccuracyProfile: metrics.cognitive.speedAccuracyProfile,
                towerDiversity: metrics.strategic.towerDiversity,
                synergyCount: metrics.strategic.synergyCount,
                completionRate: metrics.engagement.completionRate,
                learningVelocity: metrics.temporal.learningVelocity,
            },
        });

        return metrics;
    }

    /* ------------------------------------------------------------------ */

    return {
        computeSessionMetrics,
        emitMetrics,
    };
}
