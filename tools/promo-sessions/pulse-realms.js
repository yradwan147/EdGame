/**
 * Pulse Realms — promo session script.
 *
 * Real-time UI-driven session: menu → role 1 (attacker) → arena briefing →
 * arena. Move toward center, fire abilities, answer the gating MCQs,
 * loop until the recorder cuts.
 *
 * Designed for ~45 s of visually engaging gameplay footage.
 */

module.exports = async function playPromoSession({ page, sleep }) {
    /* menu → role */
    await page.evaluate(() => { try { window.__edgameBot.k.go("menu"); } catch {} });
    await sleep(800);
    await page.keyboard.press("Enter");
    await sleep(800);

    /* roleSelect: pick attacker (1) for action-heavy footage */
    await page.keyboard.press("1");
    await sleep(400);
    await page.keyboard.press("Enter");
    await sleep(800);

    /* arenaBriefing → arena */
    await page.keyboard.press("Enter");
    await sleep(2000); // dramatic pause as arena loads

    /* move toward center */
    for (const k of ["s", "d"]) await page.keyboard.down(k);
    await sleep(700);
    for (const k of ["s", "d"]) await page.keyboard.up(k);
    await sleep(400);

    /* loop: abilities + answer MCQs at human pace */
    const ABILITY_KEYS = ["1", "2"];
    const start = Date.now();
    const MAX_MS = 50_000;

    while (Date.now() - start < MAX_MS) {
        /* random small movement so it doesn't look static */
        const dirKey = ["w", "a", "s", "d"][Math.floor(Math.random() * 4)];
        await page.keyboard.down(dirKey);
        await sleep(220);
        await page.keyboard.up(dirKey);
        await sleep(150);

        const ability = ABILITY_KEYS[Math.floor(Math.random() * ABILITY_KEYS.length)];
        let before = 0;
        try { before = await page.evaluate(() => window.__edgameBot.questionsServed || 0); } catch { return; }
        await page.keyboard.press(ability);

        const qAppeared = await page.waitForFunction(
            (prev) => (window.__edgameBot.questionsServed || 0) > prev,
            { timeout: 1200, polling: 50 },
            before,
        ).then(() => true).catch(() => false);

        if (!qAppeared) continue;

        /* think 1.2–2.5 s like a real player */
        await sleep(1200 + Math.random() * 1300);

        let correctIdx = -1;
        try {
            correctIdx = await page.evaluate(() => {
                try { return window.__edgameBot.currentQuestion.correctIndex; }
                catch { return -1; }
            });
        } catch { return; }
        if (correctIdx < 0) continue;

        /* answer correctly 80% of the time so casts succeed visibly */
        const idx = Math.random() < 0.8
            ? correctIdx
            : (correctIdx + 1 + Math.floor(Math.random() * 3)) % 4;
        await page.keyboard.press(String(idx + 1));

        await page.waitForFunction(
            () => {
                try { return window.__edgameBot.k.get("question-overlay").length === 0; }
                catch { return true; }
            },
            { timeout: 2000, polling: 40 },
        ).catch(() => {});
        await sleep(400);
    }
};
