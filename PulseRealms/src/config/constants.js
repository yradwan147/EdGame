export const DEFAULT_SETTINGS = {
    telemetryStorageKey: "pulse_realms_sessions",
    progressionStorageKey: "pulse_realms_profile",
    questionTimeLimitSec: 8,
    matchDurationSec: 300,
    baseXpPerQuestion: 25,
    levelCurve: {
        coefficient: 120,
        power: 1.6,
    },
};

export const ARENA_CONFIG = {
    width: 1280,
    height: 720,
    playerMoveSpeed: 220,
    botMoveSpeed: 235,
    attackRange: 280,
    healRange: 240,
    buildRange: 220,
    baseHp: 120,
    respawnEnabled: false,
    objectiveCaptureRadius: 95,
    objectiveTickPoints: 2,
    objectiveTickSeconds: 1.5,
};

export const TEAM_IDS = {
    ALLY: "ally",
    ENEMY: "enemy",
};

export const ROLE_IDS = {
    ATTACKER: "attacker",
    HEALER: "healer",
    BUILDER: "builder",
};

export const ACTION_IDS = {
    ATTACK: "attack",
    POWER_STRIKE: "powerStrike",
    HEAL: "heal",
    SHIELD: "shield",
    BUILD_BARRIER: "buildBarrier",
    DEPLOY_TURRET: "deployTurret",
};

export const SUBJECT_IDS = {
    GENERAL: "general",
    MATH: "math",
    SCIENCE: "science",
};

export const COLORS = {
    ally: [0, 225, 255],
    enemy: [255, 72, 148],
    neutral: [152, 158, 176],
    attacker: [255, 80, 80],
    healer: [80, 220, 140],
    builder: [250, 180, 70],
    pulseGood: [90, 255, 140],
    pulseMid: [255, 205, 90],
    pulseBad: [255, 95, 95],
};

export const BOT_ACCURACY_BY_DIFFICULTY = {
    1: 0.8,
    2: 0.72,
    3: 0.62,
    4: 0.55,
    5: 0.48,
};
