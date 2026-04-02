import { COLORS, DEFAULT_SETTINGS, PHASE_IDS } from "../config/constants.js";
import { ROLE_CONFIG } from "../config/roles.js";
import { DESERT_ISLAND_PUZZLES } from "../data/scenarios/desert_island.js";
import { SPACE_STATION_PUZZLES } from "../data/scenarios/space_station.js";
import { UNDERWATER_BASE_PUZZLES } from "../data/scenarios/underwater_base.js";
import { createHudRenderer } from "../components/hudRenderer.js";
import { createChatPanel } from "../components/chatPanel.js";
import { createRoleCard } from "../components/roleCard.js";
import { createPuzzleBoard } from "../components/puzzleBoard.js";
import { createActionEffects } from "../components/actionEffects.js";
import { createPuzzleEngine } from "../systems/puzzleEngine.js";
import { createAIPartnerSystem } from "../systems/aiPartnerSystem.js";
import { createCommunicationSystem } from "../systems/communicationSystem.js";

const ALL_PUZZLES = {
    desert_island: DESERT_ISLAND_PUZZLES,
    space_station: SPACE_STATION_PUZZLES,
    underwater_base: UNDERWATER_BASE_PUZZLES,
};

export function registerPuzzleRoomScene({ k, gameStateStore, telemetry, progression }) {
    k.scene("puzzleRoom", () => {
        const state = gameStateStore.getState();
        const scenario = state.scenarioData;
        const dayData = scenario.days[state.currentDay - 1];
        const puzzleId = state.currentPuzzleId || dayData.puzzleId;

        // Load puzzle data
        const scenarioPuzzles = ALL_PUZZLES[state.scenarioId] || {};
        const puzzleData = scenarioPuzzles[puzzleId];

        if (!puzzleData) {
            k.add([k.rect(k.width(), k.height()), k.color(...COLORS.bgDark)]);
            k.add([
                k.text(`Puzzle "${puzzleId}" not found. Press ENTER to continue.`, { size: 20 }),
                k.pos(k.width() / 2, k.height() / 2),
                k.anchor("center"),
                k.color(...COLORS.dangerOrange),
            ]);
            k.onKeyPress("enter", () => handlePuzzleEnd(0.5));
            return;
        }

        // Initialize systems
        const puzzleEngine = createPuzzleEngine();
        const aiSystem = createAIPartnerSystem();
        const commSystem = createCommunicationSystem();
        const effects = createActionEffects(k);

        puzzleEngine.loadPuzzle(puzzleData);

        // Background
        k.add([k.rect(k.width(), k.height()), k.color(...(scenario.bgColor || COLORS.bgDark))]);

        // HUD
        const hud = createHudRenderer(k);
        hud.init({ scenarioName: scenario.name, totalDays: scenario.totalDays });

        // Day timer
        let dayTimerSec = DEFAULT_SETTINGS.dayTimerSec;
        const timerStart = Date.now();

        // Role info card (player's exclusive data)
        const roleCard = createRoleCard(k);
        const playerRoleInfo = puzzleEngine.getRequiredInfo(state.playerRole);
        if (playerRoleInfo) {
            roleCard.show({ roleId: state.playerRole, roleInfo: playerRoleInfo, x: 790, y: 190 });
        }

        // Chat panel
        let chatPanel;
        chatPanel = createChatPanel(k, {
            onSendMessage: (text) => handlePlayerMessage(text),
        });
        chatPanel.init();

        // Puzzle board
        const puzzleBoard = createPuzzleBoard(k);

        // Step tracking
        let currentStepIndex = 0;
        let puzzleActive = true;
        let feedbackShowing = false;

        // Puzzle title in workspace area
        k.add([
            k.text(puzzleData.name, { size: 20 }),
            k.pos(400, 60),
            k.anchor("center"),
            k.fixed(),
            k.z(1100),
            k.color(...COLORS.accentTeal),
        ]);

        // Step indicator
        const stepIndicator = k.add([
            k.text(`Step 1 of ${puzzleData.steps.length}`, { size: 14 }),
            k.pos(400, 82),
            k.anchor("center"),
            k.fixed(),
            k.z(1100),
            k.color(...COLORS.textSecondary),
        ]);

        // --- AI partner greeting ---
        const greetings = aiSystem.generateGreetings(state.aiPartners, state.playerRole);
        for (const g of greetings) {
            setTimeout(() => {
                chatPanel.addMessage(g.name, g.text, g.roleId);
                commSystem.logMessage(g.roleId, g.text, "greeting");
            }, g.delay);
        }

        // Puzzle intro responses (delayed)
        const introResponses = aiSystem.generatePuzzleIntroResponses(puzzleData, state.aiPartners, state.playerRole);
        for (const r of introResponses) {
            setTimeout(() => {
                chatPanel.addMessage(r.name, r.text, r.roleId);
                commSystem.logMessage(r.roleId, r.text, "puzzle_hint");
            }, r.delay + 2000);
        }

        // Brief the player
        chatPanel.addSystemMessage(puzzleData.briefing);

        // Start the first puzzle step
        launchCurrentStep();

        // --- Timer update loop ---
        k.onUpdate(() => {
            if (!puzzleActive) return;
            const elapsed = (Date.now() - timerStart) / 1000;
            dayTimerSec = Math.max(0, DEFAULT_SETTINGS.dayTimerSec - elapsed);

            hud.update({
                day: state.currentDay,
                timerSec: dayTimerSec,
                resources: state.resources,
                teamHealth: state.teamHealth,
            });

            if (dayTimerSec <= 0 && puzzleActive) {
                puzzleActive = false;
                chatPanel.addSystemMessage("TIME IS UP! The team must move on...");
                handlePuzzleEnd(puzzleEngine.getPuzzleScore());
            }
        });

        // --- Functions ---

        function handlePlayerMessage(text) {
            chatPanel.addPlayerMessage(text);
            commSystem.logMessage("player", text, "chat");
            gameStateStore.addMessage({ sender: "player", text, ts: Date.now() });
            gameStateStore.updateMessageStats({ totalSent: 1, onTask: 1 });
            progression.recordMessageSent();

            telemetry.event("player_message", { text: text.slice(0, 100), day: state.currentDay, puzzleId });

            // Track collaboration: player consulted team
            gameStateStore.addCollaborationEvent({ type: "waited_for_partner" });

            // AI partner responses
            const responses = aiSystem.processPlayerMessage(text, {
                puzzleData,
                aiPartners: state.aiPartners,
                playerRole: state.playerRole,
            });

            for (const resp of responses) {
                setTimeout(() => {
                    chatPanel.addMessage(resp.name, resp.text, resp.roleId);
                    commSystem.logMessage(resp.roleId, resp.text, "response");
                    gameStateStore.addMessage({ sender: resp.roleId, text: resp.text, ts: Date.now() });
                }, resp.delay);
            }
        }

        async function launchCurrentStep() {
            const step = puzzleEngine.getCurrentStep();
            if (!step) {
                handlePuzzleEnd(puzzleEngine.getPuzzleScore());
                return;
            }

            stepIndicator.text = `Step ${step.stepNumber} of ${step.totalSteps}`;

            // Show the puzzle board interaction
            try {
                const playerInput = await puzzleBoard.showStep(step);
                if (!puzzleActive) return;

                // Check solution
                const result = puzzleEngine.checkSolution(playerInput);
                gameStateStore.recordPuzzleStepResult(step.id, result.score, result.correct);

                telemetry.event("puzzle_step_complete", {
                    stepId: step.id,
                    correct: result.correct,
                    score: result.score,
                    day: state.currentDay,
                });

                // Show feedback
                showFeedback(result);

                // AI reactions
                const reactions = aiSystem.generateReaction(result.correct, state.aiPartners, state.playerRole);
                for (const r of reactions) {
                    setTimeout(() => {
                        chatPanel.addMessage(r.name, r.text, r.roleId);
                    }, r.delay + 1500);
                }
            } catch (err) {
                // Puzzle board was cleaned up (scene change)
            }
        }

        function showFeedback(result) {
            feedbackShowing = true;
            const cx = 400;
            const cy = 300;

            if (result.correct) {
                effects.puzzleComplete(cx, cy);
            } else {
                effects.puzzleFailed(cx, cy);
            }

            // Feedback overlay
            const fb = k.add([k.pos(0, 0), k.fixed(), k.z(5000)]);
            fb.add([
                k.rect(600, 120),
                k.pos(k.width() / 2 - 300, k.height() / 2 - 130),
                k.color(...(result.correct ? [20, 50, 30] : [50, 25, 20])),
                k.outline(2, k.rgb(...(result.correct ? COLORS.safeGreen : COLORS.dangerOrange))),
            ]);
            fb.add([
                k.text(result.correct ? "CORRECT!" : "NOT QUITE", { size: 28 }),
                k.pos(k.width() / 2, k.height() / 2 - 118),
                k.anchor("center"),
                k.color(...(result.correct ? COLORS.safeGreen : COLORS.dangerOrange)),
            ]);
            fb.add([
                k.text(result.feedback, { size: 14, width: 560 }),
                k.pos(k.width() / 2, k.height() / 2 - 85),
                k.anchor("center"),
                k.color(...COLORS.textPrimary),
            ]);

            // Continue prompt
            fb.add([
                k.text("Click or press ENTER to continue", { size: 13 }),
                k.pos(k.width() / 2, k.height() / 2 - 30),
                k.anchor("center"),
                k.color(...COLORS.textMuted),
            ]);

            const proceed = () => {
                if (!feedbackShowing) return;
                feedbackShowing = false;
                k.destroy(fb);

                // Advance to next step
                const hasMore = puzzleEngine.advanceStep();
                if (hasMore) {
                    launchCurrentStep();
                } else {
                    handlePuzzleEnd(puzzleEngine.getPuzzleScore());
                }
            };

            // Click anywhere or ENTER to proceed
            const clickArea = fb.add([
                k.rect(k.width(), k.height()),
                k.pos(0, 0),
                k.area(),
                k.opacity(0),
            ]);
            clickArea.onClick(proceed);
            k.onKeyPress("enter", proceed);
        }

        function handlePuzzleEnd(score) {
            puzzleActive = false;
            puzzleBoard.cleanup();

            // Get puzzle results
            const results = puzzleEngine.getPuzzleResults();
            gameStateStore.completePuzzle();

            // Apply resource changes
            if (results && results.resourceReward) {
                gameStateStore.modifyResources(results.resourceReward);
            }

            // Apply event damage/mitigation
            if (dayData.event) {
                const mitigated = results && results.passed;
                const damage = mitigated
                    ? dayData.event.healthDamage * (1 - dayData.event.mitigationReduction)
                    : dayData.event.healthDamage;

                if (damage > 0) {
                    gameStateStore.damageTeamHealth(Math.round(damage));
                }
                gameStateStore.addEventResult({
                    eventType: dayData.event.type,
                    mitigated,
                    damage: Math.round(damage),
                    day: state.currentDay,
                });
            }

            // Grant XP
            progression.grantPuzzleXp({
                puzzleId,
                score: score || 0,
                difficulty: puzzleData.difficulty || 1,
            });
            progression.grantDayXp({
                day: state.currentDay,
                resourcesRemaining: state.resources,
            });

            // Communication quality tracking
            const commQuality = commSystem.getCommunicationQuality();
            progression.adjustLeadershipScore(Math.round(commQuality * 10));

            telemetry.event("puzzle_complete", {
                puzzleId,
                score: score || 0,
                day: state.currentDay,
                commQuality,
                passed: results ? results.passed : false,
            });

            // Store comm stats in game state for assessment
            const commStats = commSystem.getMessageStats();
            gameStateStore.set({
                lastCommStats: commStats,
                lastCommQuality: commQuality,
            });

            // Check if scenario is complete
            if (state.currentDay >= scenario.totalDays) {
                k.go("scenarioResults");
            } else {
                // Advance to next day
                gameStateStore.advanceDay();
                k.go("survivalHub");
            }
        }
    });
}
