import { GAME_CONFIG } from "../config/constants.js";

export function createGameStateStore() {
    let state = defaultState();

    function defaultState() {
        return {
            phase: "prep",          // "prep" | "combat" | "waveResults" | "paused" | "ended"
            gold: GAME_CONFIG.startingGold,
            lives: GAME_CONFIG.startingLives,
            wave: 0,                // current wave (0 = not started)
            score: 0,
            towers: [],             // { id, type, level, branch, tileCol, tileRow, kills }
            enemies: [],            // managed externally by waveManager
            enemiesKilled: 0,
            enemiesLeaked: 0,
            questionsAnswered: 0,
            questionsCorrect: 0,
            studyQuestionsThisPrep: 0,
            activeSynergies: [],    // [{ synergyId, towerIds }]
            discoveredSynergies: [],
            startedAt: null,
            elapsedMs: 0,
            events: [],             // { ts, msg } for combat log
            towerIdCounter: 0,
            earlyCallsUsed: 0,
            totalGoldEarned: 0,
            totalGoldSpent: 0,
        };
    }

    return {
        getState() { return state; },

        startGame() {
            state = defaultState();
            state.startedAt = Date.now();
        },

        setPhase(phase) {
            state.phase = phase;
        },

        nextWave() {
            state.wave += 1;
            state.studyQuestionsThisPrep = 0;
            state.phase = "combat";
        },

        startPrep() {
            state.phase = "prep";
            state.studyQuestionsThisPrep = 0;
        },

        addGold(amount) {
            state.gold += amount;
            state.totalGoldEarned += amount;
        },

        spendGold(amount) {
            if (state.gold < amount) return false;
            state.gold -= amount;
            state.totalGoldSpent += amount;
            return true;
        },

        loseLives(count) {
            state.lives = Math.max(0, state.lives - count);
            return state.lives <= 0;
        },

        addScore(points) {
            state.score += points;
        },

        nextTowerId() {
            state.towerIdCounter += 1;
            return `tower_${state.towerIdCounter}`;
        },

        addTower(tower) {
            state.towers.push(tower);
        },

        removeTower(towerId) {
            state.towers = state.towers.filter((t) => t.id !== towerId);
        },

        upgradeTower(towerId, newLevel, branch) {
            const t = state.towers.find((t) => t.id === towerId);
            if (t) {
                t.level = newLevel;
                if (branch) t.branch = branch;
            }
        },

        recordKill(towerType) {
            state.enemiesKilled += 1;
            const t = state.towers.find((tw) => tw.type === towerType);
            if (t) t.kills = (t.kills || 0) + 1;
        },

        recordLeak() {
            state.enemiesLeaked += 1;
        },

        recordQuestion(correct) {
            state.questionsAnswered += 1;
            if (correct) state.questionsCorrect += 1;
        },

        recordStudyQuestion() {
            state.studyQuestionsThisPrep += 1;
        },

        recordEarlyCall() {
            state.earlyCallsUsed += 1;
        },

        setSynergies(synergies) {
            state.activeSynergies = synergies;
        },

        discoverSynergy(synergyId) {
            if (!state.discoveredSynergies.includes(synergyId)) {
                state.discoveredSynergies.push(synergyId);
            }
        },

        applyInterest() {
            const interest = Math.floor(state.gold * GAME_CONFIG.interestRate);
            if (interest > 0) {
                state.gold += interest;
                state.totalGoldEarned += interest;
            }
            return interest;
        },

        updateElapsed() {
            if (state.startedAt && state.phase !== "paused" && state.phase !== "ended") {
                state.elapsedMs = Date.now() - state.startedAt;
            }
        },

        pushEvent(msg) {
            state.events.push({ ts: Date.now(), msg });
            if (state.events.length > 20) state.events.shift();
        },

        endGame(won) {
            state.phase = "ended";
            return {
                won,
                wave: state.wave,
                score: state.score,
                gold: state.gold,
                lives: state.lives,
                enemiesKilled: state.enemiesKilled,
                enemiesLeaked: state.enemiesLeaked,
                questionsAnswered: state.questionsAnswered,
                questionsCorrect: state.questionsCorrect,
                towersBuilt: state.towers.length,
                synergiesDiscovered: state.discoveredSynergies.length,
                earlyCallsUsed: state.earlyCallsUsed,
                durationMs: state.elapsedMs,
            };
        },
    };
}
