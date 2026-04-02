export const DEFAULT_SETTINGS = {
    telemetryStorageKey: "concept_cascade_sessions",
    progressionStorageKey: "concept_cascade_profile",
    questionTimeLimitSec: 10,
    baseXpPerQuestion: 20,
    levelCurve: { coefficient: 100, power: 1.5 },
};

export const GAME_CONFIG = {
    width: 1280,
    height: 720,
    tileSize: 64,
    mapCols: 20,  // 1280 / 64
    mapRows: 11,  // ~704 / 64 (leaving bottom for HUD)
    startingGold: 100,
    startingLives: 20,
    interestRate: 0.05,
    earlyCallBonus: 0.3,
    prepPhaseSec: 15,
    studyBonusGold: 15,
    maxStudyPerPrep: 2,
    speedBonusThresholdMs: 3000,
    speedBonusDiscount: 0.25,
    wrongAnswerRefundRate: 0.5,
};

export const SUBJECT_IDS = {
    NUMBER_SENSE: "number_sense",
    OPERATIONS: "operations",
    FRACTIONS: "fractions",
    GEOMETRY: "geometry",
};

export const COLORS = {
    bg: [18, 22, 36],
    path: [62, 50, 38],
    pathBorder: [80, 65, 48],
    buildable: [28, 52, 38],
    buildableHover: [38, 72, 50],
    blocked: [35, 30, 45],
    hud: [14, 18, 30],
    hudText: [200, 210, 230],
    gold: [255, 215, 70],
    lives: [255, 90, 90],
    numberBastion: [100, 149, 237],
    operationCannon: [255, 140, 50],
    fractionFreezer: [160, 80, 255],
    geometryGuard: [255, 70, 70],
    numberSprite: [80, 220, 120],
    operationOgre: [255, 165, 50],
    fractionPhantom: [180, 100, 255],
    geometryGolem: [220, 60, 60],
    boss: [255, 50, 200],
    synergy: [255, 230, 100],
    waveText: [90, 235, 255],
};
