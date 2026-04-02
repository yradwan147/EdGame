import kaplay from "https://unpkg.com/kaplay@3001.0.19/dist/kaplay.mjs";
import { registerMenuScene } from "./src/scenes/menu.js";
import { registerScenarioSelectScene } from "./src/scenes/scenarioSelect.js";
import { registerRoleAssignmentScene } from "./src/scenes/roleAssignment.js";
import { registerSurvivalHubScene } from "./src/scenes/survivalHub.js";
import { registerPuzzleRoomScene } from "./src/scenes/puzzleRoom.js";
import { registerScenarioResultsScene } from "./src/scenes/scenarioResults.js";
import { registerPostGameScene } from "./src/scenes/postGame.js";
import { DEFAULT_SETTINGS } from "./src/config/constants.js";
import { createGameStateStore } from "./src/systems/gameState.js";
import { createTelemetry } from "./src/systems/telemetry.js";
import { createProgressionSystem } from "./src/systems/progression.js";

const k = kaplay({
    width: 1280,
    height: 720,
    letterbox: true,
    background: [10, 22, 40],
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
registerScenarioSelectScene(deps);
registerRoleAssignmentScene(deps);
registerSurvivalHubScene(deps);
registerPuzzleRoomScene(deps);
registerScenarioResultsScene(deps);
registerPostGameScene(deps);

k.go("menu");
