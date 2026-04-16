/**
 * debugBridge.js — streams telemetry events and RPG state to a
 * second "debug" window via BroadcastChannel. Lets a separate HTML
 * page (debug.html) visualize the stealth assessment pipeline in
 * real time for Knowledge Quest (turn-based RPG, 3 chapters).
 *
 * Architecture:
 *   game window ── telemetry.subscribe() ── bridge ── BroadcastChannel ──▶ debug window
 *
 * The bridge does NOT itself compute metrics — it just forwards raw
 * events plus periodic snapshots of RPG state. The debug window
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
        const player = state.player || {};
        const combat = state.combat
            ? {
                inCombat: true,
                enemyCount: (state.combat.enemies || []).length,
                enemiesAlive: (state.combat.enemies || []).filter((e) => e.hp > 0).length,
                turnNumber: state.combat.turnNumber,
            }
            : { inCombat: false };

        return {
            sessionId: session?.id || null,
            dbSessionId: session?.dbSessionId || null,
            startedAt: session?.startedAt || null,
            meta: session?.meta || {},
            chapter: state.chapter,
            currentNodeId: state.currentNodeId,
            phase: state.phase,
            visitedNodes: [...(state.visitedNodes || [])],
            visitedNodesCount: (state.visitedNodes || []).length,
            playerHp: player.hp,
            playerMaxHp: player.maxHp,
            playerMp: player.mp,
            playerMaxMp: player.maxMp,
            playerLevel: player.level || 1,
            companions: (state.companions || []).map((c) => ({
                id: c.id,
                level: c.level,
            })),
            companionCount: (state.companions || []).length,
            inventoryCount: (state.inventory || []).length,
            mentorTokens: state.mentorTokens,
            questLog: (state.questLog || []).map((q) => ({
                id: q.id,
                completed: q.completed,
            })),
            questsCompleted: (state.questLog || []).filter((q) => q.completed).length,
            questsActive: (state.questLog || []).length,
            worldStateKeys: Object.keys(state.worldState || {}),
            combat,
            totalDamageDealt: state.totalDamageDealt || 0,
            totalHealingDone: state.totalHealingDone || 0,
            spellsCast: state.spellsCast || 0,
            defendActions: state.defendActions || 0,
            elapsedMs: state.elapsedMs || 0,
            questionsAnswered: state.questionsAnswered || 0,
            questionsCorrect: state.questionsCorrect || 0,
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
