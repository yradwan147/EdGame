import { ARENA_CONFIG } from "../../config/constants.js";

export const arena1 = {
    id: "simulation_arena_alpha",
    width: ARENA_CONFIG.width,
    height: ARENA_CONFIG.height,
    objectivePoint: { x: ARENA_CONFIG.width / 2, y: ARENA_CONFIG.height / 2 },
    walls: [
        { x: 0, y: 0, w: ARENA_CONFIG.width, h: 16 },
        { x: 0, y: ARENA_CONFIG.height - 16, w: ARENA_CONFIG.width, h: 16 },
        { x: 0, y: 0, w: 16, h: ARENA_CONFIG.height },
        { x: ARENA_CONFIG.width - 16, y: 0, w: 16, h: ARENA_CONFIG.height },
        { x: 220, y: 160, w: 90, h: 28 },
        { x: 260, y: 420, w: 140, h: 24 },
        { x: 520, y: 300, w: 240, h: 24 },
        { x: 860, y: 180, w: 80, h: 170 },
        { x: 940, y: 480, w: 180, h: 24 },
    ],
    spawns: {
        ally: [
            { x: 120, y: 640 },
            { x: 200, y: 560 },
            { x: 280, y: 640 },
        ],
        enemy: [
            { x: 1140, y: 80 },
            { x: 1060, y: 160 },
            { x: 980, y: 80 },
        ],
    },
};
