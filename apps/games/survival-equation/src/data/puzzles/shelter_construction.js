/**
 * Day 2 puzzle: Build a storm-resistant shelter.
 * Requires info from all 4 roles.
 */
export const SHELTER_CONSTRUCTION = {
    id: "shelter_construction",
    name: "Shelter Construction",
    type: "beam_placement",
    description: "Design and build a shelter that can withstand tropical storm winds.",
    difficulty: 2,
    timeBonus: 45,
    resourceReward: { food: 0, water: 0, materials: 15 },
    failurePenalty: { food: -5, water: -5, materials: -10 },

    briefing: "A tropical storm is coming tonight. Without shelter, the team takes serious health damage. You must design a structure using available materials that can resist 80 km/h winds.",

    roleInfo: {
        engineer: {
            label: "Structural Blueprint (Raza's Notes)",
            style: "blueprint",
            lines: [
                "Bamboo poles: support up to 200 kg each when vertical",
                "Vine lashing holds ~80 kg of lateral force per joint",
                "Triangular bracing increases wind resistance by 60%",
                "Minimum 6 support poles needed for a 4-person shelter",
                "Palm frond roof needs 45-degree pitch to shed rain",
                "Ground anchoring: bury poles at least 40cm deep",
            ],
        },
        scientist: {
            label: "Wind Force Calculations (Juno's Data)",
            style: "lab_report",
            lines: [
                "Wind force formula: F = 0.5 x air_density x velocity^2 x area",
                "Air density at sea level: 1.225 kg/m3",
                "80 km/h = 22.2 m/s",
                "A 3m x 2m wall face receives ~1800 N of force in 80 km/h wind",
                "Angling the roof at 30-45 degrees reduces wind load by 40%",
                "Force must be distributed across at least 4 ground anchor points",
            ],
        },
        medic: {
            label: "Space Requirements (Kit's Health Notes)",
            style: "medical_chart",
            lines: [
                "Minimum floor space: 1.5m x 2m per person for sleeping",
                "Total team space needed: 3m x 4m (12 sq meters minimum)",
                "Headroom: at least 1.2m at lowest point to avoid claustrophobia stress",
                "Ventilation gap needed: 10cm minimum to prevent CO2 buildup",
                "Keep sleeping areas elevated 20cm off ground (insects, rain runoff)",
                "Dry shelter reduces hypothermia risk by 90%",
            ],
        },
        navigator: {
            label: "Storm Intelligence (Navi's Weather Report)",
            style: "field_map",
            lines: [
                "Storm approaches from the SOUTHEAST",
                "Peak wind: 80 km/h, sustained for ~3 hours",
                "Rainfall expected: 60mm in 4 hours",
                "Best shelter location: west side of the rock outcrop (natural windbreak)",
                "Terrain slopes east -- drainage will carry water away if shelter faces west",
                "Natural tree canopy on the west ridge provides 30% wind reduction",
            ],
        },
    },

    steps: [
        {
            id: "beam_layout",
            type: "beam_placement",
            instruction: "Place support beams on the shelter frame. You need at least 6 vertical poles and 4 diagonal braces. Click grid cells to place beams.",
            gridWidth: 8,
            gridHeight: 6,
            requiredVertical: 6,
            requiredDiagonal: 4,
            minScore: 0.6,
            feedbackCorrect: "Strong structure! The triangular bracing will hold against the storm.",
            feedbackWrong: "The structure needs more bracing. Add diagonal supports to resist lateral wind force.",
        },
        {
            id: "wind_force_calc",
            type: "calculation",
            instruction: "The shelter wall is 3m wide x 2m tall. Wind speed is 80 km/h (22.2 m/s). Using F = 0.5 x 1.225 x v^2 x A, what is the approximate wind force in Newtons? (Round to nearest 100)",
            correctAnswer: 1800,
            tolerance: 200,
            unit: "N",
            hint: "F = 0.5 x 1.225 x (22.2)^2 x (3 x 2). Calculate step by step.",
            feedbackCorrect: "1,814 N -- roughly 185 kg of push force. Each anchor point bears about 450 N.",
            feedbackWrong: "Break it down: 0.5 x 1.225 = 0.6125. Then 22.2^2 = 493. Then 0.6125 x 493 = 302. Then 302 x 6m^2 = about 1,814 N.",
        },
        {
            id: "orientation",
            type: "multiple_choice",
            instruction: "Based on the storm direction and terrain, which way should the shelter entrance face?",
            options: [
                "Southeast (toward the storm)",
                "Northwest (away from the storm)",
                "East (toward the drainage slope)",
                "South (toward the beach)",
            ],
            correctIndex: 1,
            feedbackCorrect: "Correct! Entrance faces away from the storm (northwest). The rock outcrop on the west shields from the southeast wind.",
            feedbackWrong: "The storm comes from the southeast. You want the entrance on the opposite side -- northwest -- so wind does not blast through the opening.",
        },
    ],

    completionMessage: "The shelter stands firm as the storm rages. Rain hammers the roof but the team stays dry inside. Raza grins: 'Told you triangles work.'",
    failureMessage: "The wind tears at the weak points. The roof partially collapses overnight. Team health suffers from exposure and cold rain.",
};
