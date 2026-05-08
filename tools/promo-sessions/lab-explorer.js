/**
 * Lab Explorer — promo session script.
 *
 * Real-time UI-driven session: jump to acid_base experiment → walk
 * through the 6 phases (hypothesis → equipment → variable → run →
 * observe → conclude). Showcases the experiment loop.
 *
 * Designed for ~45 s of footage.
 *
 * Geometry (must match experiment.js + equipmentPanel.js):
 *   - Hypothesis / Conclude: keyboard shortcuts not wired; clicks on the
 *     option rows (centered, 800×58, starting y=190, gap 70).
 *   - Equipment shelf items (left): SHELF_X=30, START_Y=100, ITEM_H=52,
 *     ITEM_W=260. Click center: (160, 100+i*52+23).
 *   - Confirm Equipment: (640+200, 640) center → click (950, 665).
 *   - Variable RUN: pos(180, 640) size 250×55 → click center (305, 668).
 *   - Done Experimenting: pos(460, 644) size 220×45 → click (570, 666).
 *   - Observation rows: same as Hypothesis (centered, 800×58, y=190,
 *     gap 70).
 *   - Confirm Observations: depends on #options (acid_base has 4) →
 *     click (640, 515).
 */

async function answerOverlay(page, sleep) {
    const has = await page.waitForFunction(
        () => {
            try { return window.__edgameBot.k.get("question-overlay").length > 0; }
            catch { return false; }
        },
        { timeout: 1500, polling: 40 },
    ).then(() => true).catch(() => false);
    if (!has) return false;
    await sleep(1500 + Math.random() * 1500);
    const idx = await page.evaluate(() => {
        try { return window.__edgameBot.currentQuestion.correctIndex; }
        catch { return -1; }
    });
    if (idx < 0) return false;
    await page.keyboard.press(String(idx + 1));
    await page.waitForFunction(
        () => {
            try { return window.__edgameBot.k.get("question-overlay").length === 0; }
            catch { return true; }
        },
        { timeout: 2500, polling: 40 },
    ).catch(() => {});
    return true;
}

async function getPhase(page) {
    return page.evaluate(() => {
        try {
            return {
                phase: window.__edgameBot.gameStateStore.getState().phase,
                hasQ: window.__edgameBot.k.get("question-overlay").length > 0,
                scene: window.__edgameBot.k.getSceneName && window.__edgameBot.k.getSceneName(),
            };
        } catch { return null; }
    });
}

module.exports = async function playPromoSession({ page, sleep }) {
    /* menu → linger → labSelect */
    await page.evaluate(() => { try { window.__edgameBot.k.go("menu"); } catch {} });
    await sleep(1500);
    await page.keyboard.press("Enter"); // START LAB
    await sleep(1200);

    /* jump straight to acid_base experiment for the most distinct visuals */
    await page.evaluate(() => {
        try { window.__edgameBot.k.go("experiment", { experimentId: "acid_base" }); } catch {}
    });
    await sleep(2500);

    /* track which phases we've completed so we only act once per phase */
    let lastPhase = null;
    const start = Date.now();
    const MAX_MS = 40_000;

    while (Date.now() - start < MAX_MS) {
        const state = await getPhase(page);
        if (!state) break;
        if (state.scene === "labSelect" || state.scene === "menu" || state.scene === "postLab") {
            await sleep(2000);
            break;
        }
        if (state.hasQ) { await answerOverlay(page, sleep); continue; }

        /* don't redo the same phase */
        if (state.phase === lastPhase) { await sleep(400); continue; }
        lastPhase = state.phase;

        if (state.phase === "hypothesis") {
            await sleep(2200); // let viewer read the hypothesis options
            /* click first hypothesis option (centered, y=190) */
            await page.mouse.click(640, 219);
            await sleep(1200);
            /* there's usually a "Submit Hypothesis" or auto-advance — try Enter */
            await page.keyboard.press("Enter");
            await sleep(800);
        } else if (state.phase === "equipment") {
            /* click 3 shelf items (y= 123, 175, 227) */
            await sleep(1000); // let viewer see the panel
            await page.mouse.click(160, 123);
            await sleep(500);
            await page.mouse.click(160, 175);
            await sleep(500);
            await page.mouse.click(160, 227);
            await sleep(800);
            /* Confirm Equipment button at (840+110, 640+25) = (950, 665) */
            await page.mouse.click(950, 665);
            await sleep(1500);
        } else if (state.phase === "variable") {
            /* show sliders briefly, then click RUN EXPERIMENT (305, 668) */
            await sleep(2000);
            /* drag a slider for visual interest — slider 1 at approx (200, 175) */
            await page.mouse.move(200, 175);
            await page.mouse.down();
            await page.mouse.move(380, 175, { steps: 12 });
            await page.mouse.up();
            await sleep(700);
            /* RUN EXPERIMENT: rect 250×55 at (180, 640) → click center */
            await page.mouse.click(305, 668);
            await sleep(2500); // run animation
        } else if (state.phase === "run") {
            /* run animation playing — sit back */
            await sleep(2500);
            /* "Done Experimenting" button at (460, 644), 220×45 → click (570, 666) */
            await page.mouse.click(570, 666);
            await sleep(1200);
        } else if (state.phase === "observe") {
            await sleep(1500);
            /* click 2 observation rows (centered, y= 219, 289) */
            await page.mouse.click(640, 219);
            await sleep(600);
            await page.mouse.click(640, 289);
            await sleep(800);
            /* Confirm Observations: 4 options × 70 + 20 + start 190 → y ≈ 490
               size 240×50 → click center (640, 515) */
            await page.mouse.click(640, 515);
            await sleep(1500);
        } else if (state.phase === "conclude") {
            await sleep(2200);
            /* click first conclusion option (centered, y=190 startY) */
            await page.mouse.click(640, 219);
            await sleep(1500);
            /* try Enter / click center to submit */
            await page.keyboard.press("Enter");
            await sleep(1500);
        } else {
            /* unknown phase — try Enter */
            await page.keyboard.press("Enter");
            await sleep(800);
            lastPhase = null; // re-eval next iteration
        }
    }

    /* outro: linger on result */
    await sleep(2000);
};
