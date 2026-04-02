/**
 * combatSystem.js -- Turn-based combat engine for Knowledge Quest.
 *
 * Core loop:
 *   1. Player selects action (castSpell, defend, useItem, askMentor)
 *   2. For spells: answer a question, then execute a timing minigame
 *   3. Enemies take their turns
 *   4. Regenerate MP, check for defeated enemies / player death
 *
 * The system is headless -- it returns data that scenes render.
 * The questionOverlay callback handles showing the question UI and
 * returning { correct, responseTimeMs }.
 */

import { getSpellById } from "../config/spells.js";
import { DEFAULT_SETTINGS } from "../config/constants.js";

const TIMING_MULTIPLIERS = {
    PERFECT: 2.0,
    GOOD: 1.5,
    OK: 1.0,
    MISS: 0.7,
};

export function createCombatSystem({
    k,
    questionEngine,
    questionOverlay,
    telemetry,
    progression,
    gameStateStore,
}) {
    let defending = false;
    let seenQuestionIds = new Set();
    let currentQuestion = null;

    /* ------------------------------------------------------------------ */
    /*  Helpers                                                             */
    /* ------------------------------------------------------------------ */

    function getTimingMultiplier(quality) {
        return TIMING_MULTIPLIERS[quality] ?? TIMING_MULTIPLIERS.OK;
    }

    function computeCompanionBuffs() {
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
            switch (comp.id) {
                case "reactia":
                    // Heals player on correct science answers
                    buffs.healOnCorrectScience += 3 + level * 2;
                    break;
                case "algebrix":
                    // Boosts damage on math spells
                    buffs.damageMultiplier += 0.05 * level;
                    buffs.healOnCorrectMath += 2 + level;
                    break;
                case "voltaire":
                    // MP regen bonus
                    buffs.mpRegenBonus += Math.floor(level / 2) + 1;
                    break;
                case "florae":
                    // Defense bonus
                    buffs.defenseBonus += level;
                    break;
                case "chronox":
                    // Slight damage bonus (time-based)
                    buffs.damageMultiplier += 0.03 * level;
                    break;
                case "luminos":
                    // Heal on any correct answer
                    buffs.healOnCorrectScience += 1 + level;
                    buffs.healOnCorrectMath += 1 + level;
                    break;
                case "gravitas":
                    // Higher defense
                    buffs.defenseBonus += Math.ceil(level * 1.5);
                    break;
                case "ember":
                    // Pure damage boost
                    buffs.damageMultiplier += 0.08 * level;
                    break;
                default:
                    break;
            }
        }

        return buffs;
    }

    /* ------------------------------------------------------------------ */
    /*  Combat Lifecycle                                                    */
    /* ------------------------------------------------------------------ */

    function startCombat(enemies) {
        defending = false;
        seenQuestionIds = new Set();
        currentQuestion = null;
        gameStateStore.startCombat(enemies);

        telemetry.event("combat_started", {
            chapter: gameStateStore.getState().chapter,
            enemies: enemies.map((e) => ({ id: e.id, name: e.name, hp: e.hp })),
        });
    }

    function getPlayerActions() {
        const state = gameStateStore.getState();
        const actions = ["castSpell", "defend"];

        if (state.inventory.some((i) => i.quantity > 0)) {
            actions.push("useItem");
        }
        if (state.mentorTokens > 0 && currentQuestion) {
            actions.push("askMentor");
        }

        return actions;
    }

    /* ------------------------------------------------------------------ */
    /*  Player Actions                                                     */
    /* ------------------------------------------------------------------ */

    /**
     * Cast a spell at targetIndex.
     * Returns { success, damage, timingQuality, correct, responseTimeMs, fizzled }
     */
    async function castSpell(spellId, targetIndex) {
        const state = gameStateStore.getState();
        const spell = getSpellById(spellId);
        if (!spell) return { success: false, reason: "unknown_spell" };

        // Check MP
        if (state.player.mp < spell.mpCost) {
            return { success: false, reason: "not_enough_mp" };
        }

        // Determine question subject and difficulty
        const baseDifficulty = Math.ceil(
            (state.questionsAnswered > 0
                ? state.questionsCorrect / state.questionsAnswered
                : 0.5) * 5,
        );
        const requestedDifficulty = Math.max(1, Math.min(5, baseDifficulty + spell.difficultyBias));
        const subjectId = spell.subject === "mixed"
            ? (Math.random() < 0.5 ? "math" : "science")
            : spell.subject;

        // Get question from engine
        const question = await questionEngine.getQuestion({
            playerId: "player",
            subjectId,
            requestedDifficulty,
            seenQuestionIds,
        });
        currentQuestion = question;
        seenQuestionIds.add(question.id);

        telemetry.event("spell_choice", {
            spellId,
            subject: subjectId,
            difficulty: question.targetDifficulty,
            targetIndex,
        });

        // Show question overlay -- returns { correct, responseTimeMs }
        const answer = await questionOverlay(question);

        // Record in engines
        questionEngine.recordResult({ playerId: "player", correct: answer.correct });
        gameStateStore.recordQuestionResult(answer.correct);
        const xpResult = progression.grantQuestionXp({
            difficulty: question.targetDifficulty,
            responseTimeMs: answer.responseTimeMs,
            correct: answer.correct,
        });

        telemetry.event("question_answered", {
            questionId: question.id,
            subject: subjectId,
            difficulty: question.targetDifficulty,
            correct: answer.correct,
            responseTimeMs: answer.responseTimeMs,
            xpGained: xpResult.xpGained,
        });

        // Spell fizzles on wrong answer
        if (!answer.correct) {
            gameStateStore.spendMp(spell.mpCost);
            gameStateStore.recordSpellCast();
            currentQuestion = null;
            return {
                success: true,
                fizzled: true,
                correct: false,
                damage: 0,
                responseTimeMs: answer.responseTimeMs,
            };
        }

        // Apply companion heal-on-correct buffs
        const buffs = computeCompanionBuffs();
        if (subjectId === "science" && buffs.healOnCorrectScience > 0) {
            gameStateStore.healPlayer(buffs.healOnCorrectScience);
            telemetry.event("companion_buff_applied", {
                buff: "healOnCorrectScience",
                amount: buffs.healOnCorrectScience,
            });
        }
        if (subjectId === "math" && buffs.healOnCorrectMath > 0) {
            gameStateStore.healPlayer(buffs.healOnCorrectMath);
            telemetry.event("companion_buff_applied", {
                buff: "healOnCorrectMath",
                amount: buffs.healOnCorrectMath,
            });
        }

        // Timing minigame result will be provided by scene -- for now
        // the caller should invoke getTimingMultiplier() with the quality
        // returned from the timing UI and pass it here.
        // We return a function that finishes the spell once timing is known.
        gameStateStore.spendMp(spell.mpCost);
        gameStateStore.recordSpellCast();
        currentQuestion = null;

        return {
            success: true,
            fizzled: false,
            correct: true,
            responseTimeMs: answer.responseTimeMs,
            xpResult,
            spell,
            targetIndex,
            buffs,
            // Call finishCast(timingQuality) after the timing minigame
            finishCast(timingQuality) {
                const timingMult = getTimingMultiplier(timingQuality);

                telemetry.event("timing_cast", {
                    spellId,
                    timingQuality,
                    timingMultiplier: timingMult,
                });

                const freshState = gameStateStore.getState();

                // Heal spell
                if (spell.healAmount && spell.targetType === "ally") {
                    const healAmt = Math.floor(spell.healAmount * timingMult);
                    gameStateStore.healPlayer(healAmt);
                    return { type: "heal", amount: healAmt, timingQuality, timingMult };
                }

                // Damage spell
                const baseDmg = spell.baseDamage * timingMult * buffs.damageMultiplier;
                const damage = Math.floor(baseDmg);

                if (spell.targetType === "all_enemies" && freshState.combat) {
                    // AoE damage
                    const results = [];
                    for (const enemy of freshState.combat.enemies) {
                        if (enemy.hp > 0) {
                            const actual = Math.max(1, damage);
                            enemy.hp -= actual;
                            gameStateStore.recordDamageDealt(actual);
                            results.push({ enemyIndex: enemy.index, damage: actual, remainingHp: enemy.hp });
                        }
                    }
                    // Apply status effect to all
                    if (spell.statusEffect && freshState.combat) {
                        for (const enemy of freshState.combat.enemies) {
                            if (enemy.hp > 0) {
                                enemy.statusEffects.push({ ...spell.statusEffect, turnsLeft: spell.statusEffect.turns });
                            }
                        }
                    }
                    return { type: "aoe_damage", results, timingQuality, timingMult };
                }

                // Single-target damage
                if (freshState.combat && freshState.combat.enemies[targetIndex]) {
                    const enemy = freshState.combat.enemies[targetIndex];
                    if (enemy.hp > 0) {
                        const actual = Math.max(1, damage);
                        enemy.hp -= actual;
                        gameStateStore.recordDamageDealt(actual);

                        // Apply status effect
                        if (spell.statusEffect) {
                            enemy.statusEffects.push({ ...spell.statusEffect, turnsLeft: spell.statusEffect.turns });
                        }

                        return {
                            type: "damage",
                            damage: actual,
                            remainingHp: enemy.hp,
                            timingQuality,
                            timingMult,
                            statusEffect: spell.statusEffect || null,
                        };
                    }
                }

                return { type: "miss", timingQuality, timingMult };
            },
        };
    }

    function defend() {
        defending = true;
        gameStateStore.recordDefendAction();

        telemetry.event("defend_action", {
            chapter: gameStateStore.getState().chapter,
            turnNumber: gameStateStore.getState().combat?.turnNumber || 0,
        });

        return { success: true, defending: true };
    }

    function useItem(itemId) {
        const item = gameStateStore.useItem(itemId);
        if (!item) return { success: false, reason: "no_item" };

        let effect = null;
        switch (item.type) {
            case "heal_potion":
                effect = { type: "heal", amount: gameStateStore.healPlayer(30) };
                break;
            case "mana_potion":
                gameStateStore.regenMp(10);
                effect = { type: "mana", amount: 10 };
                break;
            case "attack_scroll":
                // Temporary attack buff handled by scene
                effect = { type: "attack_buff", amount: 5, turns: 3 };
                break;
            case "defense_scroll":
                effect = { type: "defense_buff", amount: 5, turns: 3 };
                break;
            default:
                effect = { type: "unknown", itemType: item.type };
                break;
        }

        telemetry.event("item_used", { itemId, itemType: item.type, effect });
        return { success: true, item, effect };
    }

    function askMentor() {
        // Handled by mentorSystem -- this just signals intent
        return { success: true, action: "askMentor" };
    }

    /* ------------------------------------------------------------------ */
    /*  Player Action Dispatch                                             */
    /* ------------------------------------------------------------------ */

    async function executePlayerAction(action) {
        switch (action.type) {
            case "castSpell":
                return castSpell(action.spellId, action.targetIndex);
            case "defend":
                return defend();
            case "useItem":
                return useItem(action.itemId);
            case "askMentor":
                return askMentor();
            default:
                return { success: false, reason: "unknown_action" };
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Enemy Turns                                                        */
    /* ------------------------------------------------------------------ */

    function executeEnemyTurns() {
        const state = gameStateStore.getState();
        if (!state.combat) return [];

        const results = [];
        const playerDef = state.player.defense + computeCompanionBuffs().defenseBonus;

        for (const enemy of state.combat.enemies) {
            if (enemy.hp <= 0) continue;

            // Process status effects
            const stunned = enemy.statusEffects.some((s) => s.type === "stun" && s.turnsLeft > 0);
            const slowed = enemy.statusEffects.some((s) => s.type === "slow" && s.turnsLeft > 0);

            // Tick down status effects
            enemy.statusEffects = enemy.statusEffects
                .map((s) => ({ ...s, turnsLeft: s.turnsLeft - 1 }))
                .filter((s) => s.turnsLeft > 0);

            if (stunned) {
                results.push({ enemyIndex: enemy.index, enemyName: enemy.name, action: "stunned", damage: 0 });
                continue;
            }

            // Special enemy behaviors
            let enemyAction = "attack";
            let rawDamage = enemy.atk || enemy.ATK || 8;

            if (enemy.behavior === "crawler") {
                // Crawlers deal slightly less damage but shuffle spell order
                rawDamage = Math.floor(rawDamage * 0.8);
                enemyAction = "attack_shuffle";
            } else if (enemy.behavior === "shade") {
                // Shades reduce the question timer next turn
                enemyAction = "attack_reduce_timer";
            } else if (enemy.behavior === "giant") {
                // Giants may sleep on a turn (33% chance)
                if (Math.random() < 0.33) {
                    results.push({ enemyIndex: enemy.index, enemyName: enemy.name, action: "sleeping", damage: 0 });
                    continue;
                }
            }

            if (slowed) {
                rawDamage = Math.floor(rawDamage * 0.5);
            }

            const damage = Math.max(1, rawDamage - playerDef);
            const actualDamage = defending ? Math.max(1, Math.floor(damage / 2)) : damage;

            gameStateStore.damagePlayer(actualDamage);

            results.push({
                enemyIndex: enemy.index,
                enemyName: enemy.name,
                action: enemyAction,
                damage: actualDamage,
                wasDefending: defending,
                playerHpRemaining: gameStateStore.getState().player.hp,
            });
        }

        // Reset defending flag after all enemies act
        defending = false;

        // MP regeneration at end of turn
        const mpRegen = DEFAULT_SETTINGS.mpRegenPerTurn + computeCompanionBuffs().mpRegenBonus;
        gameStateStore.regenMp(mpRegen);

        // Advance turn counter
        if (state.combat) {
            state.combat.turnNumber += 1;
        }

        return results;
    }

    /* ------------------------------------------------------------------ */
    /*  Combat End Checks                                                  */
    /* ------------------------------------------------------------------ */

    function checkCombatEnd() {
        const state = gameStateStore.getState();
        if (!state.combat) return { ended: false };

        // Check player death
        if (state.player.hp <= 0) {
            telemetry.event("combat_ended", {
                result: "defeat",
                chapter: state.chapter,
                turnNumber: state.combat.turnNumber,
            });
            return { ended: true, result: "defeat" };
        }

        // Check all enemies defeated
        const aliveEnemies = state.combat.enemies.filter((e) => e.hp > 0);
        if (aliveEnemies.length === 0) {
            // Record defeated enemies
            const defeated = state.combat.enemies.length;
            for (let i = 0; i < defeated; i++) {
                progression.recordEnemyDefeated();
            }

            telemetry.event("combat_ended", {
                result: "victory",
                chapter: state.chapter,
                turnNumber: state.combat.turnNumber,
                enemiesDefeated: defeated,
            });

            return {
                ended: true,
                result: "victory",
                enemiesDefeated: defeated,
                turnsTaken: state.combat.turnNumber,
            };
        }

        return { ended: false, aliveEnemies: aliveEnemies.length };
    }

    /**
     * Spare an enemy instead of defeating it -- remove from combat,
     * record prosocial choice.
     */
    function spareEnemy(enemyIndex) {
        const state = gameStateStore.getState();
        if (!state.combat) return false;
        const enemy = state.combat.enemies[enemyIndex];
        if (!enemy || enemy.hp <= 0) return false;

        enemy.hp = 0; // Remove from combat
        progression.recordEnemySpared();

        telemetry.event("enemy_spared", {
            enemyId: enemy.id,
            enemyName: enemy.name,
            chapter: state.chapter,
        });

        return true;
    }

    /* ------------------------------------------------------------------ */
    /*  Public API                                                         */
    /* ------------------------------------------------------------------ */

    return {
        startCombat,
        getPlayerActions,
        executePlayerAction,
        castSpell,
        defend,
        useItem,
        askMentor,
        executeEnemyTurns,
        checkCombatEnd,
        spareEnemy,
        getTimingMultiplier,
        TIMING_MULTIPLIERS,
    };
}
