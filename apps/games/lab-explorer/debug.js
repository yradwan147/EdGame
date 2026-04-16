/**
 * debug.js — live ECD profile viewer for Lab Explorer (5 science experiments).
 *
 * Runs in a second browser window opened from main.js (debug mode).
 * Listens on BroadcastChannel('edgame-debug') for telemetry events
 * streamed from the game window, maintains a local copy of the
 * session, recomputes D1-D6 metrics on every event, and renders a
 * live evidence-centered design view.
 *
 * Primary dimension: D3 Strategic Behavior (systematic
 * experimentation, equipment selection quality, discovery vs
 * disaster ratio).
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
    snapshot: null,
    kcAttempts: {},
    kcCorrect: {},
    kcDifficultySum: {},
    kcWeightedCorrect: {},
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
    { id: "D3", key: "strategic",  label: "Strategic Behavior",   color: "d3", primary: true },
    { id: "D4", key: "social",     label: "Social & Collaborative", color: "d4" },
    { id: "D5", key: "affective",  label: "Affective & SEL",      color: "d5" },
    { id: "D6", key: "temporal",   label: "Temporal & Growth",    color: "d6" },
];

const KC_LIST = [
    { id: "chemistry", label: "Chemistry", icon: "⚗" },
    { id: "physics",   label: "Physics",   icon: "⚡" },
];

/* Per-experiment KCs (for contextual reference / optional tracking). */
const EXPERIMENT_KC = {
    acid_base:     "chemistry",
    density:       "chemistry",
    circuits:      "physics",
    pendulum:      "physics",
    heat_transfer: "physics",
};

const TOTAL_EXPERIMENTS = 5;

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

/* Compute number of unique variable combinations tried across run_start events. */
function countUniqueVariableCombos(runStartEvents) {
    const seen = new Set();
    for (const e of runStartEvents) {
        const vars = e.payload?.vars || {};
        const key = Object.keys(vars).sort().map((k) => `${k}=${vars[k]}`).join("|");
        seen.add(key);
    }
    return seen.size;
}

function computeMetrics() {
    const events = state.events;
    const snap   = state.snapshot || {};
    const qEvents = events.filter((e) => e.type === "question_answered");
    const hypEvents = events.filter((e) => e.type === "hypothesis_selected");
    const runStartEvents = events.filter((e) => e.type === "run_start");
    const runCompleteEvents = events.filter((e) => e.type === "run_complete");
    const discoveryEvents = events.filter((e) => e.type === "discovery_found");
    const failureEvents = events.filter((e) => e.type === "failure_triggered");
    const wrongToolEvents = events.filter((e) => e.type === "wrong_tool");
    const equipConfirmEvents = events.filter((e) => e.type === "equipment_confirmed");
    const observationEvents = events.filter((e) => e.type === "observations_selected");
    const conclusionEvents = events.filter((e) => e.type === "conclusion_selected");
    const experimentAbandoned = events.filter((e) => e.type === "experiment_abandoned");
    const phaseStarts = events.filter((e) => e.type === "phase_start");

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

    /* D2 Engagement — experiments reached / actions per minute */
    const playMin = (snap.elapsedMs || 0) / 60000;
    const totalActions = qAttempted
        + runStartEvents.length
        + equipConfirmEvents.length
        + hypEvents.length
        + observationEvents.length
        + conclusionEvents.length;
    const actionsPerMin = playMin > 0 ? totalActions / playMin : 0;
    // Experiments "completed" is approximated by conclusion_selected events
    const experimentsFinished = conclusionEvents.length;
    const completionRate = Math.min(1, experimentsFinished / TOTAL_EXPERIMENTS);
    const d2Score = Math.max(0, Math.min(1,
        completionRate * 0.5 + Math.min(1, actionsPerMin / 10) * 0.3
        - Math.min(0.2, experimentAbandoned.length * 0.1)
        + 0.2 * Math.min(1, runStartEvents.length / 3)));

    /* D3 Strategic (PRIMARY) — systematic experimentation + equipment choice */
    const runCount = snap.runCount || runStartEvents.length;
    const uniqueCombos = countUniqueVariableCombos(runStartEvents);
    // Systematic rate: how many of the runs explored new variable combos
    const systematicRate = runCount > 0 ? uniqueCombos / runCount : 0;
    const discoveryCount = discoveryEvents.length;
    const failureCount = failureEvents.length;
    // Equipment selection: penalty for wrong-tool attempts
    const wrongToolPenalty = Math.min(0.4, wrongToolEvents.length * 0.1);
    // Hypothesis correctness — taken from the highest hypothesis score observed.
    // Each hypothesis_selected event carries a score (0..1) from experimentEngine.
    let hypothesisScore = 0;
    for (const h of hypEvents) {
        if (typeof h.payload.score === "number" && h.payload.score > hypothesisScore) {
            hypothesisScore = h.payload.score;
        }
    }
    const normalisedHypScore = hypEvents.length > 0 ? hypothesisScore : 0;

    const d3Score = Math.max(0, Math.min(1,
        systematicRate * 0.35
        + Math.min(1, discoveryCount / 3) * 0.3
        + normalisedHypScore * 0.2
        + 0.15 // baseline credit for engaging with equipment phase
        - wrongToolPenalty
        - Math.min(0.2, failureCount * 0.05)));

    /* D4 Social — limited in single-player lab. Engagement with hints/
     * mentor help is captured as a small prosocial signal via question
     * context `wrong_equipment` (asking for guidance after safety
     * miss). Default is a low baseline. */
    const helpSeekingQs = qEvents.filter((e) => e.payload.context && e.payload.context.length).length;
    const d4Score = Math.max(0, Math.min(1,
        0.35 + Math.min(0.5, helpSeekingQs * 0.05)));

    /* D5 Affective — exploration rate (runs beyond minimum) + persistence */
    // Runs beyond the minimum (we take 3 runs as the "expected" floor for
    // full exploration in an experiment).
    const runsBeyondMin = Math.max(0, runCount - Math.min(3, runCount));
    const explorationRate = Math.min(1, runsBeyondMin / 4);
    // Persistence = fraction of runs taken AFTER first failure
    const firstFailureTs = failureEvents[0]?.ts ?? null;
    let persistence = 1.0;
    if (firstFailureTs != null && runCount > 0) {
        const runsAfter = runStartEvents.filter((e) => e.ts > firstFailureTs).length;
        persistence = runsAfter / runCount;
    }
    let wrongStreak = 0, frustrationEvents = 0;
    for (const e of qEvents) {
        if (!e.payload.correct) {
            wrongStreak += 1;
            if (wrongStreak === 3) frustrationEvents += 1;
        } else {
            wrongStreak = 0;
        }
    }
    const abandonPenalty = Math.min(0.3, experimentAbandoned.length * 0.15);
    const d5Score = Math.max(0, Math.min(1,
        explorationRate * 0.5
        + persistence * 0.4
        - frustrationEvents * 0.1
        - abandonPenalty));

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
            completionRate,
            actionsPerMin,
            playMin,
            totalActions,
            experimentsFinished,
            abandoned: experimentAbandoned.length,
        },
        strategic: {
            score: d3Score,
            systematicRate,
            uniqueCombos,
            runCount,
            discoveryCount,
            failureCount,
            wrongToolAttempts: wrongToolEvents.length,
            hypothesisScore,
        },
        social: {
            score: d4Score,
            helpSeekingQs,
        },
        affective: {
            score: d5Score,
            explorationRate,
            persistence,
            frustrationEvents,
            abandoned: experimentAbandoned.length,
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
            const ctx = p.context || "";
            if (correct) {
                const speed = rt < 3000 ? "fast" : rt < 6000 ? "moderate" : "slow";
                lines.push(`✓ Correct in ${(rt/1000).toFixed(1)}s (${speed})${ctx ? ` · ${ctx}` : ""}`);
            } else {
                lines.push(`✗ Wrong${ctx ? ` · ${ctx}` : ""}`);
                lines.push(`→ Knowledge gap signal`);
            }
            const d1 = delta(before.cognitive.score, after.cognitive.score, "D1");
            if (d1) lines.push(`→ D1 Cognitive: ${d1.before} <span class="delta-${d1.dir}">${d1.dir === "up" ? "↑" : "↓"} ${d1.after}</span>`);
            break;
        }

        case "phase_start": {
            lines.push(`➤ Phase: ${p.phase}`);
            break;
        }

        case "hypothesis_selected": {
            const score = typeof p.score === "number" ? `score ${(p.score * 100).toFixed(0)}%` : "";
            lines.push(`✿ Hypothesis: ${p.hypothesisId || "?"} ${score}`);
            lines.push(`→ Conceptual commitment — D3 will reflect correctness`);
            break;
        }

        case "wrong_tool": {
            lines.push(`✗ Wrong tool attempt: ${p.equipmentId || "?"}`);
            lines.push(`→ Safety / equipment-selection penalty`);
            const d3 = delta(before.strategic.score, after.strategic.score, "D3");
            if (d3) lines.push(`→ D3 Strategic: ${d3.before} <span class="delta-${d3.dir}">${d3.dir === "up" ? "↑" : "↓"} ${d3.after}</span>`);
            break;
        }

        case "equipment_confirmed": {
            const count = (p.equipmentSelected || p.equipment || []).length;
            lines.push(`✓ Equipment confirmed (${count} items)`);
            lines.push(`→ Proceeding to variable phase`);
            break;
        }

        case "run_start": {
            const vars = p.vars || {};
            const varStr = Object.entries(vars).map(([k, v]) => `${k}=${v}`).join(", ");
            lines.push(`⚗ Run #${p.runNumber || "?"}: ${varStr || "no vars"}`);
            lines.push(`→ Unique-combo count now: ${after.strategic.uniqueCombos}`);
            break;
        }

        case "run_complete": {
            const nDisc = (p.discoveries || []).length;
            const nFail = (p.failures || []).length;
            lines.push(`✓ Run #${p.runNumber || "?"} complete · result ${p.result ?? "?"}`);
            if (nDisc) lines.push(`→ ${nDisc} discovery${nDisc > 1 ? "ies" : ""} unlocked`);
            if (nFail) lines.push(`→ ${nFail} failure${nFail > 1 ? "s" : ""} triggered`);
            const d3 = delta(before.strategic.score, after.strategic.score, "D3");
            if (d3) lines.push(`→ D3 Strategic: ${d3.before} <span class="delta-${d3.dir}">${d3.dir === "up" ? "↑" : "↓"} ${d3.after}</span>`);
            break;
        }

        case "discovery_found": {
            lines.push(`★ Discovery: ${p.discoveryId || "?"}`);
            lines.push(`→ Exploration pay-off — D5 Affective boost`);
            break;
        }

        case "failure_triggered": {
            lines.push(`✗ Failure: ${p.failureId || "?"}`);
            lines.push(`→ Evidence: predictable hazard — check equipment/variables`);
            break;
        }

        case "observations_selected": {
            const n = (p.observationIds || p.observations || []).length;
            lines.push(`✓ Observations selected (${n})`);
            break;
        }

        case "conclusion_selected": {
            lines.push(`✿ Conclusion: ${p.conclusionId || "?"}`);
            lines.push(`→ Experiment complete`);
            break;
        }

        case "experiment_abandoned": {
            lines.push(`✗ Experiment abandoned: ${p.experimentId || "?"}`);
            lines.push(`→ Strong frustration/avoidance signal`);
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
            const d3 = delta(before.strategic.score, after.strategic.score, "D3");
            if (d1) lines.push(`→ D1 Cognitive: ${d1.before} <span class="delta-${d1.dir}">${d1.dir === "up" ? "↑" : "↓"} ${d1.after}</span>`);
            if (d3) lines.push(`→ D3 Strategic: ${d3.before} <span class="delta-${d3.dir}">${d3.dir === "up" ? "↑" : "↓"} ${d3.after}</span>`);
        }
    }

    return lines.join("<br>");
}

/* --------------------------------------------------------------- */
/*  Knowledge component tracking                                     */
/* --------------------------------------------------------------- */

function updateKC(evt) {
    if (evt.type !== "question_answered") return;
    // LE's question_answered payload often lacks a subject field, so
    // infer from the current experiment (snapshot-driven).
    let subject = evt.payload.subject;
    if (!subject && state.snapshot?.currentExperimentId) {
        subject = EXPERIMENT_KC[state.snapshot.currentExperimentId] || null;
    }
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
            return `finished <strong>${data.experimentsFinished}/5</strong> · ${data.actionsPerMin.toFixed(1)}/min · abandoned ${data.abandoned}`;
        case "strategic":
            if (data.runCount === 0) return "<strong>no runs yet</strong>";
            return `systematic <strong>${(data.systematicRate * 100).toFixed(0)}%</strong> · ${data.discoveryCount}★ / ${data.failureCount}✗ · ${data.uniqueCombos} combos`;
        case "social":
            return `help-seeking <strong>${data.helpSeekingQs}</strong>`;
        case "affective":
            return `exploration <strong>${(data.explorationRate * 100).toFixed(0)}%</strong> · persistence ${data.persistence.toFixed(2)}`;
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
    const vars = snap.variableSettings || {};
    const varStr = Object.keys(vars).length > 0
        ? Object.entries(vars).map(([k, v]) => `${k}=${v}`).join(", ")
        : "—";
    el.summary.innerHTML = `
        <div class="profile-line"><span class="k">Experiment</span><span class="v accent">${snap.currentExperimentId || "—"}</span></div>
        <div class="profile-line"><span class="k">Phase</span><span class="v">${snap.phase || "—"}</span></div>
        <div class="profile-line"><span class="k">Hypothesis</span><span class="v">${snap.hypothesisSelected || "—"}</span></div>
        <div class="profile-line"><span class="k">Equipment</span><span class="v">${(snap.equipmentSelected || []).length} items</span></div>
        <div class="profile-line"><span class="k">Variables</span><span class="v">${varStr}</span></div>
        <div class="profile-line"><span class="k">Runs</span><span class="v">${snap.runCount || 0} · ${metrics.strategic.uniqueCombos} combos</span></div>
        <div class="profile-line"><span class="k">Discoveries</span><span class="v">${snap.discoveryCount || 0} ★ · ${snap.failureCount || 0} ✗</span></div>
        <div class="profile-line"><span class="k">Wrong tool / extreme</span><span class="v">${snap.wrongToolAttempts || 0} · ${snap.extremeValueAttempts || 0}</span></div>
        <div class="profile-line"><span class="k">Total score</span><span class="v">${snap.totalScore ?? 0}</span></div>
        <div class="profile-line"><span class="k">Questions</span><span class="v">${metrics.cognitive.correct}/${metrics.cognitive.attempts} · ${acc}</span></div>
    `;
}

function renderEvent(evt, evidenceHtml) {
    const p = evt.payload || {};
    const tOffset = state.startedAt ? ((evt.ts - state.startedAt) / 1000).toFixed(1) + "s" : "—";

    let cls = "event-item";
    if (evt.type === "question_answered") cls += p.correct ? " correct" : " wrong";
    else if (evt.type === "run_start" || evt.type === "run_complete") cls += " run";
    else if (evt.type === "discovery_found") cls += " discovery";
    else if (evt.type === "failure_triggered" || evt.type === "wrong_tool" || evt.type === "experiment_abandoned") cls += " failure";
    else if (evt.type === "hypothesis_selected" || evt.type === "conclusion_selected") cls += " hypothesis";
    else if (evt.type === "phase_start" || evt.type === "equipment_confirmed" || evt.type === "observations_selected") cls += " phase";
    else if (evt.type.startsWith("assessment_")) cls += " assess";

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
