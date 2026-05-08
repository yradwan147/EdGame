/**
 * Survival Equation — promo session script.
 *
 * Real-time UI-driven session: menu → scenarioSelect → click first
 * scenario card → roleAssignment → press 2 (Juno the scientist) →
 * survivalHub → press Enter → puzzleRoom → type a chat message + click
 * puzzle steps → showcase team chat + AI partner reactions.
 *
 * Designed for ~45 s of footage. Bypasses the dataset bot's programmatic
 * shortcut so the actual UI is visible.
 */

const PROMO_MESSAGES = [
    "what should we try first?",
    "I think we need the scientist's data",
    "let me check the readings",
    "good plan, lets do it",
];

module.exports = async function playPromoSession({ page, sleep }) {
    /* fully reset + go to menu so the viewer sees the title */
    await page.evaluate(() => {
        try {
            const bot = window.__edgameBot;
            bot.gameStateStore.reset();
            bot.k.go("menu");
        } catch {}
    });
    await sleep(1500); // linger on title

    /* menu → scenarioSelect */
    await page.keyboard.press("Enter");
    await sleep(1500);

    /* click first scenario card (Desert Island, leftmost ~ x=320 y=360) */
    await page.mouse.click(320, 360);
    await sleep(1500);

    /* roleAssignment: press 2 (Juno the scientist) */
    await sleep(1000); // let viewer see role cards
    await page.keyboard.press("2");
    await sleep(2000);

    /* survivalHub: linger on the daily briefing, then Enter to start puzzle */
    await page.keyboard.press("Enter");
    await sleep(2500);

    /* puzzleRoom: send chat messages + interact with puzzle board */
    const start = Date.now();
    const MAX_MS = 32_000;
    let msgIdx = 0;

    while (Date.now() - start < MAX_MS) {
        const state = await page.evaluate(() => {
            try {
                return {
                    scene: window.__edgameBot.k.getSceneName && window.__edgameBot.k.getSceneName(),
                };
            } catch { return null; }
        });
        if (!state) break;
        if (state.scene === "menu" || state.scene === "scenarioResults") break;

        /* type a chat message at human pace (delay between keystrokes) */
        if (msgIdx < PROMO_MESSAGES.length) {
            await page.mouse.click(640, 650); // chat input area
            await sleep(200);
            await page.keyboard.type(PROMO_MESSAGES[msgIdx], { delay: 60 });
            await sleep(400);
            await page.keyboard.press("Enter");
            await sleep(2200); // let AI partner reply animation play
            msgIdx++;
        }

        /* click around the puzzle board */
        await page.mouse.click(300 + Math.random() * 600, 300 + Math.random() * 200);
        await sleep(800);

        /* try a step submission key (1–4) */
        await page.keyboard.press(String(1 + Math.floor(Math.random() * 4)));
        await sleep(1200);
    }

    /* outro: linger on whatever's on screen */
    await sleep(2000);
};
