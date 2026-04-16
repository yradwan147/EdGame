/**
 * debugBridge.js — streams telemetry events and scenario state to a
 * second "debug" window via BroadcastChannel. Lets a separate HTML
 * page (debug.html) visualize the stealth assessment pipeline in
 * real time for Survival Equation (cooperative scenarios, 5 days each).
 *
 * Architecture:
 *   game window ── telemetry.subscribe() ── bridge ── BroadcastChannel ──▶ debug window
 *
 * The bridge does NOT itself compute metrics — it just forwards raw
 * events plus periodic snapshots of scenario state. The debug window
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
        const resources = state.resources || { food: 0, water: 0, materials: 0 };
        const teamHealth = state.teamHealth || {};
        const teamHealthValues = Object.values(teamHealth);
        const teamHealthAvg = teamHealthValues.length > 0
            ? teamHealthValues.reduce((s, v) => s + v, 0) / teamHealthValues.length
            : 0;

        return {
            sessionId: session?.id || null,
            dbSessionId: session?.dbSessionId || null,
            startedAt: session?.startedAt || null,
            meta: session?.meta || {},
            status: state.status,
            scenarioId: state.scenarioId,
            currentDay: state.currentDay || 0,
            totalDays: state.totalDays || 5,
            currentPhase: state.currentPhase,
            playerRole: state.playerRole,
            aiPartners: (state.aiPartners || []).map((p) => ({
                roleId: p.roleId,
                name: p.name,
            })),
            resources: { ...resources },
            resourceSum: resources.food + resources.water + resources.materials,
            teamHealth: { ...teamHealth },
            teamHealthAvg,
            teamHealthMin: teamHealthValues.length > 0 ? Math.min(...teamHealthValues) : 0,
            currentPuzzleId: state.currentPuzzleId,
            puzzleStepIndex: state.puzzleStepIndex || 0,
            puzzleScore: state.puzzleScore || 0,
            puzzlesCompleted: (state.puzzlesCompleted || []).length,
            messageStats: { ...(state.messageStats || {}) },
            messageLogLen: (state.messageLog || []).length,
            dayEventsCount: (state.dayEvents || []).length,
            eventResultsCount: (state.eventResults || []).length,
            worldState: {
                shelterBuilt: !!state.worldState?.shelterBuilt,
                waterFilterActive: !!state.worldState?.waterFilterActive,
                signalReady: !!state.worldState?.signalReady,
                allianceFormed: !!state.worldState?.allianceFormed,
                customFlagCount: Object.keys(state.worldState?.customFlags || {}).length,
            },
            collaborationEvents: (state.collaborationEvents || []).length,
            resourceAllocationHistory: (state.resourceAllocationHistory || []).length,
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
