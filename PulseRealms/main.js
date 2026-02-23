import kaplay from "https://unpkg.com/kaplay@3001.0.19/dist/kaplay.mjs";
import { registerMenuScene } from "./src/scenes/menu.js";
import { registerRoleSelectScene } from "./src/scenes/roleSelect.js";
import { registerArenaBriefingScene } from "./src/scenes/arenaBriefing.js";
import { registerArenaScene } from "./src/scenes/arena.js";
import { registerPostGameScene } from "./src/scenes/postGame.js";
import { DEFAULT_SETTINGS } from "./src/config/constants.js";
import { createGameStateStore } from "./src/systems/gameState.js";
import { createTelemetry } from "./src/systems/telemetry.js";
import { createProgressionSystem } from "./src/systems/progression.js";

const k = kaplay({
    width: 1280,
    height: 720,
    letterbox: true,
    background: [9, 11, 23],
    global: false,
    debug: false,
    touchToMouse: true,
    crisp: true,
});

const gameStateStore = createGameStateStore();
const telemetry = createTelemetry(DEFAULT_SETTINGS.telemetryStorageKey);
const progression = createProgressionSystem(DEFAULT_SETTINGS.progressionStorageKey);

const deps = {
    k,
    settings: DEFAULT_SETTINGS,
    gameStateStore,
    telemetry,
    progression,
};

registerMenuScene(deps);
registerRoleSelectScene(deps);
registerArenaBriefingScene(deps);
registerArenaScene(deps);
registerPostGameScene(deps);

k.go("menu");
