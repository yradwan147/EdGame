/**
 * Knowledge Quest — promo session script.
 *
 * Real-time scene-driven session: menu → chapterMap → trigger combat
 * directly via window.__edgameBot.spawnEnemy → cycle through several
 * combat turns (spell select → answer MCQ → timing ring) → win.
 *
 * Bypasses the chapter-map click navigation (flaky) by going straight
 * into combat with two enemies. Showcases the timed-cast mechanic.
 *
 * Designed for ~45 s of footage.
 */

const ENEMY_TYPES = ["ignorance_imp", "confusion_crawler", "doubt_shade"];

async function answerCombatQuestion(page, sleep) {
    const has = await page.waitForFunction(
        () => {
            try { return window.__edgameBot.k.get("question-overlay").length > 0; }
            catch { return false; }
        },
        { timeout: 1500, polling: 40 },
    ).then(() => true).catch(() => false);
    if (!has) return false;

    /* think 1.5–3 s */
    await sleep(1500 + Math.random() * 1500);

    const correctIdx = await page.evaluate(() => {
        try { return window.__edgameBot.currentQuestion.correctIndex; }
        catch { return -1; }
    });
    if (correctIdx < 0) return false;

    /* answer correctly so the cast lands and player wins the combat */
    await page.keyboard.press(String(correctIdx + 1));
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
    /* reset to menu, then directly into combat (bypassing flaky chapter-map clicks) */
    await page.evaluate(() => {
        try {
            const bot = window.__edgameBot;
            bot.gameStateStore.reset();
            bot.k.go("menu");
        } catch {}
    });
    await sleep(1200);

    /* show menu briefly so the viewer sees the game's title */
    await sleep(800);

    /* walk through chapterMap then jump straight into combat */
    await page.evaluate(() => {
        try { window.__edgameBot.k.go("chapterMap", { chapterId: 1 }); } catch {}
    });
    await sleep(1500);

    /* spawn 2 enemies + force combat scene */
    await page.evaluate((types) => {
        try {
            const bot = window.__edgameBot;
            const sp = bot.spawnEnemy;
            const enemies = [
                sp(types[0], 1),
                sp(types[1], 1),
            ];
            bot.k.go("combat", {
                nodeId: "promo_combat_" + Date.now(),
                enemies,
                isBoss: false,
            });
        } catch {}
    }, ENEMY_TYPES);
    await sleep(2000);

    /* combat loop: select spell (press 1) → click spell button → click enemy → answer → timing */
    const start = Date.now();
    let turns = 0;
    const MAX_MS = 35_000;

    while (Date.now() - start < MAX_MS && turns < 6) {
        /* check if combat is still active */
        const inCombat = await page.evaluate(() => {
            try { return window.__edgameBot.gameStateStore.getState().phase === "combat"; }
            catch { return false; }
        });
        if (!inCombat) break;

        /* press 1 → action panel "Spell" */
        await page.keyboard.press("1");
        await sleep(700);

        /* click center spell button (the spell row sits at y≈620) */
        const spellX = 380 + (turns % 3) * 160;
        await page.mouse.click(spellX, 620);
        await sleep(700);

        /* click an enemy (they're drawn at y≈200, centered horizontally) */
        await page.mouse.click(640, 200);
        await sleep(700);

        /* answer the MCQ that gates the cast */
        const answered = await answerCombatQuestion(page, sleep);
        if (!answered) {
            /* spell may not have triggered an MCQ — just move on */
            await sleep(1000);
            continue;
        }

        /* timing ring — press Space at a "good" moment */
        await sleep(700);
        await page.keyboard.press("Space");
        await sleep(1500); // watch damage animation play out

        turns++;
    }

    /* outro: linger on result screen */
    await sleep(2000);
};
