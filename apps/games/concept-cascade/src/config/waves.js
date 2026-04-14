export const WAVES = [
    {
        number: 1,
        title: "Number Swarm",
        subtitle: "The sprites are coming...",
        enemies: [
            { type: "numberSprite", count: 8, interval: 0.8 },
        ],
        bonusGold: 10,
    },
    {
        number: 2,
        title: "Number Rush",
        subtitle: "More sprites, faster!",
        enemies: [
            { type: "numberSprite", count: 12, interval: 0.6 },
        ],
        bonusGold: 12,
    },
    {
        number: 3,
        title: "Operation March",
        subtitle: "The ogres have arrived.",
        enemies: [
            { type: "numberSprite", count: 6, interval: 0.7 },
            { type: "operationOgre", count: 4, interval: 1.5, delay: 3 },
        ],
        bonusGold: 18,
    },
    {
        number: 4,
        title: "Phantom Blink",
        subtitle: "Now you see them... now you don't.",
        enemies: [
            { type: "fractionPhantom", count: 6, interval: 1.0 },
            { type: "numberSprite", count: 5, interval: 0.8, delay: 2 },
        ],
        bonusGold: 20,
    },
    {
        number: 5,
        title: "Mixed Forces",
        subtitle: "All types converge!",
        enemies: [
            { type: "numberSprite", count: 8, interval: 0.6 },
            { type: "operationOgre", count: 3, interval: 1.8, delay: 2 },
            { type: "fractionPhantom", count: 4, interval: 1.2, delay: 5 },
        ],
        bonusGold: 25,
    },
    {
        // Note: Geometry Golems split into 2 fragments at 50% HP (config.splitCount).
        // Effective active count: 2 golems × (1 + 2 fragments) + 5 sprites + 2 ogres ≈ 13.
        number: 6,
        title: "Golem Advance",
        subtitle: "Heavy armor incoming. Bring big guns.",
        enemies: [
            { type: "geometryGolem", count: 2, interval: 4.0 },
            { type: "numberSprite", count: 5, interval: 0.8, delay: 1 },
            { type: "operationOgre", count: 2, interval: 2.5, delay: 5 },
        ],
        bonusGold: 30,
    },
    {
        // Effective active count with splits ≈ 20.
        number: 7,
        title: "Full Assault",
        subtitle: "Everything at once. Hold the line!",
        enemies: [
            { type: "numberSprite", count: 8, interval: 0.6 },
            { type: "operationOgre", count: 4, interval: 1.8, delay: 2 },
            { type: "fractionPhantom", count: 4, interval: 1.0, delay: 4 },
            { type: "geometryGolem", count: 2, interval: 5.0, delay: 8 },
        ],
        bonusGold: 40,
    },
    {
        // Boss also spawns up to 3+2+4 minions across its 3 phases.
        number: 8,
        title: "The Concept Dragon",
        subtitle: "BOSS WAVE. Defeat the dragon to win!",
        enemies: [
            { type: "conceptDragon", count: 1, interval: 0 },
            { type: "numberSprite", count: 3, interval: 1.2, delay: 6 },
        ],
        bonusGold: 60,
        isBoss: true,
    },
];
