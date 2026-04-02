/**
 * towerSystem.js — Tower placement, upgrade, and study-question logic.
 *
 * Provides decision logic that the scene calls. Question UI is delegated
 * to the questionOverlay component; this module orchestrates the flow:
 *   1. Validate placement / upgrade eligibility
 *   2. Ask a question via questionEngine + questionOverlay
 *   3. Apply outcome (gold, tower state, telemetry)
 *
 * Does NOT create KAPLAY game objects — returns data for the scene to render.
 */

import { TOWER_TYPES } from "../config/towers.js";
import { GAME_CONFIG } from "../config/constants.js";

export function createTowerSystem({
    k,
    gameStateStore,
    telemetry,
    progression,
    questionEngine,
    questionOverlay,
}) {
    const playerId = "player"; // single-player; used by questionEngine
    const seenQuestions = questionEngine.createSeenSet();

    // Track tower distribution per wave for strategy-shift detection
    const placementHistory = []; // { wave, towerType }

    /* ------------------------------------------------------------------ */
    /*  Helpers                                                            */
    /* ------------------------------------------------------------------ */

    /** Ask a question and return { correct, responseTimeMs, questionId } via Promise. */
    function askQuestion(subjectId, requestedDifficulty, context) {
        return new Promise(async (resolve) => {
            const question = await questionEngine.getQuestion({
                playerId,
                subjectId,
                requestedDifficulty,
                seenQuestionIds: seenQuestions,
            });
            seenQuestions.add(question.id);

            questionOverlay.show(question, (result) => {
                const correct = result.selectedIndex === question.correctIndex;
                const responseTimeMs = result.responseTimeMs;

                // Record in engine + progression
                questionEngine.recordResult({ playerId, correct });
                gameStateStore.recordQuestion(correct);
                progression.grantQuestionXp({
                    difficulty: question.difficulty,
                    responseTimeMs,
                    correct,
                });

                // Telemetry
                telemetry.event("question_answered", {
                    questionId: question.id,
                    subject: subjectId,
                    difficulty: question.difficulty,
                    correct,
                    responseTimeMs,
                    context,
                });

                resolve({ correct, responseTimeMs, questionId: question.id });
            });
        });
    }

    /** Compute effective cost after optional speed bonus. */
    function effectiveCost(baseCost, responseTimeMs) {
        if (responseTimeMs < GAME_CONFIG.speedBonusThresholdMs) {
            return Math.floor(baseCost * (1 - GAME_CONFIG.speedBonusDiscount));
        }
        return baseCost;
    }

    /* ------------------------------------------------------------------ */
    /*  Placement                                                          */
    /* ------------------------------------------------------------------ */

    function canBuildAt(col, row, mapGrid) {
        // Must be a buildable tile
        if (!mapGrid[row] || mapGrid[row][col] !== "B") return false;
        // Must not already have a tower there
        const towers = gameStateStore.getState().towers;
        return !towers.some((t) => t.tileCol === col && t.tileRow === row);
    }

    /**
     * Initiates tower build flow.
     * Returns a Promise that resolves to the tower data object or null.
     */
    async function buildTower(towerType, col, row) {
        const towerDef = TOWER_TYPES[towerType];
        if (!towerDef) return null;

        const state = gameStateStore.getState();
        if (state.gold < towerDef.cost) return null;

        // Ask a question in the tower's subject
        const { correct, responseTimeMs } = await askQuestion(
            towerDef.subject,
            null, // adaptive difficulty
            "tower_build",
        );

        if (correct) {
            const cost = effectiveCost(towerDef.cost, responseTimeMs);
            if (!gameStateStore.spendGold(cost)) return null; // safety check

            const towerId = gameStateStore.nextTowerId();
            const tower = {
                id: towerId,
                type: towerType,
                level: 0,
                branch: null,
                tileCol: col,
                tileRow: row,
                kills: 0,
            };
            gameStateStore.addTower(tower);

            // Track placement for strategy analysis
            placementHistory.push({ wave: state.wave, towerType });

            telemetry.event("tower_placed", {
                towerType,
                tileCol: col,
                tileRow: row,
                goldSpent: cost,
                questionCorrect: true,
                responseTimeMs,
            });

            return tower;
        }

        // Wrong answer — refund half
        const refund = Math.floor(towerDef.cost * GAME_CONFIG.wrongAnswerRefundRate);
        // No gold was deducted yet, so nothing to refund from state,
        // but we penalise with a "lost opportunity" log entry
        telemetry.event("tower_placed", {
            towerType,
            tileCol: col,
            tileRow: row,
            goldSpent: 0,
            questionCorrect: false,
            responseTimeMs,
        });

        return null;
    }

    /* ------------------------------------------------------------------ */
    /*  Upgrade                                                            */
    /* ------------------------------------------------------------------ */

    async function upgradeTower(towerId) {
        const state = gameStateStore.getState();
        const tower = state.towers.find((t) => t.id === towerId);
        if (!tower) return null;

        const towerDef = TOWER_TYPES[tower.type];
        if (!towerDef) return null;

        const nextLevel = tower.level + 1;
        if (nextLevel >= towerDef.upgrades.length) return null; // max level

        const upgrade = towerDef.upgrades[nextLevel];
        // Branching level has { a, b } instead of a flat object
        const upgradeCost = upgrade.a ? upgrade.a.cost : upgrade.cost;

        if (state.gold < upgradeCost) return null;

        // Question at +1 difficulty relative to adaptive
        const { correct, responseTimeMs } = await askQuestion(
            towerDef.subject,
            null, // engine handles adaptive; scene can override
            "tower_upgrade",
        );

        if (correct) {
            const cost = effectiveCost(upgradeCost, responseTimeMs);
            if (!gameStateStore.spendGold(cost)) return null;

            const oldLevel = tower.level;
            gameStateStore.upgradeTower(towerId, nextLevel);

            telemetry.event("tower_upgraded", {
                towerType: tower.type,
                towerId,
                oldLevel,
                newLevel: nextLevel,
                goldSpent: cost,
            });

            return { towerId, oldLevel, newLevel: nextLevel };
        }

        telemetry.event("tower_upgraded", {
            towerType: tower.type,
            towerId,
            oldLevel: tower.level,
            newLevel: tower.level,
            goldSpent: 0,
        });

        return null;
    }

    /* ------------------------------------------------------------------ */
    /*  Risky Upgrade                                                      */
    /* ------------------------------------------------------------------ */

    async function riskyUpgrade(towerId) {
        const state = gameStateStore.getState();
        const tower = state.towers.find((t) => t.id === towerId);
        if (!tower) return null;

        const towerDef = TOWER_TYPES[tower.type];
        if (!towerDef) return null;

        const nextLevel = tower.level + 1;
        if (nextLevel >= towerDef.upgrades.length) return null;

        // +2 difficulty jump
        const playerMetrics = questionEngine.getPlayerMetrics(playerId);
        const riskyDifficulty = Math.min(5, Math.round(playerMetrics.skillRating) + 2);

        const { correct, responseTimeMs } = await askQuestion(
            towerDef.subject,
            riskyDifficulty,
            "risky_upgrade",
        );

        if (correct) {
            // Free upgrade — no gold cost!
            const oldLevel = tower.level;
            gameStateStore.upgradeTower(towerId, nextLevel);

            telemetry.event("risky_upgrade_attempted", {
                towerType: tower.type,
                success: true,
                difficultyJump: 2,
            });
            telemetry.event("tower_upgraded", {
                towerType: tower.type,
                towerId,
                oldLevel,
                newLevel: nextLevel,
                goldSpent: 0,
            });

            return { towerId, oldLevel, newLevel: nextLevel, free: true };
        }

        // Wrong — lose 1 level (cannot go below 0)
        const oldLevel = tower.level;
        const demotedLevel = Math.max(0, tower.level - 1);
        gameStateStore.upgradeTower(towerId, demotedLevel);

        telemetry.event("risky_upgrade_attempted", {
            towerType: tower.type,
            success: false,
            difficultyJump: 2,
        });

        return { towerId, oldLevel, newLevel: demotedLevel, demoted: true };
    }

    /* ------------------------------------------------------------------ */
    /*  Study Question (Prep Phase)                                        */
    /* ------------------------------------------------------------------ */

    async function studyQuestion(subjectId) {
        const state = gameStateStore.getState();
        if (state.studyQuestionsThisPrep >= GAME_CONFIG.maxStudyPerPrep) {
            return { allowed: false };
        }

        gameStateStore.recordStudyQuestion();

        const { correct, responseTimeMs } = await askQuestion(
            subjectId,
            null,
            "study",
        );

        if (correct) {
            gameStateStore.addGold(GAME_CONFIG.studyBonusGold);
            return { allowed: true, correct: true, goldEarned: GAME_CONFIG.studyBonusGold };
        }

        return { allowed: true, correct: false, goldEarned: 0 };
    }

    /* ------------------------------------------------------------------ */
    /*  Queries                                                            */
    /* ------------------------------------------------------------------ */

    function getPlacementHistory() {
        return [...placementHistory];
    }

    /* ------------------------------------------------------------------ */

    return {
        canBuildAt,
        buildTower,
        upgradeTower,
        riskyUpgrade,
        studyQuestion,
        getPlacementHistory,
    };
}
