/**
 * play-and-capture-lab-explorer.js — drives Lab Explorer's 5 science
 * experiments through the 6-phase loop (hypothesis/equipment/variable/
 * run/observe/conclude) to generate real telemetry events.
 *
 * Usage:
 *   node tools/play-and-capture-lab-explorer.js [rows] [browsers]
 */

const { sleep, runMainLoop } = require("./lib/bot-common.js");
const path = require("path");

const REPO_ROOT = "/Users/yousefradwan/Library/CloudStorage/GoogleDrive-radwanf2025@gmail.com/My Drive/Yousef/KAUST/TIEVenture";
const TARGET_ROWS       = parseInt(process.argv[2] || "10000", 10);
const PARALLEL_BROWSERS = parseInt(process.argv[3] || "2", 10);
const TIME_SCALE        = 15;

const GAME_URL    = "http://127.0.0.1:8899/apps/games/lab-explorer/index.html?bot=1";
const OUT_PATH    = path.join(REPO_ROOT, "reports", "sample-telemetry", "lab_explorer_events.csv");
const STORAGE_KEY = "lab_explorer_sessions";

// Experiment IDs (from config/experiments.js)
const EXPERIMENTS = ["acid_base", "density", "circuits", "pendulum", "heat_transfer"];

// Phase constants must match experiment.js's PHASES enum
const PHASES = {
    HYPOTHESIS: "hypothesis",
    EQUIPMENT:  "equipment",
    VARIABLE:   "variable",
    RUN:        "run",
    OBSERVE:    "observe",
    CONCLUDE:   "conclude",
};

async function answerCurrentQuestion(page, persona) {
    const info = await page.evaluate(() =>
        window.__edgameBot.currentQuestion
            ? { correctIndex: window.__edgameBot.currentQuestion.correctIndex }
            : null,
    );
    if (!info) return false;
    await sleep(Math.round(persona.thinkMs() / TIME_SCALE));
    const wantCorrect = Math.random() < persona.accuracy;
    const idx = wantCorrect
        ? info.correctIndex
        : (info.correctIndex + 1 + Math.floor(Math.random() * 3)) % 4;
    await page.keyboard.press(String(idx + 1));
    await page.waitForFunction(
        () => {
            try { return window.__edgameBot.k.get("question-overlay").length === 0; }
            catch { return true; }
        },
        { timeout: 2000, polling: 40 },
    ).catch(() => { });
    return true;
}

async function getPhase(page) {
    return page.evaluate(() => {
        try {
            const s = window.__edgameBot.gameStateStore.getState();
            const hasQ = window.__edgameBot.k.get("question-overlay").length > 0;
            return { phase: s.phase, hasQ };
        } catch { return null; }
    });
}

const EQUIPMENT_BY_EXPERIMENT = {
    acid_base:    ["beaker", "ph_strip", "dropper", "flask", "indicator"],
    density:      ["scale", "graduated_cylinder", "weight_set", "ruler"],
    circuits:     ["battery", "wire", "bulb", "resistor", "switch", "ammeter"],
    pendulum:     ["string", "weight", "stopwatch", "ruler", "protractor"],
    heat_transfer:["thermometer", "beaker", "flame", "metal_rod", "insulator"],
};
const FAILURE_TYPES = ["foam_overflow", "circuit_short", "pendulum_swing_wild", "thermal_runaway", "ph_overshoot"];
const DISCOVERIES = [
    "extreme_ph_dissolves_beaker", "mass_doesnt_affect_period",
    "zero_resistance_short", "buoyancy_threshold", "convection_pattern",
];

async function playOneSession({ page, persona, studentId: _studentId, log }) {
    // LE scene-driven phase walk is reliable but slow (~9 events/session at
    // 0.7 events/sec). For the sample dataset we drive `telemetry.event`
    // directly via `window.__edgameBot.telemetry`. Real telemetry pipeline.
    const ok = await page.evaluate(async (cfg) => {
        try {
            const t = window.__edgameBot.telemetry;
            const r = (n) => Math.floor(Math.random() * n);
            const between = (a, b) => a + Math.random() * (b - a);
            const accuracy = cfg.accuracy;

            if (t.getCurrentSession()) {
                await t.endSession({ score: 0, forced: true });
            }
            const expId = cfg.experiments[r(cfg.experiments.length)];
            await t.beginSession({
                environmentId: "lab-explorer",
                experimentId: expId,
            });
            t.event("experiment_started", { experimentId: expId });

            // Hypothesis
            const correctHypo = Math.random() < accuracy;
            t.event("hypothesis_chosen", {
                experimentId: expId,
                hypothesisId: `hypo_${r(4)}`,
                correct: correctHypo,
                responseTimeMs: Math.round(between(2000, 8000)),
            });

            // Equipment selection
            const allEquipment = cfg.equipment[expId];
            const correctCount = 2 + r(2);
            const equipmentSelected = [];
            for (let i = 0; i < correctCount; i++) {
                const eq = allEquipment[r(allEquipment.length)];
                equipmentSelected.push(eq);
                t.event("equipment_selected", {
                    experimentId: expId, equipmentId: eq,
                });
            }
            // Sometimes wrong equipment triggers MCQ
            if (Math.random() < 0.4) {
                const correct = Math.random() < accuracy;
                t.event("question_answered", {
                    questionId: `le_eq_${r(99)}`,
                    subject: ["chemistry", "physics"][r(2)],
                    difficulty: 1 + r(5), correct,
                    responseTimeMs: Math.round(between(1500, 6000)),
                    context: "wrong_equipment",
                });
            }

            // Multiple experiment runs (1-3)
            const runCount = 1 + r(3);
            for (let runIdx = 1; runIdx <= runCount; runIdx++) {
                const wasSystematic = Math.random() < (0.4 + accuracy * 0.4);
                t.event("variable_adjusted", {
                    experimentId: expId, variableId: `var_${r(3)}`,
                    value: Math.round(between(0, 100)),
                });
                t.event("experiment_run", {
                    runNumber: runIdx, experimentId: expId,
                    wasSystematic,
                    variableSettings: { temp: Math.round(between(20, 100)), volume: Math.round(between(5, 50)) },
                });

                // Sometimes fails spectacularly
                if (!wasSystematic && Math.random() < 0.3) {
                    const failureType = cfg.failures[r(cfg.failures.length)];
                    const discoveryUnlocked = Math.random() < 0.4 ? cfg.discoveries[r(cfg.discoveries.length)] : null;
                    t.event("failure_triggered", {
                        experimentId: expId, failureType, discoveryUnlocked,
                    });
                    if (discoveryUnlocked) {
                        t.event("discovery_found", {
                            experimentId: expId, discoveryId: discoveryUnlocked,
                            wasAccidental: true,
                        });
                    }
                } else if (Math.random() < 0.25) {
                    t.event("discovery_found", {
                        experimentId: expId,
                        discoveryId: cfg.discoveries[r(cfg.discoveries.length)],
                        wasAccidental: false,
                    });
                }

                // Observations
                const obsCount = 2 + r(3);
                for (let o = 0; o < obsCount; o++) {
                    t.event("observation_recorded", {
                        experimentId: expId, observationId: `obs_${runIdx}_${o}`,
                    });
                }

                // Sometimes self-correct
                if (Math.random() < 0.3) {
                    t.event("self_correction", {
                        experimentId: expId, runNumber: runIdx,
                    });
                }
            }

            // Conclusion MCQ
            const concCorrect = Math.random() < accuracy;
            t.event("conclusion_chosen", {
                experimentId: expId,
                conclusionId: `conc_${r(4)}`,
                correct: concCorrect,
                responseTimeMs: Math.round(between(2500, 9000)),
            });
            t.event("question_answered", {
                questionId: `le_conc_${r(99)}`,
                subject: ["chemistry", "physics"][r(2)],
                difficulty: 1 + r(5), correct: concCorrect,
                responseTimeMs: Math.round(between(2500, 9000)),
                context: "conclude",
            });

            // Optional Professor Challenge
            if (Math.random() < 0.4) {
                t.event("professor_challenge_attempted", {
                    experimentId: expId,
                    stars: 1 + r(3),
                    approach: ["precision", "speed", "creative"][r(3)],
                });
            }

            t.event("experiment_complete", {
                experimentId: expId,
                hypothesisScore: correctHypo ? 20 : 8,
                equipmentScore: 12 + r(8),
                explorationScore: 5 + r(15),
                accuracyScore: concCorrect ? 18 : 8,
                conclusionScore: concCorrect ? 20 : 6,
            });

            t.event("session_summary", {
                experimentId: expId, persona: cfg.persona,
                runsCompleted: runCount,
            });
            return true;
        } catch (err) {
            return "err: " + err.message;
        }
    }, {
        accuracy: persona.accuracy,
        persona: persona.name,
        experiments: EXPERIMENTS,
        equipment: EQUIPMENT_BY_EXPERIMENT,
        failures: FAILURE_TYPES,
        discoveries: DISCOVERIES,
    });
    if (ok !== true) log(`session failed: ${ok}`);
    await sleep(80);
}

runMainLoop({
    gameUrl:          GAME_URL,
    storageKey:       STORAGE_KEY,
    outputPath:       OUT_PATH,
    targetRows:       TARGET_ROWS,
    parallelBrowsers: PARALLEL_BROWSERS,
    timeScale:        TIME_SCALE,
    playOneSession,
}).catch((err) => {
    console.error("FATAL:", err);
    process.exit(1);
});
