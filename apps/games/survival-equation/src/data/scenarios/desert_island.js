import { WATER_PURIFICATION } from "../puzzles/water_purification.js";
import { SHELTER_CONSTRUCTION } from "../puzzles/shelter_construction.js";
import { SIGNAL_BOOST } from "../puzzles/signal_boost.js";

/**
 * Complete puzzle definitions for all 5 days of the desert island scenario.
 * Days 1, 2, 5 use the dedicated puzzle files; days 3, 4 are defined inline.
 */

const MEDICAL_DIAGNOSIS = {
    id: "medical_diagnosis",
    name: "Tropical Fever Treatment",
    type: "multi_step",
    description: "Diagnose and treat a team member's sudden illness using available resources.",
    difficulty: 2,
    timeBonus: 50,
    resourceReward: { food: 0, water: 5, materials: 5 },
    failurePenalty: { food: -5, water: -5, materials: 0 },
    briefing: "Juno collapsed with a high fever. Kit suspects contaminated food or an insect bite. Diagnose the cause and prepare treatment before it spreads.",
    roleInfo: {
        engineer: {
            label: "Camp Equipment (Raza's Inventory)",
            style: "blueprint",
            lines: [
                "Available tools: sharpened bamboo, heated stones, cloth strips, vine rope",
                "Can construct a cooling rack from bamboo over wet cloth",
                "Charcoal from the fire can be crushed into powder for ingestion",
                "The water boiling setup from Day 1 still works -- can sterilize instruments",
            ],
        },
        scientist: {
            label: "Pathogen Analysis (Juno's Prior Notes)",
            style: "lab_report",
            lines: [
                "Juno's symptoms: 39.5C fever, chills, nausea, headache",
                "Onset was sudden -- 6 hours after eating foraged berries",
                "Tropical bacteria incubation: typically 4-12 hours after ingestion",
                "Activated charcoal can adsorb toxins in the gut within 1 hour of ingestion",
                "Rehydration is critical: 1 liter of water with a pinch of salt and sugar",
            ],
        },
        medic: {
            label: "Treatment Protocol (Kit's Medical Chart)",
            style: "medical_chart",
            lines: [
                "Step 1: Reduce fever below 38.5C using evaporative cooling",
                "Step 2: Administer activated charcoal if toxin ingestion suspected",
                "Step 3: Oral rehydration solution: 1L water + 6 tsp sugar + 0.5 tsp salt",
                "Step 4: Monitor temperature every 30 minutes for 4 hours",
                "Fever above 40C is a medical emergency -- act fast",
                "Do NOT give food until nausea subsides",
            ],
        },
        navigator: {
            label: "Foraging Report (Navi's Observations)",
            style: "field_map",
            lines: [
                "Berry source: red clusters found near the south stream at 14:00",
                "Some berries had tiny black specks -- possible fungal contamination",
                "Local birds were NOT eating those berries -- warning sign",
                "Medicinal aloe-like plant found 100m north -- sap may soothe nausea",
                "Night insects in this area carry dengue-like fevers -- check for bite marks",
            ],
        },
    },
    steps: [
        {
            id: "diagnosis",
            type: "multiple_choice",
            instruction: "Based on the evidence, what is the most likely cause of Juno's illness?",
            options: [
                "Insect bite transmitting a virus",
                "Contaminated berry ingestion (fungal toxin)",
                "Dehydration and heat stroke",
                "Bacterial infection from the water filter",
            ],
            correctIndex: 1,
            feedbackCorrect: "Correct! The timing (6 hours after eating) and the fungal specks on the berries point to ingested toxin. Birds avoiding them was the clue.",
            feedbackWrong: "Look at the timing: symptoms started 6 hours after eating berries that had black specks and that birds avoided. This points to food-borne toxin.",
        },
        {
            id: "treatment_order",
            type: "drag_order",
            instruction: "Arrange the treatment steps in the correct order.",
            items: [
                { id: "cool", label: "Cool patient (wet cloth evaporation)", correctPosition: 0 },
                { id: "charcoal", label: "Administer crushed charcoal", correctPosition: 1 },
                { id: "rehydrate", label: "Give oral rehydration solution", correctPosition: 2 },
                { id: "monitor", label: "Monitor temperature every 30 min", correctPosition: 3 },
            ],
            partialCreditPerCorrect: 0.25,
            feedbackCorrect: "Perfect treatment sequence! Cool first to prevent brain damage, charcoal to absorb toxin, rehydrate to replace lost fluids, then monitor.",
            feedbackWrong: "Priority: reduce dangerous fever first, then absorb the toxin with charcoal, rehydrate, and monitor.",
        },
        {
            id: "rehydration_calc",
            type: "calculation",
            instruction: "Kit's rehydration solution needs 6 teaspoons of sugar per liter. If you need to prepare 2 liters, how many teaspoons of sugar total?",
            correctAnswer: 12,
            tolerance: 0,
            unit: "teaspoons",
            hint: "6 teaspoons per liter, multiplied by 2 liters.",
            feedbackCorrect: "12 teaspoons -- Juno needs the full 2L over the next 4 hours. Good proportions.",
            feedbackWrong: "Simple scaling: 6 tsp per 1L, so 2L needs 6 x 2 = 12 teaspoons.",
        },
    ],
    completionMessage: "By evening, Juno's fever breaks. Kit watches with visible relief as the temperature drops to 37.8C. 'No more mystery berries,' Juno whispers weakly.",
    failureMessage: "Juno's condition worsens through the night. The fever peaks dangerously and the team must split attention between care and survival tasks.",
};

const RESOURCE_NEGOTIATION = {
    id: "resource_negotiation",
    name: "Rival Camp Negotiation",
    type: "multi_step",
    description: "Decide how to handle a rival group of survivors -- trade, share, or compete.",
    difficulty: 2,
    timeBonus: 40,
    resourceReward: { food: 15, water: 10, materials: 10 },
    failurePenalty: { food: -10, water: -5, materials: -5 },
    briefing: "Another group of 3 survivors has been spotted. They have excess food but no water purification. This is a test of leadership and values.",
    roleInfo: {
        engineer: {
            label: "Asset Assessment (Raza's Analysis)",
            style: "blueprint",
            lines: [
                "Their camp has metal sheeting (excellent material) and canned food",
                "They lack any filtration or purification capability",
                "Trading our filter blueprint for their metal would be mutually beneficial",
                "Their shelter is crude -- we could offer structural advice as goodwill",
            ],
        },
        scientist: {
            label: "Resource Calculation (Juno's Analysis)",
            style: "lab_report",
            lines: [
                "Combined groups would need 14L water/day (7 people x 2L)",
                "Our filter produces 2L/hour = 16L/day maximum, which covers 7 people",
                "Food situation: their 3 cans + our foraging = 4 days if shared",
                "Alone, our food lasts 2 more days. With their cans, it stretches to 4",
            ],
        },
        medic: {
            label: "Health Risk Assessment (Kit's Notes)",
            style: "medical_chart",
            lines: [
                "Their group has one person with a sprained ankle -- limited mobility",
                "Sharing resources reduces everyone's stress cortisol (better immune function)",
                "Conflict injuries could be catastrophic without proper medical supplies",
                "Larger group = more hands for shelter, signal-building, and watch shifts",
            ],
        },
        navigator: {
            label: "Strategic Assessment (Navi's Intel)",
            style: "field_map",
            lines: [
                "Their camp is 800m northwest on higher ground with ocean visibility",
                "They can see rescue ships/planes from their position -- we cannot from ours",
                "Cooperating gives us a lookout advantage",
                "If conflict occurs, their higher ground is a tactical disadvantage for us",
            ],
        },
    },
    steps: [
        {
            id: "approach_decision",
            type: "multiple_choice",
            instruction: "Based on everyone's intel, what is the best approach to the rival camp?",
            options: [
                "Avoid them entirely and stay hidden",
                "Trade: offer water purification knowledge for their metal and food",
                "Take their supplies by force while they sleep",
                "Give them everything for free to build trust",
            ],
            correctIndex: 1,
            feedbackCorrect: "Trade! Mutual benefit: they need water, you need food and materials. Plus their hilltop lookout could spot rescue.",
            feedbackWrong: "Fair trade creates the best outcome for both groups: we share water purification, they share food and materials. Cooperation beats isolation.",
        },
        {
            id: "trade_fairness",
            type: "slider",
            instruction: "Set the trade ratio. What percentage of your daily filtered water should you offer in exchange for 3 cans of food and metal sheeting?",
            min: 0,
            max: 100,
            correctValue: 50,
            tolerance: 15,
            unit: "%",
            labels: { 0: "None", 25: "Little", 50: "Fair", 75: "Generous", 100: "All" },
            feedbackCorrect: "A fair 50/50 split. Both groups get what they need without anyone going short. Good leadership.",
            feedbackWrong: "Too extreme. An unfair trade breeds resentment. Aim for ~50% -- enough to help them while keeping your team healthy.",
        },
        {
            id: "combined_food",
            type: "calculation",
            instruction: "If you share resources, combined food must feed 7 people. You have 24 units of food, they add 18. How many days will the combined food last at 6 units per day?",
            correctAnswer: 7,
            tolerance: 0,
            unit: "days",
            hint: "Total food / daily consumption = days.",
            feedbackCorrect: "42 units / 6 per day = 7 days! That is more than enough to reach Day 5 rescue.",
            feedbackWrong: "24 + 18 = 42 total food. At 6 per day for the combined group: 42 / 6 = 7 days.",
        },
    ],
    completionMessage: "The trade goes smoothly. Their leader, a former teacher, shakes your hand. 'Two teams are stronger than one.' Navi posts a lookout on their hilltop immediately.",
    failureMessage: "Tensions rise during negotiation. The rival group retreats to their camp and builds a wall. An opportunity for cooperation -- lost.",
};

export const DESERT_ISLAND_PUZZLES = {
    water_purification: WATER_PURIFICATION,
    shelter_construction: SHELTER_CONSTRUCTION,
    medical_diagnosis: MEDICAL_DIAGNOSIS,
    resource_negotiation: RESOURCE_NEGOTIATION,
    signal_boost: SIGNAL_BOOST,
};
