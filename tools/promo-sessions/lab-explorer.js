/**
 * Lab Explorer — promo session script.
 *
 * Real-time UI-driven session: menu → labSelect → pick acid_base
 * experiment → walk through the 6 phases (hypothesis → equipment →
 * variable → run → observe → conclude). Showcases the experiment loop.
 *
 * Designed for ~45–60 s of footage.
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

module.exports = async function playPromoSession({ page, sleep }) {
    /* menu → labSelect */
    await page.evaluate(() => { try { window.__edgameBot.k.go("menu"); } catch {} });
    await sleep(1200);
    await page.keyboard.press("Enter"); // START LAB
    await sleep(1500);

    /* jump directly to the acid_base experiment for the most visually distinct flow */
    await page.evaluate(() => {
        try { window.__edgameBot.k.go("experiment", { experimentId: "acid_base" }); } catch {}
    });
    await sleep(2000); // let the lab bench appear

    /* walk through 6 phases at human-watchable pace */
    const start = Date.now();
    const MAX_MS = 38_000;

    while (Date.now() - start < MAX_MS) {
        const state = await page.evaluate(() => {
            try {
                return {
                    phase: window.__edgameBot.gameStateStore.getState().phase,
                    hasQ: window.__edgameBot.k.get("question-overlay").length > 0,
                    scene: window.__edgameBot.k.getSceneName && window.__edgameBot.k.getSceneName(),
                };
            } catch { return null; }
        });
        if (!state) break;
        if (state.scene === "labSelect" || state.scene === "menu" || state.scene === "postLab") {
            /* finished the experiment loop — linger then exit */
            await sleep(2500);
            break;
        }
        if (state.hasQ) { await answerOverlay(page, sleep); continue; }

        if (state.phase === "hypothesis") {
            /* press 1 (first hypothesis) — confident pick */
            await sleep(2000); // let viewer read the hypothesis options
            await page.keyboard.press("1");
            await sleep(1500);
        } else if (state.phase === "equipment") {
            /* click 3–4 equipment items — left side of screen */
            const targets = [
                { x: 200, y: 260 }, { x: 300, y: 260 },
                { x: 400, y: 260 }, { x: 200, y: 360 },
            ];
            for (const t of targets) {
                await page.mouse.click(t.x, t.y);
                await sleep(500);
            }
            /* click Confirm Equipment button (center-bottom) */
            await sleep(500);
            await page.mouse.click(700, 640);
            await sleep(800);
            await page.mouse.click(900, 640); // alt position
            await sleep(1000);
        } else if (state.phase === "variable") {
            /* let viewer see the variable sliders, then click Run */
            await sleep(2000);
            await page.mouse.click(900, 640);
            await sleep(800);
            await page.mouse.click(1100, 640);
            await sleep(1500);
        } else if (state.phase === "run") {
            /* sit back and watch the experiment animation */
            await sleep(2500);
        } else if (state.phase === "observe") {
            /* click 3 observation rows */
            for (const y of [300, 380, 460]) {
                await page.mouse.click(300, y);
                await sleep(500);
            }
            /* confirm */
            await sleep(800);
            await page.mouse.click(900, 640);
            await sleep(1200);
        } else if (state.phase === "conclude") {
            await sleep(2200); // let viewer read conclusion options
            await page.keyboard.press("1"); // pick first
            await sleep(2000);
            await page.mouse.click(640, 400); // click center as fallback
            await sleep(2000);
        } else {
            /* unknown phase — try Enter */
            await page.keyboard.press("Enter");
            await sleep(800);
        }
    }
};
