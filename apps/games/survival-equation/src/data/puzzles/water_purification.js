/**
 * Day 1 puzzle: Build a water purification system.
 * Requires collaboration: each role has exclusive info the team needs.
 */
export const WATER_PURIFICATION = {
    id: "water_purification",
    name: "Water Purification",
    type: "drag_order",
    description: "Build a layered water filter from scavenged materials and calculate daily water needs.",
    difficulty: 1,
    timeBonus: 60,
    resourceReward: { food: 0, water: 25, materials: 0 },
    failurePenalty: { food: 0, water: -10, materials: 0 },

    briefing: "The stream water is murky and potentially contaminated. You need to build a filtration system using available materials. But first, figure out HOW MUCH water you actually need.",

    roleInfo: {
        engineer: {
            label: "Material Analysis (Raza's Blueprint)",
            style: "blueprint",
            lines: [
                "Available filter materials: gravel, sand, charcoal, cloth, coconut husk",
                "Charcoal has the finest filtration at 0.5 microns",
                "Layer order matters: coarse to fine for gravity filtration",
                "Estimated filter capacity: 2 liters per hour once built",
                "Container options: halved coconut (0.5L) or hollowed bamboo tube (1L)",
            ],
        },
        scientist: {
            label: "Purification Science (Juno's Lab Report)",
            style: "lab_report",
            lines: [
                "Gravity filtration removes particles but NOT bacteria",
                "After filtering, water must be boiled for 1 minute at sea level",
                "Charcoal adsorbs organic compounds via van der Waals forces",
                "Sand layer removes suspended sediment down to 50 microns",
                "Optimal filter depth: at least 15cm per layer for effectiveness",
            ],
        },
        medic: {
            label: "Hydration Requirements (Kit's Medical Chart)",
            style: "medical_chart",
            lines: [
                "Minimum water need: 2 liters per person per day",
                "In tropical heat, increase to 3 liters if doing physical labor",
                "Team size: 4 people",
                "Dehydration symptoms begin within 4-6 hours in heat",
                "Signs of unsafe water: cloudy, odd smell, surface film",
            ],
        },
        navigator: {
            label: "Water Source Survey (Navi's Field Map)",
            style: "field_map",
            lines: [
                "Stream location: 200m east of camp, downhill",
                "Water clarity: 3/10 (very murky, brown sediment)",
                "Flow rate: moderate, refill containers easily",
                "Alternative source: morning dew collection (very slow, ~0.2L/day)",
                "Rain forecast: possible light rain Day 3 (unreliable)",
            ],
        },
    },

    steps: [
        {
            id: "filter_order",
            type: "drag_order",
            instruction: "Arrange the filter layers from TOP (water enters) to BOTTOM (clean water exits). Coarsest first, finest last.",
            items: [
                { id: "cloth", label: "Cloth (coarse weave)", correctPosition: 0 },
                { id: "gravel", label: "Gravel (large particles)", correctPosition: 1 },
                { id: "sand", label: "Sand (fine particles)", correctPosition: 2 },
                { id: "charcoal", label: "Charcoal (activated carbon)", correctPosition: 3 },
                { id: "coconut_husk", label: "Coconut Husk (collection)", correctPosition: 4 },
            ],
            partialCreditPerCorrect: 0.2,
            feedbackCorrect: "Perfect layer order! Water flows through coarse to fine filtration.",
            feedbackWrong: "Not quite -- remember: coarse materials on top catch big stuff first, fine materials on bottom catch small particles.",
        },
        {
            id: "water_calculation",
            type: "calculation",
            instruction: "The filter produces 2L/hour. With 4 people each needing 2L/day, how many hours must the filter run daily?",
            correctAnswer: 4,
            tolerance: 0,
            unit: "hours",
            hint: "Total need = people x liters per person. Then divide by filter rate.",
            feedbackCorrect: "4 people x 2L = 8L needed. At 2L/hour, that is 4 hours of filtering!",
            feedbackWrong: "Think about it: 4 people x 2L each = 8L total. At 2L/hour, how many hours?",
        },
        {
            id: "boil_question",
            type: "multiple_choice",
            instruction: "After filtering, what additional step makes the water safe to drink?",
            options: [
                "Let it sit in sunlight for 10 minutes",
                "Boil it for at least 1 minute",
                "Add salt to kill bacteria",
                "Shake it vigorously to aerate",
            ],
            correctIndex: 1,
            feedbackCorrect: "Correct! Boiling for 1 minute at sea level kills bacteria and parasites.",
            feedbackWrong: "Filtering removes particles, but bacteria survive. Boiling for 1 minute kills pathogens.",
        },
    ],

    completionMessage: "The water filter is working. Clean water flows into your containers. The team can survive another day.",
    failureMessage: "The filter is not effective. Water is still unsafe. The team must ration their remaining clean water carefully.",
};
