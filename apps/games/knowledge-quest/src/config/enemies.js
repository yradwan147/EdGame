/**
 * Enemy type definitions for Knowledge Quest.
 *
 * behavior values control special in-combat mechanics:
 *   argue   - displays distracting text bubbles on the question UI
 *   shuffle - rearranges the order of the player's spell menu each turn
 *   whisper - reduces the question timer by 3 seconds
 *   sleep   - falls asleep after 2 idle turns; player can sneak past
 *   riddle  - asks the player a riddle; correct answer weakens the boss
 */

export const ENEMY_TYPES = [
    {
        id: "ignorance_imp",
        name: "Ignorance Imp",
        description:
            "A small, chattering fiend that fills the air with nonsense to distract learners.",
        hp: 35,
        atk: 8,
        speed: 12,
        behavior: "argue",
        behaviorDescription:
            "Displays distracting text bubbles over the question panel.",
        companionDropRate: 0.15,
        xpReward: 18,
        goldReward: 8,
        possibleDrops: ["potion_small"],
        spriteColor: "impColor",
        chapters: [1, 2, 3],
    },
    {
        id: "confusion_crawler",
        name: "Confusion Crawler",
        description:
            "A many-legged creature that scrambles thoughts and rearranges what you see.",
        hp: 55,
        atk: 14,
        speed: 8,
        behavior: "shuffle",
        behaviorDescription:
            "Shuffles the order of the player's spell menu at the start of each turn.",
        companionDropRate: 0.1,
        xpReward: 28,
        goldReward: 14,
        possibleDrops: ["potion_small", "potion_medium"],
        spriteColor: "crawlerColor",
        chapters: [1, 2, 3],
    },
    {
        id: "doubt_shade",
        name: "Doubt Shade",
        description:
            "A whispering shadow that erodes confidence and steals precious seconds.",
        hp: 75,
        atk: 18,
        speed: 6,
        behavior: "whisper",
        behaviorDescription:
            "Reduces the question timer by 3 seconds while this enemy is alive.",
        companionDropRate: 0.1,
        xpReward: 40,
        goldReward: 20,
        possibleDrops: ["potion_medium", "scroll_hint"],
        spriteColor: "shadeColor",
        chapters: [2, 3],
    },
    {
        id: "apathy_giant",
        name: "Apathy Giant",
        description:
            "A colossal, drowsy brute. Powerful when awake, but its lethargy can be exploited.",
        hp: 130,
        atk: 24,
        speed: 3,
        behavior: "sleep",
        behaviorDescription:
            "Falls asleep after 2 idle turns. While asleep the player can sneak past or land a free critical hit.",
        companionDropRate: 0.2,
        xpReward: 55,
        goldReward: 30,
        possibleDrops: ["potion_medium", "potion_large", "scroll_hint"],
        spriteColor: "giantColor",
        chapters: [2, 3],
    },
    {
        id: "riddler_boss",
        name: "The Riddler",
        description:
            "A cunning, shape-shifting entity that tests knowledge with layered riddles. Answering its riddles weakens it.",
        hp: 300,
        atk: 20,
        speed: 5,
        behavior: "riddle",
        behaviorDescription:
            "Poses a riddle each turn. Correct answers reduce its ATK and defense; wrong answers heal it.",
        companionDropRate: 1.0,
        xpReward: 120,
        goldReward: 80,
        possibleDrops: ["companion_spark", "potion_large", "knowledge_stone"],
        spriteColor: "bossColor",
        chapters: [1, 2, 3],
    },
];

/** Look up an enemy type by its id. */
export function getEnemyType(id) {
    return ENEMY_TYPES.find((e) => e.id === id) ?? null;
}

/** Return all enemy types that can appear in a given chapter. */
export function getEnemiesForChapter(chapter) {
    return ENEMY_TYPES.filter((e) => e.chapters.includes(chapter));
}

/**
 * Build a combat-ready enemy instance from a type definition.
 * Returns a fresh object with mutable hp, status effects, etc.
 */
export function spawnEnemy(typeId, difficultyScale = 1) {
    const base = getEnemyType(typeId);
    if (!base) throw new Error(`Unknown enemy type: ${typeId}`);
    return {
        ...base,
        currentHp: Math.round(base.hp * difficultyScale),
        maxHp: Math.round(base.hp * difficultyScale),
        currentAtk: Math.round(base.atk * difficultyScale),
        statusEffects: [],
        idleTurns: 0,
        isAsleep: false,
    };
}
