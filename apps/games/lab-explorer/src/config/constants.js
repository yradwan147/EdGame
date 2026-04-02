export const DEFAULT_SETTINGS = {
    telemetryStorageKey: "lab_explorer_sessions",
    progressionStorageKey: "lab_explorer_profile",
    questionTimeLimitSec: 15,
    baseXpPerQuestion: 18,
    levelCurve: {
        coefficient: 100,
        power: 1.5,
    },
};

export const COLORS = {
    labBg:       [14, 26, 46],
    panelDark:   [18, 32, 56],
    panelLight:  [28, 48, 78],
    accent:      [60, 200, 220],
    accentBright:[90, 235, 255],
    teal:        [40, 180, 190],
    white:       [230, 245, 255],
    safetyYellow:[255, 210, 60],
    dangerRed:   [255, 75, 75],
    beakerGreen: [80, 220, 130],
    successGreen:[100, 240, 150],
    phAcid:      [255, 80, 60],
    phNeutral:   [100, 200, 100],
    phBase:      [80, 100, 255],
    electricBlue:[100, 160, 255],
    heatOrange:  [255, 150, 50],
    pendulumBrown:[180, 130, 80],
    discoveryGold:[255, 215, 80],
    disasterPurple:[200, 80, 220],
};

export const SUBJECT_IDS = {
    CHEMISTRY: "chemistry",
    PHYSICS: "physics",
};

export const PHASES = {
    HYPOTHESIS: "hypothesis",
    EQUIPMENT:  "equipment",
    VARIABLE:   "variable",
    RUN:        "run",
    OBSERVE:    "observe",
    CONCLUDE:   "conclude",
};

export const PHASE_ORDER = [
    "hypothesis",
    "equipment",
    "variable",
    "run",
    "observe",
    "conclude",
];

export const PHASE_LABELS = {
    hypothesis: "Hypothesis",
    equipment:  "Equipment",
    variable:   "Variables",
    run:        "Run",
    observe:    "Observe",
    conclude:   "Conclude",
};
