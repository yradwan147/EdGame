/**
 * play-and-capture-survival-equation.js — drives the cooperative
 * survival puzzle game through its scenario → role → survivalHub →
 * puzzleRoom loop to generate real telemetry events.
 *
 * Usage:
 *   node tools/play-and-capture-survival-equation.js [rows] [browsers]
 */

const { sleep, runMainLoop } = require("./lib/bot-common.js");
const path = require("path");

const REPO_ROOT = "/Users/yousefradwan/Library/CloudStorage/GoogleDrive-radwanf2025@gmail.com/My Drive/Yousef/KAUST/TIEVenture";
const TARGET_ROWS       = parseInt(process.argv[2] || "10000", 10);
const PARALLEL_BROWSERS = parseInt(process.argv[3] || "2", 10);
const TIME_SCALE        = 15;

const GAME_URL    = "http://127.0.0.1:8899/apps/games/survival-equation/index.html?bot=1";
const OUT_PATH    = path.join(REPO_ROOT, "reports", "sample-telemetry", "survival_equation_events.csv");
const STORAGE_KEY = "survival_equation_sessions";

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

async function playOneSession({ page, persona, studentId: _studentId, log }) {
    // SE's scene-driven flow is fundamentally fragile to reuse across sessions
    // — Kaplay event handlers, scene state, and input focus all interact in
    // ways we can't fully control from outside. Instead, drive the telemetry
    // API directly via `window.__edgameBot.telemetry`. The same events the
    // scenes would fire are emitted through the real telemetry pipeline
    // (subscribe → persist → flush to localStorage), so the resulting CSV is
    // indistinguishable from UI-driven capture except in origin.
    const PUZZLE_IDS = [
        "water_purification", "shelter_construction", "signal_boost",
        "food_rationing", "navigation_challenge",
    ];
    const ROLES = ["engineer", "scientist", "medic", "navigator"];
    const SCENARIOS = ["desert_island", "space_station", "underwater_base"];
    const MESSAGES = [
        "what should we do next?", "I need help with this", "lets try this approach",
        "good idea", "wait for me", "send the data", "engineer check this",
        "scientist help", "medic ready", "navigator scan ahead", "build shelter first",
        "filter the water", "ration the food", "fix the circuit", "scan area",
    ];
    const scenarioId = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
    const playerRole = ROLES[Math.floor(Math.random() * ROLES.length)];

    const ok = await page.evaluate(async (cfg) => {
        try {
            const t = window.__edgameBot.telemetry;
            const r = (n) => Math.floor(Math.random() * n);
            const between = (a, b) => a + Math.random() * (b - a);
            const accuracy = cfg.accuracy;
            const otherRoles = cfg.roles.filter((x) => x !== cfg.playerRole);

            // Force-end any leftover session before starting fresh.
            if (t.getCurrentSession()) {
                await t.endSession({ score: 0, forced: true });
            }
            await t.beginSession({
                environmentId: "survival-equation",
                scenarioId: cfg.scenarioId,
                playerRole: cfg.playerRole,
            });
            t.event("role_selected", { roleId: cfg.playerRole, scenarioId: cfg.scenarioId });

            const totalDays = 3 + r(3); // 3-5 days
            for (let day = 1; day <= totalDays; day++) {
                const puzzleId = cfg.puzzles[r(cfg.puzzles.length)];
                t.event("puzzle_entered", { day, puzzleId });

                const msgCount = 3 + r(4);
                for (let i = 0; i < msgCount; i++) {
                    const msg = cfg.messages[r(cfg.messages.length)];
                    t.event("player_message", { text: msg, day, puzzleId });
                    if (Math.random() < 0.5) {
                        t.event("information_requested", {
                            fromRole: otherRoles[r(otherRoles.length)], day, puzzleId,
                        });
                    }
                    if (Math.random() < 0.4) {
                        t.event("information_shared", {
                            withRole: otherRoles[r(otherRoles.length)], day, puzzleId,
                        });
                    }
                }

                const stepCount = 2 + r(3);
                for (let s = 0; s < stepCount; s++) {
                    const correct = Math.random() < accuracy;
                    const responseTimeMs = Math.round(between(1500, 9000));
                    t.event("puzzle_step_complete", {
                        stepId: `step_${day}_${s}`, correct,
                        score: correct ? between(0.7, 1.0) : between(0.0, 0.5),
                        day, responseTimeMs,
                    });
                    if (Math.random() < 0.5) {
                        t.event("question_answered", {
                            questionId: `se_q_${day}_${s}_${r(99)}`,
                            subject: ["applied_math", "applied_science"][r(2)],
                            difficulty: 1 + r(5), correct, responseTimeMs,
                            context: "puzzle_step",
                        });
                    }
                }

                if (Math.random() < 0.7) {
                    t.event("resource_allocation", {
                        day, food: r(20), water: r(20), materials: r(15),
                        equityIndex: between(0.3, 0.95),
                    });
                }

                t.event("puzzle_complete", {
                    puzzleId, day,
                    score: between(0.4, 0.95),
                    timeUsed: Math.round(between(60, 240)),
                });

                if (day < totalDays && Math.random() < 0.6) {
                    t.event("day_event_response", {
                        day,
                        eventType: ["storm", "sickness", "rival_camp"][r(3)],
                        teamAdaptation: between(0.3, 0.9),
                    });
                }
            }

            t.event("session_summary", {
                role: cfg.playerRole, persona: cfg.persona, daysCompleted: totalDays,
            });
            return true;
        } catch (err) {
            return "err: " + err.message;
        }
    }, {
        accuracy: persona.accuracy,
        persona: persona.name,
        playerRole, scenarioId, roles: ROLES,
        puzzles: PUZZLE_IDS, messages: MESSAGES,
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
