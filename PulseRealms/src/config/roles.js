import { ACTION_IDS, ROLE_IDS } from "./constants.js";

export const ROLE_CONFIG = {
    [ROLE_IDS.ATTACKER]: {
        id: ROLE_IDS.ATTACKER,
        name: "Vanguard",
        description: "Frontline damage specialist. Cannot self-heal.",
        actions: [
            {
                id: ACTION_IDS.ATTACK,
                key: "1",
                label: "Pulse Shot",
                description: "Standard ranged strike. Moderate damage on correct answer.",
                cooldownSec: 1.5,
                basePower: 24,
                difficultyBias: 0,
            },
            {
                id: ACTION_IDS.POWER_STRIKE,
                key: "2",
                label: "Power Strike",
                description: "High-risk close strike. High damage, harder question.",
                cooldownSec: 5.0,
                basePower: 42,
                difficultyBias: 1,
            },
        ],
    },
    [ROLE_IDS.HEALER]: {
        id: ROLE_IDS.HEALER,
        name: "Medic",
        description: "Keeps team alive through knowledge-powered support.",
        actions: [
            {
                id: ACTION_IDS.HEAL,
                key: "1",
                label: "Restore",
                description: "Heal a nearby ally after a correct answer.",
                cooldownSec: 2.0,
                basePower: 28,
                difficultyBias: 0,
            },
            {
                id: ACTION_IDS.SHIELD,
                key: "2",
                label: "Aegis Shield",
                description: "Grant temporary damage reduction to a nearby ally.",
                cooldownSec: 6.0,
                basePower: 0.35,
                difficultyBias: 1,
            },
        ],
    },
    [ROLE_IDS.BUILDER]: {
        id: ROLE_IDS.BUILDER,
        name: "Engineer",
        description: "Controls the battlefield with barriers and constructs.",
        actions: [
            {
                id: ACTION_IDS.BUILD_BARRIER,
                key: "1",
                label: "Build Barrier",
                description: "Create short defensive protection on yourself.",
                cooldownSec: 4.5,
                basePower: 5.0,
                difficultyBias: 0,
            },
            {
                id: ACTION_IDS.DEPLOY_TURRET,
                key: "2",
                label: "Deploy Turret",
                description: "Deploy an offensive construct effect on enemy target.",
                cooldownSec: 8.0,
                basePower: 16,
                difficultyBias: 1,
            },
        ],
    },
};

export function getRole(roleId) {
    return ROLE_CONFIG[roleId];
}

export function getRoleList() {
    return Object.values(ROLE_CONFIG);
}
