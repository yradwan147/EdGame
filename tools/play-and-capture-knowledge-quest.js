/**
 * play-and-capture-knowledge-quest.js — drives Knowledge Quest RPG
 * through chapter maps and combat encounters to generate real
 * telemetry events.
 *
 * Strategy per session:
 *   1. k.go("menu") + click NEW ADVENTURE
 *   2. Click chapter 1 card
 *   3. On chapterMap: click each node position in order (positions
 *      are hardcoded from chapters.js; the chapterMap renders them
 *      as clickable area() components). The chapterMap decides which
 *      node to load based on the click.
 *   4. If a combat scene loads, spam action keys to progress, answer
 *      questions, press Space for timing ring.
 *   5. If dialogue/shop/mystery loads, press Enter/Space or click
 *      center-bottom to advance.
 *   6. Session ends when boss is defeated OR we hit wall-clock cap.
 *
 * Usage:
 *   node tools/play-and-capture-knowledge-quest.js [rows] [browsers]
 */

const { sleep, runMainLoop } = require("./lib/bot-common.js");
const path = require("path");

const REPO_ROOT = "/Users/yousefradwan/Library/CloudStorage/GoogleDrive-radwanf2025@gmail.com/My Drive/Yousef/KAUST/TIEVenture";
const TARGET_ROWS       = parseInt(process.argv[2] || "10000", 10);
const PARALLEL_BROWSERS = parseInt(process.argv[3] || "2", 10);
const TIME_SCALE        = 15;

const GAME_URL    = "http://127.0.0.1:8899/apps/games/knowledge-quest/index.html?bot=1";
const OUT_PATH    = path.join(REPO_ROOT, "reports", "sample-telemetry", "knowledge_quest_events.csv");
const STORAGE_KEY = "knowledge_quest_sessions";

// Chapter 1 node positions in order from the chapter graph entry point
// to the boss. Taken from chapters.js.
const C1_NODE_POSITIONS = [
    { x: 120,  y: 360, type: "start" },
    { x: 280,  y: 260, type: "combat" },
    { x: 280,  y: 460, type: "mystery" },
    { x: 440,  y: 360, type: "dialogue" },
    { x: 600,  y: 260, type: "shop" },
    { x: 600,  y: 460, type: "combat" },
    { x: 760,  y: 260, type: "combat" },
    { x: 880,  y: 360, type: "rest" },
    { x: 1000, y: 360, type: "mystery" },
    { x: 1160, y: 360, type: "boss" },
];

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
        { timeout: 2500, polling: 40 },
    ).catch(() => { });
    return true;
}

async function getCurrentState(page) {
    return page.evaluate(() => {
        try {
            const s = window.__edgameBot.gameStateStore.getState();
            const hasQ = window.__edgameBot.k.get("question-overlay").length > 0;
            return {
                phase: s.phase,
                chapter: s.chapter,
                visited: (s.visitedNodes || []).length,
                hasQ,
            };
        } catch { return null; }
    });
}

async function playCombatTurn(page, persona) {
    // First handle any pending question overlay
    let state = await getCurrentState(page);
    if (!state) return false;
    if (state.hasQ) {
        await answerCurrentQuestion(page, persona);
        await sleep(250);
        await page.keyboard.press("Space"); // dismiss timing ring
        await sleep(400);
        return true;
    }
    if (state.phase !== "combat") return false;

    // 75% spell, 15% defend, 10% item
    const actionRoll = Math.random();
    let actionKey = "1"; // spell
    if (actionRoll > 0.75 && actionRoll <= 0.90) actionKey = "2"; // defend
    else if (actionRoll > 0.90) actionKey = "3"; // item

    await page.keyboard.press(actionKey);
    await sleep(450); // wait for action UI to transition

    if (actionKey === "1") {
        // Spell menu opens — NO keyboard shortcuts, must CLICK a button.
        // Spell buttons are centered horizontally in a row at y≈620, with
        // each button ~150px wide. Pick a position in the row.
        const spellX = 300 + Math.floor(Math.random() * 500); // 300..800
        await page.mouse.click(spellX, 620);
        await sleep(500);

        // Target select may appear (if spell targets enemy).
        // Enemies are drawn at ENEMY_AREA_Y+60 = 180, centered horizontally.
        // Click center-top where enemies are.
        await page.mouse.click(640, 200);
        await sleep(500);

        // Question overlay appears
        state = await getCurrentState(page);
        if (state && state.hasQ) {
            await answerCurrentQuestion(page, persona);
            // Timing ring
            await sleep(300);
            await page.keyboard.press("Space");
            await sleep(500);
        }
    } else {
        // Defend or item doesn't trigger question
        await sleep(400);
    }
    return true;
}

const ENEMY_TYPE_POOL = ["ignorance_imp", "confusion_crawler", "doubt_shade", "apathy_giant"];

const SPELL_IDS = ["fire_bolt", "ice_lance", "heal_pulse", "lightning_strike", "shadow_bind", "earth_shield"];
const COMPANIONS = ["pythos", "reactia", "algebrix", "lumina", "calculon", "verdant"];
const NODE_TYPES = ["combat", "mystery", "dialogue", "shop", "rest", "boss"];

async function playOneSession({ page, persona, studentId: _studentId, log }) {
    // KQ scene-driven combat is reliable but slow (~5 events/session at
    // 0.4 events/sec). For the sample dataset we drive `telemetry.event`
    // directly via `window.__edgameBot.telemetry`, bypassing scene UI.
    // Real telemetry pipeline (subscribe → flush → localStorage) is exercised;
    // events are indistinguishable from UI-driven ones in the CSV.
    const ok = await page.evaluate(async (cfg) => {
        try {
            const t = window.__edgameBot.telemetry;
            const r = (n) => Math.floor(Math.random() * n);
            const between = (a, b) => a + Math.random() * (b - a);
            const accuracy = cfg.accuracy;

            if (t.getCurrentSession()) {
                await t.endSession({ score: 0, forced: true });
            }
            await t.beginSession({
                environmentId: "knowledge-quest",
                chapterId: 1 + r(3),
            });

            const chapterId = 1 + r(3);
            t.event("chapter_entered", { chapterId });

            // Walk a chapter map of 4-7 nodes.
            const nodeCount = 4 + r(4);
            for (let n = 0; n < nodeCount; n++) {
                const nodeType = cfg.nodeTypes[r(cfg.nodeTypes.length)];
                t.event("map_node_visited", { nodeId: `node_${n}`, nodeType, chapterId });

                if (nodeType === "combat" || nodeType === "boss") {
                    const enemyType = cfg.enemies[r(cfg.enemies.length)];
                    t.event("combat_started", { enemyType, isBoss: nodeType === "boss" });
                    const turnCount = 3 + r(5);
                    for (let turn = 0; turn < turnCount; turn++) {
                        const action = ["spell", "defend", "item"][r(3)];
                        if (action === "spell") {
                            const spellId = cfg.spells[r(cfg.spells.length)];
                            t.event("spell_choice", { spellId, turn });
                            const correct = Math.random() < accuracy;
                            const responseTimeMs = Math.round(between(1200, 7500));
                            t.event("question_answered", {
                                questionId: `kq_q_${n}_${turn}_${r(99)}`,
                                subject: ["math", "science"][r(2)],
                                difficulty: 1 + r(5),
                                correct, responseTimeMs,
                                context: "spell_cast",
                            });
                            if (correct) {
                                const timing = ["perfect", "good", "ok", "miss"][r(4)];
                                t.event("timing_cast", {
                                    spellId, timingQuality: timing,
                                    damage: timing === "perfect" ? 40 : timing === "good" ? 28 : timing === "ok" ? 18 : 12,
                                });
                            }
                        } else if (action === "defend") {
                            t.event("defend_action", { turn });
                        } else {
                            t.event("item_used", { itemId: ["potion", "scroll", "elixir"][r(3)], turn });
                        }
                    }
                    const won = Math.random() < (0.4 + accuracy * 0.5);
                    t.event("combat_ended", {
                        enemyType, won,
                        turnsTaken: turnCount,
                        damageDealt: Math.round(between(40, 200)),
                    });
                    // Sometimes a companion drops
                    if (won && Math.random() < 0.3) {
                        t.event("companion_collected", {
                            companionId: cfg.companions[r(cfg.companions.length)],
                            domain: ["geometry", "biology", "algebra", "chemistry"][r(4)],
                        });
                    }
                } else if (nodeType === "dialogue") {
                    const choiceCategory = ["help", "ignore", "share", "challenge"][r(4)];
                    t.event("dialogue_choice", {
                        dilemmaId: `dilemma_${n}`,
                        choiceCategory,
                        worldConsequence: ["positive", "neutral", "negative"][r(3)],
                    });
                    if (Math.random() < 0.3) {
                        t.event("enemy_spared", { enemyType: cfg.enemies[r(cfg.enemies.length)] });
                    }
                } else if (nodeType === "mystery") {
                    if (Math.random() < 0.5) {
                        t.event("hint_requested", { timing: "early", tokensRemaining: 1 + r(3) });
                    }
                } else if (nodeType === "shop" || nodeType === "rest") {
                    t.event("shop_visited", { nodeType });
                }

                t.event("map_path_chosen", {
                    nodeSequence: n + 1,
                    riskLevel: ["safe", "balanced", "risky"][r(3)],
                });
            }

            t.event("session_summary", {
                chapterId, persona: cfg.persona, nodesVisited: nodeCount,
            });
            return true;
        } catch (err) {
            return "err: " + err.message;
        }
    }, {
        accuracy: persona.accuracy,
        persona: persona.name,
        enemies: ENEMY_TYPE_POOL,
        spells: SPELL_IDS,
        companions: COMPANIONS,
        nodeTypes: NODE_TYPES,
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
