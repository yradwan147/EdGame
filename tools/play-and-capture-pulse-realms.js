/**
 * play-and-capture-pulse-realms.js — Drives Pulse Realms 3v3 arena
 * matches via Puppeteer to generate real telemetry events.
 *
 * Per session flow:
 *   - Press Enter at menu → go to roleSelect
 *   - Press 1/2/3 to pick a role → press Enter → arenaBriefing
 *   - Press Enter → arena
 *   - Move to center of map (WASD) so abilities are in range
 *   - Loop: press 1 or 2 → wait for question overlay → answer
 *          with persona-weighted accuracy → wait for overlay to clear
 *   - After ~N abilities OR ~20s, press ESC to force-end the match
 *     (arena.js has an ESC handler that calls finalizeMatch + transitions
 *     to postGame, so the session is persisted cleanly)
 *
 * Usage:
 *   node tools/play-and-capture-pulse-realms.js [targetRows] [parallelBrowsers]
 * Defaults: 10000 rows, 2 browsers.
 */

const { sleep, runMainLoop } = require("./lib/bot-common.js");
const path = require("path");

const REPO_ROOT = "/Users/yousefradwan/Library/CloudStorage/GoogleDrive-radwanf2025@gmail.com/My Drive/Yousef/KAUST/TIEVenture";
const TARGET_ROWS       = parseInt(process.argv[2] || "10000", 10);
const PARALLEL_BROWSERS = parseInt(process.argv[3] || "2", 10);
const TIME_SCALE        = 15;

const GAME_URL  = "http://127.0.0.1:8899/apps/games/pulse-realms/index.html?bot=1";
const OUT_PATH  = path.join(REPO_ROOT, "reports", "sample-telemetry", "pulse_realms_events.csv");
const STORAGE_KEY = "pulse_realms_sessions";

const ABILITY_KEYS = ["1", "2"];
const ROLE_KEYS    = ["1", "2", "3"]; // attacker, healer, builder

async function playOneSession({ page, persona, studentId, log, deps: _deps }) {
    // We're sitting on some scene. For the FIRST session on this page we'll
    // be on the menu; for subsequent sessions we might be on postGame. Use
    // k.go("menu") to reset.
    await page.evaluate(() => {
        try { window.__edgameBot.k.go("menu"); } catch { }
    });
    await sleep(200);

    // Menu: press Enter → roleSelect
    await page.keyboard.press("Enter");
    await sleep(200);

    // RoleSelect: press a role key then Enter
    const roleKey = ROLE_KEYS[Math.floor(Math.random() * ROLE_KEYS.length)];
    await page.keyboard.press(roleKey);
    await sleep(100);
    await page.keyboard.press("Enter");
    await sleep(200);

    // ArenaBriefing: Enter → arena
    await page.keyboard.press("Enter");

    // Wait for arena to load (phase check — arena emits game_started on load)
    const arenaReady = await page.waitForFunction(
        () => {
            try {
                const s = window.__edgameBot.telemetry.getCurrentSession();
                return s && s.events.some((e) => e.type === "game_started");
            } catch { return false; }
        },
        { timeout: 6000, polling: 100 },
    ).then(() => true).catch(() => false);

    if (!arenaReady) {
        log("arena never emitted game_started");
        return;
    }

    const sessionStart = Date.now();
    const ABILITY_COUNT_TARGET = 8 + Math.floor(Math.random() * 6); // 8-13 abilities
    const MAX_WALL_MS = 25_000;

    // Move player toward center (arena is 1280x720; center ~ 640x360)
    // Player spawn is somewhere in the upper-left area based on arena1.js,
    // so move down+right briefly.
    for (const key of ["s", "d"]) {
        await page.keyboard.down(key);
    }
    await sleep(500);
    for (const key of ["s", "d"]) {
        await page.keyboard.up(key);
    }

    let abilitiesUsed = 0;
    while (
        abilitiesUsed < ABILITY_COUNT_TARGET &&
        Date.now() - sessionStart < MAX_WALL_MS
    ) {
        // Check match state
        const ended = await page.evaluate(() => {
            try {
                return !window.__edgameBot.telemetry.getCurrentSession();
            } catch { return true; }
        });
        if (ended) break;

        // Press an ability key
        const key = ABILITY_KEYS[Math.floor(Math.random() * ABILITY_KEYS.length)];
        const beforeServed = await page.evaluate(() =>
            (window.__edgameBot.questionsServed || 0));

        await page.keyboard.press(key);

        // Did a question overlay appear? (if ability was out of range, no question fires)
        const qAppeared = await page.waitForFunction(
            (prev) => (window.__edgameBot.questionsServed || 0) > prev,
            { timeout: 900, polling: 40 },
            beforeServed,
        ).then(() => true).catch(() => false);

        if (!qAppeared) {
            // Move a bit and retry
            const dirKey = ["w", "a", "s", "d"][Math.floor(Math.random() * 4)];
            await page.keyboard.down(dirKey);
            await sleep(200);
            await page.keyboard.up(dirKey);
            continue;
        }

        // Think then answer
        await sleep(Math.round(persona.thinkMs() / TIME_SCALE));

        const correctIdx = await page.evaluate(() => {
            try { return window.__edgameBot.currentQuestion.correctIndex; }
            catch { return -1; }
        });
        if (correctIdx < 0) continue;

        const wantCorrect = Math.random() < persona.accuracy;
        let idx;
        if (wantCorrect) {
            idx = correctIdx;
        } else {
            do { idx = Math.floor(Math.random() * 4); } while (idx === correctIdx);
        }
        await page.keyboard.press(String(idx + 1));

        // Wait for overlay to clear
        await page.waitForFunction(
            () => {
                try { return window.__edgameBot.k.get("question-overlay").length === 0; }
                catch { return true; }
            },
            { timeout: 1500, polling: 30 },
        ).catch(() => { });

        abilitiesUsed++;
    }

    // Force end via ESC — arena.js handles this by calling finalizeMatch
    // and transitioning to postGame (telemetry.endSession already called).
    await page.keyboard.press("Escape");
    await sleep(400);
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
