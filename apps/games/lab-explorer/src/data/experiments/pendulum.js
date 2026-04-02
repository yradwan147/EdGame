import { SUBJECT_IDS } from "../../config/constants.js";

export const pendulumExperiment = {
    id: "pendulum",
    name: "The Pendulum Lab",
    subject: SUBJECT_IDS.PHYSICS,
    difficulty: 3,
    description:
        "What affects a pendulum's period? Change the string length, mass, " +
        "and release angle to find out. The answer may surprise you!",

    requiredEquipment: [
        "string",
        "weights",
        "ruler",
        "stopwatch",
        "safety_goggles",
    ],
    availableEquipment: [
        "string",
        "weights",
        "ruler",
        "stopwatch",
        "safety_goggles",
        "scale",
        "thermometer",
        "beaker",
    ],

    variables: [
        {
            name: "string_length",
            label: "String Length",
            unit: "cm",
            min: 10,
            max: 100,
            step: 5,
            defaultValue: 50,
        },
        {
            name: "mass",
            label: "Bob Mass",
            unit: "g",
            min: 50,
            max: 500,
            step: 25,
            defaultValue: 100,
        },
        {
            name: "release_angle",
            label: "Release Angle",
            unit: "deg",
            min: 10,
            max: 60,
            step: 5,
            defaultValue: 15,
        },
    ],

    hypothesisOptions: [
        { id: "h1", text: "Heavier bobs swing faster (shorter period)" },
        { id: "h2", text: "Only string length affects the period" },
        { id: "h3", text: "Both mass and length affect the period equally" },
        { id: "h4", text: "The release angle is the main factor" },
    ],
    correctHypothesisId: "h2",

    computeResult(vars) {
        const lengthM = vars.string_length / 100;
        const g = 9.81;
        // T = 2 * pi * sqrt(L / g), with small correction for large angles
        const angleRad = (vars.release_angle * Math.PI) / 180;
        const angleCorrection = 1 + (angleRad * angleRad) / 16;
        const period = 2 * Math.PI * Math.sqrt(lengthM / g) * angleCorrection;
        return Math.round(period * 1000) / 1000;
    },

    resultLabel: "Period",
    resultUnit: "s",
    targetMin: 1.3,
    targetMax: 1.5,

    describeResult(period) {
        if (period < 0.5) return "Lightning fast! Short string = fast swing.";
        if (period < 1.0) return "Quick pendulum — about one swing per second.";
        if (period >= 1.3 && period <= 1.5) return "CLASSIC PENDULUM! Around 1.4s — like a grandfather clock!";
        if (period < 2.0) return "Nice steady swing — easy to time.";
        if (period < 3.0) return "Slow, graceful arcs. Very relaxing to watch.";
        return "Extremely slow swing — this is a long pendulum!";
    },

    resultColor(period) {
        if (period < 0.5) return [255, 200, 80];
        if (period < 1.3) return [200, 180, 140];
        if (period <= 1.5) return [80, 220, 130];
        if (period < 2.5) return [140, 160, 200];
        return [100, 120, 180];
    },

    discoveries: [
        {
            id: "mass_independence",
            name: "Mass Does Not Matter!",
            trigger: (vars, result, history) => {
                if (!history || history.length < 2) return false;
                const prev = history[history.length - 2];
                if (!prev) return false;
                const massChanged = prev.vars.mass !== vars.mass;
                const lengthSame = prev.vars.string_length === vars.string_length;
                const periodSimilar = Math.abs(prev.result - result) < 0.05;
                return massChanged && lengthSame && periodSimilar;
            },
            description:
                "Amazing! Changing the mass did NOT change the period! " +
                "Galileo discovered this 400 years ago. Gravity accelerates all masses equally.",
        },
        {
            id: "small_angle",
            name: "Small Angle Approximation",
            trigger: (vars) => vars.release_angle === 10,
            description:
                "At small angles (under 15 degrees), the pendulum equation T = 2*pi*sqrt(L/g) " +
                "is most accurate. Physicists love small angle approximations!",
        },
        {
            id: "resonance_insight",
            name: "The Square Root Rule",
            trigger: (vars, result, history) => {
                if (!history || history.length < 2) return false;
                const prev = history[history.length - 2];
                if (!prev) return false;
                const doubled = vars.string_length === prev.vars.string_length * 2;
                return doubled;
            },
            description:
                "Double the length = sqrt(2) times the period! " +
                "The period grows with the square root of length. Math is beautiful.",
        },
    ],

    failureStates: [
        {
            id: "string_break",
            trigger: (vars) => vars.mass >= 450 && vars.string_length >= 80,
            animation: "string_break",
            description:
                "SNAP! The string cannot hold that much weight at that length! " +
                "The bob goes flying across the lab like a tiny cannonball.",
        },
        {
            id: "wild_swing",
            trigger: (vars) => vars.release_angle > 55,
            animation: "wild_swing",
            description:
                "WHOOOOA! At angles above 55 degrees the pendulum swings wildly " +
                "and almost wraps around the pivot! That is NOT simple harmonic motion!",
        },
    ],

    conclusionOptions: [
        { id: "c1", text: "Only string length affects the period; mass does not matter", correct: true },
        { id: "c2", text: "Heavier pendulums always swing faster", correct: false },
        { id: "c3", text: "The release angle is the main factor in period", correct: false },
        { id: "c4", text: "All three variables affect the period equally", correct: false },
    ],

    observationOptions: [
        { id: "o1", text: "Changing mass while keeping length constant did not change the period", correct: true },
        { id: "o2", text: "Longer strings produced longer periods", correct: true },
        { id: "o3", text: "Heavier bobs swung noticeably faster", correct: false },
        { id: "o4", text: "The pendulum sped up over time due to momentum", correct: false },
    ],
};
