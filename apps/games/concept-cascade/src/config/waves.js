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
        number: 6,
        title: "Golem Advance",
        subtitle: "Heavy armor incoming. Bring big guns.",
        enemies: [
            { type: "geometryGolem", count: 3, interval: 3.0 },
            { type: "numberSprite", count: 6, interval: 0.7, delay: 1 },
            { type: "operationOgre", count: 2, interval: 2.0, delay: 4 },
        ],
        bonusGold: 30,
    },
    {
        number: 7,
        title: "Full Assault",
        subtitle: "Everything at once. Hold the line!",
        enemies: [
            { type: "numberSprite", count: 10, interval: 0.5 },
            { type: "operationOgre", count: 5, interval: 1.5, delay: 2 },
            { type: "fractionPhantom", count: 6, interval: 0.9, delay: 3 },
            { type: "geometryGolem", count: 2, interval: 4.0, delay: 6 },
        ],
        bonusGold: 35,
    },
    {
        number: 8,
        title: "The Concept Dragon",
        subtitle: "BOSS WAVE. Defeat the dragon to win!",
        enemies: [
            { type: "conceptDragon", count: 1, interval: 0 },
            { type: "numberSprite", count: 4, interval: 1.0, delay: 5 },
        ],
        bonusGold: 50,
        isBoss: true,
    },
];
