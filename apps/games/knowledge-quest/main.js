import kaplay from "https://unpkg.com/kaplay@3001.0.19/dist/kaplay.mjs";
import { DEFAULT_SETTINGS, COLORS } from "./src/config/constants.js";
import { createGameStateStore } from "./src/systems/gameState.js";
import { createTelemetry } from "./src/systems/telemetry.js";
import { createProgressionSystem } from "./src/systems/progression.js";
import { registerMenuScene } from "./src/scenes/menu.js";
import { registerChapterSelectScene } from "./src/scenes/chapterSelect.js";
import { registerChapterMapScene } from "./src/scenes/chapterMap.js";
import { registerCombatScene } from "./src/scenes/combat.js";
import { registerDialogueScene } from "./src/scenes/dialogue.js";
import { registerShopScene } from "./src/scenes/shop.js";
import { registerPostChapterScene } from "./src/scenes/postChapter.js";

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
registerChapterSelectScene(deps);
registerChapterMapScene(deps);
registerCombatScene(deps);
registerDialogueScene(deps);
registerShopScene(deps);
registerPostChapterScene(deps);

k.go("menu");
