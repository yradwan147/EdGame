/**
 * gameState.js -- Central RPG state store for Knowledge Quest.
 *
 * Tracks chapter progress, player stats, companions, inventory,
 * combat state, quest log, and world-state flags that persist
 * across dialogue consequences.
 */

import { DEFAULT_SETTINGS } from "../config/constants.js";

function defaultState() {
    return {
        // Chapter / map progress
        chapter: 1,
        currentNodeId: null,
        visitedNodes: [],
        phase: "map", // "map" | "combat" | "dialogue" | "shop" | "rest"

        // Player combat stats
        player: {
            hp: 100,
            maxHp: 100,
            mp: 20,
            maxMp: 20,
            attack: 10,
            defense: 5,
            speed: 10,
        },

        // Active companions (max 3 in battle)
        companions: [],

        // Inventory items: { id, name, type, quantity }
        inventory: [],

        // Mentor hint tokens -- reset each chapter
        mentorTokens: DEFAULT_SETTINGS.mentorTokensPerChapter,

        // Active combat state (null when not in combat)
        combat: null,

        // Quest log
        questLog: [],

        // Persistent world-state flags set by dialogue choices
        worldState: {},

        // Session-wide aggregated stats
        totalDamageDealt: 0,
        totalHealingDone: 0,
        spellsCast: 0,
        defendActions: 0,

        // Timing
        startedAt: Date.now(),
        elapsedMs: 0,

        // Question tracking
        questionsAnswered: 0,
        questionsCorrect: 0,
    };
}

export function createGameStateStore() {
    let state = defaultState();

    function getState() {
        return state;
    }

    function setState(partial) {
        state = { ...state, ...partial };
    }

    /* ------------------------------------------------------------------ */
    /*  Chapter / Map                                                      */
    /* ------------------------------------------------------------------ */

    function startChapter(chapterNumber) {
        state.chapter = chapterNumber;
        state.currentNodeId = null;
        state.visitedNodes = [];
        state.phase = "map";
        state.mentorTokens = DEFAULT_SETTINGS.mentorTokensPerChapter;

        // Restore player HP/MP to full at chapter start
        state.player.hp = state.player.maxHp;
        state.player.mp = state.player.maxMp;
    }

    function visitNode(nodeId) {
        state.currentNodeId = nodeId;
        if (!state.visitedNodes.includes(nodeId)) {
            state.visitedNodes.push(nodeId);
        }
    }

    function setPhase(phase) {
        state.phase = phase;
    }

    /* ------------------------------------------------------------------ */
    /*  Combat                                                             */
    /* ------------------------------------------------------------------ */

    function startCombat(enemies) {
        const combatEnemies = enemies.map((e, i) => ({
            ...e,
            index: i,
            hp: e.hp,
            maxHp: e.hp,
            statusEffects: [],
        }));

        // Build turn order based on speed
        const participants = [
            { type: "player", speed: state.player.speed },
            ...combatEnemies.map((e) => ({ type: "enemy", index: e.index, speed: e.speed || 5 })),
        ];
        participants.sort((a, b) => b.speed - a.speed);

        state.combat = {
            enemies: combatEnemies,
            turnOrder: participants,
            currentTurn: 0,
            turnNumber: 1,
        };
        state.phase = "combat";
    }

    function endCombat() {
        state.combat = null;
        state.phase = "map";
    }

    /* ------------------------------------------------------------------ */
    /*  Companions                                                         */
    /* ------------------------------------------------------------------ */

    function addCompanion(companionId, level = 1) {
        if (state.companions.length >= 3) return false;
        if (state.companions.some((c) => c.id === companionId)) return false;
        state.companions.push({ id: companionId, level });
        return true;
    }

    function removeCompanion(companionId) {
        state.companions = state.companions.filter((c) => c.id !== companionId);
    }

    function setCompanionLevel(companionId, newLevel) {
        const comp = state.companions.find((c) => c.id === companionId);
        if (comp) comp.level = newLevel;
    }

    /* ------------------------------------------------------------------ */
    /*  Inventory                                                          */
    /* ------------------------------------------------------------------ */

    function addItem(item) {
        const existing = state.inventory.find((i) => i.id === item.id);
        if (existing) {
            existing.quantity += item.quantity || 1;
        } else {
            state.inventory.push({
                id: item.id,
                name: item.name,
                type: item.type,
                quantity: item.quantity || 1,
            });
        }
    }

    function useItem(itemId) {
        const item = state.inventory.find((i) => i.id === itemId);
        if (!item || item.quantity <= 0) return null;
        item.quantity -= 1;
        if (item.quantity <= 0) {
            state.inventory = state.inventory.filter((i) => i.id !== itemId);
        }
        return item;
    }

    /* ------------------------------------------------------------------ */
    /*  World State & Quest Log                                            */
    /* ------------------------------------------------------------------ */

    function setWorldState(key, value) {
        state.worldState[key] = value;
    }

    function getWorldState(key) {
        return state.worldState[key] ?? null;
    }

    function addQuest(quest) {
        if (!state.questLog.some((q) => q.id === quest.id)) {
            state.questLog.push({
                id: quest.id,
                description: quest.description,
                completed: false,
            });
        }
    }

    function completeQuest(questId) {
        const quest = state.questLog.find((q) => q.id === questId);
        if (quest) quest.completed = true;
    }

    /* ------------------------------------------------------------------ */
    /*  Mentor Tokens                                                      */
    /* ------------------------------------------------------------------ */

    function useMentorToken() {
        if (state.mentorTokens <= 0) return false;
        state.mentorTokens -= 1;
        return true;
    }

    /* ------------------------------------------------------------------ */
    /*  Player Stat Helpers                                                */
    /* ------------------------------------------------------------------ */

    function damagePlayer(amount) {
        const actual = Math.max(1, amount);
        state.player.hp = Math.max(0, state.player.hp - actual);
        return actual;
    }

    function healPlayer(amount) {
        const before = state.player.hp;
        state.player.hp = Math.min(state.player.maxHp, state.player.hp + amount);
        const healed = state.player.hp - before;
        state.totalHealingDone += healed;
        return healed;
    }

    function spendMp(amount) {
        if (state.player.mp < amount) return false;
        state.player.mp -= amount;
        return true;
    }

    function regenMp(amount) {
        state.player.mp = Math.min(state.player.maxMp, state.player.mp + amount);
    }

    function recordDamageDealt(amount) {
        state.totalDamageDealt += amount;
    }

    function recordSpellCast() {
        state.spellsCast += 1;
    }

    function recordDefendAction() {
        state.defendActions += 1;
    }

    function recordQuestionResult(correct) {
        state.questionsAnswered += 1;
        if (correct) state.questionsCorrect += 1;
    }

    function updateElapsed() {
        state.elapsedMs = Date.now() - state.startedAt;
    }

    /* ------------------------------------------------------------------ */
    /*  Reset                                                              */
    /* ------------------------------------------------------------------ */

    function reset() {
        state = defaultState();
    }

    /* ------------------------------------------------------------------ */
    /*  Public API                                                         */
    /* ------------------------------------------------------------------ */

    return {
        getState,
        setState,

        // Chapter / map
        startChapter,
        visitNode,
        setPhase,

        // Combat
        startCombat,
        endCombat,

        // Companions
        addCompanion,
        removeCompanion,
        setCompanionLevel,

        // Inventory
        addItem,
        useItem,

        // World state & quests
        setWorldState,
        getWorldState,
        addQuest,
        completeQuest,

        // Mentor tokens
        useMentorToken,

        // Player stat helpers
        damagePlayer,
        healPlayer,
        spendMp,
        regenMp,
        recordDamageDealt,
        recordSpellCast,
        recordDefendAction,
        recordQuestionResult,
        updateElapsed,

        // Reset
        reset,
    };
}
