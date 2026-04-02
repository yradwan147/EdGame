/**
 * Day 5 puzzle: Build and power a rescue signal.
 * Multi-step puzzle requiring ALL roles' input.
 */
export const SIGNAL_BOOST = {
    id: "signal_boost",
    name: "Rescue Signal",
    type: "multi_step",
    description: "Wire a signal device from scavenged parts, calculate power needs, and aim the antenna.",
    difficulty: 3,
    timeBonus: 30,
    resourceReward: { food: 0, water: 0, materials: 0 },
    failurePenalty: { food: 0, water: 0, materials: 0 },

    briefing: "A rescue aircraft has been spotted! You have one window to send a signal. Build a transmitter from salvaged electronics, power it correctly, and aim it at the right coordinates. This is everything you have been surviving for.",

    roleInfo: {
        engineer: {
            label: "Transmitter Schematic (Raza's Blueprint)",
            style: "blueprint",
            lines: [
                "Salvaged parts: battery (9V), copper wire, tin can (reflector), LED strip, toggle switch",
                "Circuit path: battery -> switch -> resistor -> antenna coil -> ground",
                "The tin can acts as a parabolic reflector -- must be aimed precisely",
                "Copper wire needs at least 20 loops for a working antenna coil",
                "Solder alternative: twist wires tightly and wrap with tape for conductivity",
                "Total circuit resistance should be approximately 150 ohms for safe operation",
            ],
        },
        scientist: {
            label: "Signal Physics (Juno's Calculations)",
            style: "lab_report",
            lines: [
                "Signal frequency target: ~150 MHz (emergency aviation band)",
                "Power needed: P = V^2 / R. With 9V battery and 150 ohm resistance, P = 0.54 watts",
                "0.54 watts is weak but detectable within 5 km line-of-sight",
                "Antenna length for 150 MHz: wavelength/4 = 0.5 meters",
                "Higher elevation increases line-of-sight range dramatically",
                "The tin reflector doubles effective signal strength in the aimed direction",
            ],
        },
        medic: {
            label: "Team Status Report (Kit's Assessment)",
            style: "medical_chart",
            lines: [
                "Team fatigue level: HIGH. Everyone has ~2 hours of focused work left",
                "Raza has a minor hand injury -- needs help with fine wire work",
                "Battery acid is corrosive -- handle the 9V battery with cloth wrapping",
                "Signal assembly should take no more than 90 minutes to preserve energy",
                "If this fails, morale drops to critical. Success is essential for team mental health",
                "Have everyone hydrate before the final push",
            ],
        },
        navigator: {
            label: "Rescue Aircraft Data (Navi's Observations)",
            style: "field_map",
            lines: [
                "Aircraft spotted bearing 315 degrees (northwest)",
                "Estimated altitude: 3000 meters",
                "Aircraft heading: southeast, estimated speed 200 km/h",
                "Signal window: approximately 8 minutes as it passes overhead",
                "Best signal position: hilltop at 120m elevation, grid ref NW-7",
                "The aircraft will be closest at bearing 280 degrees (west-northwest) in 4 minutes",
            ],
        },
    },

    steps: [
        {
            id: "circuit_wiring",
            type: "node_wiring",
            instruction: "Wire the signal circuit in the correct order. Connect components from battery to antenna. Drag wires between the nodes.",
            nodes: [
                { id: "battery", label: "9V Battery", x: 0.1, y: 0.5, type: "source" },
                { id: "switch", label: "Toggle Switch", x: 0.3, y: 0.3, type: "component" },
                { id: "resistor", label: "Resistor (150 ohm)", x: 0.5, y: 0.5, type: "component" },
                { id: "coil", label: "Antenna Coil", x: 0.7, y: 0.3, type: "component" },
                { id: "reflector", label: "Tin Reflector", x: 0.85, y: 0.5, type: "output" },
                { id: "ground", label: "Ground", x: 0.5, y: 0.8, type: "ground" },
            ],
            correctConnections: [
                ["battery", "switch"],
                ["switch", "resistor"],
                ["resistor", "coil"],
                ["coil", "reflector"],
                ["coil", "ground"],
            ],
            feedbackCorrect: "Circuit complete! Current flows from battery through the switch, resistor, coil, and into the reflector. The antenna is powered!",
            feedbackWrong: "The circuit is not complete. Remember: battery -> switch -> resistor -> antenna coil -> reflector, with coil also grounded.",
        },
        {
            id: "power_calculation",
            type: "calculation",
            instruction: "Calculate the signal power. Using P = V^2 / R, with a 9V battery and 150 ohm total resistance, what power (in watts) does the transmitter produce? (Round to 2 decimal places)",
            correctAnswer: 0.54,
            tolerance: 0.05,
            unit: "watts",
            hint: "P = 9^2 / 150 = 81 / 150",
            feedbackCorrect: "0.54 watts -- just enough for detection at close range. The reflector effectively doubles it to ~1 watt in one direction!",
            feedbackWrong: "P = V^2 / R = 9^2 / 150 = 81 / 150 = 0.54 watts. Every decimal matters for survival!",
        },
        {
            id: "antenna_aim",
            type: "slider",
            instruction: "Aim the antenna at the rescue aircraft. Navi says it will be closest at bearing 280 degrees. Set the antenna bearing.",
            min: 0,
            max: 360,
            correctValue: 280,
            tolerance: 15,
            unit: "degrees",
            labels: { 0: "N", 90: "E", 180: "S", 270: "W", 360: "N" },
            feedbackCorrect: "Signal locked on! The aircraft's radio crackles to life with your transmission. RESCUE IS COMING!",
            feedbackWrong: "The signal missed the aircraft. Remember: Navi said bearing 280 degrees -- west-northwest. Aim where the plane WILL be, not where it was.",
        },
    ],

    completionMessage: "The radio crackles: 'Copy your signal, survivors. Rescue helicopter dispatched. ETA 2 hours. Stay where you are.' The team erupts in cheers. You did it -- together.",
    failureMessage: "The aircraft passes without acknowledging. But the team does not give up. They will try again tomorrow... if supplies hold out.",
};
