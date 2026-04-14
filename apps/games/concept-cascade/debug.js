/**
 * debug.js — live ECD profile viewer for Concept Cascade.
 *
 * Runs in a second browser window opened from main.js (debug mode).
 * Listens on BroadcastChannel('edgame-debug') for telemetry events
 * streamed from the game window, maintains a local copy of the
 * session, recomputes D1-D6 metrics on every event, and renders a
 * live evidence-centered design view.
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
    { id: "D3", key: "strategic",  label: "Strategic Behavior",   color: "d3", primary: true },
    { id: "D5", key: "affective",  label: "Affective & SEL",      color: "d5" },
    { id: "D6", key: "temporal",   label: "Temporal & Growth",    color: "d6" },
];

const KC_LIST = [
    { id: "number_sense", label: "Number Sense", icon: "#" },
    { id: "operations",   label: "Operations",   icon: "×" },
    { id: "fractions",    label: "Fractions",    icon: "½" },
    { id: "geometry",     label: "Geometry",     icon: "△" },
];

/* --------------------------------------------------------------- */
/*  Lite metric computation (mirrors assessmentEngine.js)           */
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

function computeMetrics() {
    const events = state.events;
    const snap   = state.snapshot || {};
    const qEvents = events.filter((e) => e.type === "question_answered");
    const tEvents = events.filter((e) => e.type === "tower_placed");

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

    /* D2 Engagement */
    const playMin = (snap.elapsedMs || 0) / 60000;
    const actions = tEvents.length
        + events.filter((e) => e.type === "tower_upgraded").length
        + qAttempted;
    const actionsPerMin = playMin > 0 ? actions / playMin : 0;
    const TOTAL_WAVES = 8;
    const completionRate = Math.min(1, (snap.wave || 0) / TOTAL_WAVES);
    // Score: completion dominates, actions/min rewards engagement up to a cap
    const d2Score = Math.max(0, Math.min(1, completionRate * 0.6 + Math.min(1, actionsPerMin / 8) * 0.4));

    /* D3 Strategic (PRIMARY) */
    const typeCounts = {};
    for (const e of tEvents) {
        const t = e.payload.towerType;
        if (t) typeCounts[t] = (typeCounts[t] || 0) + 1;
    }
    const towerTypes = ["numberBastion", "operationCannon", "fractionFreezer", "geometryGuard"];
    const countsArr = towerTypes.map((k) => typeCounts[k] || 0);
    const towerDiversity = shannonEntropy(countsArr);
    const synergyCount = (snap.discoveredSynergies || []).length;
    const earlyCallUsage = Math.min(1, (snap.earlyCallsUsed || 0) / Math.max(1, snap.wave || 1));
    const resourceEff = snap.totalGoldEarned > 0
        ? Math.min(1, (snap.totalGoldSpent || 0) / snap.totalGoldEarned)
        : 0;
    // Weighted composite
    const d3Score = Math.max(0, Math.min(1,
        towerDiversity * 0.4 +
        Math.min(1, synergyCount / 3) * 0.3 +
        resourceEff * 0.2 +
        earlyCallUsage * 0.1,
    ));

    /* D5 Affective */
    let wrongStreak = 0, frustrationEvents = 0;
    for (const e of qEvents) {
        if (!e.payload.correct) {
            wrongStreak += 1;
            if (wrongStreak === 3) frustrationEvents += 1;
        } else {
            wrongStreak = 0;
        }
    }
    // Persistence: questions answered after first leak
    let firstLeakTs = null;
    for (const e of events) {
        if (e.type === "enemy_leaked") { firstLeakTs = e.ts; break; }
    }
    let persistence = 1.0;
    if (firstLeakTs && qAttempted > 0) {
        const afterLeak = qEvents.filter((e) => e.ts > firstLeakTs).length;
        persistence = afterLeak / qAttempted;
    }
    const d5Score = Math.max(0, Math.min(1, persistence - frustrationEvents * 0.15));

    /* D6 Temporal */
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
        rtImprovement = firstRt - secondRt; // ms — positive = getting faster
        d6Score = Math.max(0, Math.min(1, 0.5 + learningVelocity)); // 0.5 baseline, nudged by delta
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
            towerDiversity,
            synergyCount,
            earlyCallUsage,
            resourceEff,
            typeCounts: countsArr,
        },
        affective: {
            score: d5Score,
            persistence,
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
            const ctx  = p.context || "";

            if (correct) {
                const speed = rt < 3000 ? "fast" : rt < 6000 ? "moderate" : "slow";
                lines.push(`✓ Correct at difficulty ${diff} in ${(rt/1000).toFixed(1)}s (${speed})`);
                if (rt < 3000) {
                    lines.push(`→ Evidence: fluent response — strong mastery signal`);
                } else if (rt > 6000) {
                    lines.push(`→ Evidence: deliberate response — present but not fluent`);
                }
            } else {
                const speed = rt < 2000 ? "too fast" : "slow";
                lines.push(`✗ Wrong at difficulty ${diff} (${speed})`);
                if (rt < 2000) {
                    lines.push(`→ Evidence: rushed guess — weak mastery signal`);
                } else {
                    lines.push(`→ Evidence: struggled — specific knowledge gap`);
                }
            }

            if (p.subject) {
                lines.push(`→ KC "${p.subject}" mastery updated`);
            }
            if (ctx) {
                lines.push(`→ Context: ${ctx}`);
            }

            const d1 = delta(before.cognitive.score, after.cognitive.score, "D1");
            if (d1) lines.push(`→ D1 Cognitive: ${d1.before} <span class="delta-${d1.dir}">${d1.dir === "up" ? "↑" : "↓"} ${d1.after}</span>`);
            break;
        }

        case "tower_placed": {
            lines.push(`✓ Built ${p.towerType} at (${p.tileCol}, ${p.tileRow}) for ${p.goldSpent}g`);
            lines.push(`→ Strategic choice: what tower mix is forming?`);
            const d3 = delta(before.strategic.score, after.strategic.score, "D3");
            if (d3) lines.push(`→ D3 Strategic: ${d3.before} <span class="delta-${d3.dir}">${d3.dir === "up" ? "↑" : "↓"} ${d3.after}</span>`);
            if (after.strategic.towerDiversity > before.strategic.towerDiversity + 0.01) {
                lines.push(`→ Tower diversity increased (${after.strategic.towerDiversity.toFixed(2)}) — adaptive strategy`);
            }
            break;
        }

        case "tower_upgraded": {
            lines.push(`↑ Upgraded ${p.towerType} to level ${p.newLevel} for ${p.goldSpent}g`);
            lines.push(`→ Investment strategy: doubling down vs diversifying`);
            break;
        }

        case "synergy_discovered": {
            lines.push(`★ SYNERGY: ${p.synergyName}`);
            lines.push(`→ Systems thinking indicator — discovered emergent combo`);
            lines.push(`→ D3 Strategic boost (+ creative problem-solving tag)`);
            break;
        }

        case "early_call_used": {
            lines.push(`↗ Early call on wave ${p.waveNumber} (+${p.bonusKC}g bonus)`);
            lines.push(`→ Risk-taking evidence — confident in current defenses`);
            break;
        }

        case "wave_started": {
            lines.push(`Wave ${p.waveNumber} begins — ${p.totalEnemies || "?"} enemies incoming`);
            break;
        }

        case "wave_completed": {
            const stars = p.enemiesLeaked === 0 ? 3 : p.enemiesLeaked < 3 ? 2 : 1;
            lines.push(`Wave ${p.waveNumber} cleared ${"★".repeat(stars)}${"☆".repeat(3 - stars)}`);
            if (p.enemiesLeaked > 0) {
                lines.push(`→ ${p.enemiesLeaked} enemies leaked — check which KCs they represented`);
            }
            break;
        }

        case "enemy_leaked": {
            const kc = p.knowledgeComponent ? ` (${p.knowledgeComponent})` : "";
            lines.push(`✗ ${p.enemyType || "enemy"} breached defenses${kc}`);
            lines.push(`→ Concept gap signal: missing coverage for this KC type`);
            break;
        }

        case "tower_placement_pattern":
        case "resource_allocation":
        case "strategy_shift_detected": {
            lines.push(`Strategy update detected`);
            break;
        }

        default: {
            // Generic metric delta check
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
            return `<strong>${(data.completionRate * 100).toFixed(0)}%</strong> completion · ${data.actionsPerMin.toFixed(1)}/min pace`;
        case "strategic":
            return `diversity <strong>${data.towerDiversity.toFixed(2)}</strong> · synergies <strong>${data.synergyCount}</strong>`;
        case "affective":
            return `persistence <strong>${data.persistence.toFixed(2)}</strong> · frustration ${data.frustrationEvents}`;
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
    el.summary.innerHTML = `
        <div class="profile-line"><span class="k">Phase</span><span class="v accent">${snap.phase || "—"}</span></div>
        <div class="profile-line"><span class="k">Wave</span><span class="v">${snap.wave || 0} / 8</span></div>
        <div class="profile-line"><span class="k">Gold / Lives</span><span class="v">${snap.gold || 0} g · ${snap.lives || 0} ♥</span></div>
        <div class="profile-line"><span class="k">Towers placed</span><span class="v">${(snap.towers || []).length}</span></div>
        <div class="profile-line"><span class="k">Questions</span><span class="v">${metrics.cognitive.correct}/${metrics.cognitive.attempts} · ${acc}</span></div>
        <div class="profile-line"><span class="k">Speed-accuracy profile</span><span class="v">${metrics.cognitive.profile.replace("_", " + ")}</span></div>
    `;
}

function renderEvent(evt, evidenceHtml) {
    const p = evt.payload || {};
    const tOffset = state.startedAt ? ((evt.ts - state.startedAt) / 1000).toFixed(1) + "s" : "—";

    // Choose class for visual variant
    let cls = "event-item";
    if (evt.type === "question_answered") cls += p.correct ? " correct" : " wrong";
    else if (evt.type === "tower_placed" || evt.type === "tower_upgraded") cls += " tower";
    else if (evt.type === "synergy_discovered") cls += " synergy";
    else if (evt.type.startsWith("wave_") || evt.type === "session_start") cls += " phase";

    // Pretty payload
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

    // Clear empty state on first event
    const emptyState = el.eventList.querySelector(".empty-state");
    if (emptyState) emptyState.remove();

    // Insert at top
    el.eventList.insertBefore(div, el.eventList.firstChild);

    // Cap the event list
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
    // Capture metrics BEFORE adding event
    const before = computeMetrics();

    // Add event and update KCs
    state.events.push(evt);
    updateKC(evt);

    // Recompute AFTER
    const after = computeMetrics();

    // Determine which dimensions changed
    const changed = new Set();
    for (const dim of DIMENSIONS) {
        if (Math.abs((after[dim.key]?.score || 0) - (before[dim.key]?.score || 0)) > 0.001) {
            changed.add(dim.key);
        }
    }

    // Evidence string for this event
    const evidenceHtml = evidenceFor(evt, before, after);

    // Render
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

    // Clear UI
    el.eventList.innerHTML = "";

    // Replay each event
    for (const evt of (backfill.events || [])) {
        state.events.push(evt);
        updateKC(evt);
    }

    const metrics = computeMetrics();
    renderDimensions(metrics, new Set());
    renderKCs();
    renderSummary(metrics);
    renderStatusBar();

    // Render most recent 20 events in order
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
                // Append a session_end marker
                renderEvent(
                    { type: "session_end", ts: Date.now(), payload: data.summary || {} },
                    "Session ended — final profile recorded."
                );
                break;
        }
    });

    // Say hello so the bridge sends us the backlog
    channel.postMessage({ type: "debug_hello" });
    el.channel.textContent = "listening";
    el.channel.className = "stat-value";
}

/* --------------------------------------------------------------- */
/*  Startup                                                          */
/* --------------------------------------------------------------- */

function init() {
    // Initial render (empty state)
    const m = computeMetrics();
    renderDimensions(m, new Set());
    renderKCs();
    renderSummary(m);
    renderStatusBar();

    initChannel();

    // Update elapsed time every second
    setInterval(renderStatusBar, 1000);
}

init();
