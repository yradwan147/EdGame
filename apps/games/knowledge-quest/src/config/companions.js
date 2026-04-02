/**
 * Knowledge Companions -- collectible creatures that provide passive buffs.
 *
 * Rarity tiers: common, uncommon, rare, legendary
 * Each companion can evolve through 3 levels by feeding it XP from its domain.
 */

export const COMPANIONS = [
    {
        id: "pythos",
        name: "Pythos the Triangle",
        domain: "geometry",
        description:
            "A lively triangular sprite that hums the Pythagorean theorem as a lullaby.",
        rarity: "common",
        buff: {
            type: "damage_boost",
            condition: "geometry",
            value: 0.2,
            label: "+20% damage on geometry questions",
        },
        evolutionLevels: [
            {
                level: 1,
                name: "Pythos",
                description: "A small, eager triangle with glowing vertices.",
            },
            {
                level: 2,
                name: "Pythoras",
                description:
                    "Its sides shimmer with proofs. +25% geometry damage.",
            },
            {
                level: 3,
                name: "Pythagon",
                description:
                    "A radiant polygon that bends space. +30% geometry damage and +5% crit chance.",
            },
        ],
    },
    {
        id: "reactia",
        name: "Reactia the Molecule",
        domain: "chemistry",
        description:
            "A bubbly cluster of atoms that rearranges itself when excited.",
        rarity: "common",
        buff: {
            type: "heal_on_correct",
            condition: "science",
            value: 10,
            label: "Correct science answers heal 10 HP",
        },
        evolutionLevels: [
            {
                level: 1,
                name: "Reactia",
                description: "A simple molecule bouncing with energy.",
            },
            {
                level: 2,
                name: "Reactium",
                description: "Bonds strengthen. Heal increased to 15 HP.",
            },
            {
                level: 3,
                name: "Catalysia",
                description:
                    "A dazzling compound. Heals 20 HP and grants 1 MP on correct science answers.",
            },
        ],
    },
    {
        id: "algebrix",
        name: "Algebrix the Variable",
        domain: "algebra",
        description:
            "An ever-shifting letter that changes form but always finds the unknown.",
        rarity: "uncommon",
        buff: {
            type: "speed_bonus",
            condition: "algebra",
            value: 2.0,
            label: "2x speed bonus on algebra questions",
        },
        evolutionLevels: [
            {
                level: 1,
                name: "Algebrix",
                description: "A flickering 'x' that floats beside you.",
            },
            {
                level: 2,
                name: "Equatix",
                description:
                    "Now balances full equations. 2.5x algebra speed bonus.",
            },
            {
                level: 3,
                name: "Polynomius",
                description:
                    "A swirling cloud of variables and exponents. 3x algebra speed bonus and +10% XP.",
            },
        ],
    },
    {
        id: "numerus",
        name: "Numerus the Counter",
        domain: "number_sense",
        description:
            "A cheerful digit that tallies everything it sees and never loses count.",
        rarity: "common",
        buff: {
            type: "mp_regen",
            condition: "always",
            value: 1,
            label: "+1 MP regeneration per turn",
        },
        evolutionLevels: [
            {
                level: 1,
                name: "Numerus",
                description:
                    "A small '1' that hops along counting footsteps.",
            },
            {
                level: 2,
                name: "Decimal",
                description:
                    "Grows a decimal tail. +2 MP regen per turn.",
            },
            {
                level: 3,
                name: "Infinitus",
                description:
                    "Radiates an infinity glow. +2 MP regen and start each combat with +3 MP.",
            },
        ],
    },
    {
        id: "voltix",
        name: "Voltix the Spark",
        domain: "physics",
        description:
            "A crackling mote of electricity that arcs between your fingertips.",
        rarity: "uncommon",
        buff: {
            type: "spell_damage",
            condition: "always",
            value: 0.15,
            label: "+15% spell damage",
        },
        evolutionLevels: [
            {
                level: 1,
                name: "Voltix",
                description: "A tiny spark that zaps nearby objects.",
            },
            {
                level: 2,
                name: "Amperon",
                description:
                    "Charges intensify. +20% spell damage.",
            },
            {
                level: 3,
                name: "Teslion",
                description:
                    "A miniature lightning storm. +25% spell damage and 10% chance to chain to another enemy.",
            },
        ],
    },
    {
        id: "chrona",
        name: "Chrona the Hourglass",
        domain: "time",
        description:
            "A delicate hourglass spirit that stretches seconds when you need them most.",
        rarity: "rare",
        buff: {
            type: "timer_extension",
            condition: "always",
            value: 3,
            label: "+3 seconds on question timer",
        },
        evolutionLevels: [
            {
                level: 1,
                name: "Chrona",
                description: "A small hourglass that ticks gently.",
            },
            {
                level: 2,
                name: "Temporia",
                description:
                    "Sand flows slower. +4 seconds on question timer.",
            },
            {
                level: 3,
                name: "Aeonix",
                description:
                    "Time bends at will. +5 seconds and once per combat freezes the timer for one question.",
            },
        ],
    },
    {
        id: "enigma",
        name: "Enigma the Riddle",
        domain: "mixed",
        description:
            "A mysterious, shape-shifting puzzle piece that whispers the right questions to ask.",
        rarity: "rare",
        buff: {
            type: "free_hints",
            condition: "always",
            value: 0,
            label: "Mentor hints cost 0 tokens",
        },
        evolutionLevels: [
            {
                level: 1,
                name: "Enigma",
                description: "A shimmering question mark with curious eyes.",
            },
            {
                level: 2,
                name: "Paradoxia",
                description:
                    "Can see two answers at once. Hints also eliminate one wrong option.",
            },
            {
                level: 3,
                name: "Omniscia",
                description:
                    "Knows the shape of every answer. Free hints, eliminates two wrong options, and 5% auto-correct chance.",
            },
        ],
    },
    {
        id: "prismus",
        name: "Prismus the Spectrum",
        domain: "all",
        description:
            "A legendary prismatic entity that refracts the light of all knowledge.",
        rarity: "legendary",
        buff: {
            type: "companion_xp_boost",
            condition: "always",
            value: 0.5,
            label: "All companions gain 50% more evolution XP",
        },
        evolutionLevels: [
            {
                level: 1,
                name: "Prismus",
                description: "A faint rainbow orb that follows you quietly.",
            },
            {
                level: 2,
                name: "Spectra",
                description:
                    "Colors intensify. Companions gain 75% more evolution XP.",
            },
            {
                level: 3,
                name: "Omnichroma",
                description:
                    "A blinding spectrum of pure knowledge. Companions gain 100% more XP and all buff values increase by 10%.",
            },
        ],
    },
];

/** Look up a companion by its id. */
export function getCompanionById(id) {
    return COMPANIONS.find((c) => c.id === id) ?? null;
}

/** Return all companions of a given rarity. */
export function getCompanionsByRarity(rarity) {
    return COMPANIONS.filter((c) => c.rarity === rarity);
}
