/**
 * play-and-capture.js — Drives Concept Cascade through real game
 * sessions via Puppeteer and captures the resulting telemetry events
 * to a CSV file. Events are emitted by the actual game code
 * (telemetry.event(...)), not synthesized.
 *
 * Strategy for speed:
 *   - One Chrome page per worker, reused across sessions (no reloads).
 *     Between sessions the bot calls k.go("menu") to reset.
 *   - KAPLAY timeScale = 12 → game logic runs 12× faster
 *   - Bot builds many towers per wave to maximise events per session
 *   - Tight polling intervals (200ms)
 *   - Bot reads the current question's correctIndex from window.__edgameBot
 *     (exposed by questionEngine.js when ?bot=1 is in the URL)
 *
 * Usage:
 *   node play-and-capture.js [targetRows] [parallelPages]
 *
 * Defaults: 50000 rows, 6 parallel pages.
 *
 * Output:
 *   reports/sample-telemetry/telemetry_events.csv
 */

const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");

// ------------------------------------------------------------------
//  CLI / config
// ------------------------------------------------------------------
const REPO_ROOT = "/Users/yousefradwan/Library/CloudStorage/GoogleDrive-radwanf2025@gmail.com/My Drive/Yousef/KAUST/TIEVenture";
const TARGET_ROWS    = parseInt(process.argv[2] || "50000", 10);
const PARALLEL_PAGES = parseInt(process.argv[3] || "2", 10);
const GAME_URL       = "http://127.0.0.1:8899/apps/games/concept-cascade/index.html?bot=1";
const OUTPUT_PATH    = path.join(REPO_ROOT, "reports", "sample-telemetry", "telemetry_events.csv");
const TIME_SCALE     = 15;
const SESSION_TIMEOUT_MS = 90_000;
const MAX_SESSIONS_PER_PAGE = 2000;
const VERBOSE = process.env.VERBOSE === "1";

// CSV columns — flat schema covering all event types
const CSV_COLUMNS = [
    "session_id",
    "student_id",
    "persona",
    "event_id",
    "event_type",
    "ts_iso",
    "ts_ms",
    "session_offset_ms",
    "wave_number",
    "question_id",
    "subject",
    "difficulty",
    "correct",
    "response_time_ms",
    "context",
    "tower_type",
    "tile_col",
    "tile_row",
    "gold_spent",
    "old_level",
    "new_level",
    "success",
    "difficulty_jump",
    "total_enemies",
    "enemies_killed",
    "enemies_leaked",
    "interest",
    "bonus_gold",
    "synergy_id",
    "synergy_name",
    "enemy_type",
    "knowledge_component",
    "reward",
    "live_cost",
    "lives_remaining",
    "amount",
    "remaining_prep_time",
];

// Persona definitions. `towers` = how many builds the bot attempts
// each prep phase (more = more events per session).
const PERSONAS = [
    { name: "strong_student",   accuracy: 0.92, thinkMs: () => 800  + Math.random() * 1200, towers: 6, diverse: true,  earlyCall: 0.4, upgradeChance: 0.55 },
    { name: "average_student",  accuracy: 0.65, thinkMs: () => 1500 + Math.random() * 2500, towers: 5, diverse: true,  earlyCall: 0.2, upgradeChance: 0.35 },
    { name: "struggling_student", accuracy: 0.42, thinkMs: () => 3000 + Math.random() * 4000, towers: 4, diverse: false, earlyCall: 0.1, upgradeChance: 0.20 },
    { name: "risk_taker",       accuracy: 0.70, thinkMs: () => 600  + Math.random() * 1200, towers: 6, diverse: true,  earlyCall: 0.7, upgradeChance: 0.45 },
    { name: "methodical",       accuracy: 0.85, thinkMs: () => 2500 + Math.random() * 3500, towers: 6, diverse: true,  earlyCall: 0.0, upgradeChance: 0.65 },
    { name: "guesser",          accuracy: 0.30, thinkMs: () => 400  + Math.random() * 800,  towers: 4, diverse: false, earlyCall: 0.5, upgradeChance: 0.25 },
];

// Map1 buildable tiles — pre-computed avoiding path/blocked + HUD strips.
const BUILDABLE_TILES = (() => {
    const grid = [
        "XBBBBBBBBXBBBBBBBBBB",
        "XBBBBBBBBXBBBBBBBBBB",
        "PPPPPBBBBXBBBBBPPPPP",
        "BBBBPBBBBXBBBBBPBBBB",
        "BBBBPBBBBBBBBBBPBBBB",
        "BBBBPPPPPPPPPPPPBBBB",
        "BBBBBBBBBBBBBBBXBBBB",
        "BBBPPPPPPPPPBBBXBBBB",
        "BBBPBBBBBBBPBBBXBBBB",
        "BBBPBBBBBBBPPPPXBBBB",
        "XXXPBBBBBBBBBBBXBBBB",
    ];
    const TILE = 64;
    const tiles = [];
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            if (grid[r][c] === "B") {
                const y = r * TILE + TILE / 2;
                if (y < 50 || y >= 660) continue;
                tiles.push({ col: c, row: r, x: c * TILE + TILE / 2, y });
            }
        }
    }
    return tiles;
})();

// ------------------------------------------------------------------
//  CSV writer (streaming)
// ------------------------------------------------------------------
function escapeCsv(v) {
    if (v === undefined || v === null) return "";
    let s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        s = '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
}

function rowFromEvent(ctx, evt) {
    const p = evt.payload || {};
    return {
        session_id:        ctx.sessionId,
        student_id:        ctx.studentId,
        persona:           ctx.persona,
        event_id:          evt.id,
        event_type:        evt.type,
        ts_iso:            new Date(evt.ts).toISOString(),
        ts_ms:             evt.ts,
        session_offset_ms: evt.ts - ctx.sessionStartTs,
        wave_number:       p.waveNumber ?? p.wave ?? "",
        question_id:       p.questionId ?? "",
        subject:           p.subject ?? "",
        difficulty:        p.difficulty ?? "",
        correct:           p.correct === undefined ? "" : (p.correct ? "true" : "false"),
        response_time_ms:  p.responseTimeMs ?? "",
        context:           p.context ?? "",
        tower_type:        p.towerType ?? "",
        tile_col:          p.tileCol ?? "",
        tile_row:          p.tileRow ?? "",
        gold_spent:        p.goldSpent ?? "",
        old_level:         p.oldLevel ?? "",
        new_level:         p.newLevel ?? "",
        success:           p.success === undefined ? "" : (p.success ? "true" : "false"),
        difficulty_jump:   p.difficultyJump ?? "",
        total_enemies:     p.totalEnemies ?? "",
        enemies_killed:    p.enemiesKilled ?? "",
        enemies_leaked:    p.enemiesLeaked ?? "",
        interest:          p.interest ?? "",
        bonus_gold:        p.bonusGold ?? "",
        synergy_id:        p.synergyId ?? "",
        synergy_name:      p.synergyName ?? "",
        enemy_type:        p.enemyType ?? "",
        knowledge_component: p.knowledgeComponent ?? "",
        reward:            p.reward ?? "",
        live_cost:         p.liveCost ?? "",
        lives_remaining:   p.livesRemaining ?? "",
        amount:            p.amount ?? "",
        remaining_prep_time: p.remainingPrepTime ?? "",
    };
}

class CsvWriter {
    constructor(filePath, columns) {
        this.fd = fs.openSync(filePath, "w");
        this.columns = columns;
        this.rowCount = 0;
        fs.writeSync(this.fd, columns.join(",") + "\n");
    }
    write(row) {
        const line = this.columns.map((c) => escapeCsv(row[c])).join(",") + "\n";
        fs.writeSync(this.fd, line);
        this.rowCount++;
    }
    close() {
        fs.closeSync(this.fd);
    }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------------------
//  Per-session play loop (uses the page already on the menu scene)
// ------------------------------------------------------------------
async function playOneSession(page, persona, studentId, csv, summary, log) {
    // Reset KAPLAY game state by navigating to menu and clicking PLAY
    // (no page reload — keeps Chrome warm).
    await page.evaluate(() => {
        try {
            // Force any prior session to end so events get persisted
            const t = window.__edgameBot.telemetry;
            if (t && t.getCurrentSession()) {
                t.endSession({ score: 0, forced: true });
            }
            // Clear localStorage so we read only the next session
            localStorage.removeItem("concept_cascade_sessions");
            // Go back to menu
            window.__edgameBot.k.go("menu");
        } catch (e) { /* ignore */ }
    });
    await sleep(150);

    // Click PLAY (centred at 640, 450)
    await page.mouse.click(640, 450);

    // Wait for battlefield phase = "prep"
    const ready = await page.waitForFunction(
        () => {
            try { return window.__edgameBot.gameStateStore.getState().phase === "prep"; }
            catch { return false; }
        },
        { timeout: 6000, polling: 100 },
    ).then(() => true).catch(() => false);

    if (!ready) {
        log("battlefield never reached prep, skipping");
        return 0;
    }

    const sessionStart = Date.now();
    const towerKeys = ["1", "2", "3", "4"];
    const usedTiles = new Set();
    let towersBuilt = 0;
    let waveCount = 0;
    let combatEmptyTicks = 0;  // counts polls where combat phase has 0 enemies

    while (Date.now() - sessionStart < SESSION_TIMEOUT_MS) {
        const state = await page.evaluate(() => {
            try {
                const s = window.__edgameBot.gameStateStore.getState();
                const enemies = window.__edgameBot.k.get("enemy").length;
                return { phase: s.phase, wave: s.wave, gold: s.gold, lives: s.lives, enemies };
            } catch { return null; }
        });
        if (!state) break;
        if (state.phase === "ended") break;
        if (state.lives <= 0) break;

        if (VERBOSE) log(`tick phase=${state.phase} wave=${state.wave} lives=${state.lives} enemies=${state.enemies} towers=${towersBuilt}`);

        // ---------- PREP PHASE ----------
        if (state.phase === "prep") {
            // Build N towers
            const target = persona.towers;
            for (let i = 0; i < target; i++) {
                const towerKey = persona.diverse
                    ? towerKeys[Math.floor(Math.random() * 4)]
                    : towerKeys[0];
                await page.keyboard.press(towerKey);

                // Pick an unused buildable tile
                let tile = null;
                for (let attempt = 0; attempt < BUILDABLE_TILES.length; attempt++) {
                    const cand = BUILDABLE_TILES[Math.floor(Math.random() * BUILDABLE_TILES.length)];
                    const key = cand.col + "," + cand.row;
                    if (!usedTiles.has(key)) { tile = cand; break; }
                }
                if (!tile) break;

                const beforeServed = await page.evaluate(() =>
                    (window.__edgameBot.questionsServed || 0));

                await page.mouse.click(tile.x, tile.y);

                // Wait for question overlay (questionsServed counter increment)
                const questionAppeared = await page.waitForFunction(
                    (prev) => (window.__edgameBot.questionsServed || 0) > prev,
                    { timeout: 2000, polling: 50 },
                    beforeServed,
                ).then(() => true).catch(() => false);

                if (!questionAppeared) continue;

                // Mark tile as used
                usedTiles.add(tile.col + "," + tile.row);

                // Persona thinks
                const thinkWall = Math.round(persona.thinkMs() / TIME_SCALE);
                await sleep(thinkWall);

                // Answer based on persona accuracy
                const correctIdx = await page.evaluate(() =>
                    window.__edgameBot.currentQuestion.correctIndex);
                const wantCorrect = Math.random() < persona.accuracy;
                let answerIdx;
                if (wantCorrect) {
                    answerIdx = correctIdx;
                } else {
                    do { answerIdx = Math.floor(Math.random() * 4); }
                    while (answerIdx === correctIdx);
                }
                await page.keyboard.press(String(answerIdx + 1));

                // Wait for the question-overlay KAPLAY object to be
                // destroyed (otherwise the next tile click hits the
                // still-visible answer buttons and misses the grid).
                await page.waitForFunction(
                    () => {
                        try { return window.__edgameBot.k.get("question-overlay").length === 0; }
                        catch { return true; }
                    },
                    { timeout: 1500, polling: 30 },
                ).catch(() => { });

                towersBuilt++;
            }

            // Maybe upgrade
            if (towersBuilt > 0 && Math.random() < persona.upgradeChance) {
                const tx = await page.evaluate(() => {
                    const ts = window.__edgameBot.gameStateStore.getState().towers;
                    if (ts.length === 0) return null;
                    const t = ts[Math.floor(Math.random() * ts.length)];
                    return { col: t.tileCol, row: t.tileRow };
                });
                if (tx) {
                    const beforeServed = await page.evaluate(() =>
                        (window.__edgameBot.questionsServed || 0));
                    await page.mouse.click(tx.col * 64 + 32, tx.row * 64 + 32);
                    const ok = await page.waitForFunction(
                        (prev) => (window.__edgameBot.questionsServed || 0) > prev,
                        { timeout: 1500, polling: 50 },
                        beforeServed,
                    ).then(() => true).catch(() => false);
                    if (ok) {
                        await sleep(Math.round(persona.thinkMs() / TIME_SCALE));
                        const ci = await page.evaluate(() =>
                            window.__edgameBot.currentQuestion.correctIndex);
                        const idx = Math.random() < persona.accuracy
                            ? ci
                            : (ci + 1 + Math.floor(Math.random() * 3)) % 4;
                        await page.keyboard.press(String(idx + 1));
                        await page.waitForFunction(
                            () => {
                                try { return window.__edgameBot.k.get("question-overlay").length === 0; }
                                catch { return true; }
                            },
                            { timeout: 1500, polling: 30 },
                        ).catch(() => { });
                    }
                }
            }

            // Early call or wait briefly for prep timer to tick down
            if (Math.random() < persona.earlyCall) {
                await page.keyboard.press("Space");
                await sleep(150);
            } else {
                // Prep is 15s game time → 15/timeScale wall ≈ 1.5s at timeScale=10
                await sleep(1700);
            }
            combatEmptyTicks = 0;
            continue;
        }

        // ---------- COMBAT PHASE ----------
        if (state.phase === "combat") {
            // The wave is "really" complete when there are no live enemies
            // AND the wave's spawn groups have all spawned. Since the
            // battlefield's update loop sets phase=combat throughout BOTH
            // active combat AND the wave-results overlay, we detect overlay
            // by polling: if we see 0 enemies twice in a row, the overlay
            // is up — press Enter to dismiss it.
            if (state.enemies === 0) {
                combatEmptyTicks++;
                if (combatEmptyTicks >= 2) {
                    await page.keyboard.press("Enter");
                    await sleep(250);
                    combatEmptyTicks = 0;
                    waveCount++;
                    // Free up some tiles for later waves
                    if (waveCount % 3 === 0) usedTiles.clear();
                    continue;
                }
            } else {
                combatEmptyTicks = 0;
            }
            await sleep(220);
            continue;
        }

        // Unknown phase — bail
        await sleep(200);
    }

    // Force end if not already ended. AWAIT the async endSession so its
    // localStorage write completes before we read.
    await page.evaluate(async () => {
        try {
            const t = window.__edgameBot.telemetry;
            if (t.getCurrentSession()) {
                await t.endSession({ score: 0, forced: true });
            }
        } catch { }
    });

    // Wait for the session to actually appear in localStorage (handles
    // the race where the battlefield's endGame() fires telemetry.endSession
    // without awaiting it — its async write may not have completed yet).
    await page.waitForFunction(
        () => {
            try {
                const t = window.__edgameBot.telemetry;
                if (t.getCurrentSession() !== null) return false;
                const raw = localStorage.getItem("concept_cascade_sessions");
                return raw && JSON.parse(raw).length > 0;
            } catch { return false; }
        },
        { timeout: 3000, polling: 80 },
    ).catch(() => { });

    // Read events from localStorage
    const sessions = await page.evaluate(() => {
        try {
            const raw = localStorage.getItem("concept_cascade_sessions");
            return raw ? JSON.parse(raw) : [];
        } catch { return []; }
    });

    if (sessions.length === 0) {
        log("no session captured");
        return 0;
    }

    const session = sessions[0];
    const events = session.events || [];
    const ctx = {
        sessionId: session.id,
        studentId,
        persona: persona.name,
        sessionStartTs: session.startedAt,
    };
    for (const evt of events) csv.write(rowFromEvent(ctx, evt));
    summary.sessions++;
    summary.events += events.length;

    log(`done — ${events.length} events (total: ${csv.rowCount})`);
    return events.length;
}

// ------------------------------------------------------------------
//  Per-page worker
// ------------------------------------------------------------------
async function runPageWorker(browser, pageId, csv, summary, stopFlag) {
    const page = await browser.newPage();
    page._pageId = pageId;
    await page.setViewport({ width: 1280, height: 720 });

    page.on("pageerror", () => { /* swallow — the bot polls game state directly */ });

    // First-time navigation. Install a clock-speedup BEFORE the game
    // module loads. KAPLAY computes dt() from the `t` parameter that
    // browsers pass to requestAnimationFrame callbacks, so the only
    // way to make KAPLAY run faster is to wrap rAF so each callback
    // sees an inflated timestamp. We also patch performance.now() and
    // Date.now() so that telemetry timestamps and the bot's time
    // measurements stay consistent with the game's perception.
    await page.evaluateOnNewDocument((scale) => {
        const realRAF      = window.requestAnimationFrame.bind(window);
        const realPerfNow  = performance.now.bind(performance);
        const realDateNow  = Date.now.bind(Date);

        const startReal = realPerfNow();
        const startDate = realDateNow();

        // Patched perf.now(): linear in real time, scaled
        performance.now = function () {
            return (realPerfNow() - startReal) * scale;
        };
        Date.now = function () {
            return startDate + (realPerfNow() - startReal) * scale;
        };

        // Patched rAF: callback sees a fake timestamp that advances
        // `scale` times faster than wall clock.
        window.requestAnimationFrame = function (cb) {
            return realRAF((realT) => {
                const fakeT = (realT - startReal) * scale;
                cb(fakeT);
            });
        };

        window.__BOT_TIMESCALE = scale;
    }, TIME_SCALE);

    try {
        await page.goto(GAME_URL, { waitUntil: "networkidle0", timeout: 15_000 });
        await page.waitForFunction(
            () => window.__edgameBot && window.__edgameBot.k,
            { timeout: 10_000 },
        );
    } catch (err) {
        console.log(`[p${pageId}] Initial load failed: ${err.message}`);
        await page.close();
        return;
    }

    let sessionIdx = 0;
    while (!stopFlag.stop && sessionIdx < MAX_SESSIONS_PER_PAGE) {
        sessionIdx++;
        const persona = PERSONAS[Math.floor(Math.random() * PERSONAS.length)];
        const studentId = `student_${pageId}_${sessionIdx.toString().padStart(3, "0")}`;
        const log = (msg) => process.stdout.write(`[p${pageId}/${sessionIdx}/${persona.name}] ${msg}\n`);

        try {
            await playOneSession(page, persona, studentId, csv, summary, log);
        } catch (err) {
            log(`ERROR: ${err.message}`);
            // If browser disconnected, bail out of this worker
            if (err.message.includes("detached") || err.message.includes("Target closed")) {
                break;
            }
        }

        if (csv.rowCount >= TARGET_ROWS) {
            stopFlag.stop = true;
            break;
        }
    }

    try { await page.close(); } catch { }
}

// ------------------------------------------------------------------
//  Main
// ------------------------------------------------------------------
(async () => {
    process.stdout.write(`Target: ${TARGET_ROWS} rows across ${PARALLEL_PAGES} parallel pages\n`);
    process.stdout.write(`Output: ${OUTPUT_PATH}\n`);
    process.stdout.write(`Game URL: ${GAME_URL}\n`);
    process.stdout.write(`KAPLAY timeScale: ${TIME_SCALE}x\n\n`);

    const csv = new CsvWriter(OUTPUT_PATH, CSV_COLUMNS);
    const summary = { sessions: 0, events: 0 };
    const stopFlag = { stop: false };

    const browser = await puppeteer.launch({
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        headless: "new",
        args: [
            "--use-gl=angle",
            "--use-angle=swiftshader",
            "--enable-webgl",
            "--ignore-gpu-blocklist",
            "--no-sandbox",
            "--disable-dev-shm-usage",
        ],
    });

    const startTime = Date.now();

    // Stagger worker starts to avoid CPU spike
    const workers = [];
    for (let i = 0; i < PARALLEL_PAGES; i++) {
        workers.push(runPageWorker(browser, i + 1, csv, summary, stopFlag));
        await sleep(500);
    }

    // Periodic progress reporter
    const progressTimer = setInterval(() => {
        const pct = Math.round((csv.rowCount / TARGET_ROWS) * 100);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
        process.stdout.write(`PROGRESS rows=${csv.rowCount}/${TARGET_ROWS} (${pct}%) sessions=${summary.sessions} elapsed=${elapsed}s\n`);
    }, 15_000);

    await Promise.all(workers);
    clearInterval(progressTimer);

    csv.close();
    try { await browser.close(); } catch { }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    process.stdout.write(`\n=== Done ===\n`);
    process.stdout.write(`Sessions: ${summary.sessions}\n`);
    process.stdout.write(`Events:   ${csv.rowCount}\n`);
    process.stdout.write(`Elapsed:  ${elapsed}s\n`);
    process.stdout.write(`Output:   ${OUTPUT_PATH}\n`);
    process.stdout.write(`File size: ${(fs.statSync(OUTPUT_PATH).size / 1024 / 1024).toFixed(2)} MB\n`);
})().catch((err) => {
    console.error("FATAL:", err);
    process.exit(1);
});
