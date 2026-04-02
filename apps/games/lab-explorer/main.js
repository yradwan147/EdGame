import kaplay from "https://unpkg.com/kaplay@3001.0.19/dist/kaplay.mjs";
import { registerMenuScene } from "./src/scenes/menu.js";
import { registerLabSelectScene } from "./src/scenes/labSelect.js";
import { registerExperimentScene } from "./src/scenes/experiment.js";
import { registerJournalScene } from "./src/scenes/journal.js";
import { registerPostLabScene } from "./src/scenes/postLab.js";
import { DEFAULT_SETTINGS } from "./src/config/constants.js";
import { createGameStateStore } from "./src/systems/gameState.js";
import { createTelemetry } from "./src/systems/telemetry.js";
import { createProgressionSystem } from "./src/systems/progression.js";

const k = kaplay({
    width: 1280,
    height: 720,
    letterbox: true,
    background: [14, 26, 46],
    global: false,
    debug: false,
    touchToMouse: true,
    crisp: true,
});

const params = new URLSearchParams(window.location.search);
const apiBase = params.get("apiBase") || "/api";

const gameStateStore = createGameStateStore();
const telemetry = createTelemetry(DEFAULT_SETTINGS.telemetryStorageKey, { apiBase });
const progression = createProgressionSystem(DEFAULT_SETTINGS.progressionStorageKey);

const deps = {
    k,
    settings: DEFAULT_SETTINGS,
    gameStateStore,
    telemetry,
    progression,
};

registerMenuScene(deps);
registerLabSelectScene(deps);
registerExperimentScene(deps);
registerJournalScene(deps);
registerPostLabScene(deps);

k.go("menu");
