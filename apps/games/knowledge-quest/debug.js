/**
 * debug.js — live ECD profile viewer for Knowledge Quest (turn-based RPG).
 *
 * Runs in a second browser window opened from main.js (debug mode).
 * Listens on BroadcastChannel('edgame-debug') for telemetry events
 * streamed from the game window, maintains a local copy of the
 * session, recomputes D1-D6 metrics on every event, and renders a
 * live evidence-centered design view.
 *
 * Primary dimension: D5 Affective & SEL (empathy score, dialogue
 * choice categories, companion bonding, hint use).
 */

const CHANNEL_NAME = "edgame-debug";

/* --------------------------------------------------------------- */
/*  State                                                           */
/* --------------------------------------------------------------- */

const state = {
    sessionId: null,
    startedAt: null,
    meta: null,
    events: [],              // full event log (oldest first)
    snapshot: null,           // latest game state snapshot
    kcAttempts: {},           // per-subject attempt count
    kcCorrect: {},            // per-subject correct count
    kcDifficultySum: {},      // per-subject sum of difficulties attempted
    kcWeightedCorrect: {},    // per-subject sum of difficulties correct
    prevMetrics: null,
};

/* --------------------------------------------------------------- */
/*  DOM refs                                                        */
/* --------------------------------------------------------------- */

const el = {
    session:  document.getElementById("stat-session"),
    elapsed:  document.getElementById("stat-elapsed"),
    events:   document.getElementById("stat-events"),
    channel:  document.getElementById("stat-channel"),
    dims:     document.getElementById("dimensions"),
    kcList:   document.getElementById("kc-list"),
    summary:  document.getElementById("profile-summary"),
    eventList:document.getElementById("event-list"),
};

/* --------------------------------------------------------------- */
/*  Dimension + KC config                                            */
/* --------------------------------------------------------------- */

const DIMENSIONS = [
    { id: "D1", key: "cognitive",  label: "Cognitive Knowledge",  color: "d1" },
    { id: "D2", key: "engagement", label: "Behavioral Engagement",color: "d2" },
    { id: "D3", key: "strategic",  label: "Strategic Behavior",   color: "d3" },
    { id: "D4", key: "social",     label: "Social & Collaborative", color: "d4" },
    { id: "D5", key: "affective",  label: "Affective & SEL",      color: "d5", primary: true },
    { id: "D6", key: "temporal",   label: "Temporal & Growth",    color: "d6" },
];

const KC_LIST = [
    { id: "math",    label: "Math",    icon: "×" },
    { id: "science", label: "Science", icon: "⚛" },
];

/* Dialogue choice categories (based on dialogueSystem.js). A
 * prosocial choice is empathetic / sparing / generous; self-interest
 * is greedy or aggressive; transactional is neutral / pragmatic. */
const PROSOCIAL_CATEGORIES = new Set([
    "prosocial", "compassion", "empathetic", "altruistic", "spare", "mercy", "help",
]);
const SELF_INTEREST_CATEGORIES = new Set([
    "self_interest", "self-interest", "greedy", "aggressive", "attack", "refuse", "hostile",
]);
const TRANSACTIONAL_CATEGORIES = new Set([
    "transactional", "neutral", "pragmatic", "trade", "barter",
]);

const TOTAL_CHAPTERS = 3;

/* --------------------------------------------------------------- */
/*  Lite metric computation                                          */
/* --------------------------------------------------------------- */

function shannonEntropy(counts) {
    const total = counts.reduce((s, c) => s + c, 0);
    if (total === 0) return 0;
    const maxE = Math.log2(counts.length || 1);
    if (maxE === 0) return 0;
    let e = 0;
    for (const c of counts) {
        if (c === 0) continue;
        const p = c / total;
        e -= p * Math.log2(p);
    }
    return e / maxE;
}

function categorizeDialogueChoice(category) {
    if (!category) return "unknown";
    const c = String(category).toLowerCase();
    if (PROSOCIAL_CATEGORIES.has(c)) return "prosocial";
    if (SELF_INTEREST_CATEGORIES.has(c)) return "self_interest";
    if (TRANSACTIONAL_CATEGORIES.has(c)) return "transactional";
    // Fuzzy match as fallback
    for (const p of PROSOCIAL_CATEGORIES) if (c.includes(p)) return "prosocial";
    for (const s of SELF_INTEREST_CATEGORIES) if (c.includes(s)) return "self_interest";
    for (const t of TRANSACTIONAL_CATEGORIES) if (c.includes(t)) return "transactional";
    return "unknown";
}

function computeMetrics() {
    const events = state.events;
    const snap   = state.snapshot || {};
    const qEvents = events.filter((e) => e.type === "question_answered");
    const spellEvents = events.filter((e) => e.type === "spell_choice");
    const timingEvents = events.filter((e) => e.type === "timing_cast");
    const dialogueEvents = events.filter((e) => e.type === "dialogue_choice");
    const hintEvents = events.filter((e) => e.type === "hint_requested");
    const sparedEvents = events.filter((e) => e.type === "enemy_spared");
    const companionCollected = events.filter((e) => e.type === "companion_collected");
    const companionEvolved = events.filter((e) => e.type === "companion_evolved");
    const nodeVisited = events.filter((e) => e.type === "node_visited");

    /* D1 Cognitive */
    const qAttempted = qEvents.length;
    const qCorrect   = qEvents.filter((e) => e.payload.correct).length;
    const correctnessRate = qAttempted > 0 ? qCorrect / qAttempted : 0;
    const avgRtMs = qAttempted > 0
        ? qEvents.reduce((s, e) => s + (e.payload.responseTimeMs || 0), 0) / qAttempted
        : 0;
    const fast = avgRtMs < 4000;
    const accurate = correctnessRate >= 0.7;
    const speedAccuracy = fast && accurate ? "fast_accurate"
                        : fast && !accurate ? "fast_inaccurate"
                        : !fast && accurate ? "slow_accurate"
                        : "slow_inaccurate";
    const d1Score = Math.max(0, Math.min(1, correctnessRate * (fast ? 1.1 : 1.0)));

    /* D2 Engagement — chapter progress + actions per minute */
    const chapter = snap.chapter || 1;
    const visitedNodesCount = snap.visitedNodesCount || 0;
    const playMin = (snap.elapsedMs || 0) / 60000;
    const actions = qAttempted + spellEvents.length + dialogueEvents.length + nodeVisited.length;
    const actionsPerMin = playMin > 0 ? actions / playMin : 0;
    // Rough chapter completion: full chapters done + progress in current chapter
    // (assumes ~10 nodes per chapter as a heuristic)
    const chapterProgress = Math.min(1, ((chapter - 1) + Math.min(1, visitedNodesCount / 10)) / TOTAL_CHAPTERS);
    const d2Score = Math.max(0, Math.min(1,
        chapterProgress * 0.6 + Math.min(1, actionsPerMin / 8) * 0.4));

    /* D3 Strategic — spell diversity + companion utilisation */
    const spellCounts = {};
    for (const e of spellEvents) {
        const s = e.payload.spellId;
        if (s) spellCounts[s] = (spellCounts[s] || 0) + 1;
    }
    const spellDiversity = shannonEntropy(Object.values(spellCounts));
    const companionCount = (snap.companions || []).length;
    const companionMaxLevel = (snap.companions || []).reduce((m, c) => Math.max(m, c.level || 0), 0);
    // Companion usage proxy: number of collected × avg level
    const compProgress = companionCount > 0
        ? Math.min(1, companionCount / 3) * 0.5 + Math.min(1, companionMaxLevel / 3) * 0.5
        : 0;
    // Timing-cast quality contributes to strategic play
    let timingQualitySum = 0;
    let timingCount = 0;
    for (const e of timingEvents) {
        if (e.payload.timingMultiplier != null) {
            timingQualitySum += e.payload.timingMultiplier;
            timingCount += 1;
        }
    }
    const avgTimingMult = timingCount > 0 ? timingQualitySum / timingCount : 0;
    const d3Score = Math.max(0, Math.min(1,
        spellDiversity * 0.4 + compProgress * 0.35 + Math.min(1, avgTimingMult / 1.5) * 0.25));

    /* D4 Social — dialogue category mix (prosocial choices are social-leaning) */
    let prosocial = 0, selfInt = 0, transactional = 0, unknown = 0;
    for (const e of dialogueEvents) {
        const cat = categorizeDialogueChoice(e.payload.choiceCategory || e.payload.category);
        if (cat === "prosocial") prosocial += 1;
        else if (cat === "self_interest") selfInt += 1;
        else if (cat === "transactional") transactional += 1;
        else unknown += 1;
    }
    const totalDialogue = prosocial + selfInt + transactional + unknown;
    // Social metric: prosocial + companion bonding
    const prosocialRatio = totalDialogue > 0 ? prosocial / totalDialogue : 0;
    const d4Score = Math.max(0, Math.min(1,
        prosocialRatio * 0.6 + Math.min(1, companionCount / 3) * 0.4));

    /* D5 Affective (PRIMARY) — empathy score from dialogue + sparing + hint balance */
    const empathyScore = totalDialogue > 0
        ? (prosocial - selfInt) / totalDialogue  // range [-1..1]
        : 0;
    const normalisedEmpathy = 0.5 + empathyScore / 2; // [0..1]
    const sparedCount = sparedEvents.length;
    // Hint-requested is NOT frustration — it's a help-seeking prosocial signal in this game.
    const hintBalance = Math.min(1, hintEvents.length / 3);
    let wrongStreak = 0, frustrationEvents = 0;
    for (const e of qEvents) {
        if (!e.payload.correct) {
            wrongStreak += 1;
            if (wrongStreak === 3) frustrationEvents += 1;
        } else {
            wrongStreak = 0;
        }
    }
    const d5Score = Math.max(0, Math.min(1,
        normalisedEmpathy * 0.55
        + Math.min(1, sparedCount / 2) * 0.2
        + hintBalance * 0.15
        + (1 - Math.min(1, frustrationEvents * 0.15)) * 0.1,
    ));

    /* D6 Temporal — learning velocity */
    let d6Score = 0;
    let learningVelocity = 0;
    let rtImprovement = 0;
    if (qEvents.length >= 4) {
        const mid = Math.floor(qEvents.length / 2);
        const first = qEvents.slice(0, mid);
        const second = qEvents.slice(mid);
        const firstAcc = first.filter((e) => e.payload.correct).length / first.length;
        const secondAcc = second.filter((e) => e.payload.correct).length / second.length;
        learningVelocity = secondAcc - firstAcc;
        const firstRt  = first.reduce((s, e) => s + (e.payload.responseTimeMs || 0), 0) / first.length;
        const secondRt = second.reduce((s, e) => s + (e.payload.responseTimeMs || 0), 0) / second.length;
        rtImprovement = firstRt - secondRt;
        d6Score = Math.max(0, Math.min(1, 0.5 + learningVelocity));
    }

    return {
        cognitive: {
            score: d1Score,
            correctnessRate,
            avgRtMs,
            profile: speedAccuracy,
            attempts: qAttempted,
            correct: qCorrect,
        },
        engagement: {
            score: d2Score,
            chapterProgress,
            actionsPerMin,
            playMin,
            totalActions: actions,
            chapter,
        },
        strategic: {
            score: d3Score,
            spellDiversity,
            spellCounts,
            companionCount,
            companionMaxLevel,
            avgTimingMult,
            companionEvolutions: companionEvolved.length,
        },
        social: {
            score: d4Score,
            prosocialRatio,
            dialogueCount: totalDialogue,
            companionCount,
        },
        affective: {
            score: d5Score,
            empathyScore,
            normalisedEmpathy,
            prosocial,
            selfInt,
            transactional,
            unknown,
            totalDialogue,
            sparedCount,
            hintUses: hintEvents.length,
            frustrationEvents,
        },
        temporal: {
            score: d6Score,
            learningVelocity,
            rtImprovement,
            dataPoints: qEvents.length,
        },
    };
}

/* --------------------------------------------------------------- */
/*  Evidence trace: human-readable explanation per event            */
/* --------------------------------------------------------------- */

function evidenceFor(evt, before, after) {
    const p = evt.payload || {};
    const lines = [];
    const delta = (a, b, label, fmt = (x) => x.toFixed(2)) => {
        if (a == null || b == null) return null;
        const da = Number(a), db = Number(b);
        if (!isFinite(da) || !isFinite(db)) return null;
        if (Math.abs(db - da) < 0.001) return null;
        const dir = db > da ? "up" : "down";
        return { label, before: fmt(da), after: fmt(db), dir };
    };

    switch (evt.type) {
        case "question_answered": {
            const correct = p.correct;
            const rt = p.responseTimeMs || 0;
            const diff = p.difficulty || 1;

            if (correct) {
                const speed = rt < 3000 ? "fast" : rt < 6000 ? "moderate" : "slow";
                lines.push(`✓ Correct at difficulty ${diff} in ${(rt/1000).toFixed(1)}s (${speed})`);
            } else {
                lines.push(`✗ Wrong at difficulty ${diff} — spell fizzled`);
                lines.push(`→ Evidence: ${p.subject || "subject"} gap`);
            }
            if (p.subject) lines.push(`→ KC "${p.subject}" mastery updated`);
            const d1 = delta(before.cognitive.score, after.cognitive.score, "D1");
            if (d1) lines.push(`→ D1 Cognitive: ${d1.before} <span class="delta-${d1.dir}">${d1.dir === "up" ? "↑" : "↓"} ${d1.after}</span>`);
            break;
        }

        case "spell_choice": {
            lines.push(`✦ Cast ${p.spellId} on target ${p.targetIndex ?? "?"}`);
            lines.push(`→ Strategic choice: subject ${p.subject || "?"} at diff ${p.difficulty ?? "?"}`);
            const d3 = delta(before.strategic.score, after.strategic.score, "D3");
            if (d3) lines.push(`→ D3 Strategic: ${d3.before} <span class="delta-${d3.dir}">${d3.dir === "up" ? "↑" : "↓"} ${d3.after}</span>`);
            break;
        }

        case "timing_cast": {
            const q = p.timingQuality;
            const mult = p.timingMultiplier || 0;
            lines.push(`⏱ Timing: ${q || "?"} (×${mult.toFixed?.(2) ?? mult})`);
            lines.push(`→ Micro-skill evidence — strategic execution`);
            break;
        }

        case "dialogue_choice": {
            const cat = categorizeDialogueChoice(p.choiceCategory || p.category);
            if (cat === "prosocial") {
                lines.push(`♥ Prosocial choice — empathy signal`);
            } else if (cat === "self_interest") {
                lines.push(`⚡ Self-interest choice`);
            } else if (cat === "transactional") {
                lines.push(`⚖ Transactional choice — pragmatic`);
            } else {
                lines.push(`→ Dialogue choice (${p.choiceCategory || "unknown"})`);
            }
            if (p.dilemmaId) lines.push(`→ Dilemma: ${p.dilemmaId}`);
            if (p.trustChange != null) lines.push(`→ Trust change: ${p.trustChange > 0 ? "+" : ""}${p.trustChange}`);
            const d5 = delta(before.affective.score, after.affective.score, "D5");
            if (d5) lines.push(`→ D5 Affective: ${d5.before} <span class="delta-${d5.dir}">${d5.dir === "up" ? "↑" : "↓"} ${d5.after}</span>`);
            const d4 = delta(before.social.score, after.social.score, "D4");
            if (d4) lines.push(`→ D4 Social: ${d4.before} <span class="delta-${d4.dir}">${d4.dir === "up" ? "↑" : "↓"} ${d4.after}</span>`);
            break;
        }

        case "hint_requested": {
            lines.push(`? Mentor hint requested (tokens left: ${p.tokensLeft ?? "?"})`);
            lines.push(`→ Help-seeking evidence — SEL indicator`);
            break;
        }

        case "enemy_spared": {
            lines.push(`♥ Enemy spared: ${p.enemyId || p.enemyType || "?"}`);
            lines.push(`→ Strong empathy / mercy signal — D5 boost`);
            break;
        }

        case "companion_collected": {
            lines.push(`★ Companion joined: ${p.companionId || "?"}`);
            lines.push(`→ Social bond formed`);
            break;
        }

        case "companion_evolved": {
            lines.push(`✦ Companion evolved: ${p.companionId || "?"} → level ${p.newLevel || "?"}`);
            lines.push(`→ Long-term investment evidence`);
            break;
        }

        case "node_visited": {
            lines.push(`➤ Visited node ${p.nodeId || "?"} (chapter ${p.chapter || "?"})`);
            break;
        }

        case "mystery_resolved": {
            lines.push(`★ Mystery resolved — exploration pay-off`);
            break;
        }

        case "chapter_completed": {
            lines.push(`★ Chapter ${p.chapter || "?"} completed`);
            break;
        }

        case "combat_started":
        case "combat_ended":
        case "dialogue_started":
        case "dialogue_ended": {
            lines.push(`Phase shift: ${evt.type.replace("_", " ")}`);
            break;
        }

        case "assessment_cognitive":
        case "assessment_engagement":
        case "assessment_strategic":
        case "assessment_social":
        case "assessment_affective":
        case "assessment_temporal":
        case "assessment_complete": {
            lines.push(`★ Assessment emitted: ${evt.type.replace("assessment_", "")}`);
            break;
        }

        default: {
            const d1 = delta(before.cognitive.score, after.cognitive.score, "D1");
            const d5 = delta(before.affective.score, after.affective.score, "D5");
            if (d1) lines.push(`→ D1 Cognitive: ${d1.before} <span class="delta-${d1.dir}">${d1.dir === "up" ? "↑" : "↓"} ${d1.after}</span>`);
            if (d5) lines.push(`→ D5 Affective: ${d5.before} <span class="delta-${d5.dir}">${d5.dir === "up" ? "↑" : "↓"} ${d5.after}</span>`);
        }
    }

    return lines.join("<br>");
}

/* --------------------------------------------------------------- */
/*  Knowledge component tracking                                     */
/* --------------------------------------------------------------- */

function updateKC(evt) {
    if (evt.type !== "question_answered") return;
    const subject = evt.payload.subject;
    if (!subject) return;
    const diff = evt.payload.difficulty || 1;

    state.kcAttempts[subject]      = (state.kcAttempts[subject] || 0) + 1;
    state.kcDifficultySum[subject] = (state.kcDifficultySum[subject] || 0) + diff;
    if (evt.payload.correct) {
        state.kcCorrect[subject]         = (state.kcCorrect[subject] || 0) + 1;
        state.kcWeightedCorrect[subject] = (state.kcWeightedCorrect[subject] || 0) + diff;
    }
}

/* --------------------------------------------------------------- */
/*  Rendering                                                        */
/* --------------------------------------------------------------- */

function describeDimension(dim, m) {
    const data = m[dim.key];
    if (!data) return "";
    switch (dim.key) {
        case "cognitive":
            if (data.attempts === 0) return "<strong>Waiting for first question</strong>";
            return `<strong>${data.correct}/${data.attempts}</strong> correct · avg ${(data.avgRtMs/1000).toFixed(1)}s · ${data.profile.replace("_"," + ")}`;
        case "engagement":
            return `ch. <strong>${data.chapter}/3</strong> · <strong>${(data.chapterProgress * 100).toFixed(0)}%</strong> · ${data.actionsPerMin.toFixed(1)}/min`;
        case "strategic":
            return `spell diversity <strong>${data.spellDiversity.toFixed(2)}</strong> · ${data.companionCount}/3 companions · evolutions ${data.companionEvolutions}`;
        case "social":
            return `prosocial <strong>${(data.prosocialRatio * 100).toFixed(0)}%</strong> · ${data.dialogueCount} choices`;
        case "affective":
            if (data.totalDialogue === 0) return "<strong>no choices yet</strong>";
            return `empathy <strong>${data.empathyScore >= 0 ? "+" : ""}${(data.empathyScore).toFixed(2)}</strong> · spared ${data.sparedCount} · hints ${data.hintUses}`;
        case "temporal":
            if (data.dataPoints < 4) return "<strong>collecting…</strong>";
            const arrow = data.learningVelocity > 0 ? "improving" : data.learningVelocity < 0 ? "declining" : "steady";
            return `learning velocity <strong>${data.learningVelocity >= 0 ? "+" : ""}${(data.learningVelocity * 100).toFixed(0)}%</strong> · ${arrow}`;
    }
    return "";
}

function renderDimensions(metrics, changedKeys = new Set()) {
    el.dims.innerHTML = DIMENSIONS.map((dim) => {
        const data = metrics[dim.key];
        const score = data?.score || 0;
        const pct = Math.round(score * 100);
        const pulseClass = changedKeys.has(dim.key) ? "pulse" : "";
        const primaryClass = dim.primary ? "primary" : "";
        return `
            <div class="dim-row dim-${dim.color} ${pulseClass} ${primaryClass}">
                <div class="dim-id">${dim.id}</div>
                <div class="dim-label">${dim.label}<br><span style="font-size:10px;color:var(--text-mute)">${describeDimension(dim, metrics)}</span></div>
                <div class="dim-bar-wrap"><div class="dim-bar" style="width: ${pct}%;"></div></div>
                <div class="dim-value">${score.toFixed(2)}</div>
            </div>
        `;
    }).join("");
}

function renderKCs() {
    el.kcList.innerHTML = KC_LIST.map((kc) => {
        const attempts = state.kcAttempts[kc.id] || 0;
        const correct  = state.kcCorrect[kc.id] || 0;
        const weightedC = state.kcWeightedCorrect[kc.id] || 0;
        const weightedA = state.kcDifficultySum[kc.id] || 0;
        const mastery  = weightedA > 0 ? weightedC / weightedA : 0;
        const pct = Math.round(mastery * 100);
        const stats = attempts === 0
            ? `<span style="color:var(--text-mute);">no data</span>`
            : `<span class="correct">${correct}</span>/${attempts}`;
        return `
            <div class="kc-row">
                <div class="kc-label"><span class="icon">${kc.icon}</span>${kc.label}</div>
                <div class="kc-bar-wrap"><div class="kc-bar" style="width: ${pct}%;"></div></div>
                <div class="kc-stats">${stats}</div>
            </div>
        `;
    }).join("");
}

function renderSummary(metrics) {
    const snap = state.snapshot || {};
    const acc = metrics.cognitive.attempts > 0
        ? `${(metrics.cognitive.correctnessRate * 100).toFixed(0)}%`
        : "—";
    const hp = snap.playerHp != null ? `${snap.playerHp}/${snap.playerMaxHp ?? "?"}` : "—";
    const mp = snap.playerMp != null ? `${snap.playerMp}/${snap.playerMaxMp ?? "?"}` : "—";
    el.summary.innerHTML = `
        <div class="profile-line"><span class="k">Chapter</span><span class="v accent">${snap.chapter || "—"} / 3</span></div>
        <div class="profile-line"><span class="k">Phase</span><span class="v">${snap.phase || "—"}</span></div>
        <div class="profile-line"><span class="k">Current node</span><span class="v">${snap.currentNodeId || "—"}</span></div>
        <div class="profile-line"><span class="k">Player HP / MP</span><span class="v">${hp} · ${mp}</span></div>
        <div class="profile-line"><span class="k">Companions</span><span class="v">${snap.companionCount || 0}/3 · max lvl ${(snap.companions || []).reduce((m, c) => Math.max(m, c.level || 0), 0)}</span></div>
        <div class="profile-line"><span class="k">Mentor tokens</span><span class="v">${snap.mentorTokens ?? "—"}</span></div>
        <div class="profile-line"><span class="k">Quests</span><span class="v">${snap.questsCompleted || 0} done · ${snap.questsActive || 0} active</span></div>
        <div class="profile-line"><span class="k">Combat</span><span class="v">${snap.combat?.inCombat ? `turn ${snap.combat.turnNumber} · ${snap.combat.enemiesAlive}/${snap.combat.enemyCount}` : "idle"}</span></div>
        <div class="profile-line"><span class="k">Questions</span><span class="v">${metrics.cognitive.correct}/${metrics.cognitive.attempts} · ${acc}</span></div>
        <div class="profile-line"><span class="k">Empathy (P/S/T)</span><span class="v">${metrics.affective.prosocial}/${metrics.affective.selfInt}/${metrics.affective.transactional}</span></div>
    `;
}

function renderEvent(evt, evidenceHtml) {
    const p = evt.payload || {};
    const tOffset = state.startedAt ? ((evt.ts - state.startedAt) / 1000).toFixed(1) + "s" : "—";

    let cls = "event-item";
    if (evt.type === "question_answered") cls += p.correct ? " correct" : " wrong";
    else if (evt.type === "spell_choice" || evt.type === "timing_cast") cls += " spell";
    else if (evt.type === "dialogue_choice" || evt.type === "enemy_spared") cls += " dialogue";
    else if (evt.type.startsWith("companion_")) cls += " companion";
    else if (evt.type === "hint_requested") cls += " mentor";
    else if (evt.type.startsWith("assessment_")) cls += " assess";
    else if (evt.type.startsWith("combat_") || evt.type.startsWith("dialogue_")) cls += " phase";
    else if (evt.type === "node_visited" || evt.type === "chapter_completed") cls += " phase";

    const payloadHtml = Object.entries(p)
        .filter(([k]) => !k.startsWith("_"))
        .map(([k, v]) => `<span class="k">${k}:</span> <span class="v">${formatValue(v)}</span>`)
        .join(" · ");

    const div = document.createElement("div");
    div.className = cls;
    div.innerHTML = `
        <div class="event-head">
            <span class="event-type">${evt.type}</span>
            <span>t+${tOffset}</span>
        </div>
        <div class="event-payload">${payloadHtml}</div>
        ${evidenceHtml ? `<div class="event-evidence">${evidenceHtml}</div>` : ""}
    `;

    const emptyState = el.eventList.querySelector(".empty-state");
    if (emptyState) emptyState.remove();

    el.eventList.insertBefore(div, el.eventList.firstChild);

    while (el.eventList.children.length > 60) {
        el.eventList.removeChild(el.eventList.lastChild);
    }
}

function formatValue(v) {
    if (v === null || v === undefined) return "null";
    if (typeof v === "number") return Number.isInteger(v) ? v : v.toFixed(2);
    if (typeof v === "boolean") return v ? "true" : "false";
    if (typeof v === "string") return v.length > 40 ? v.slice(0, 37) + "…" : v;
    if (Array.isArray(v)) return `[${v.length}]`;
    if (typeof v === "object") return "{…}";
    return String(v);
}

function renderStatusBar() {
    el.events.textContent = state.events.length;
    el.session.textContent = state.sessionId ? state.sessionId.slice(-6) : "—";

    if (state.startedAt) {
        const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
        const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
        const ss = String(elapsed % 60).padStart(2, "0");
        el.elapsed.textContent = `${mm}:${ss}`;
    }
}

function setChannelStatus(connected) {
    el.channel.textContent = connected ? "connected" : "waiting…";
    el.channel.className = "stat-value " + (connected ? "connected" : "disconnected");
}

/* --------------------------------------------------------------- */
/*  Event processing pipeline                                       */
/* --------------------------------------------------------------- */

function processEvent(evt) {
    const before = computeMetrics();

    state.events.push(evt);
    updateKC(evt);

    const after = computeMetrics();

    const changed = new Set();
    for (const dim of DIMENSIONS) {
        if (Math.abs((after[dim.key]?.score || 0) - (before[dim.key]?.score || 0)) > 0.001) {
            changed.add(dim.key);
        }
    }

    const evidenceHtml = evidenceFor(evt, before, after);

    renderEvent(evt, evidenceHtml);
    renderDimensions(after, changed);
    renderKCs();
    renderSummary(after);
    renderStatusBar();
}

function applyBackfill(backfill) {
    state.sessionId = backfill.sessionId;
    state.startedAt = backfill.startedAt;
    state.meta      = backfill.meta;
    state.events    = [];
    state.kcAttempts = {};
    state.kcCorrect  = {};
    state.kcDifficultySum = {};
    state.kcWeightedCorrect = {};
    state.snapshot = backfill.snapshot;

    el.eventList.innerHTML = "";

    for (const evt of (backfill.events || [])) {
        state.events.push(evt);
        updateKC(evt);
    }

    const metrics = computeMetrics();
    renderDimensions(metrics, new Set());
    renderKCs();
    renderSummary(metrics);
    renderStatusBar();

    const recent = (backfill.events || []).slice(-20);
    for (const evt of recent) {
        renderEvent(evt, null);
    }
}

/* --------------------------------------------------------------- */
/*  BroadcastChannel wiring                                         */
/* --------------------------------------------------------------- */

function initChannel() {
    if (typeof BroadcastChannel === "undefined") {
        el.channel.textContent = "unsupported";
        return;
    }

    const channel = new BroadcastChannel(CHANNEL_NAME);

    channel.addEventListener("message", (msg) => {
        const { type, data } = msg.data || {};
        if (!type) return;

        setChannelStatus(true);

        switch (type) {
            case "session_start":
                state.sessionId = data.sessionId;
                state.startedAt = data.startedAt;
                state.meta      = data.meta;
                state.events    = [];
                state.kcAttempts = {};
                state.kcCorrect  = {};
                state.kcDifficultySum = {};
                state.kcWeightedCorrect = {};
                el.eventList.innerHTML = "";
                const startMetrics = computeMetrics();
                renderDimensions(startMetrics, new Set());
                renderKCs();
                renderSummary(startMetrics);
                break;

            case "session_backfill":
                applyBackfill(data);
                break;

            case "event":
                if (data.snapshot) state.snapshot = data.snapshot;
                processEvent(data.event);
                break;

            case "snapshot":
                state.snapshot = data;
                const liveMetrics = computeMetrics();
                renderDimensions(liveMetrics, new Set());
                renderSummary(liveMetrics);
                renderStatusBar();
                break;

            case "session_end":
                state.snapshot = data.snapshot;
                const endMetrics = computeMetrics();
                renderDimensions(endMetrics, new Set());
                renderSummary(endMetrics);
                renderEvent(
                    { type: "session_end", ts: Date.now(), payload: data.summary || {} },
                    "Session ended — final profile recorded."
                );
                break;
        }
    });

    channel.postMessage({ type: "debug_hello" });
    el.channel.textContent = "listening";
    el.channel.className = "stat-value";
}

/* --------------------------------------------------------------- */
/*  Startup                                                          */
/* --------------------------------------------------------------- */

function init() {
    const m = computeMetrics();
    renderDimensions(m, new Set());
    renderKCs();
    renderSummary(m);
    renderStatusBar();

    initChannel();

    setInterval(renderStatusBar, 1000);
}

init();
