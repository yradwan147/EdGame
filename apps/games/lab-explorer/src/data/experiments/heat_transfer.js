import { SUBJECT_IDS } from "../../config/constants.js";

/** Thermal conductivity multipliers (higher = more heat lost) */
const MATERIAL_CONDUCTIVITY = {
    metal: 1.0,
    wood:  0.35,
    cloth: 0.25,
    foam:  0.12,
};

const MATERIAL_NAMES = {
    metal: "Metal Sheet",
    wood:  "Wood Block",
    cloth: "Cloth Wrap",
    foam:  "Foam Sleeve",
};

export const heatTransferExperiment = {
    id: "heat_transfer",
    name: "Best Insulator Challenge",
    subject: SUBJECT_IDS.PHYSICS,
    difficulty: 3,
    description:
        "Wrap a hot beaker with different materials and see which one " +
        "keeps the water hottest. Find the best insulator!",

    requiredEquipment: [
        "beaker",
        "thermometer",
        "insulation_materials",
        "stopwatch",
        "safety_goggles",
    ],
    availableEquipment: [
        "beaker",
        "thermometer",
        "insulation_materials",
        "stopwatch",
        "safety_goggles",
        "bunsen_burner",
        "scale",
        "graduated_cylinder",
    ],

    variables: [
        {
            name: "material",
            label: "Insulation Material",
            unit: "",
            min: 0,
            max: 3,
            step: 1,
            defaultValue: 0,
            options: ["metal", "wood", "cloth", "foam"],
            optionLabels: ["Metal Sheet", "Wood Block", "Cloth Wrap", "Foam Sleeve"],
        },
        {
            name: "initial_temp",
            label: "Starting Temperature",
            unit: "C",
            min: 60,
            max: 90,
            step: 5,
            defaultValue: 80,
        },
        {
            name: "time_minutes",
            label: "Wait Time",
            unit: "min",
            min: 1,
            max: 10,
            step: 1,
            defaultValue: 5,
        },
    ],

    hypothesisOptions: [
        { id: "h1", text: "Foam is the best insulator — it traps the most air" },
        { id: "h2", text: "Metal keeps heat best because it is shiny" },
        { id: "h3", text: "All materials insulate equally" },
        { id: "h4", text: "Thicker materials always insulate better" },
    ],
    correctHypothesisId: "h1",

    computeResult(vars) {
        const materialKey = ["metal", "wood", "cloth", "foam"][vars.material] || "metal";
        const conductivity = MATERIAL_CONDUCTIVITY[materialKey];
        const roomTemp = 22;
        const diff = vars.initial_temp - roomTemp;
        // Newton's law of cooling (simplified): T(t) = Troom + diff * e^(-k*t)
        const k_cool = conductivity * 0.12;
        const finalTemp = roomTemp + diff * Math.exp(-k_cool * vars.time_minutes);
        return Math.round(finalTemp * 10) / 10;
    },

    resultLabel: "Final Temp",
    resultUnit: "C",
    targetMin: 65,
    targetMax: 80,

    describeResult(temp) {
        if (temp > 85) return "Still piping hot! Barely any heat escaped.";
        if (temp >= 65) return "Nicely warm — the insulation is doing its job!";
        if (temp >= 45) return "Lukewarm. Decent insulation but room for improvement.";
        if (temp >= 30) return "Almost room temperature. Not great insulation!";
        return "Cold! The heat escaped almost completely.";
    },

    resultColor(temp) {
        if (temp > 80) return [255, 80, 40];
        if (temp > 60) return [255, 160, 60];
        if (temp > 40) return [255, 220, 100];
        if (temp > 30) return [180, 200, 220];
        return [100, 160, 230];
    },

    discoveries: [
        {
            id: "conductor_king",
            name: "Conductor King",
            trigger: (vars) => {
                const mat = ["metal", "wood", "cloth", "foam"][vars.material];
                return mat === "metal" && vars.time_minutes >= 5;
            },
            description:
                "Metal lost the most heat! Metals are excellent thermal CONDUCTORS. " +
                "That is why metal door handles feel cold — they steal your body heat fast.",
        },
        {
            id: "double_wrap",
            name: "Double Wrap Discovery",
            trigger: (vars, result, history) => {
                if (!history || history.length < 2) return false;
                const prev = history[history.length - 2];
                if (!prev) return false;
                return prev.vars.material !== vars.material;
            },
            description:
                "You tried different materials! In real life, combining insulators " +
                "(like foam inside cloth) works even better. Layering is key!",
        },
        {
            id: "boiling_point_test",
            name: "Boiling Territory",
            trigger: (vars) => vars.initial_temp === 90,
            description:
                "Starting near boiling (90C)! At 100C water turns to steam. " +
                "The higher the starting temperature, the faster heat escapes (bigger gradient).",
        },
    ],

    failureStates: [
        {
            id: "steam_explosion",
            trigger: (vars) => vars.initial_temp >= 90 && vars.time_minutes <= 1,
            animation: "steam_cloud",
            description:
                "PSSSHHHH! The near-boiling water sends up a massive steam cloud! " +
                "The lid rattles and the whole bench gets foggy. Safety goggles to the rescue!",
        },
        {
            id: "melted_foam",
            trigger: (vars) => {
                const mat = ["metal", "wood", "cloth", "foam"][vars.material];
                return mat === "foam" && vars.initial_temp >= 85;
            },
            animation: "melted_foam",
            description:
                "The foam starts to warp and melt from the heat! " +
                "Foam is a great insulator but it has a low melting point. Oops!",
        },
    ],

    conclusionOptions: [
        { id: "c1", text: "Foam is the best insulator because it traps air, which conducts heat poorly", correct: true },
        { id: "c2", text: "Metal is the best insulator because it reflects heat", correct: false },
        { id: "c3", text: "All materials lose heat at the same rate", correct: false },
        { id: "c4", text: "The starting temperature does not affect cooling rate", correct: false },
    ],

    observationOptions: [
        { id: "o1", text: "Metal-wrapped beakers cooled fastest", correct: true },
        { id: "o2", text: "Foam-wrapped beakers stayed warmest", correct: true },
        { id: "o3", text: "The material made no difference in cooling", correct: false },
        { id: "o4", text: "Higher starting temps cooled more slowly", correct: false },
    ],

    MATERIAL_CONDUCTIVITY,
    MATERIAL_NAMES,
};
