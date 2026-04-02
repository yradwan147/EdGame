export const SYNERGIES = [
    {
        id: "chainCalculation",
        name: "Chain Calculation",
        description: "Bastion marks enemies for Cannon to deal 2x damage",
        requires: ["numberBastion", "operationCannon"],
        maxDistance: 150,  // tiles must be within this px distance
        effect: {
            type: "markAndBoost",
            marker: "numberBastion",
            beneficiary: "operationCannon",
            damageMultiplier: 2.0,
            markDuration: 2.0,
        },
        color: [255, 200, 80],
    },
    {
        id: "shatterShot",
        name: "Shatter Shot",
        description: "Frozen enemies take 3x damage from Guard's shots",
        requires: ["fractionFreezer", "geometryGuard"],
        maxDistance: 250,  // guard has long range so allow wider synergy
        effect: {
            type: "conditionalBoost",
            condition: "frozen",
            beneficiary: "geometryGuard",
            damageMultiplier: 3.0,
        },
        color: [180, 120, 255],
    },
    {
        id: "knowledgeNexus",
        name: "Knowledge Nexus",
        description: "3 towers in triangle get 20% attack speed boost",
        requires: "any3",
        maxDistance: 200,
        minTowers: 3,
        effect: {
            type: "auraBoost",
            fireRateMultiplier: 1.2,
        },
        color: [100, 255, 200],
    },
    {
        id: "frostCannon",
        name: "Frost Cannon",
        description: "Freezer + Cannon: splash applies slow",
        requires: ["fractionFreezer", "operationCannon"],
        maxDistance: 150,
        effect: {
            type: "splashSlow",
            beneficiary: "operationCannon",
            slowFactor: 0.3,
            slowDuration: 1.5,
        },
        color: [140, 180, 255],
    },
    {
        id: "fortifiedLine",
        name: "Fortified Line",
        description: "2 Bastions adjacent: both get +25% range",
        requires: ["numberBastion", "numberBastion"],
        maxDistance: 100,
        effect: {
            type: "mutualBoost",
            rangeMultiplier: 1.25,
        },
        color: [120, 180, 255],
    },
];
