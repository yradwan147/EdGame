/**
 * Spell definitions for Knowledge Quest.
 *
 * timingPattern controls the timed-cast minigame:
 *   single_ring   - one shrinking ring, press when it aligns with the center
 *   double_ring   - two concentric rings, press when they overlap
 *   moving_target - crosshair moves across the screen, press when on target
 *   pulse         - ring pulses in and out, press at its smallest diameter
 *   rapid_shrink  - very fast single ring (harder version of single_ring)
 *   triple_ring   - three sequential rings, press once per ring
 */

export const SPELLS = [
    {
        id: "spark",
        name: "Spark",
        description: "A quick bolt of fire fuelled by arithmetic instinct.",
        subject: "math",
        difficultyBias: 0,
        mpCost: 2,
        baseDamage: 18,
        targetType: "enemy",
        element: "fire",
        timingPattern: "single_ring",
        unlockChapter: 1,
        statusEffect: null,
    },
    {
        id: "frost_wave",
        name: "Frost Wave",
        description: "A chilling wave that slows the enemy's next action.",
        subject: "science",
        difficultyBias: 0,
        mpCost: 3,
        baseDamage: 14,
        targetType: "enemy",
        element: "ice",
        timingPattern: "double_ring",
        unlockChapter: 1,
        statusEffect: { type: "slow", turns: 1 },
    },
    {
        id: "healing_light",
        name: "Healing Light",
        description: "Restores health to an ally through the clarity of numbers.",
        subject: "math",
        difficultyBias: 0,
        mpCost: 3,
        baseDamage: 0,
        healAmount: 25,
        targetType: "ally",
        element: "light",
        timingPattern: "pulse",
        unlockChapter: 1,
        statusEffect: null,
    },
    {
        id: "vine_bind",
        name: "Vine Bind",
        description: "Living vines erupt from the ground and hold the foe in place.",
        subject: "math",
        difficultyBias: 1,
        mpCost: 4,
        baseDamage: 0,
        targetType: "enemy",
        element: "nature",
        timingPattern: "moving_target",
        unlockChapter: 2,
        statusEffect: { type: "stun", turns: 2 },
    },
    {
        id: "thunder_strike",
        name: "Thunder Strike",
        description: "A devastating bolt drawn from understanding the forces of nature.",
        subject: "science",
        difficultyBias: 1,
        mpCost: 5,
        baseDamage: 35,
        targetType: "enemy",
        element: "lightning",
        timingPattern: "rapid_shrink",
        unlockChapter: 2,
        statusEffect: null,
    },
    {
        id: "knowledge_burst",
        name: "Knowledge Burst",
        description: "Pure learning energy erupts outward, damaging every foe on the field.",
        subject: "mixed",
        difficultyBias: 2,
        mpCost: 8,
        baseDamage: 50,
        targetType: "all_enemies",
        element: "arcane",
        timingPattern: "triple_ring",
        unlockChapter: 3,
        statusEffect: null,
    },
];

/** Look up a spell by its id. */
export function getSpellById(id) {
    return SPELLS.find((s) => s.id === id) ?? null;
}

/** Return all spells unlocked at or before the given chapter. */
export function getSpellsForChapter(chapter) {
    return SPELLS.filter((s) => s.unlockChapter <= chapter);
}
