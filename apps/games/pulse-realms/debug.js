/**
 * debug.js — live ECD profile viewer for Pulse Realms (3v3 team arena).
 *
 * Runs in a second browser window opened from main.js (debug mode).
 * Listens on BroadcastChannel('edgame-debug') for telemetry events
 * streamed from the game window, maintains a local copy of the
 * session, recomputes D1-D6 metrics on every event, and renders a
 * live evidence-centered design view.
 *
 * Primary dimension: D4 Social & Collaborative (role adherence,
 * teammate-support actions).
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
    prevMetrics: null,        // previous metrics (for delta detection)
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
    { id: "math",    label: "Math",    icon: "×" },
    { id: "science", label: "Science", icon: "⚛" },
    { id: "general", label: "General", icon: "?" },
];

/* Actions that support teammates (heals/buffs/shields) — used to
 * recognise prosocial play under Pulse Realms' role model. */
const SUPPORT_ACTIONS = new Set([
    "heal", "healAlly", "shield", "buff", "reinforce", "restore",
    "support", "rally", "protect", "build",
]);

const DAMAGE_ACTIONS = new Set([
    "attack", "strike", "blast", "pulse", "snipe", "skirmish", "charge",
]);

const MATCH_DURATION_MS = 5 * 60 * 1000;

/* --------------------------------------------------------------- */
/*  Lite metric computation (mirrors assessment of the game)        */
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

function classifyAction(actionId) {
    if (!actionId) return "other";
    const a = String(actionId).toLowerCase();
    if (SUPPORT_ACTIONS.has(a)) return "support";
    for (const s of SUPPORT_ACTIONS) {
        if (a.includes(s)) return "support";
    }
    if (DAMAGE_ACTIONS.has(a)) return "damage";
    for (const s of DAMAGE_ACTIONS) {
        if (a.includes(s)) return "damage";
    }
    return "other";
}

function expectedRolePattern(roleId) {
    const r = (roleId || "").toLowerCase();
    if (r.includes("heal") || r.includes("support") || r.includes("medic")) return "support";
    if (r.includes("build") || r.includes("engineer")) return "support";
    if (r.includes("attack") || r.includes("striker") || r.includes("dps")) return "damage";
    return null;
}

function computeMetrics() {
    const events = state.events;
    const snap   = state.snapshot || {};
    const qEvents = events.filter((e) => e.type === "question_answered");
    const aEvents = events.filter((e) => e.type === "action_performed");
    const dEvents = events.filter((e) => e.type === "damage_taken");

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

    /* D2 Engagement — match elapsed / actions per minute / completion */
    const matchElapsedMs = snap.matchElapsedMs || snap.elapsedMs || 0;
    const playMin = matchElapsedMs / 60000;
    const actions = aEvents.length + qAttempted;
    const actionsPerMin = playMin > 0 ? actions / playMin : 0;
    const completionRate = Math.min(1, matchElapsedMs / MATCH_DURATION_MS);
    const d2Score = Math.max(0, Math.min(1,
        completionRate * 0.5 + Math.min(1, actionsPerMin / 12) * 0.5));

    /* D3 Strategic — action variation + target choice */
    const actionCounts = {};
    for (const e of aEvents) {
        const t = e.payload.actionType;
        if (t) actionCounts[t] = (actionCounts[t] || 0) + 1;
    }
    const actionDiversity = shannonEntropy(Object.values(actionCounts));
    const successfulActions = aEvents.filter((e) => e.payload.success).length;
    const successRate = aEvents.length > 0 ? successfulActions / aEvents.length : 0;
    const d3Score = Math.max(0, Math.min(1,
        actionDiversity * 0.5 + successRate * 0.5));

    /* D4 Social (PRIMARY) — role adherence + teammate-support ratio */
    const roleId = snap.selectedRoleId || "";
    const expected = expectedRolePattern(roleId);
    let supportActions = 0;
    let damageActions = 0;
    let otherActions = 0;
    let roleAlignedActions = 0;
    for (const e of aEvents) {
        const klass = classifyAction(e.payload.actionType);
        if (klass === "support") supportActions += 1;
        else if (klass === "damage") damageActions += 1;
        else otherActions += 1;
        if (expected && klass === expected) roleAlignedActions += 1;
    }
    const totalActs = aEvents.length;
    const supportRatio = totalActs > 0 ? supportActions / totalActs : 0;
    const roleAdherence = (expected && totalActs > 0)
        ? roleAlignedActions / totalActs
        : 0.5; // neutral baseline when role-agnostic
    // D4 weighted: role adherence + support ratio bonus
    const d4Score = Math.max(0, Math.min(1,
        roleAdherence * 0.6 + supportRatio * 0.4));

    /* D5 Affective — persistence after damage */
    let totalDamageTaken = 0;
    let firstDamageTs = null;
    for (const e of dEvents) {
        const amt = e.payload.amount || 0;
        totalDamageTaken += amt;
        if (firstDamageTs == null) firstDamageTs = e.ts;
    }
    let persistence = 1.0;
    if (firstDamageTs && aEvents.length > 0) {
        const actionsAfterDamage = aEvents.filter((e) => e.ts > firstDamageTs).length;
        persistence = actionsAfterDamage / aEvents.length;
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
    const d5Score = Math.max(0, Math.min(1, persistence - frustrationEvents * 0.15));

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
            actionsPerMin,
            completionRate,
            playMin,
            totalActions: actions,
        },
        strategic: {
            score: d3Score,
            actionDiversity,
            successRate,
            actionCounts,
        },
        social: {
            score: d4Score,
            roleId,
            expectedPattern: expected,
            roleAdherence,
            supportRatio,
            supportActions,
            damageActions,
            otherActions,
            totalActs,
        },
        affective: {
            score: d5Score,
            persistence,
            frustrationEvents,
            totalDamageTaken,
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
        case "game_started": {
            lines.push(`Match started — role ${p.role || "?"} · subject ${p.questionSubject || "?"}`);
            break;
        }

        case "question_answered": {
            const correct = p.correct;
            const rt = p.responseTimeMs || 0;
            const diff = p.difficulty || 1;
            const actionType = p.actionType || "";

            if (correct) {
                const speed = rt < 3000 ? "fast" : rt < 6000 ? "moderate" : "slow";
                lines.push(`✓ Correct at diff ${diff} in ${(rt/1000).toFixed(1)}s (${speed})`);
                if (p.powerMultiplier) {
                    lines.push(`→ Powered ${actionType} at ${(p.powerMultiplier * 100).toFixed(0)}%`);
                }
            } else {
                lines.push(`✗ Wrong at diff ${diff} — ${actionType || "action"} fizzled`);
                lines.push(`→ Evidence: knowledge gap in ${p.subject || "subject"}`);
            }

            if (p.subject) {
                lines.push(`→ KC "${p.subject}" mastery updated`);
            }

            const d1 = delta(before.cognitive.score, after.cognitive.score, "D1");
            if (d1) lines.push(`→ D1 Cognitive: ${d1.before} <span class="delta-${d1.dir}">${d1.dir === "up" ? "↑" : "↓"} ${d1.after}</span>`);
            break;
        }

        case "action_performed": {
            const klass = classifyAction(p.actionType);
            const role  = p.role || "?";
            const target = p.targetId || "—";
            const icon  = klass === "support" ? "♥" : klass === "damage" ? "⚔" : "·";
            lines.push(`${icon} ${p.actionType} by ${role} → ${target}` + (p.success ? " (hit)" : " (miss)"));
            if (klass === "support") {
                lines.push(`→ Prosocial action — D4 social signal`);
            } else if (klass === "damage") {
                lines.push(`→ Combat action — role-expected if attacker`);
            }
            const d4 = delta(before.social.score, after.social.score, "D4");
            if (d4) lines.push(`→ D4 Social: ${d4.before} <span class="delta-${d4.dir}">${d4.dir === "up" ? "↑" : "↓"} ${d4.after}</span>`);
            const d3 = delta(before.strategic.score, after.strategic.score, "D3");
            if (d3) lines.push(`→ D3 Strategic: ${d3.before} <span class="delta-${d3.dir}">${d3.dir === "up" ? "↑" : "↓"} ${d3.after}</span>`);
            break;
        }

        case "damage_taken": {
            lines.push(`✗ ${p.amount || "?"} damage from ${p.sourceRole || p.sourceId || "?"}`);
            lines.push(`→ Persistence check: does the player continue acting?`);
            const d5 = delta(before.affective.score, after.affective.score, "D5");
            if (d5) lines.push(`→ D5 Affective: ${d5.before} <span class="delta-${d5.dir}">${d5.dir === "up" ? "↑" : "↓"} ${d5.after}</span>`);
            break;
        }

        case "game_ended": {
            const winner = p.winnerTeamId || p.winner || "?";
            lines.push(`★ Match ended — winner ${winner}`);
            if (p.allyScore != null || p.enemyScore != null) {
                lines.push(`→ Score ${p.allyScore || 0} vs ${p.enemyScore || 0}`);
            }
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
            lines.push(`→ Final profile snapshot from engine`);
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
            return `<strong>${(data.completionRate * 100).toFixed(0)}%</strong> match · ${data.actionsPerMin.toFixed(1)}/min pace`;
        case "strategic":
            return `diversity <strong>${data.actionDiversity.toFixed(2)}</strong> · hit-rate <strong>${(data.successRate * 100).toFixed(0)}%</strong>`;
        case "social":
            if (data.totalActs === 0) return "<strong>no actions yet</strong>";
            return `role ${data.roleId || "?"} · adherence <strong>${(data.roleAdherence * 100).toFixed(0)}%</strong> · support <strong>${(data.supportRatio * 100).toFixed(0)}%</strong>`;
        case "affective":
            return `persistence <strong>${data.persistence.toFixed(2)}</strong> · dmg taken ${data.totalDamageTaken}`;
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
    const elapsedSec = Math.floor((snap.matchElapsedMs || 0) / 1000);
    const mm = String(Math.floor(elapsedSec / 60)).padStart(2, "0");
    const ss = String(elapsedSec % 60).padStart(2, "0");
    const obj = snap.objectivePoints || { ally: 0, enemy: 0, captureOwner: null };
    el.summary.innerHTML = `
        <div class="profile-line"><span class="k">Status</span><span class="v accent">${snap.status || "—"}</span></div>
        <div class="profile-line"><span class="k">Role</span><span class="v">${snap.selectedRoleId || "—"}</span></div>
        <div class="profile-line"><span class="k">Subject</span><span class="v">${snap.selectedSubject || "—"}</span></div>
        <div class="profile-line"><span class="k">Match time</span><span class="v">${mm}:${ss} / 05:00</span></div>
        <div class="profile-line"><span class="k">Ally alive</span><span class="v">${snap.alliesAlive || 0}/${snap.allyCount || 0} · ${snap.allyHpTotal || 0} HP</span></div>
        <div class="profile-line"><span class="k">Enemy alive</span><span class="v">${snap.enemiesAlive || 0}/${snap.enemyCount || 0} · ${snap.enemyHpTotal || 0} HP</span></div>
        <div class="profile-line"><span class="k">Objective</span><span class="v">A ${obj.ally} · E ${obj.enemy} · owner ${obj.captureOwner || "—"}</span></div>
        <div class="profile-line"><span class="k">Questions</span><span class="v">${metrics.cognitive.correct}/${metrics.cognitive.attempts} · ${acc}</span></div>
        <div class="profile-line"><span class="k">Support / Damage</span><span class="v">${metrics.social.supportActions} ♥ / ${metrics.social.damageActions} ⚔</span></div>
    `;
}

function renderEvent(evt, evidenceHtml) {
    const p = evt.payload || {};
    const tOffset = state.startedAt ? ((evt.ts - state.startedAt) / 1000).toFixed(1) + "s" : "—";

    let cls = "event-item";
    if (evt.type === "question_answered") cls += p.correct ? " correct" : " wrong";
    else if (evt.type === "action_performed") cls += " action";
    else if (evt.type === "damage_taken") cls += " damage";
    else if (evt.type.startsWith("assessment_")) cls += " assess";
    else if (evt.type === "game_started" || evt.type === "game_ended") cls += " phase";

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
