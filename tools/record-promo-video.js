/**
 * record-promo-video.js — record a 30–60 s MP4 of one EdGame game being
 * played by a Puppeteer bot. Used to produce promotional clips.
 *
 * Captures the canvas via Chrome DevTools Protocol's `Page.startScreencast`
 * (PNG frames over WebSocket), pipes the decoded PNGs into ffmpeg via stdin,
 * and ffmpeg encodes to H.264 MP4.
 *
 * Plays the game at REAL TIME (no rAF time-scale patch — different from
 * the dataset bots which run at 15× to generate events fast).
 *
 * Usage:
 *   node tools/record-promo-video.js --game pulse-realms --duration 45
 *   node tools/record-promo-video.js --game knowledge-quest --duration 60 --out reports/promo-videos/kq.mp4
 *
 * Flags:
 *   --game <id>        pulse-realms | concept-cascade | knowledge-quest | lab-explorer | survival-equation
 *   --duration <sec>   how long to record (default 45)
 *   --out <path>       output MP4 path (default reports/promo-videos/<game>.mp4)
 *   --fps <n>          target fps (default 30; lower = smaller file)
 *   --port <n>         dev server port (default 8899)
 */

const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const puppeteer = require("puppeteer-core");

const REPO_ROOT = "/Users/yousefradwan/Library/CloudStorage/GoogleDrive-radwanf2025@gmail.com/My Drive/Yousef/KAUST/TIEVenture";
const VALID_GAMES = ["pulse-realms", "concept-cascade", "knowledge-quest", "lab-explorer", "survival-equation"];

function parseArgs(argv) {
    const out = { game: null, duration: 45, fps: 30, port: 8899, out: null };
    for (let i = 2; i < argv.length; i++) {
        const a = argv[i], v = argv[i + 1];
        if (a === "--game") { out.game = v; i++; }
        else if (a === "--duration") { out.duration = parseInt(v, 10); i++; }
        else if (a === "--out") { out.out = v; i++; }
        else if (a === "--fps") { out.fps = parseInt(v, 10); i++; }
        else if (a === "--port") { out.port = parseInt(v, 10); i++; }
    }
    return out;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function recordOne({ game, duration, fps, port, outPath }) {
    if (!VALID_GAMES.includes(game)) {
        throw new Error(`unknown --game: ${game} (valid: ${VALID_GAMES.join(", ")})`);
    }
    const sessionFile = path.join(__dirname, "promo-sessions", `${game}.js`);
    if (!fs.existsSync(sessionFile)) {
        throw new Error(`no promo session script at ${sessionFile}`);
    }
    const playPromoSession = require(sessionFile);
    if (typeof playPromoSession !== "function") {
        throw new Error(`${sessionFile} must export a function`);
    }

    const gameUrl = `http://127.0.0.1:${port}/apps/games/${game}/index.html?bot=1`;
    const finalOut = outPath || path.join(REPO_ROOT, "reports", "promo-videos", `${game}.mp4`);
    fs.mkdirSync(path.dirname(finalOut), { recursive: true });

    process.stdout.write(`Recording: ${game}\n`);
    process.stdout.write(`URL:       ${gameUrl}\n`);
    process.stdout.write(`Duration:  ${duration}s\n`);
    process.stdout.write(`Output:    ${finalOut}\n\n`);

    /* ---- 1. launch headless Chrome ---- */
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
            "--hide-scrollbars",
            "--mute-audio",
            "--window-size=1280,720",
        ],
        defaultViewport: { width: 1280, height: 720 },
    });
    const page = await browser.newPage();
    page.on("pageerror", (err) => { process.stderr.write(`pageerror: ${err.message}\n`); });
    page.on("requestfailed", (req) => {
        process.stderr.write(`reqfailed: ${req.url()} — ${req.failure()?.errorText}\n`);
    });
    page.on("console", (msg) => {
        const t = msg.type();
        if (process.env.PROMO_VERBOSE === "1" || t === "error" || t === "warning") {
            process.stderr.write(`page-${t}: ${msg.text()}\n`);
        }
    });

    /* ---- 2. ffmpeg pipe (image2pipe → MP4) ---- */
    const ff = spawn("ffmpeg", [
        "-y",
        "-loglevel", "warning",
        "-f", "image2pipe",
        "-framerate", String(fps),
        "-i", "-",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "veryfast",
        "-movflags", "+faststart",
        "-r", String(fps),
        finalOut,
    ], { stdio: ["pipe", "inherit", "inherit"] });

    ff.on("error", (err) => {
        process.stderr.write(`ffmpeg error: ${err.message}\n`);
    });

    /* ---- 3. open CDP session, start screencast ---- */
    const client = await page.createCDPSession();
    let frameCount = 0;
    let stopping = false;

    client.on("Page.screencastFrame", async ({ data, sessionId }) => {
        if (stopping) return;
        try {
            const buf = Buffer.from(data, "base64");
            ff.stdin.write(buf);
            frameCount++;
        } catch { /* writing to a stale stream during shutdown — ignore */ }
        try { await client.send("Page.screencastFrameAck", { sessionId }); } catch { }
    });

    /* ---- 4. navigate + wait for game ready ---- */
    try {
        await page.goto(gameUrl, { waitUntil: "networkidle0", timeout: 30_000 });
        await page.waitForFunction(() => window.__edgameBot && window.__edgameBot.k, { timeout: 15_000, polling: 100 });
    } catch (err) {
        process.stderr.write(`load failed: ${err.message}\n`);
        try { ff.stdin.end(); } catch { }
        try { await browser.close(); } catch { }
        throw err;
    }

    /* ---- 5. start recording ---- */
    await client.send("Page.startScreencast", {
        format: "png",
        maxWidth: 1280,
        maxHeight: 720,
        everyNthFrame: Math.max(1, Math.round(60 / fps)),
    });
    process.stdout.write(`screencast started\n`);

    /* ---- 6. play promo session in background; cap recording at duration ---- */
    let sessionExited = false;
    playPromoSession({ page, sleep })
        .then(() => { sessionExited = true; process.stdout.write("session returned normally\n"); })
        .catch((err) => { sessionExited = true; process.stderr.write(`session error: ${err.stack || err.message}\n`); });
    /* always record for the full requested duration regardless of session lifecycle —
       short sessions still produce the desired-length clip (the game keeps running) */
    await sleep(duration * 1000);

    /* ---- 7. shutdown: stop screencast, end ffmpeg, close browser ---- */
    stopping = true;
    try { await client.send("Page.stopScreencast"); } catch { }
    await sleep(200);
    try { ff.stdin.end(); } catch { }

    const ffExit = await new Promise((resolve) => {
        ff.on("close", (code) => resolve(code));
        setTimeout(() => resolve("timeout"), 15_000);
    });

    try { await browser.close(); } catch { }

    if (ffExit !== 0) {
        process.stderr.write(`ffmpeg exited with code ${ffExit}\n`);
        process.exit(1);
    }

    const stat = fs.statSync(finalOut);
    process.stdout.write(`\n=== Done ===\n`);
    process.stdout.write(`Frames captured: ${frameCount}\n`);
    process.stdout.write(`File:            ${finalOut}\n`);
    process.stdout.write(`Size:            ${(stat.size / 1024 / 1024).toFixed(2)} MB\n`);
}

async function main() {
    const args = parseArgs(process.argv);
    if (!args.game) {
        process.stderr.write(`usage: node record-promo-video.js --game <id> [--duration 45] [--out path] [--fps 30] [--port 8899]\n`);
        process.stderr.write(`games: ${VALID_GAMES.join(", ")}\n`);
        process.exit(1);
    }
    await recordOne({
        game: args.game,
        duration: args.duration,
        fps: args.fps,
        port: args.port,
        outPath: args.out,
    });
}

main().catch((err) => {
    process.stderr.write(`FATAL: ${err.stack || err.message}\n`);
    process.exit(1);
});
