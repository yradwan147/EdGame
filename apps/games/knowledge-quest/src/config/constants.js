export const DEFAULT_SETTINGS = {
    telemetryStorageKey: "knowledge_quest_sessions",
    progressionStorageKey: "knowledge_quest_profile",
    questionTimeLimitSec: 12,
    baseXpPerQuestion: 22,
    levelCurve: { coefficient: 110, power: 1.5 },
    mentorTokensPerChapter: 3,
    mpRegenPerTurn: 1,
};

export const COLORS = {
    bg: [12, 8, 24],
    // RPG theme colors - deep purple/gold
    primary: [180, 140, 255],
    secondary: [255, 200, 80],
    danger: [255, 80, 80],
    heal: [80, 255, 140],
    frost: [100, 200, 255],
    nature: [80, 200, 80],
    lightning: [255, 230, 50],
    dark: [180, 60, 200],
    panelBg: [20, 16, 40],
    panelBorder: [100, 80, 160],
    textPrimary: [230, 220, 255],
    textSecondary: [160, 150, 190],
    hudBg: [16, 12, 32],
    // enemy colors
    impColor: [200, 80, 80],
    crawlerColor: [180, 120, 60],
    shadeColor: [100, 60, 160],
    giantColor: [80, 80, 100],
    bossColor: [255, 50, 200],
};

export const SUBJECT_IDS = { MATH: "math", SCIENCE: "science" };
