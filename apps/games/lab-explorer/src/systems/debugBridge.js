/**
 * debugBridge.js — streams telemetry events and lab state to a
 * second "debug" window via BroadcastChannel. Lets a separate HTML
 * page (debug.html) visualize the stealth assessment pipeline in
 * real time for Lab Explorer (5 science experiments).
 *
 * Architecture:
 *   game window ── telemetry.subscribe() ── bridge ── BroadcastChannel ──▶ debug window
 *
 * The bridge does NOT itself compute metrics — it just forwards raw
 * events plus periodic snapshots of lab state. The debug window
 * runs its own lite computation so it stays fully decoupled.
 */

const CHANNEL_NAME = "edgame-debug";

export function createDebugBridge({ telemetry, gameStateStore, autoOpen = true, windowUrl = "./debug.html" } = {}) {
    let channel = null;
    let debugWindow = null;
    let unsubscribe = null;
    let snapshotTimer = null;
    let openAttempts = 0;

    function hasBroadcastChannel() {
        return typeof BroadcastChannel !== "undefined";
    }

    function post(type, data) {
        if (!channel) return;
        try {
            channel.postMessage({ type, data, ts: Date.now() });
        } catch (err) {
            console.warn("debugBridge post failed", err);
        }
    }

    function openDebugWindow() {
        if (debugWindow && !debugWindow.closed) return debugWindow;
        try {
            debugWindow = window.open(
                windowUrl,
                "edgame-debug",
                "width=720,height=900,left=40,top=40",
            );
            if (!debugWindow) {
                console.warn("Debug window blocked. Allow popups for this site, then reload.");
                openAttempts += 1;
            } else {
                openAttempts = 0;
            }
        } catch (err) {
            console.warn("Failed to open debug window", err);
        }
        return debugWindow;
    }

    function captureSnapshot() {
        const state = gameStateStore.getState();
        const session = telemetry.getCurrentSession();
        const elapsedMs = state.startedAt ? Date.now() - state.startedAt : 0;
        const totalScore = state.score
            ? (state.score.hypothesis || 0)
              + (state.score.equipment || 0)
              + (state.score.exploration || 0)
              + (state.score.accuracy || 0)
              + (state.score.conclusion || 0)
            : 0;

        return {
            sessionId: session?.id || null,
            dbSessionId: session?.dbSessionId || null,
            startedAt: session?.startedAt || null,
            meta: session?.meta || {},
            status: state.status,
            currentExperimentId: state.currentExperimentId,
            phase: state.phase,
            equipmentSelected: [...(state.equipmentSelected || [])],
            variableSettings: { ...(state.variableSettings || {}) },
            runCount: state.runCount || 0,
            runResults: (state.runResults || []).map((r) => ({
                runNumber: r.runNumber,
                vars: r.vars,
                result: r.result,
            })),
            discoveries: [...(state.discoveries || [])],
            discoveryCount: (state.discoveries || []).length,
            failures: [...(state.failures || [])],
            failureCount: (state.failures || []).length,
            hypothesisSelected: state.hypothesisSelected,
            observationsSelected: [...(state.observationsSelected || [])],
            conclusionSelected: state.conclusionSelected,
            safetyChecks: { ...(state.safetyChecks || {}) },
            wrongToolAttempts: state.safetyChecks?.wrongToolAttempts || 0,
            extremeValueAttempts: state.safetyChecks?.extremeValueAttempts || 0,
            score: { ...(state.score || {}) },
            totalScore,
            stepSequence: (state.stepSequence || []).map((s) => s.phase),
            questionsAnswered: state.questionsAnswered || 0,
            questionsCorrect: state.questionsCorrect || 0,
            elapsedMs,
        };
    }

    function start() {
        if (!hasBroadcastChannel()) {
            console.warn("BroadcastChannel not supported — debug bridge disabled.");
            return;
        }

        channel = new BroadcastChannel(CHANNEL_NAME);

        // When the debug window wakes up and says hello, send it the
        // full session history so it can catch up on events that fired
        // before it opened.
        channel.addEventListener("message", (msg) => {
            if (msg.data?.type === "debug_hello") {
                const session = telemetry.getCurrentSession();
                const backlog = session ? session.events : [];
                post("session_backfill", {
                    sessionId: session?.id || null,
                    meta: session?.meta || {},
                    startedAt: session?.startedAt || null,
                    events: backlog,
                    snapshot: captureSnapshot(),
                });
            }
        });

        // Listen to every telemetry event and forward it
        unsubscribe = telemetry.subscribe((type, data) => {
            if (type === "session_start") {
                post("session_start", {
                    sessionId: data.session.id,
                    meta: data.session.meta,
                    startedAt: data.session.startedAt,
                });
            } else if (type === "event") {
                post("event", {
                    event: data.event,
                    snapshot: captureSnapshot(),
                });
            } else if (type === "session_end") {
                post("session_end", {
                    sessionId: data.session.id,
                    summary: data.session.summary,
                    snapshot: captureSnapshot(),
                });
            }
        });

        // Periodic snapshot for elapsed time / live counters
        snapshotTimer = setInterval(() => {
            post("snapshot", captureSnapshot());
        }, 500);

        if (autoOpen) {
            openDebugWindow();
        }

        console.log("[debugBridge] active on channel", CHANNEL_NAME);
    }

    function stop() {
        if (unsubscribe) { unsubscribe(); unsubscribe = null; }
        if (snapshotTimer) { clearInterval(snapshotTimer); snapshotTimer = null; }
        if (channel) { channel.close(); channel = null; }
        if (debugWindow && !debugWindow.closed) {
            try { debugWindow.close(); } catch { /* ignore */ }
        }
    }

    return {
        start,
        stop,
        openDebugWindow,
    };
}
