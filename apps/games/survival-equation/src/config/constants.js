export const DEFAULT_SETTINGS = {
    telemetryStorageKey: "survival_equation_sessions",
    progressionStorageKey: "survival_equation_profile",
    questionTimeLimitSec: 12,
    dayTimerSec: 210,
    baseXpPerQuestion: 20,
    baseXpPerPuzzle: 50,
    baseXpPerDay: 30,
    levelCurve: {
        coefficient: 100,
        power: 1.5,
    },
};

export const ROLE_IDS = {
    ENGINEER: "engineer",
    SCIENTIST: "scientist",
    MEDIC: "medic",
    NAVIGATOR: "navigator",
};

export const SUBJECT_IDS = {
    APPLIED_MATH: "applied_math",
    APPLIED_SCIENCE: "applied_science",
};

export const RESOURCE_IDS = {
    FOOD: "food",
    WATER: "water",
    MATERIALS: "materials",
};

export const PHASE_IDS = {
    BRIEFING: "briefing",
    PUZZLE: "puzzle",
    ALLOCATION: "allocation",
    EVENT: "event",
    TRANSITION: "transition",
};

export const COLORS = {
    bgDark: [10, 22, 40],
    bgPanel: [18, 32, 52],
    bgCard: [24, 42, 65],
    textPrimary: [232, 240, 224],
    textSecondary: [160, 175, 150],
    textMuted: [110, 125, 105],
    earth: [140, 110, 60],
    earthLight: [185, 155, 95],
    dangerOrange: [230, 120, 50],
    dangerRed: [210, 65, 55],
    waterBlue: [70, 155, 220],
    waterLight: [120, 195, 245],
    safeGreen: [80, 190, 100],
    teamEngineer: [220, 160, 50],
    teamScientist: [100, 180, 255],
    teamMedic: [80, 220, 120],
    teamNavigator: [200, 100, 255],
    resourceFood: [200, 160, 60],
    resourceWater: [70, 155, 220],
    resourceMaterials: [160, 130, 90],
    xpGold: [255, 210, 80],
    accentTeal: [60, 200, 190],
};
