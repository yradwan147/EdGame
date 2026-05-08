/**
 * Concept Cascade — promo session script.
 *
 * Real-time UI-driven session: menu → click PLAY → place 4 different
 * tower types in adjacency to trigger synergies → answer the gating MCQs
 * → wait through a wave → place 1 more tower → done.
 *
 * Designed for ~45–60 s of footage with visible synergies / wave action.
 */

/* Tower keys: 1=Number Bastion, 2=Operation Cannon, 3=Fraction Freezer, 4=Geometry Guard.
   Place 4 different types in adjacent positions to trigger Knowledge Nexus + chain combos. */
const TOWER_KEYS = ["1", "2", "3", "4"];

/* Hand-picked buildable tiles forming an adjacent 2×2 cluster — primes the
   synergy system to fire on placement of the 3rd / 4th tower. */
const SYNERGY_CLUSTER = [
    { col: 5, row: 4, x: 352, y: 288 },   // top-left of cluster (B at row 4, col 5)
    { col: 6, row: 4, x: 416, y: 288 },
    { col: 5, row: 6, x: 352, y: 416 },
    { col: 6, row: 6, x: 416, y: 416 },
    { col: 13, row: 4, x: 864, y: 288 },  // 5th: spacer
    { col: 14, row: 4, x: 928, y: 288 },
];

async function answerWithDelay(page, sleep, accuracy = 0.85) {
    /* wait for question overlay */
    const ok = await page.waitForFunction(
        () => {
            try { return window.__edgameBot.k.get("question-overlay").length > 0; }
            catch { return false; }
        },
        { timeout: 1500, polling: 50 },
    ).then(() => true).catch(() => false);
    if (!ok) return false;

    /* think 1.5–3 s like a real player */
    await sleep(1500 + Math.random() * 1500);

    const correctIdx = await page.evaluate(() => {
        try { return window.__edgameBot.currentQuestion.correctIndex; }
        catch { return -1; }
    });
    if (correctIdx < 0) return false;

    const idx = Math.random() < accuracy
        ? correctIdx
        : (correctIdx + 1 + Math.floor(Math.random() * 3)) % 4;
    await page.keyboard.press(String(idx + 1));

    /* wait for overlay to clear before next click */
    await page.waitForFunction(
        () => {
            try { return window.__edgameBot.k.get("question-overlay").length === 0; }
            catch { return true; }
        },
        { timeout: 2000, polling: 30 },
    ).catch(() => {});
    await sleep(500);
    return true;
}

module.exports = async function playPromoSession({ page, sleep }) {
    /* menu → battlefield */
    await page.evaluate(() => { try { window.__edgameBot.k.go("menu"); } catch {} });
    await sleep(900);
    await page.mouse.click(640, 450); // PLAY button
    await sleep(1500);

    /* wait for battlefield prep phase */
    await page.waitForFunction(
        () => {
            try { return window.__edgameBot.gameStateStore.getState().phase === "prep"; }
            catch { return false; }
        },
        { timeout: 8_000, polling: 100 },
    ).catch(() => {});

    /* place 4 different tower types in an adjacency cluster — synergies! */
    for (let i = 0; i < 4; i++) {
        const towerKey = TOWER_KEYS[i]; // 1 of each type
        const tile = SYNERGY_CLUSTER[i];
        await page.keyboard.press(towerKey);
        await sleep(300);
        await page.mouse.click(tile.x, tile.y);
        const answered = await answerWithDelay(page, sleep, 0.95);
        if (!answered) await sleep(800);
    }

    /* let prep timer expire / press Space to call wave early for action */
    await sleep(1000);
    await page.keyboard.press("Space");
    await sleep(2500); // wave intro animation

    /* watch the combat phase — towers shoot, enemies leak / die, projectiles fly */
    const combatStart = Date.now();
    while (Date.now() - combatStart < 18_000) {
        const state = await page.evaluate(() => {
            try {
                const s = window.__edgameBot.gameStateStore.getState();
                const enemies = window.__edgameBot.k.get("enemy").length;
                return { phase: s.phase, enemies, lives: s.lives };
            } catch { return null; }
        });
        if (!state || state.lives <= 0) break;
        if (state.phase === "prep") {
            /* between-wave overlay — press Enter to dismiss */
            await page.keyboard.press("Enter");
            await sleep(800);
            /* place one more tower to fill the cluster */
            await page.keyboard.press(TOWER_KEYS[Math.floor(Math.random() * 4)]);
            await sleep(300);
            const tile = SYNERGY_CLUSTER[4 + Math.floor(Math.random() * 2)];
            await page.mouse.click(tile.x, tile.y);
            await answerWithDelay(page, sleep, 0.85);
            await sleep(500);
            await page.keyboard.press("Space"); // call next wave early
        }
        await sleep(400);
    }
};
