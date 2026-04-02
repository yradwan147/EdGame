/**
 * companionSystem.js -- Knowledge Companion collection and leveling.
 *
 * Companions are collected through gameplay (combat sparks, dialogue rewards).
 * They level up when the player answers questions in their domain.
 * Up to 3 may be active at once, providing passive combat buffs.
 *
 * Evolution stages (4 total):
 *   Stage 1: level 1   (base form)
 *   Stage 2: level 2   (50 XP)
 *   Stage 3: level 3   (150 XP)
 *   Stage 4: level 4   (350 XP)
 */

const LEVEL_THRESHOLDS = [0, 50, 150, 350];

const COMPANION_DATA = {
    algebrix: {
        domain: "math",
        evolutions: [
            { stage: 1, name: "Algebrix", desc: "A small crystalline fox that glows with numeric runes." },
            { stage: 2, name: "Algebrix Prime", desc: "A sleek fox wreathed in floating equations." },
            { stage: 3, name: "Algebrix Magnus", desc: "A majestic fox whose tail traces golden formulas in the air." },
            { stage: 4, name: "Algebrix Omega", desc: "A radiant fox of pure mathematical energy, equations orbiting like planets." },
        ],
    },
    reactia: {
        domain: "science",
        evolutions: [
            { stage: 1, name: "Reactia", desc: "A bubbly slime that shifts between solid, liquid, and gas." },
            { stage: 2, name: "Reactia Flux", desc: "A shimmering slime with tiny molecule models floating inside." },
            { stage: 3, name: "Reactia Catalyst", desc: "A luminous slime that emits sparks of chemical energy." },
            { stage: 4, name: "Reactia Nova", desc: "A blazing slime radiating all states of matter at once." },
        ],
    },
    voltaire: {
        domain: "science",
        evolutions: [
            { stage: 1, name: "Voltaire", desc: "A tiny thunderbird chick crackling with static." },
            { stage: 2, name: "Voltaire Storm", desc: "A young thunderbird with wings of living lightning." },
            { stage: 3, name: "Voltaire Surge", desc: "A powerful thunderbird trailing arcs of electricity." },
            { stage: 4, name: "Voltaire Tempest", desc: "A colossal thunderbird whose wingbeats generate electromagnetic storms." },
        ],
    },
    florae: {
        domain: "science",
        evolutions: [
            { stage: 1, name: "Florae", desc: "A small plant sprite with leaf-like wings." },
            { stage: 2, name: "Florae Bloom", desc: "A flowering sprite trailing pollen and light." },
            { stage: 3, name: "Florae Verdant", desc: "A forest spirit draped in living vines and blossoms." },
            { stage: 4, name: "Florae Ancient", desc: "A towering nature guardian with a canopy of luminescent flowers." },
        ],
    },
    chronox: {
        domain: "math",
        evolutions: [
            { stage: 1, name: "Chronox", desc: "A clockwork beetle with slowly ticking gears." },
            { stage: 2, name: "Chronox Tick", desc: "A brass beetle whose gears spin faster, warping the air." },
            { stage: 3, name: "Chronox Flux", desc: "A golden beetle surrounded by overlapping clock faces." },
            { stage: 4, name: "Chronox Eternal", desc: "A magnificent beetle that exists in multiple time frames at once." },
        ],
    },
    luminos: {
        domain: "math",
        evolutions: [
            { stage: 1, name: "Luminos", desc: "A glowing firefly with a faint numeric shimmer." },
            { stage: 2, name: "Luminos Ray", desc: "A bright firefly whose light reveals hidden patterns." },
            { stage: 3, name: "Luminos Beacon", desc: "A dazzling firefly that illuminates entire rooms with knowledge." },
            { stage: 4, name: "Luminos Radiance", desc: "A brilliant star-firefly pulsing with pure enlightenment." },
        ],
    },
    gravitas: {
        domain: "science",
        evolutions: [
            { stage: 1, name: "Gravitas", desc: "A floating stone golem the size of a fist." },
            { stage: 2, name: "Gravitas Core", desc: "A dense stone orb orbited by pebbles." },
            { stage: 3, name: "Gravitas Titan", desc: "A hovering boulder with a glowing gravitational field." },
            { stage: 4, name: "Gravitas Singularity", desc: "A miniature planetoid bending light around itself." },
        ],
    },
    ember: {
        domain: "math",
        evolutions: [
            { stage: 1, name: "Ember", desc: "A tiny flame sprite dancing on a candle wick." },
            { stage: 2, name: "Ember Flare", desc: "A spirited flame leaving trails of arithmetic sparks." },
            { stage: 3, name: "Ember Blaze", desc: "A roaring fire spirit wreathed in calculation sigils." },
            { stage: 4, name: "Ember Inferno", desc: "A towering inferno of mathematical fury, equations burning in its core." },
        ],
    },
};

export function createCompanionSystem({ gameStateStore, telemetry, progression }) {

    // Companion XP tracked locally (not in gameState, since it persists
    // across sessions via progression system's companionLevels)
    const companionXp = {};

    function getCompanionLevel(companionId) {
        const profile = progression.getProfile();
        return profile.companionLevels[companionId] || 1;
    }

    function getEvolutionStage(level) {
        // Stages are 1-4 based on level
        return Math.min(level, 4);
    }

    /* ------------------------------------------------------------------ */
    /*  Collection                                                         */
    /* ------------------------------------------------------------------ */

    function tryCollectCompanion(companionId) {
        if (!COMPANION_DATA[companionId]) return { collected: false, reason: "unknown_companion" };

        const profile = progression.getProfile();
        if (profile.companionsCollected.includes(companionId)) {
            return { collected: false, reason: "already_owned" };
        }

        progression.recordCompanionCollected(companionId);
        companionXp[companionId] = 0;

        telemetry.event("companion_collected", {
            companionId,
            name: COMPANION_DATA[companionId].evolutions[0].name,
            domain: COMPANION_DATA[companionId].domain,
        });

        return {
            collected: true,
            companion: getCompanionInfo(companionId),
        };
    }

    /* ------------------------------------------------------------------ */
    /*  Active Companions                                                  */
    /* ------------------------------------------------------------------ */

    function getActiveCompanions() {
        const state = gameStateStore.getState();
        return state.companions.map((c) => ({
            ...c,
            ...getCompanionInfo(c.id),
        }));
    }

    function setActiveCompanions(ids) {
        const state = gameStateStore.getState();
        const profile = progression.getProfile();

        // Only allow owned companions, max 3
        const validIds = ids
            .filter((id) => profile.companionsCollected.includes(id))
            .slice(0, 3);

        // Clear current companions
        while (state.companions.length > 0) {
            gameStateStore.removeCompanion(state.companions[0].id);
        }

        // Add new active set
        for (const id of validIds) {
            gameStateStore.addCompanion(id, getCompanionLevel(id));
        }

        return getActiveCompanions();
    }

    /* ------------------------------------------------------------------ */
    /*  Companion Info                                                     */
    /* ------------------------------------------------------------------ */

    function getCompanionInfo(companionId) {
        const data = COMPANION_DATA[companionId];
        if (!data) return null;

        const level = getCompanionLevel(companionId);
        const stage = getEvolutionStage(level);
        const evolution = data.evolutions[stage - 1] || data.evolutions[0];

        return {
            id: companionId,
            domain: data.domain,
            level,
            stage,
            name: evolution.name,
            description: evolution.desc,
            xp: companionXp[companionId] || 0,
            nextLevelXp: LEVEL_THRESHOLDS[level] ?? null,
        };
    }

    function getAllCompanionInfo() {
        const profile = progression.getProfile();
        return profile.companionsCollected.map((id) => getCompanionInfo(id));
    }

    /* ------------------------------------------------------------------ */
    /*  Companion XP & Leveling                                            */
    /* ------------------------------------------------------------------ */

    function grantCompanionXp(companionId, amount) {
        if (!COMPANION_DATA[companionId]) return null;
        if (!companionXp[companionId]) companionXp[companionId] = 0;

        companionXp[companionId] += amount;
        const currentLevel = getCompanionLevel(companionId);

        // Check for level up
        if (currentLevel < 4 && companionXp[companionId] >= LEVEL_THRESHOLDS[currentLevel]) {
            const newLevel = currentLevel + 1;
            progression.recordCompanionLevelUp(companionId, newLevel);
            gameStateStore.setCompanionLevel(companionId, newLevel);

            const info = getCompanionInfo(companionId);

            telemetry.event("companion_evolved", {
                companionId,
                newLevel,
                newStage: info.stage,
                newName: info.name,
            });

            return {
                leveledUp: true,
                companionId,
                newLevel,
                info,
            };
        }

        return {
            leveledUp: false,
            companionId,
            xp: companionXp[companionId],
            nextLevelXp: LEVEL_THRESHOLDS[currentLevel] ?? null,
        };
    }

    /* ------------------------------------------------------------------ */
    /*  Buffs                                                              */
    /* ------------------------------------------------------------------ */

    function getCompanionBuffs() {
        const state = gameStateStore.getState();
        const buffs = {
            damageMultiplier: 1.0,
            defenseBonus: 0,
            mpRegenBonus: 0,
            healOnCorrectScience: 0,
            healOnCorrectMath: 0,
        };

        for (const comp of state.companions) {
            const level = comp.level || 1;
            const data = COMPANION_DATA[comp.id];
            if (!data) continue;

            switch (comp.id) {
                case "reactia":
                    buffs.healOnCorrectScience += 3 + level * 2;
                    break;
                case "algebrix":
                    buffs.damageMultiplier += 0.05 * level;
                    buffs.healOnCorrectMath += 2 + level;
                    break;
                case "voltaire":
                    buffs.mpRegenBonus += Math.floor(level / 2) + 1;
                    break;
                case "florae":
                    buffs.defenseBonus += level;
                    break;
                case "chronox":
                    buffs.damageMultiplier += 0.03 * level;
                    break;
                case "luminos":
                    buffs.healOnCorrectScience += 1 + level;
                    buffs.healOnCorrectMath += 1 + level;
                    break;
                case "gravitas":
                    buffs.defenseBonus += Math.ceil(level * 1.5);
                    break;
                case "ember":
                    buffs.damageMultiplier += 0.08 * level;
                    break;
                default:
                    break;
            }

            telemetry.event("companion_buff_applied", {
                companionId: comp.id,
                level,
                buffSnapshot: { ...buffs },
            });
        }

        return buffs;
    }

    /* ------------------------------------------------------------------ */
    /*  Public API                                                         */
    /* ------------------------------------------------------------------ */

    return {
        tryCollectCompanion,
        getActiveCompanions,
        setActiveCompanions,
        getCompanionInfo,
        getAllCompanionInfo,
        getCompanionBuffs,
        grantCompanionXp,
        COMPANION_DATA,
        LEVEL_THRESHOLDS,
    };
}
