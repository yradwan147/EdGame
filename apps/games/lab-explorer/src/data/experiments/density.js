import { SUBJECT_IDS } from "../../config/constants.js";

export const densityExperiment = {
    id: "density",
    name: "Mystery Object Density",
    subject: SUBJECT_IDS.CHEMISTRY,
    difficulty: 2,
    description:
        "Determine the density of a mystery metal object using a scale " +
        "and water displacement. Can you identify the material?",

    requiredEquipment: [
        "scale",
        "graduated_cylinder",
        "safety_goggles",
    ],
    availableEquipment: [
        "scale",
        "graduated_cylinder",
        "safety_goggles",
        "beaker",
        "thermometer",
        "ph_meter",
        "ruler",
        "bunsen_burner",
    ],

    variables: [
        {
            name: "mass_reading",
            label: "Mass Reading",
            unit: "g",
            min: 10,
            max: 200,
            step: 1,
            defaultValue: 54,
            hint: "Place the object on the scale and read the mass",
        },
        {
            name: "volume_displaced",
            label: "Water Displaced",
            unit: "mL",
            min: 5,
            max: 100,
            step: 1,
            defaultValue: 20,
            hint: "Submerge the object and read the change in water level",
        },
    ],

    hypothesisOptions: [
        { id: "h1", text: "The object is aluminum (density about 2.7 g/cm3)" },
        { id: "h2", text: "The object is iron (density about 7.9 g/cm3)" },
        { id: "h3", text: "The object is wood (density about 0.6 g/cm3)" },
        { id: "h4", text: "Density cannot be measured this way" },
    ],
    correctHypothesisId: "h1",

    computeResult(vars) {
        if (vars.volume_displaced <= 0) return 0;
        const density = vars.mass_reading / vars.volume_displaced;
        return Math.round(density * 100) / 100;
    },

    resultLabel: "Density",
    resultUnit: "g/cm3",
    targetMin: 2.5,
    targetMax: 2.9,

    describeResult(density) {
        if (density < 0.5) return "Lighter than cork! This would float on anything.";
        if (density < 1.0) return "Less dense than water — this object floats!";
        if (density < 2.0) return "Light solid — maybe plastic or light wood.";
        if (density >= 2.5 && density <= 2.9) return "ALUMINUM! Density matches perfectly at ~2.7 g/cm3!";
        if (density < 5.0) return "Medium density — could be titanium or glass.";
        if (density < 8.0) return "Heavy — this might be iron or steel!";
        if (density < 12.0) return "Very heavy — lead territory!";
        return "Extremely dense — are you sure about those measurements?";
    },

    resultColor(density) {
        if (density < 1.0) return [100, 200, 255];
        if (density < 2.5) return [180, 180, 180];
        if (density <= 2.9) return [200, 210, 220];
        if (density < 8.0) return [160, 140, 120];
        return [120, 100, 90];
    },

    discoveries: [
        {
            id: "floater_test",
            name: "The Floater Test",
            trigger: (vars, result) => result < 1.0,
            description:
                "You discovered that objects with density < 1 g/cm3 float on water! " +
                "Archimedes figured this out in a bathtub over 2000 years ago.",
        },
        {
            id: "heavy_metal",
            name: "Heavy Metal Alert",
            trigger: (vars, result) => result > 7.0,
            description:
                "Density above 7 g/cm3? That is heavy metal territory! " +
                "Iron, copper, and lead all live in this range.",
        },
        {
            id: "perfect_aluminum",
            name: "Aluminum Ace",
            trigger: (vars, result) => Math.abs(result - 2.7) < 0.05,
            description:
                "Density of 2.70 g/cm3 — textbook aluminum! " +
                "Used in planes, cans, and smartphone frames.",
        },
    ],

    failureStates: [
        {
            id: "overflow",
            trigger: (vars) => vars.volume_displaced > 80,
            animation: "overflow",
            description:
                "SPLASH! Too much water in the graduated cylinder! " +
                "Your lab bench is now a swimming pool.",
        },
        {
            id: "scale_tip",
            trigger: (vars) => vars.mass_reading > 180,
            animation: "scale_tip",
            description:
                "The scale tips over from the weight! " +
                "That object is way too heavy for this little scale.",
        },
    ],

    conclusionOptions: [
        { id: "c1", text: "Density equals mass divided by volume, and our object is aluminum", correct: true },
        { id: "c2", text: "Density depends on the shape of the object", correct: false },
        { id: "c3", text: "Heavier objects always have higher density", correct: false },
        { id: "c4", text: "You need a thermometer to measure density", correct: false },
    ],

    observationOptions: [
        { id: "o1", text: "The object sank — it is denser than water", correct: true },
        { id: "o2", text: "The water level rose when the object was submerged", correct: true },
        { id: "o3", text: "The mass changed when I put the object in water", correct: false },
        { id: "o4", text: "Larger objects always displace more water regardless of density", correct: false },
    ],
};
