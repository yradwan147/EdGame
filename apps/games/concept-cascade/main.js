import kaplay from "https://unpkg.com/kaplay@3001.0.19/dist/kaplay.mjs";
import { DEFAULT_SETTINGS, COLORS } from "./src/config/constants.js";
import { createGameStateStore } from "./src/systems/gameState.js";
import { createTelemetry } from "./src/systems/telemetry.js";
import { createProgressionSystem } from "./src/systems/progression.js";
import { createDebugBridge } from "./src/systems/debugBridge.js";
import { registerMenuScene } from "./src/scenes/menu.js";
import { registerBattlefieldScene } from "./src/scenes/battlefield.js";
// waveResults is now an in-scene overlay inside battlefield (preserves state);
// the standalone scene file is kept for reference but no longer registered.
import { registerPostGameScene } from "./src/scenes/postGame.js";

const k = kaplay({
    width: 1280,
    height: 720,
    letterbox: true,
    background: COLORS.bg,
    global: false,
    debug: false,
    touchToMouse: true,
    crisp: true,
});

const params = new URLSearchParams(window.location.search);
const apiBase = params.get("apiBase") || "/api";
const debugMode = params.get("debug") === "1" || params.get("debug") === "true";
const botMode   = params.get("bot")   === "1" || params.get("bot")   === "true";

const gameStateStore = createGameStateStore();
const telemetry = createTelemetry(DEFAULT_SETTINGS.telemetryStorageKey, { apiBase });
const progression = createProgressionSystem(DEFAULT_SETTINGS.progressionStorageKey);

// Debug mode: open a second window that streams ECD profile updates live.
if (debugMode) {
    const bridge = createDebugBridge({
        telemetry,
        gameStateStore,
        autoOpen: true,
        windowUrl: "./debug.html",
    });
    bridge.start();
    window.__edgameDebug = bridge;
    console.log("%c[EdGame] Debug mode active. Open the debug window for live profile view.", "color:#5ac8fa;font-weight:bold");
    console.log("Tip: if popups are blocked, click the window.__edgameDebug.openDebugWindow() in console, or re-allow popups and reload.");
}

const deps = {
    k,
    settings: DEFAULT_SETTINGS,
    gameStateStore,
    telemetry,
    progression,
};

registerMenuScene(deps);
registerBattlefieldScene(deps);
registerPostGameScene(deps);

// Bot mode: expose KAPLAY context + game state for automated test driver.
// Only active when ?bot=1; has no effect during normal play.
if (botMode) {
    window.__edgameBot = window.__edgameBot || {};
    window.__edgameBot.k = k;
    window.__edgameBot.gameStateStore = gameStateStore;
    window.__edgameBot.telemetry = telemetry;
    window.__edgameBot.progression = progression;
    console.log("%c[EdGame] Bot mode active — window.__edgameBot exposed", "color:#ffd84d;font-weight:bold");
}

k.go("menu");
