import { SUBJECT_IDS } from "../../config/constants.js";

export const circuitsExperiment = {
    id: "circuits",
    name: "Light the Bulb",
    subject: SUBJECT_IDS.PHYSICS,
    difficulty: 2,
    description:
        "Build a simple circuit to light a bulb. Use batteries, wires, and a resistor " +
        "to achieve the right current without blowing the bulb!",

    requiredEquipment: [
        "battery",
        "wires",
        "bulb",
        "ammeter",
        "safety_goggles",
    ],
    availableEquipment: [
        "battery",
        "wires",
        "bulb",
        "ammeter",
        "safety_goggles",
        "resistor",
        "switch",
        "voltmeter",
        "thermometer",
        "scale",
    ],

    variables: [
        {
            name: "batteries",
            label: "Batteries (1.5V each)",
            unit: "cells",
            min: 1,
            max: 3,
            step: 1,
            defaultValue: 1,
        },
        {
            name: "resistor_value",
            label: "Resistor Value",
            unit: "ohms",
            min: 0,
            max: 100,
            step: 5,
            defaultValue: 10,
        },
    ],

    hypothesisOptions: [
        { id: "h1", text: "More batteries means more current and a brighter bulb" },
        { id: "h2", text: "The resistor controls how much current flows (Ohm's law)" },
        { id: "h3", text: "The bulb brightness depends only on wire thickness" },
        { id: "h4", text: "Batteries and resistors have no relationship" },
    ],
    correctHypothesisId: "h2",

    computeResult(vars) {
        const voltage = vars.batteries * 1.5;
        const resistance = Math.max(0.5, vars.resistor_value);
        const current = voltage / resistance;
        return Math.round(current * 1000) / 1000;
    },

    resultLabel: "Current",
    resultUnit: "A",
    targetMin: 0.3,
    targetMax: 0.5,

    describeResult(current) {
        if (current <= 0.01) return "No current! The circuit is basically open.";
        if (current < 0.1) return "Tiny trickle of current — the bulb barely glows.";
        if (current < 0.3) return "Some current — the bulb glows dimly.";
        if (current >= 0.3 && current <= 0.5) return "PERFECT! The bulb glows brightly and steadily!";
        if (current < 0.8) return "Getting bright — careful, the bulb is getting warm!";
        if (current < 1.0) return "TOO BRIGHT! The bulb filament is turning white-hot!";
        return "OVERLOAD! The current is way too high!";
    },

    resultColor(current) {
        if (current < 0.1) return [60, 60, 70];
        if (current < 0.3) return [200, 180, 100];
        if (current <= 0.5) return [255, 255, 180];
        if (current < 1.0) return [255, 255, 255];
        return [255, 100, 100];
    },

    discoveries: [
        {
            id: "short_circuit",
            name: "Short Circuit!",
            trigger: (vars) => vars.resistor_value === 0,
            description:
                "ZERO resistance = short circuit! All the current rushes through " +
                "with nothing to slow it down. This is how house fires start.",
        },
        {
            id: "overload",
            name: "Bulb Overload",
            trigger: (vars, result) => result > 1.0,
            description:
                "Current over 1A through a small bulb! The filament can not handle this much " +
                "energy. In real life you would smell burning tungsten.",
        },
        {
            id: "series_insight",
            name: "Voltage Stacking",
            trigger: (vars) => vars.batteries === 3,
            description:
                "Three batteries in series = 4.5V! Batteries in series add their voltages. " +
                "This is why flashlights stack multiple batteries.",
        },
    ],

    failureStates: [
        {
            id: "sparks",
            trigger: (vars) => vars.resistor_value === 0,
            animation: "sparks",
            description:
                "ZAP! Short circuit! Sparks fly everywhere as current rushes through " +
                "with zero resistance. The wires are getting HOT!",
        },
        {
            id: "bulb_pop",
            trigger: (vars, result) => result > 1.0,
            animation: "bulb_pop",
            description:
                "POP! The bulb explodes in a shower of glass! " +
                "Too much current melted the filament. Safety goggles saved your eyes!",
        },
    ],

    conclusionOptions: [
        { id: "c1", text: "Current equals voltage divided by resistance (Ohm's law: I = V/R)", correct: true },
        { id: "c2", text: "Current is always the same regardless of resistance", correct: false },
        { id: "c3", text: "Batteries create resistance, not voltage", correct: false },
        { id: "c4", text: "The bulb creates its own electricity", correct: false },
    ],

    observationOptions: [
        { id: "o1", text: "Increasing resistance decreased the current", correct: true },
        { id: "o2", text: "More batteries increased the voltage and current", correct: true },
        { id: "o3", text: "The bulb got brighter with less current", correct: false },
        { id: "o4", text: "Changing the resistor had no visible effect", correct: false },
    ],
};
