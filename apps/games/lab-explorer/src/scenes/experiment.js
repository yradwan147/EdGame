import { COLORS, PHASES, PHASE_ORDER, SUBJECT_IDS } from "../config/constants.js";
import { getExperimentById } from "../config/experiments.js";
import { createExperimentEngine } from "../systems/experimentEngine.js";
import { createDiscoveryTracker } from "../systems/discoveryTracker.js";
import { createAssessmentEngine } from "../systems/assessmentEngine.js";
import { createQuestionEngine } from "../systems/questionEngine.js";
import { createHudRenderer } from "../components/hudRenderer.js";
import { createEquipmentPanel } from "../components/equipmentPanel.js";
import { createVariableControls } from "../components/variableControls.js";
import { createResultDisplay } from "../components/resultDisplay.js";
import { createQuestionOverlay } from "../components/questionOverlay.js";
import { createActionEffects } from "../components/actionEffects.js";

/**
 * THE MAIN EXPERIMENT SCENE.
 * Manages the full experiment flow across 6 phases:
 *   hypothesis -> equipment -> variable -> run -> observe -> conclude
 * Supports multiple runs, discovery tracking, failure animations, MCQ gates.
 */
export function registerExperimentScene({ k, gameStateStore, telemetry, progression, settings }) {
    k.scene("experiment", async ({ experimentId }) => {
        const expConfig = getExperimentById(experimentId);
        if (!expConfig) {
            k.go("labSelect");
            return;
        }

        // ---- Systems ----
        const experimentEngine = createExperimentEngine();
        const discoveryTracker = createDiscoveryTracker();
        const assessmentEngine = createAssessmentEngine();
        const questionEngine = createQuestionEngine();
        const questionOverlay = createQuestionOverlay(k);
        const effects = createActionEffects(k);
        const resultDisplay = createResultDisplay(k);

        // Load profile discoveries
        const profile = progression.getProfile();
        discoveryTracker.loadFromProfile(profile.discoveriesFound, profile.failuresTriggered);

        // Start session
        const sessionId = await telemetry.beginSession({
            environmentId: "lab-explorer",
            experimentId,
        });
        gameStateStore.startExperiment({ sessionId, experimentId });

        const seenQuestionIds = questionEngine.createSeenSet();
        const playerId = "player";

        // ---- Background ----
        k.add([k.rect(k.width(), k.height()), k.color(...COLORS.labBg)]);

        // ---- HUD ----
        const hud = createHudRenderer(k);
        hud.init({ experimentName: expConfig.name });

        function updateHud(statusMessage) {
            const st = gameStateStore.getState();
            hud.update({
                phase: st.phase,
                totalScore: gameStateStore.getTotalScore(),
                discoveryCount: st.discoveries.length,
                runCount: st.runCount,
                statusMessage: statusMessage || "",
            });
        }

        // ---- Phase content containers ----
        // We'll clear and rebuild content when switching phases.
        let phaseCleanups = [];

        function clearPhaseContent() {
            for (const fn of phaseCleanups) {
                try { fn(); } catch {}
            }
            phaseCleanups = [];
        }

        // ---- Shared: Ask a question ----
        async function askQuestion(context = "equipment") {
            const subjectId = expConfig.subject === SUBJECT_IDS.CHEMISTRY
                ? SUBJECT_IDS.CHEMISTRY
                : SUBJECT_IDS.PHYSICS;
            try {
                const q = await questionEngine.getQuestion({
                    playerId,
                    subjectId,
                    seenQuestionIds,
                });
                seenQuestionIds.add(q.id);
                const result = await questionOverlay.show(q);
                questionEngine.recordResult({ playerId, correct: result.correct });
                gameStateStore.recordQuestion(result.correct);
                progression.grantQuestionXp({
                    difficulty: q.difficulty,
                    responseTimeMs: result.responseTimeMs,
                    correct: result.correct,
                });
                telemetry.event("question_answered", {
                    questionId: q.id,
                    correct: result.correct,
                    responseTimeMs: result.responseTimeMs,
                    context,
                });
                return result;
            } catch {
                return { correct: false, responseTimeMs: 0, timedOut: true };
            }
        }

        // ====================================================================
        //  PHASE 1: HYPOTHESIS
        // ====================================================================
        function showHypothesisPhase() {
            clearPhaseContent();
            gameStateStore.setPhase(PHASES.HYPOTHESIS);
            updateHud("Select your hypothesis for this experiment");
            telemetry.event("phase_start", { phase: "hypothesis" });

            const panelRoot = k.add([k.pos(0, 0), k.z(500), "phase-hypothesis"]);
            phaseCleanups.push(() => k.destroy(panelRoot));

            panelRoot.add([
                k.rect(700, 50),
                k.pos(k.width() / 2 - 350, 70),
                k.color(...COLORS.panelDark),
                k.outline(2, k.rgb(...COLORS.accent)),
            ]);
            panelRoot.add([
                k.text("What do you think will happen?", { size: 22 }),
                k.pos(k.width() / 2, 95),
                k.anchor("center"),
                k.color(...COLORS.accentBright),
            ]);

            // Description
            panelRoot.add([
                k.text(expConfig.description, { size: 16, width: 800 }),
                k.pos(k.width() / 2 - 400, 140),
                k.color(180, 200, 230),
            ]);

            // Hypothesis options
            const startY = 210;
            for (let i = 0; i < expConfig.hypothesisOptions.length; i++) {
                const hyp = expConfig.hypothesisOptions[i];
                const y = startY + i * 80;

                const btn = panelRoot.add([
                    k.rect(800, 65),
                    k.pos(k.width() / 2 - 400, y),
                    k.color(22, 38, 62),
                    k.area(),
                    k.outline(2, k.rgb(50, 80, 120)),
                ]);

                const labels = ["A", "B", "C", "D"];
                btn.add([
                    k.text(`(${labels[i]}) ${hyp.text}`, { size: 18, width: 760 }),
                    k.pos(20, 33),
                    k.anchor("left"),
                    k.color(210, 225, 250),
                ]);

                btn.onClick(() => {
                    gameStateStore.selectHypothesis(hyp.id);
                    const score = experimentEngine.evaluateHypothesis(hyp.id, expConfig.correctHypothesisId);
                    gameStateStore.setScore("hypothesis", score);
                    telemetry.event("hypothesis_selected", { hypothesisId: hyp.id, score });
                    showEquipmentPhase();
                });
            }

            // Keyboard shortcuts
            const keys = ["1", "2", "3", "4"];
            for (let i = 0; i < Math.min(4, expConfig.hypothesisOptions.length); i++) {
                const idx = i;
                const cancel = k.onKeyPress(keys[i], () => {
                    const hyp = expConfig.hypothesisOptions[idx];
                    gameStateStore.selectHypothesis(hyp.id);
                    const score = experimentEngine.evaluateHypothesis(hyp.id, expConfig.correctHypothesisId);
                    gameStateStore.setScore("hypothesis", score);
                    telemetry.event("hypothesis_selected", { hypothesisId: hyp.id, score });
                    showEquipmentPhase();
                });
                phaseCleanups.push(cancel);
            }
        }

        // ====================================================================
        //  PHASE 2: EQUIPMENT
        // ====================================================================
        function showEquipmentPhase() {
            clearPhaseContent();
            gameStateStore.setPhase(PHASES.EQUIPMENT);
            updateHud("Select the right equipment for your experiment");
            telemetry.event("phase_start", { phase: "equipment" });

            let equipPanel = null;

            equipPanel = createEquipmentPanel(k, {
                availableEquipmentIds: expConfig.availableEquipment,
                requiredEquipmentIds: expConfig.requiredEquipment,
                async onWrongTool(eqId) {
                    gameStateStore.incrementSafetyCounter("wrongToolAttempts");
                    telemetry.event("wrong_tool", { equipmentId: eqId });

                    // Trigger MCQ for wrong tool
                    effects.safetyWarning("Wrong tool! Answer a question to continue.");
                    await askQuestion("wrong_equipment");
                },
                onSelectionChanged(selected) {
                    gameStateStore.setEquipment(selected);
                    // Check if safety goggles are worn
                    if (selected.includes("safety_goggles")) {
                        gameStateStore.recordSafetyCheck("gogglesWorn", true);
                    }
                },
            });

            phaseCleanups.push(() => {
                if (equipPanel) equipPanel.destroy();
            });

            // "Confirm Equipment" button
            const confirmBtn = k.add([
                k.rect(220, 50),
                k.pos(k.width() / 2 + 200, k.height() - 80),
                k.color(20, 80, 100),
                k.area(),
                k.outline(2, k.rgb(...COLORS.accentBright)),
                k.z(600),
            ]);
            confirmBtn.add([
                k.text("Confirm Equipment", { size: 18 }),
                k.pos(110, 25),
                k.anchor("center"),
                k.color(...COLORS.accentBright),
            ]);
            phaseCleanups.push(() => k.destroy(confirmBtn));

            confirmBtn.onClick(() => {
                const selected = equipPanel ? equipPanel.getSelected() : [];
                const evalResult = experimentEngine.checkEquipment(
                    selected,
                    expConfig.requiredEquipment,
                );
                gameStateStore.setScore("equipment", evalResult.score);
                telemetry.event("equipment_confirmed", {
                    selected,
                    score: evalResult.score,
                    missing: evalResult.missing,
                    incorrect: evalResult.incorrect,
                });
                showVariablePhase();
            });
        }

        // ====================================================================
        //  PHASE 3: VARIABLES
        // ====================================================================
        function showVariablePhase() {
            clearPhaseContent();
            gameStateStore.setPhase(PHASES.VARIABLE);
            updateHud("Adjust variables, then click RUN EXPERIMENT");
            telemetry.event("phase_start", { phase: "variable" });

            // Set initial variable values
            const initialValues = {};
            for (const v of expConfig.variables) {
                initialValues[v.name] = v.defaultValue;
                gameStateStore.setVariable(v.name, v.defaultValue);
            }

            const varControls = createVariableControls(k, {
                variables: expConfig.variables,
                initialValues,
                onValueChanged(name, value, allValues) {
                    gameStateStore.setVariable(name, value);

                    // Check for extreme values
                    const v = expConfig.variables.find((vr) => vr.name === name);
                    if (v && !v.options) {
                        const range = v.max - v.min;
                        const normalizedDist = Math.min(
                            Math.abs(value - v.min),
                            Math.abs(value - v.max),
                        ) / range;
                        if (normalizedDist < 0.05) {
                            gameStateStore.incrementSafetyCounter("extremeValueAttempts");
                        }
                    }

                    // Live preview on result display
                    const liveResult = experimentEngine.calculateResult(expConfig, allValues);
                    resultDisplay.show(experimentId, liveResult, allValues);
                },
            });

            phaseCleanups.push(() => varControls.destroy());

            // Show idle display initially
            resultDisplay.showIdle(experimentId);
            phaseCleanups.push(() => resultDisplay.cleanup());

            // RUN EXPERIMENT button
            const runBtn = k.add([
                k.rect(250, 55),
                k.pos(180, k.height() - 80),
                k.color(25, 100, 60),
                k.area(),
                k.outline(3, k.rgb(...COLORS.beakerGreen)),
                k.z(600),
            ]);
            runBtn.add([
                k.text("RUN EXPERIMENT", { size: 20 }),
                k.pos(125, 28),
                k.anchor("center"),
                k.color(...COLORS.beakerGreen),
            ]);
            phaseCleanups.push(() => k.destroy(runBtn));

            runBtn.onClick(() => {
                executeRun(varControls);
            });

            // "Done Experimenting" button (visible after first run)
            const doneBtn = k.add([
                k.rect(220, 45),
                k.pos(460, k.height() - 76),
                k.color(80, 50, 30),
                k.area(),
                k.outline(2, k.rgb(200, 160, 80)),
                k.z(600),
                k.opacity(0),
            ]);
            doneBtn.add([
                k.text("Done Experimenting", { size: 16 }),
                k.pos(110, 23),
                k.anchor("center"),
                k.color(220, 190, 130),
            ]);
            phaseCleanups.push(() => k.destroy(doneBtn));

            let doneVisible = false;
            doneBtn.onClick(() => {
                if (!doneVisible) return;
                showObservePhase();
            });

            // ---- Execute a single run ----
            async function executeRun(controls) {
                const vars = controls.getValues();
                const st = gameStateStore.getState();
                telemetry.event("run_start", { runNumber: st.runCount + 1, vars });

                updateHud("Running experiment...");

                // Calculate result
                const result = experimentEngine.calculateResult(expConfig, vars);
                gameStateStore.recordRun(result.numericResult);

                // Animated 3-second reveal
                resultDisplay.show(experimentId, result, vars);

                // Check for failures
                const newFailures = discoveryTracker.checkForFailures(expConfig, vars, result.numericResult);
                for (const fail of newFailures) {
                    gameStateStore.addFailure(fail.id);
                    progression.recordFailure(fail.id);
                    telemetry.event("failure_triggered", { failureId: fail.id });

                    // Play failure animation based on type
                    const cx = 930;
                    const cy = 380;
                    if (fail.animation === "foam_eruption") {
                        effects.foamEruption(cx, cy);
                    } else if (fail.animation === "sparks") {
                        effects.sparks(cx, cy, 25);
                    } else if (fail.animation === "steam_cloud") {
                        effects.steamCloud(cx, cy, 4);
                    } else if (fail.animation === "beaker_dissolve") {
                        effects.beakerDissolve(cx, cy);
                    } else if (fail.animation === "bulb_pop") {
                        effects.bulbPop(cx, cy);
                    } else if (fail.animation === "overflow") {
                        effects.overflow(cx, cy);
                    } else if (fail.animation === "string_break") {
                        effects.stringBreak(cx, cy);
                    } else if (fail.animation === "wild_swing") {
                        effects.burstParticles(cx, cy, [200, 160, 100], 15, 120, 5);
                    } else if (fail.animation === "melted_foam") {
                        effects.steamCloud(cx, cy, 3);
                    } else if (fail.animation === "scale_tip") {
                        effects.burstParticles(cx, cy, [180, 180, 190], 10, 60, 4);
                    }

                    // Show failure text
                    effects.failureTriggered(cx, cy, fail.description);
                }

                // Check for discoveries
                const runHistory = gameStateStore.getState().runResults;
                const newDiscoveries = discoveryTracker.checkForDiscoveries(
                    expConfig, vars, result.numericResult, runHistory,
                );
                for (const disc of newDiscoveries) {
                    gameStateStore.addDiscovery(disc.id);
                    progression.recordDiscovery(disc.id);
                    telemetry.event("discovery_found", { discoveryId: disc.id });

                    // Golden sparkle effect
                    effects.discoveryFound(930, 300, disc.name);
                }

                telemetry.event("run_complete", {
                    runNumber: gameStateStore.getState().runCount,
                    result: result.numericResult,
                    discoveries: newDiscoveries.map((d) => d.id),
                    failures: newFailures.map((f) => f.id),
                });

                updateHud("Run complete! Adjust variables for another run, or click Done.");

                // Show "Done" button after first run
                if (!doneVisible) {
                    doneVisible = true;
                    doneBtn.opacity = 1;
                }
            }
        }

        // ====================================================================
        //  PHASE 4 (handled within variable phase): RUN
        //  The run phase is embedded in the variable phase via executeRun().
        //  We transition to observe phase when player clicks "Done Experimenting".
        // ====================================================================

        // ====================================================================
        //  PHASE 5: OBSERVE
        // ====================================================================
        function showObservePhase() {
            clearPhaseContent();
            gameStateStore.setPhase(PHASES.OBSERVE);
            updateHud("Select your observations from the experiment");
            telemetry.event("phase_start", { phase: "observe" });

            const panelRoot = k.add([k.pos(0, 0), k.z(500), "phase-observe"]);
            phaseCleanups.push(() => k.destroy(panelRoot));

            panelRoot.add([
                k.rect(800, 45),
                k.pos(k.width() / 2 - 400, 70),
                k.color(...COLORS.panelDark),
                k.outline(2, k.rgb(...COLORS.accent)),
            ]);
            panelRoot.add([
                k.text("What did you observe? (Select all that apply)", { size: 20 }),
                k.pos(k.width() / 2, 92),
                k.anchor("center"),
                k.color(...COLORS.accentBright),
            ]);

            // Run summary
            const st = gameStateStore.getState();
            const runs = st.runResults;
            let summaryText = `You ran ${runs.length} experiment(s).\n`;
            if (runs.length > 0) {
                const last = runs[runs.length - 1];
                summaryText += `Last result: ${expConfig.resultLabel} = ${last.result} ${expConfig.resultUnit}`;
            }

            panelRoot.add([
                k.text(summaryText, { size: 15, width: 700 }),
                k.pos(k.width() / 2 - 350, 130),
                k.color(160, 180, 210),
            ]);

            // Observation options (toggleable)
            const selectedObs = new Set();
            const obsBtns = [];
            const startY = 190;

            for (let i = 0; i < expConfig.observationOptions.length; i++) {
                const obs = expConfig.observationOptions[i];
                const y = startY + i * 70;

                const btn = panelRoot.add([
                    k.rect(800, 58),
                    k.pos(k.width() / 2 - 400, y),
                    k.color(22, 38, 58),
                    k.area(),
                    k.outline(2, k.rgb(50, 70, 100)),
                ]);

                const labels = ["A", "B", "C", "D"];
                const textObj = btn.add([
                    k.text(`(${labels[i]}) ${obs.text}`, { size: 17, width: 760 }),
                    k.pos(20, 29),
                    k.anchor("left"),
                    k.color(200, 215, 240),
                ]);

                btn.onClick(() => {
                    if (selectedObs.has(obs.id)) {
                        selectedObs.delete(obs.id);
                        btn.color = k.rgb(22, 38, 58);
                    } else {
                        selectedObs.add(obs.id);
                        gameStateStore.selectObservation(obs.id);
                        btn.color = k.rgb(30, 60, 90);
                    }
                });

                obsBtns.push(btn);
            }

            // Confirm observations button
            const confirmBtn = panelRoot.add([
                k.rect(240, 50),
                k.pos(k.width() / 2 - 120, startY + expConfig.observationOptions.length * 70 + 20),
                k.color(20, 80, 100),
                k.area(),
                k.outline(2, k.rgb(...COLORS.accentBright)),
            ]);
            confirmBtn.add([
                k.text("Confirm Observations", { size: 18 }),
                k.pos(120, 25),
                k.anchor("center"),
                k.color(...COLORS.accentBright),
            ]);

            confirmBtn.onClick(() => {
                telemetry.event("observations_selected", {
                    selected: [...selectedObs],
                });
                showConcludePhase();
            });
        }

        // ====================================================================
        //  PHASE 6: CONCLUDE
        // ====================================================================
        async function showConcludePhase() {
            clearPhaseContent();
            gameStateStore.setPhase(PHASES.CONCLUDE);
            updateHud("Final question: What is the scientific conclusion?");
            telemetry.event("phase_start", { phase: "conclude" });

            const panelRoot = k.add([k.pos(0, 0), k.z(500), "phase-conclude"]);
            phaseCleanups.push(() => k.destroy(panelRoot));

            panelRoot.add([
                k.rect(800, 45),
                k.pos(k.width() / 2 - 400, 80),
                k.color(...COLORS.panelDark),
                k.outline(2, k.rgb(...COLORS.accent)),
            ]);
            panelRoot.add([
                k.text("What is the correct conclusion?", { size: 22 }),
                k.pos(k.width() / 2, 102),
                k.anchor("center"),
                k.color(...COLORS.accentBright),
            ]);

            const startY = 160;
            for (let i = 0; i < expConfig.conclusionOptions.length; i++) {
                const conc = expConfig.conclusionOptions[i];
                const y = startY + i * 80;

                const btn = panelRoot.add([
                    k.rect(800, 68),
                    k.pos(k.width() / 2 - 400, y),
                    k.color(22, 38, 58),
                    k.area(),
                    k.outline(2, k.rgb(50, 70, 100)),
                ]);

                const labels = ["A", "B", "C", "D"];
                btn.add([
                    k.text(`(${labels[i]}) ${conc.text}`, { size: 18, width: 760 }),
                    k.pos(20, 34),
                    k.anchor("left"),
                    k.color(210, 225, 250),
                ]);

                btn.onClick(() => {
                    selectConclusion(conc);
                });
            }

            // Keyboard
            const keys = ["1", "2", "3", "4"];
            for (let i = 0; i < Math.min(4, expConfig.conclusionOptions.length); i++) {
                const idx = i;
                const cancel = k.onKeyPress(keys[i], () => {
                    selectConclusion(expConfig.conclusionOptions[idx]);
                });
                phaseCleanups.push(cancel);
            }

            async function selectConclusion(conc) {
                gameStateStore.selectConclusion(conc.id);
                const score = experimentEngine.evaluateConclusion(conc.id, expConfig.conclusionOptions);
                gameStateStore.setScore("conclusion", score);

                telemetry.event("conclusion_selected", {
                    conclusionId: conc.id,
                    correct: conc.correct,
                    score,
                });

                // Show feedback
                if (conc.correct) {
                    effects.discoveryFound(k.width() / 2, k.height() / 2, "Correct Conclusion!");
                } else {
                    effects.floatText(k.width() / 2, k.height() / 2, "Not quite right...", [255, 150, 100], 28);
                }

                // Final MCQ about the science
                await askQuestion("conclusion");

                // Calculate final scores
                await finishExperiment();
            }
        }

        // ====================================================================
        //  FINISH: Calculate scores, assessment, transition to postLab
        // ====================================================================
        async function finishExperiment() {
            clearPhaseContent();
            const st = gameStateStore.getState();

            // Exploration score
            const explorationScore = experimentEngine.evaluateExploration(
                st.runResults,
                expConfig.variables,
            );
            gameStateStore.setScore("exploration", explorationScore);

            // Accuracy score
            const accuracyScore = experimentEngine.evaluateAccuracy(
                st.runResults,
                expConfig.targetMin,
                expConfig.targetMax,
            );
            gameStateStore.setScore("accuracy", accuracyScore);

            // Systematic experimentation check
            const systematic = experimentEngine.wasSystematic(st.runResults);
            const selfCorrections = experimentEngine.countSelfCorrections(
                st.runResults,
                expConfig.targetMin,
                expConfig.targetMax,
            );

            // Best accuracy error for assessment
            let bestError = 1.0;
            const targetCenter = (expConfig.targetMin + expConfig.targetMax) / 2;
            const targetRange = expConfig.targetMax - expConfig.targetMin;
            for (const run of st.runResults) {
                const err = Math.abs(run.result - targetCenter) / Math.max(0.01, targetRange);
                bestError = Math.min(bestError, err);
            }

            // Record assessment
            assessmentEngine.recordExperiment({
                experimentId,
                questionsAnswered: st.questionsAnswered,
                questionsCorrect: st.questionsCorrect,
                bestAccuracyError: bestError,
                hypothesisCorrect: st.hypothesisSelected === expConfig.correctHypothesisId,
                conclusionCorrect: expConfig.conclusionOptions.find(
                    (c) => c.id === st.conclusionSelected
                )?.correct || false,
                durationMs: Date.now() - st.startedAt,
                runCount: st.runCount,
                equipmentScore: st.score.equipment,
                explorationScore,
                wasSystematic: systematic,
                selfCorrectionCount: selfCorrections,
                stepSequence: st.stepSequence,
                gogglesWorn: st.safetyChecks.gogglesWorn,
                extremeValueAttempts: st.safetyChecks.extremeValueAttempts,
                discoveriesFound: st.discoveries.length,
                failuresTriggered: st.failures.length,
                wrongToolAttempts: st.safetyChecks.wrongToolAttempts,
                accuracyScore,
            });

            const totalScore = gameStateStore.getTotalScore();
            const stars = gameStateStore.getStars();
            const assessment = assessmentEngine.generateReport();

            // Grant XP
            const xpResult = progression.grantExperimentXp({
                experimentId,
                totalScore,
                stars,
            });

            // End game state and telemetry
            gameStateStore.endExperiment();
            const summary = {
                experimentId,
                experimentName: expConfig.name,
                totalScore,
                stars,
                scores: { ...st.score, exploration: explorationScore, accuracy: accuracyScore },
                discoveries: st.discoveries,
                failures: st.failures,
                runCount: st.runCount,
                systematic,
                selfCorrections,
                assessment,
                xpResult,
                questionsAnswered: st.questionsAnswered,
                questionsCorrect: st.questionsCorrect,
                durationMs: Date.now() - st.startedAt,
                gogglesWorn: st.safetyChecks.gogglesWorn,
            };

            await telemetry.endSession(summary);

            // Go to post-lab scene
            k.go("postLab", { summary });
        }

        // ---- Start the experiment flow ----
        showHypothesisPhase();

        // Escape key to bail out
        k.onKeyPress("escape", () => {
            telemetry.event("experiment_abandoned", { experimentId });
            k.go("labSelect");
        });
    });
}
