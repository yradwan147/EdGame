/**
 * Chapter definitions for Knowledge Quest.
 *
 * Each chapter contains a node-based map. Players travel from node to node,
 * encountering combat, dialogue/dilemma, shop, mystery, rest, and boss events.
 *
 * Node types:
 *   combat   - battle one or more enemies
 *   dialogue - story / moral-dilemma encounter
 *   shop     - buy potions, scrolls, companion food
 *   mystery  - random event (treasure, trap, companion egg, etc.)
 *   rest     - restore HP/MP and optionally level up companions
 *   boss     - chapter-ending boss fight
 */

export const CHAPTERS = [
    /* ------------------------------------------------------------------ */
    /*  Chapter 1 — The Withering Forest                                  */
    /* ------------------------------------------------------------------ */
    {
        id: 1,
        name: "The Withering Forest",
        description:
            "The once-lush Verdantwood is dying. Strange creatures born of ignorance roam the trails, and three Knowledge Stones hidden deep in the forest are the only hope of restoring life. Gather the stones before the last leaf falls.",
        unlockRequirement: null,
        themeColors: {
            primary: [60, 160, 60],
            secondary: [180, 140, 60],
            fog: [40, 50, 30],
        },
        nodes: [
            {
                id: "c1_start",
                type: "dialogue",
                label: "Forest Gate",
                position: { x: 120, y: 360 },
                connections: ["c1_combat1", "c1_mystery1"],
                difficulty: [1, 1],
                storyRef: "lost_merchant",
            },
            {
                id: "c1_combat1",
                type: "combat",
                label: "Overgrown Path",
                position: { x: 280, y: 260 },
                connections: ["c1_dialogue1"],
                difficulty: [1, 2],
                enemies: ["ignorance_imp", "ignorance_imp"],
            },
            {
                id: "c1_mystery1",
                type: "mystery",
                label: "Hollow Stump",
                position: { x: 280, y: 460 },
                connections: ["c1_dialogue1"],
                difficulty: [1, 1],
            },
            {
                id: "c1_dialogue1",
                type: "dialogue",
                label: "Riverside Camp",
                position: { x: 440, y: 360 },
                connections: ["c1_shop1", "c1_combat2"],
                difficulty: [1, 2],
                storyRef: "struggling_student",
            },
            {
                id: "c1_shop1",
                type: "shop",
                label: "Wandering Peddler",
                position: { x: 600, y: 260 },
                connections: ["c1_combat3"],
                difficulty: [1, 1],
            },
            {
                id: "c1_combat2",
                type: "combat",
                label: "Fungal Clearing",
                position: { x: 600, y: 460 },
                connections: ["c1_rest1"],
                difficulty: [2, 3],
                enemies: ["confusion_crawler"],
            },
            {
                id: "c1_combat3",
                type: "combat",
                label: "Thorn Thicket",
                position: { x: 760, y: 260 },
                connections: ["c1_rest1"],
                difficulty: [2, 2],
                enemies: ["ignorance_imp", "confusion_crawler"],
            },
            {
                id: "c1_rest1",
                type: "rest",
                label: "Moonlit Grove",
                position: { x: 880, y: 360 },
                connections: ["c1_mystery2"],
                difficulty: [1, 1],
            },
            {
                id: "c1_mystery2",
                type: "mystery",
                label: "Ancient Tree",
                position: { x: 1000, y: 360 },
                connections: ["c1_boss"],
                difficulty: [2, 3],
            },
            {
                id: "c1_boss",
                type: "boss",
                label: "Heart of the Blight",
                position: { x: 1160, y: 360 },
                connections: [],
                difficulty: [3, 4],
                enemies: ["riddler_boss"],
            },
        ],
    },

    /* ------------------------------------------------------------------ */
    /*  Chapter 2 — The Frozen Archives                                   */
    /* ------------------------------------------------------------------ */
    {
        id: 2,
        name: "The Frozen Archives",
        description:
            "An ancient library once held all the world's knowledge, until a curse froze it in time. Ice-bound guardians patrol the halls. Thaw the archive before its wisdom is lost forever.",
        unlockRequirement: { chapter: 1, completed: true },
        themeColors: {
            primary: [100, 180, 240],
            secondary: [200, 220, 255],
            fog: [30, 40, 60],
        },
        nodes: [
            {
                id: "c2_start",
                type: "dialogue",
                label: "Frozen Entrance",
                position: { x: 120, y: 360 },
                connections: ["c2_combat1"],
                difficulty: [2, 2],
                storyRef: "frozen_guardian",
            },
            {
                id: "c2_combat1",
                type: "combat",
                label: "Icy Corridor",
                position: { x: 260, y: 260 },
                connections: ["c2_mystery1", "c2_combat2"],
                difficulty: [2, 3],
                enemies: ["ignorance_imp", "doubt_shade"],
            },
            {
                id: "c2_mystery1",
                type: "mystery",
                label: "Sealed Vault",
                position: { x: 400, y: 180 },
                connections: ["c2_shop1"],
                difficulty: [2, 3],
            },
            {
                id: "c2_combat2",
                type: "combat",
                label: "Reading Hall",
                position: { x: 400, y: 360 },
                connections: ["c2_dialogue1"],
                difficulty: [3, 3],
                enemies: ["confusion_crawler", "confusion_crawler"],
            },
            {
                id: "c2_shop1",
                type: "shop",
                label: "Thawed Alcove",
                position: { x: 540, y: 180 },
                connections: ["c2_combat3"],
                difficulty: [1, 1],
            },
            {
                id: "c2_dialogue1",
                type: "dialogue",
                label: "Librarian's Desk",
                position: { x: 540, y: 420 },
                connections: ["c2_combat3"],
                difficulty: [3, 3],
                storyRef: "librarian_dilemma",
            },
            {
                id: "c2_combat3",
                type: "combat",
                label: "Frozen Stacks",
                position: { x: 700, y: 300 },
                connections: ["c2_rest1"],
                difficulty: [3, 4],
                enemies: ["doubt_shade", "apathy_giant"],
            },
            {
                id: "c2_rest1",
                type: "rest",
                label: "Warm Hearth",
                position: { x: 860, y: 300 },
                connections: ["c2_combat4"],
                difficulty: [1, 1],
            },
            {
                id: "c2_combat4",
                type: "combat",
                label: "Grand Atrium",
                position: { x: 1000, y: 360 },
                connections: ["c2_boss"],
                difficulty: [3, 4],
                enemies: ["apathy_giant", "doubt_shade"],
            },
            {
                id: "c2_boss",
                type: "boss",
                label: "The Frost Riddle",
                position: { x: 1160, y: 360 },
                connections: [],
                difficulty: [4, 5],
                enemies: ["riddler_boss"],
            },
        ],
    },

    /* ------------------------------------------------------------------ */
    /*  Chapter 3 — The Dragon's Equation                                 */
    /* ------------------------------------------------------------------ */
    {
        id: 3,
        name: "The Dragon's Equation",
        description:
            "At the peak of Numeron Mountain, a dragon guards the final Knowledge Stone. Only by solving the dragon's legendary equation can you reclaim it and restore balance to the world.",
        unlockRequirement: { chapter: 2, completed: true },
        themeColors: {
            primary: [220, 60, 60],
            secondary: [255, 200, 80],
            fog: [50, 20, 20],
        },
        nodes: [
            {
                id: "c3_start",
                type: "combat",
                label: "Mountain Pass",
                position: { x: 120, y: 360 },
                connections: ["c3_dialogue1", "c3_mystery1"],
                difficulty: [3, 4],
                enemies: ["doubt_shade", "confusion_crawler"],
            },
            {
                id: "c3_dialogue1",
                type: "dialogue",
                label: "Dragon's Emissary",
                position: { x: 300, y: 240 },
                connections: ["c3_combat2"],
                difficulty: [4, 4],
                storyRef: "dragon_offer",
            },
            {
                id: "c3_mystery1",
                type: "mystery",
                label: "Crystal Cave",
                position: { x: 300, y: 480 },
                connections: ["c3_combat2"],
                difficulty: [3, 4],
            },
            {
                id: "c3_combat2",
                type: "combat",
                label: "Lava Bridge",
                position: { x: 500, y: 360 },
                connections: ["c3_rest1"],
                difficulty: [4, 5],
                enemies: ["apathy_giant", "doubt_shade", "ignorance_imp"],
            },
            {
                id: "c3_rest1",
                type: "rest",
                label: "Summit Shrine",
                position: { x: 680, y: 360 },
                connections: ["c3_dialogue2"],
                difficulty: [1, 1],
            },
            {
                id: "c3_dialogue2",
                type: "dialogue",
                label: "The Final Choice",
                position: { x: 860, y: 360 },
                connections: ["c3_combat3"],
                difficulty: [5, 5],
                storyRef: "final_choice",
            },
            {
                id: "c3_combat3",
                type: "combat",
                label: "Dragon's Lair Gate",
                position: { x: 1020, y: 360 },
                connections: ["c3_boss"],
                difficulty: [5, 5],
                enemies: ["apathy_giant", "apathy_giant"],
            },
            {
                id: "c3_boss",
                type: "boss",
                label: "The Dragon's Equation",
                position: { x: 1160, y: 360 },
                connections: [],
                difficulty: [5, 5],
                enemies: ["riddler_boss"],
            },
        ],
    },
];

/** Return a chapter by its numeric id. */
export function getChapter(id) {
    return CHAPTERS.find((c) => c.id === id) ?? null;
}

/** Return a specific node within a chapter. */
export function getNode(chapterId, nodeId) {
    const ch = getChapter(chapterId);
    return ch ? ch.nodes.find((n) => n.id === nodeId) ?? null : null;
}
