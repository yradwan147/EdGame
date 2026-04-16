/**
 * debug.js — live ECD profile viewer for Survival Equation
 * (cooperative puzzle, 3 scenarios × 5 days each).
 *
 * Runs in a second browser window opened from main.js (debug mode).
 * Listens on BroadcastChannel('edgame-debug') for telemetry events
 * streamed from the game window, maintains a local copy of the
 * session, recomputes D1-D6 metrics on every event, and renders a
 * live evidence-centered design view.
 *
 * Primary dimension: D4 Social & Collaborative — message mix,
 * resource fairness (Gini), team-contribution equity.
 */

const CHANNEL_NAME = "edgame-debug";

/* --------------------------------------------------------------- */
/*  State                                                           */
/* --------------------------------------------------------------- */

const state = {
    sessionId: null,
    startedAt: null,
    meta: null,
    events: [],
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
    { id: "D3", key: "strategic",  label: "Strategic Behavior",   color: "d3" },
    { id: "D4", key: "social",     label: "Social & Collaborative", color: "d4", primary: true },
    { id: "D5", key: "affective",  label: "Affective & SEL",      color: "d5" },
    { id: "D6", key: "temporal",   label: "Temporal & Growth",    color: "d6" },
];

const KC_LIST = [
    { id: "applied_math",    label: "Applied Math",    icon: "∑" },
    { id: "applied_science", label: "Applied Science", icon: "🧭" },
];

const TOTAL_DAYS_DEFAULT = 5;

/* Heuristic classification mirrored from communicationSystem.js */
const INFO_KEYWORDS = ["found", "discovered", "my data says", "according to", "i see", "the report shows", "blueprint", "chart", "map", "lab report"];
const REQUEST_KEYWORDS = ["what", "how", "can you", "do you know", "anyone know", "need help", "tell me", "explain", "check"];
const OFF_TASK_KEYWORDS = ["lol", "haha", "bored", "whatever", "who cares", "meh"];

function classifyMessage(text) {
    if (!text) return { isInfoShare: false, isInfoRequest: false, isOnTask: true, isOffTask: false };
    const lower = String(text).toLowerCase();
    const isInfoShare = INFO_KEYWORDS.some((kw) => lower.includes(kw));
    const isInfoRequest = REQUEST_KEYWORDS.some((kw) => lower.includes(kw));
    const isOffTask = OFF_TASK_KEYWORDS.some((kw) => lower.includes(kw));
    return {
        isInfoShare,
        isInfoRequest,
        isOnTask: !isOffTask || isInfoShare || isInfoRequest,
        isOffTask: isOffTask && !isInfoShare && !isInfoRequest,
    };
}

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

/* Gini coefficient on a small array — 0 = perfectly equal, 1 = fully concentrated. */
function gini(values) {
    const xs = values.filter((v) => v != null && !Number.isNaN(v));
    if (xs.length === 0) return 0;
    const sum = xs.reduce((s, v) => s + v, 0);
    if (sum === 0) return 0;
    const n = xs.length;
    let g = 0;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            g += Math.abs(xs[i] - xs[j]);
        }
    }
    return g / (2 * n * sum);
}

function computeMetrics() {
    const events = state.events;
    const snap   = state.snapshot || {};
    const qEvents = events.filter((e) => e.type === "question_answered");
    const msgEvents = events.filter((e) => e.type === "player_message");
    const puzzleEntered = events.filter((e) => e.type === "puzzle_entered");
    const puzzleStepComplete = events.filter((e) => e.type === "puzzle_step_complete");
    const puzzleComplete = events.filter((e) => e.type === "puzzle_complete");
    const scenarioComplete = events.filter((e) => e.type === "scenario_complete");
    const roleSelectedEvents = events.filter((e) => e.type === "role_selected");

    /* D1 Cognitive — questions and puzzle-step correctness */
    const qAttempted = qEvents.length;
    const qCorrect   = qEvents.filter((e) => e.payload.correct).length;
    const stepAttempted = puzzleStepComplete.length;
    const stepCorrect = puzzleStepComplete.filter((e) => e.payload.correct).length;
    // Combine Q and puzzle steps for a broader correctness signal
    const totalAttempted = qAttempted + stepAttempted;
    const totalCorrect   = qCorrect + stepCorrect;
    const correctnessRate = totalAttempted > 0 ? totalCorrect / totalAttempted : 0;
    const avgRtMs = qAttempted > 0
        ? qEvents.reduce((s, e) => s + (e.payload.responseTimeMs || 0), 0) / qAttempted
        : 0;
    const fast = avgRtMs < 4000;
    const accurate = correctnessRate >= 0.7;
    const speedAccuracy = fast && accurate ? "fast_accurate"
                        : fast && !accurate ? "fast_inaccurate"
                        : !fast && accurate ? "slow_accurate"
                        : "slow_inaccurate";
    const d1Score = Math.max(0, Math.min(1, correctnessRate * (fast ? 1.05 : 1.0)));

    /* D2 Engagement — scenario day progress + actions/minute */
    const currentDay = snap.currentDay || 0;
    const totalDays = snap.totalDays || TOTAL_DAYS_DEFAULT;
    const playMin = (snap.elapsedMs || 0) / 60000;
    const totalActions = qAttempted + msgEvents.length + puzzleStepComplete.length;
    const actionsPerMin = playMin > 0 ? totalActions / playMin : 0;
    const completionRate = totalDays > 0 ? Math.min(1, currentDay / totalDays) : 0;
    const d2Score = Math.max(0, Math.min(1,
        completionRate * 0.55 + Math.min(1, actionsPerMin / 10) * 0.35
        + 0.1 * Math.min(1, puzzleComplete.length / 3)));

    /* D3 Strategic — resource-allocation decisions + puzzle score trend */
    // Resource balance (snapshot): a team that keeps all three resources
    // above a floor exhibits better strategy.
    const res = snap.resources || { food: 0, water: 0, materials: 0 };
    const minRes = Math.min(res.food, res.water, res.materials);
    const resourceBalance = Math.max(0, Math.min(1, minRes / 50));
    // Puzzle score rolling average
    const avgPuzzleScore = puzzleComplete.length > 0
        ? puzzleComplete.reduce((s, e) => s + (e.payload.score || 0), 0) / puzzleComplete.length
        : 0;
    const d3Score = Math.max(0, Math.min(1,
        resourceBalance * 0.5 + avgPuzzleScore * 0.5));

    /* D4 Social (PRIMARY) — communication quality + resource fairness + equity */
    let infoShares = 0, infoRequests = 0, offTask = 0, onTask = 0;
    for (const e of msgEvents) {
        const c = classifyMessage(e.payload.text);
        if (c.isInfoShare) infoShares += 1;
        if (c.isInfoRequest) infoRequests += 1;
        if (c.isOffTask) offTask += 1;
        else onTask += 1;
    }
    const totalMsgs = msgEvents.length;
    const onTaskRatio = totalMsgs > 0 ? onTask / totalMsgs : 0.5;
    const shareBalance = totalMsgs > 0
        ? 1 - Math.abs(infoShares - infoRequests) / totalMsgs
        : 0.5;
    // Resource fairness — Gini on shared resource pool (low is fair)
    const resVals = [res.food, res.water, res.materials];
    const resGini = gini(resVals);
    const resourceFairness = 1 - resGini; // 1 = perfectly equal
    // Team health equity — Gini across roles
    const teamHealthVals = Object.values(snap.teamHealth || {});
    const teamGini = gini(teamHealthVals);
    const teamEquity = 1 - teamGini;
    // Collaboration events recorded by game
    const collabCount = snap.collaborationEvents || 0;
    const collabSignal = Math.min(1, collabCount / 10);
    const d4Score = Math.max(0, Math.min(1,
        onTaskRatio * 0.25
        + shareBalance * 0.15
        + resourceFairness * 0.25
        + teamEquity * 0.2
        + collabSignal * 0.15));

    /* D5 Affective — resource-sharing + frustration */
    // Team health as wellbeing proxy — drops indicate pressure
    const teamHealthAvg = snap.teamHealthAvg || 0;
    const teamHealthMin = snap.teamHealthMin || 0;
    const wellbeing = teamHealthAvg / 100;
    // Frustration: consecutive wrong steps
    let wrongStreak = 0, frustrationEvents = 0;
    for (const e of puzzleStepComplete) {
        if (!e.payload.correct) {
            wrongStreak += 1;
            if (wrongStreak === 3) frustrationEvents += 1;
        } else {
            wrongStreak = 0;
        }
    }
    // Resource-sharing rate from allocation history
    const resourceAllocations = snap.resourceAllocationHistory || 0;
    const sharingSignal = Math.min(1, resourceAllocations / 5);
    const d5Score = Math.max(0, Math.min(1,
        wellbeing * 0.5
        + sharingSignal * 0.3
        - frustrationEvents * 0.1
        + 0.2 * (teamHealthMin / 100)));

    /* D6 Temporal — learning velocity on puzzle steps + questions */
    let d6Score = 0;
    let learningVelocity = 0;
    let rtImprovement = 0;
    const attemptSeries = [...qEvents, ...puzzleStepComplete].sort((a, b) => a.ts - b.ts);
    if (attemptSeries.length >= 4) {
        const mid = Math.floor(attemptSeries.length / 2);
        const first = attemptSeries.slice(0, mid);
        const second = attemptSeries.slice(mid);
        const firstAcc = first.filter((e) => e.payload.correct).length / first.length;
        const secondAcc = second.filter((e) => e.payload.correct).length / second.length;
        learningVelocity = secondAcc - firstAcc;
        const firstRts = first.filter((e) => e.payload.responseTimeMs);
        const secondRts = second.filter((e) => e.payload.responseTimeMs);
        if (firstRts.length > 0 && secondRts.length > 0) {
            const firstRt = firstRts.reduce((s, e) => s + e.payload.responseTimeMs, 0) / firstRts.length;
            const secondRt = secondRts.reduce((s, e) => s + e.payload.responseTimeMs, 0) / secondRts.length;
            rtImprovement = firstRt - secondRt;
        }
        d6Score = Math.max(0, Math.min(1, 0.5 + learningVelocity));
    }

    return {
        cognitive: {
            score: d1Score,
            correctnessRate,
            avgRtMs,
            profile: speedAccuracy,
            attempts: totalAttempted,
            correct: totalCorrect,
            qAttempts: qAttempted,
            qCorrect,
            stepAttempts: stepAttempted,
            stepCorrect,
        },
        engagement: {
            score: d2Score,
            completionRate,
            actionsPerMin,
            currentDay,
            totalDays,
            totalActions,
            puzzlesDone: puzzleComplete.length,
        },
        strategic: {
            score: d3Score,
            resourceBalance,
            avgPuzzleScore,
            minResource: minRes,
        },
        social: {
            score: d4Score,
            onTaskRatio,
            infoShares,
            infoRequests,
            offTask,
            totalMsgs,
            resourceFairness,
            resGini,
            teamEquity,
            teamGini,
            collabCount,
        },
        affective: {
            score: d5Score,
            wellbeing,
            teamHealthAvg,
            teamHealthMin,
            frustrationEvents,
            sharingSignal,
            resourceAllocations,
        },
        temporal: {
            score: d6Score,
            learningVelocity,
            rtImprovement,
            dataPoints: attemptSeries.length,
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
        case "role_selected": {
            lines.push(`➤ Role: ${p.roleId || "?"} (scenario ${p.scenarioId || "?"})`);
            lines.push(`→ Role commitment — D4 evidence begins`);
            break;
        }

        case "puzzle_entered": {
            lines.push(`➤ Puzzle: ${p.puzzleId || "?"} on day ${p.day ?? "?"}`);
            break;
        }

        case "player_message": {
            const c = classifyMessage(p.text);
            const tags = [];
            if (c.isInfoShare)   tags.push("info-share");
            if (c.isInfoRequest) tags.push("info-request");
            if (c.isOffTask)     tags.push("off-task");
            const tagStr = tags.length ? tags.join(", ") : "on-task";
            lines.push(`✉ "${(p.text || "").slice(0, 80)}" (${tagStr})`);
            if (c.isInfoShare) lines.push(`→ Information sharing — prosocial collaboration`);
            if (c.isInfoRequest) lines.push(`→ Help-seeking — D4 prosocial signal`);
            if (c.isOffTask) lines.push(`→ Off-task — D2 attention dip`);
            const d4 = delta(before.social.score, after.social.score, "D4");
            if (d4) lines.push(`→ D4 Social: ${d4.before} <span class="delta-${d4.dir}">${d4.dir === "up" ? "↑" : "↓"} ${d4.after}</span>`);
            break;
        }

        case "puzzle_step_complete": {
            if (p.correct) {
                lines.push(`✓ Step ${p.stepId || "?"} · score ${p.score ?? "?"}`);
            } else {
                lines.push(`✗ Step ${p.stepId || "?"} wrong · score ${p.score ?? "?"}`);
            }
            const d1 = delta(before.cognitive.score, after.cognitive.score, "D1");
            if (d1) lines.push(`→ D1 Cognitive: ${d1.before} <span class="delta-${d1.dir}">${d1.dir === "up" ? "↑" : "↓"} ${d1.after}</span>`);
            break;
        }

        case "puzzle_complete": {
            const status = p.passed ? "PASSED" : "failed";
            lines.push(`★ Puzzle ${p.puzzleId || "?"} ${status} · score ${(p.score || 0).toFixed?.(2) ?? p.score}`);
            if (typeof p.commQuality === "number") {
                lines.push(`→ Communication quality: ${(p.commQuality * 100).toFixed(0)}%`);
            }
            const d3 = delta(before.strategic.score, after.strategic.score, "D3");
            if (d3) lines.push(`→ D3 Strategic: ${d3.before} <span class="delta-${d3.dir}">${d3.dir === "up" ? "↑" : "↓"} ${d3.after}</span>`);
            break;
        }

        case "scenario_complete": {
            lines.push(`★ Scenario ${p.scenarioId || "?"} complete — grade ${p.grade || "?"}`);
            lines.push(`→ Days survived ${p.daysSurvived ?? "?"} · puzzles ${p.puzzlesSolved ?? "?"}`);
            break;
        }

        case "question_answered": {
            const correct = p.correct;
            const rt = p.responseTimeMs || 0;
            if (correct) {
                const speed = rt < 3000 ? "fast" : rt < 6000 ? "moderate" : "slow";
                lines.push(`✓ Correct in ${(rt/1000).toFixed(1)}s (${speed})`);
            } else {
                lines.push(`✗ Wrong`);
            }
            const d1 = delta(before.cognitive.score, after.cognitive.score, "D1");
            if (d1) lines.push(`→ D1 Cognitive: ${d1.before} <span class="delta-${d1.dir}">${d1.dir === "up" ? "↑" : "↓"} ${d1.after}</span>`);
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
            const d4 = delta(before.social.score, after.social.score, "D4");
            if (d1) lines.push(`→ D1 Cognitive: ${d1.before} <span class="delta-${d1.dir}">${d1.dir === "up" ? "↑" : "↓"} ${d1.after}</span>`);
            if (d4) lines.push(`→ D4 Social: ${d4.before} <span class="delta-${d4.dir}">${d4.dir === "up" ? "↑" : "↓"} ${d4.after}</span>`);
        }
    }

    return lines.join("<br>");
}

/* --------------------------------------------------------------- */
/*  Knowledge component tracking                                     */
/* --------------------------------------------------------------- */

function inferSubject(evt) {
    // question_answered may carry subject; otherwise map based on
    // puzzle type signals (default applied_math).
    if (evt.payload?.subject) return evt.payload.subject;
    const pid = (evt.payload?.puzzleId || state.snapshot?.currentPuzzleId || "").toLowerCase();
    if (pid.includes("science") || pid.includes("bio") || pid.includes("chem") || pid.includes("lab")) {
        return "applied_science";
    }
    if (pid.includes("math") || pid.includes("ratio") || pid.includes("calc") || pid.includes("code")) {
        return "applied_math";
    }
    return null;
}

function updateKC(evt) {
    if (evt.type !== "question_answered" && evt.type !== "puzzle_step_complete") return;
    const subject = inferSubject(evt);
    if (!subject) return;
    const diff = evt.payload?.difficulty || 1;

    state.kcAttempts[subject]      = (state.kcAttempts[subject] || 0) + 1;
    state.kcDifficultySum[subject] = (state.kcDifficultySum[subject] || 0) + diff;
    if (evt.payload?.correct) {
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
            if (data.attempts === 0) return "<strong>Waiting for first attempt</strong>";
            return `<strong>${data.correct}/${data.attempts}</strong> correct · avg ${(data.avgRtMs/1000).toFixed(1)}s · ${data.profile.replace("_"," + ")}`;
        case "engagement":
            return `day <strong>${data.currentDay}/${data.totalDays}</strong> · ${data.actionsPerMin.toFixed(1)}/min · ${data.puzzlesDone} puzzles`;
        case "strategic":
            return `resource bal <strong>${(data.resourceBalance * 100).toFixed(0)}%</strong> · puzzle avg ${(data.avgPuzzleScore * 100).toFixed(0)}%`;
        case "social":
            if (data.totalMsgs === 0 && data.collabCount === 0) return "<strong>no social signal yet</strong>";
            return `on-task <strong>${(data.onTaskRatio * 100).toFixed(0)}%</strong> · fair <strong>${(data.resourceFairness * 100).toFixed(0)}%</strong> · equity ${(data.teamEquity * 100).toFixed(0)}%`;
        case "affective":
            return `wellbeing <strong>${(data.wellbeing * 100).toFixed(0)}%</strong> · min health ${data.teamHealthMin}`;
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
    const res = snap.resources || { food: 0, water: 0, materials: 0 };
    const world = snap.worldState || {};
    const flagsBuilt = [
        world.shelterBuilt && "shelter",
        world.waterFilterActive && "water",
        world.signalReady && "signal",
        world.allianceFormed && "alliance",
    ].filter(Boolean).join(", ") || "none";
    el.summary.innerHTML = `
        <div class="profile-line"><span class="k">Scenario</span><span class="v accent">${snap.scenarioId || "—"}</span></div>
        <div class="profile-line"><span class="k">Day</span><span class="v">${snap.currentDay || 0} / ${snap.totalDays || 5}</span></div>
        <div class="profile-line"><span class="k">Phase</span><span class="v">${snap.currentPhase || "—"}</span></div>
        <div class="profile-line"><span class="k">Role</span><span class="v">${snap.playerRole || "—"}</span></div>
        <div class="profile-line"><span class="k">Partners</span><span class="v">${(snap.aiPartners || []).map((p) => p.roleId).join(", ") || "—"}</span></div>
        <div class="profile-line"><span class="k">Resources</span><span class="v">F ${res.food} · W ${res.water} · M ${res.materials}</span></div>
        <div class="profile-line"><span class="k">Team health</span><span class="v">avg ${(snap.teamHealthAvg || 0).toFixed(0)} · min ${snap.teamHealthMin || 0}</span></div>
        <div class="profile-line"><span class="k">Puzzle</span><span class="v">${snap.currentPuzzleId || "—"} step ${snap.puzzleStepIndex || 0}</span></div>
        <div class="profile-line"><span class="k">Puzzles done</span><span class="v">${snap.puzzlesCompleted || 0}</span></div>
        <div class="profile-line"><span class="k">World flags</span><span class="v">${flagsBuilt}</span></div>
        <div class="profile-line"><span class="k">Messages</span><span class="v">${metrics.social.totalMsgs} (${metrics.social.infoShares}S/${metrics.social.infoRequests}R/${metrics.social.offTask}O)</span></div>
        <div class="profile-line"><span class="k">Resource fairness</span><span class="v">${(metrics.social.resourceFairness * 100).toFixed(0)}%</span></div>
        <div class="profile-line"><span class="k">Attempts</span><span class="v">${metrics.cognitive.correct}/${metrics.cognitive.attempts} · ${acc}</span></div>
    `;
}

function renderEvent(evt, evidenceHtml) {
    const p = evt.payload || {};
    const tOffset = state.startedAt ? ((evt.ts - state.startedAt) / 1000).toFixed(1) + "s" : "—";

    let cls = "event-item";
    if (evt.type === "question_answered" || evt.type === "puzzle_step_complete") {
        cls += p.correct ? " correct" : " wrong";
    } else if (evt.type === "player_message") cls += " message";
    else if (evt.type === "puzzle_entered" || evt.type === "puzzle_complete") cls += " puzzle";
    else if (evt.type === "scenario_complete") cls += " complete";
    else if (evt.type === "role_selected") cls += " phase";
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
