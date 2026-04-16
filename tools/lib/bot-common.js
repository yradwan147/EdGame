/**
 * bot-common.js — shared infrastructure for per-game Puppeteer bot
 * drivers. Each game supplies its own `playOneSession` function that
 * knows how to navigate the game's UI and trigger telemetry events;
 * this library handles the common pieces:
 *
 *   - CsvWriter streaming output with a flat 37-column schema
 *   - Persona definitions (6 archetypes)
 *   - Buildable-tile / target position helpers
 *   - Browser-per-worker launch + cleanup
 *   - rAF/perf.now/Date.now timescale patch
 *   - localStorage read-with-wait (handles the endSession race)
 *   - Main-loop orchestration with progress reporting
 */

const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");

// ------------------------------------------------------------------
//  CSV schema
// ------------------------------------------------------------------
const CSV_COLUMNS = [
    "session_id", "student_id", "persona", "event_id", "event_type",
    "ts_iso", "ts_ms", "session_offset_ms",
    "wave_number", "question_id", "subject", "difficulty",
    "correct", "response_time_ms", "context",
    "tower_type", "tile_col", "tile_row", "gold_spent",
    "old_level", "new_level", "success", "difficulty_jump",
    "total_enemies", "enemies_killed", "enemies_leaked",
    "interest", "bonus_gold",
    "synergy_id", "synergy_name",
    "enemy_type", "knowledge_component", "reward", "live_cost",
    "lives_remaining", "amount", "remaining_prep_time",
];

// ------------------------------------------------------------------
//  Personas — same 6 archetypes used for Concept Cascade
// ------------------------------------------------------------------
const PERSONAS = [
    { name: "strong_student",     accuracy: 0.92, thinkMs: () => 800  + Math.random() * 1200 },
    { name: "average_student",    accuracy: 0.65, thinkMs: () => 1500 + Math.random() * 2500 },
    { name: "struggling_student", accuracy: 0.42, thinkMs: () => 3000 + Math.random() * 4000 },
    { name: "risk_taker",         accuracy: 0.70, thinkMs: () => 600  + Math.random() * 1200 },
    { name: "methodical",         accuracy: 0.85, thinkMs: () => 2500 + Math.random() * 3500 },
    { name: "guesser",            accuracy: 0.30, thinkMs: () => 400  + Math.random() * 800  },
];

// ------------------------------------------------------------------
//  CSV writer
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
        session_id:          ctx.sessionId,
        student_id:          ctx.studentId,
        persona:             ctx.persona,
        event_id:            evt.id,
        event_type:          evt.type,
        ts_iso:              new Date(evt.ts).toISOString(),
        ts_ms:               evt.ts,
        session_offset_ms:   evt.ts - ctx.sessionStartTs,
        wave_number:         p.waveNumber ?? p.wave ?? "",
        question_id:         p.questionId ?? "",
        subject:             p.subject ?? "",
        difficulty:          p.difficulty ?? "",
        correct:             p.correct === undefined ? "" : (p.correct ? "true" : "false"),
        response_time_ms:    p.responseTimeMs ?? "",
        context:             p.context ?? "",
        tower_type:          p.towerType ?? "",
        tile_col:            p.tileCol ?? "",
        tile_row:            p.tileRow ?? "",
        gold_spent:          p.goldSpent ?? "",
        old_level:           p.oldLevel ?? "",
        new_level:           p.newLevel ?? "",
        success:             p.success === undefined ? "" : (p.success ? "true" : "false"),
        difficulty_jump:     p.difficultyJump ?? "",
        total_enemies:       p.totalEnemies ?? "",
        enemies_killed:      p.enemiesKilled ?? "",
        enemies_leaked:      p.enemiesLeaked ?? "",
        interest:            p.interest ?? "",
        bonus_gold:          p.bonusGold ?? "",
        synergy_id:          p.synergyId ?? "",
        synergy_name:        p.synergyName ?? "",
        enemy_type:          p.enemyType ?? "",
        knowledge_component: p.knowledgeComponent ?? "",
        reward:              p.reward ?? "",
        live_cost:           p.liveCost ?? "",
        lives_remaining:     p.livesRemaining ?? "",
        amount:              p.amount ?? "",
        remaining_prep_time: p.remainingPrepTime ?? "",
    };
}

class CsvWriter {
    constructor(filePath, columns = CSV_COLUMNS) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
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
    close() { fs.closeSync(this.fd); }
}

// ------------------------------------------------------------------
//  Time utilities
// ------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------------------
//  Browser launch + time-scale patch
// ------------------------------------------------------------------
async function launchBrowser() {
    return puppeteer.launch({
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
}

async function installTimeScale(page, scale) {
    await page.evaluateOnNewDocument((scale) => {
        const realRAF     = window.requestAnimationFrame.bind(window);
        const realPerfNow = performance.now.bind(performance);
        const startReal   = realPerfNow();
        const startDate   = Date.now();
        performance.now = function () {
            return (realPerfNow() - startReal) * scale;
        };
        Date.now = function () {
            return startDate + (realPerfNow() - startReal) * scale;
        };
        window.requestAnimationFrame = function (cb) {
            return realRAF((realT) => {
                const fakeT = (realT - startReal) * scale;
                cb(fakeT);
            });
        };
        window.__BOT_TIMESCALE = scale;
    }, scale);
}

// ------------------------------------------------------------------
//  localStorage read with endSession race handling
// ------------------------------------------------------------------
async function readLatestSession(page, storageKey) {
    // Force-end any active session, await the async write, then read.
    await page.evaluate(async () => {
        try {
            const t = window.__edgameBot && window.__edgameBot.telemetry;
            if (t && t.getCurrentSession()) {
                await t.endSession({ score: 0, forced: true });
            }
        } catch { }
    });
    await page.waitForFunction(
        (key) => {
            try {
                const t = window.__edgameBot && window.__edgameBot.telemetry;
                if (t && t.getCurrentSession() !== null) return false;
                const raw = localStorage.getItem(key);
                return raw && JSON.parse(raw).length > 0;
            } catch { return false; }
        },
        { timeout: 3000, polling: 80 },
        storageKey,
    ).catch(() => { });

    return await page.evaluate((key) => {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : [];
        } catch { return []; }
    }, storageKey);
}

// ------------------------------------------------------------------
//  Write one captured session to CSV
// ------------------------------------------------------------------
function writeSessionEvents(csv, session, studentId, persona) {
    const events = session.events || [];
    const ctx = {
        sessionId: session.id,
        studentId,
        persona,
        sessionStartTs: session.startedAt,
    };
    for (const evt of events) {
        csv.write(rowFromEvent(ctx, evt));
    }
    return events.length;
}

// ------------------------------------------------------------------
//  Main worker loop
// ------------------------------------------------------------------
/**
 * runMainLoop(opts)
 *
 * opts: {
 *   gameUrl:       string   — URL with ?bot=1
 *   storageKey:    string   — localStorage key where telemetry backs up sessions
 *   outputPath:    string   — CSV file to write
 *   targetRows:    number   — stop when reached
 *   parallelBrowsers: number
 *   timeScale:     number
 *   maxSessions:   number   — hard cap per worker
 *   playOneSession: async (ctx) => number  — worker's per-session logic; receives
 *                                            { page, persona, studentId, log, deps }
 *                                            and is responsible for driving the
 *                                            game UI. Does NOT need to handle
 *                                            localStorage read or session write —
 *                                            the loop does that after the callback
 *                                            returns. Must either:
 *                                              (a) complete the session (trigger
 *                                                  game-ended telemetry naturally), or
 *                                              (b) be prepared for force-end via
 *                                                  readLatestSession().
 * }
 */
async function runMainLoop(opts) {
    const {
        gameUrl, storageKey, outputPath, targetRows,
        parallelBrowsers, timeScale, maxSessions = 4000,
        playOneSession,
    } = opts;

    process.stdout.write(`Target: ${targetRows} rows across ${parallelBrowsers} browsers\n`);
    process.stdout.write(`Game URL: ${gameUrl}\n`);
    process.stdout.write(`timeScale: ${timeScale}x\n`);
    process.stdout.write(`Output: ${outputPath}\n\n`);

    const csv = new CsvWriter(outputPath);
    const summary = { sessions: 0, events: 0 };
    const stopFlag = { stop: false };
    const startTime = Date.now();

    async function worker(workerId) {
        const browser = await launchBrowser();
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
        page.on("pageerror", () => { /* swallow */ });

        const log = (msg) => process.stdout.write(`[w${workerId}] ${msg}\n`);

        try {
            await installTimeScale(page, timeScale);
            await page.goto(gameUrl, { waitUntil: "networkidle0", timeout: 20_000 });
            await page.waitForFunction(
                () => window.__edgameBot && window.__edgameBot.k,
                { timeout: 10_000 },
            );
        } catch (err) {
            log(`initial load failed: ${err.message}`);
            try { await browser.close(); } catch { }
            return;
        }

        let sessionIdx = 0;
        while (!stopFlag.stop && sessionIdx < maxSessions) {
            sessionIdx++;
            const persona = PERSONAS[Math.floor(Math.random() * PERSONAS.length)];
            const studentId = `student_w${workerId}_${sessionIdx.toString().padStart(3, "0")}`;
            const sessionLog = (msg) => process.stdout.write(`[w${workerId}/${sessionIdx}/${persona.name}] ${msg}\n`);

            try {
                await playOneSession({ page, persona, studentId, log: sessionLog, deps: {} });

                const sessions = await readLatestSession(page, storageKey);
                if (sessions.length === 0) {
                    sessionLog("no session captured");
                    // Clear localStorage for next session
                    await page.evaluate((key) => { try { localStorage.removeItem(key); } catch { } }, storageKey);
                    continue;
                }
                const session = sessions[0];
                const written = writeSessionEvents(csv, session, studentId, persona.name);
                summary.sessions++;
                summary.events += written;
                sessionLog(`done — ${written} events (total: ${csv.rowCount})`);

                // Clear localStorage so next session isn't confused with this one
                await page.evaluate((key) => { try { localStorage.removeItem(key); } catch { } }, storageKey);
            } catch (err) {
                sessionLog(`ERROR: ${err.message}`);
                if (err.message.includes("detached") || err.message.includes("Target closed")) {
                    break;
                }
            }

            if (csv.rowCount >= targetRows) {
                stopFlag.stop = true;
                break;
            }
        }

        try { await page.close(); } catch { }
        try { await browser.close(); } catch { }
    }

    const workers = [];
    for (let i = 0; i < parallelBrowsers; i++) {
        workers.push(worker(i + 1));
        await sleep(800);
    }

    const progressTimer = setInterval(() => {
        const pct = Math.round((csv.rowCount / targetRows) * 100);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
        process.stdout.write(`PROGRESS rows=${csv.rowCount}/${targetRows} (${pct}%) sessions=${summary.sessions} elapsed=${elapsed}s\n`);
    }, 15_000);

    await Promise.all(workers);
    clearInterval(progressTimer);

    csv.close();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    process.stdout.write(`\n=== Done ===\n`);
    process.stdout.write(`Sessions: ${summary.sessions}\n`);
    process.stdout.write(`Events:   ${csv.rowCount}\n`);
    process.stdout.write(`Elapsed:  ${elapsed}s\n`);
    process.stdout.write(`Output:   ${outputPath}\n`);
    process.stdout.write(`File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB\n`);
}

module.exports = {
    CSV_COLUMNS,
    PERSONAS,
    CsvWriter,
    sleep,
    launchBrowser,
    installTimeScale,
    readLatestSession,
    writeSessionEvents,
    runMainLoop,
};
