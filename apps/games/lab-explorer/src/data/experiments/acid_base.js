import { SUBJECT_IDS } from "../../config/constants.js";

export const acidBaseExperiment = {
    id: "acid_base",
    name: "Acid-Base Neutralization",
    subject: SUBJECT_IDS.CHEMISTRY,
    difficulty: 1,
    description:
        "Mix an acid solution with a base to reach neutral pH. " +
        "Use the pH meter to measure your result and find the perfect balance!",

    requiredEquipment: [
        "beaker",
        "ph_meter",
        "safety_goggles",
    ],
    availableEquipment: [
        "beaker",
        "ph_meter",
        "safety_goggles",
        "graduated_cylinder",
        "thermometer",
        "bunsen_burner",
        "litmus_paper",
        "scale",
    ],

    variables: [
        {
            name: "acidDrops",
            label: "Acid Drops",
            unit: "drops",
            min: 0,
            max: 20,
            step: 1,
            defaultValue: 0,
        },
        {
            name: "baseDrops",
            label: "Base Drops",
            unit: "drops",
            min: 0,
            max: 20,
            step: 1,
            defaultValue: 0,
        },
    ],

    hypothesisOptions: [
        { id: "h1", text: "Equal drops of acid and base will make a neutral solution" },
        { id: "h2", text: "More acid than base is needed for neutralization" },
        { id: "h3", text: "More base than acid is needed for neutralization" },
        { id: "h4", text: "The order you add them matters more than the amounts" },
    ],
    correctHypothesisId: "h1",

    /** Compute pH from variable settings */
    computeResult(vars) {
        const pH = 7 + (vars.baseDrops - vars.acidDrops) * 0.35;
        return Math.round(Math.max(0, Math.min(14, pH)) * 100) / 100;
    },

    resultLabel: "pH",
    resultUnit: "",
    targetMin: 6.5,
    targetMax: 7.5,

    /** Visual description for the result display */
    describeResult(pH) {
        if (pH < 2) return "EXTREMELY ACIDIC — the beaker is sizzling!";
        if (pH < 4) return "Strongly acidic — careful with those fumes!";
        if (pH < 6.5) return "Mildly acidic solution.";
        if (pH <= 7.5) return "NEUTRAL! Perfect balance achieved!";
        if (pH < 10) return "Mildly basic solution.";
        if (pH < 12) return "Strongly basic — slippery to touch!";
        return "EXTREMELY BASIC — the solution is caustic!";
    },

    /** Map pH to a color [r,g,b] for the liquid display */
    resultColor(pH) {
        if (pH < 3) return [255, 40, 40];
        if (pH < 5) return [255, 140, 60];
        if (pH < 6.5) return [255, 200, 80];
        if (pH <= 7.5) return [80, 210, 100];
        if (pH < 9) return [80, 160, 220];
        if (pH < 11) return [100, 80, 220];
        return [160, 40, 200];
    },

    discoveries: [
        {
            id: "ph_1_zone",
            name: "Extreme Acid Zone",
            trigger: (vars, result) => result < 1,
            description:
                "You created battery-acid strength solution! " +
                "At pH < 1, most metals dissolve. Please don't drink this.",
        },
        {
            id: "ph_14_zone",
            name: "Extreme Base Zone",
            trigger: (vars, result) => result > 13,
            description:
                "You made drain-cleaner grade base! " +
                "At pH > 13 this can dissolve organic matter. Science is fun!",
        },
        {
            id: "exact_neutral",
            name: "Perfect Neutral",
            trigger: (vars, result) => Math.abs(result - 7) < 0.05,
            description:
                "pH 7.00 exactly! Like pure water! " +
                "This is harder to achieve than it looks.",
        },
    ],

    failureStates: [
        {
            id: "foam_eruption",
            trigger: (vars) => vars.acidDrops >= 18 && vars.baseDrops >= 18,
            animation: "foam_eruption",
            description:
                "TOO MUCH OF EVERYTHING! The beaker erupts like a science-fair volcano. " +
                "Your lab coat will never be the same.",
        },
        {
            id: "beaker_dissolve",
            trigger: (vars, result) => result < 2,
            animation: "beaker_dissolve",
            description:
                "The acid is so strong it starts etching the beaker glass! " +
                "Quick, pour it into the neutralization bin!",
        },
    ],

    conclusionOptions: [
        { id: "c1", text: "Equal amounts of acid and base produce a neutral solution", correct: true },
        { id: "c2", text: "You always need more base than acid to neutralize", correct: false },
        { id: "c3", text: "Temperature is the main factor in neutralization", correct: false },
        { id: "c4", text: "The color of the liquid tells you nothing about pH", correct: false },
    ],

    observationOptions: [
        { id: "o1", text: "The pH changes linearly with each drop added", correct: true },
        { id: "o2", text: "Adding acid makes the pH go up", correct: false },
        { id: "o3", text: "The solution got warmer as I mixed — neutralization is exothermic", correct: true },
        { id: "o4", text: "Nothing happened when I added the drops", correct: false },
    ],
};
