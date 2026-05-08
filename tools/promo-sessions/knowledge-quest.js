/**
 * Knowledge Quest — promo session script.
 *
 * Real-time scene-driven session: menu → chapterMap → trigger combat
 * directly via window.__edgameBot.spawnEnemy → cycle through several
 * combat turns (spell select → answer MCQ → timing ring) → win.
 *
 * Showcases the timed-cast mechanic. Designed for ~45 s of footage.
 *
 * Geometry notes (must match combat.js):
 *   - Spell-menu buttons live at y ∈ [590, 646], x ∈ [322, 472] for
 *     button #1 (4 spells centered, btnW=150, gap=12, panelY=H-160=560).
 *   - Enemy targetBtns are at (ex, ENEMY_AREA_Y+60)=(*, 180), each 70×90
 *     centered. For 2 enemies: ex_0 = 540, ex_1 = 740.
 *   - Clicking (640, 180) MISSES both enemies (between them) — must
 *     click 540 or 740, not 640.
 */

const ENEMY_TYPES = ["ignorance_imp", "confusion_crawler", "doubt_shade"];

async function answerCombatQuestion(page, sleep) {
    const has = await page.waitForFunction(
        () => {
            try { return window.__edgameBot.k.get("question-overlay").length > 0; }
            catch { return false; }
        },
        { timeout: 3500, polling: 40 },
    ).then(() => true).catch(() => false);
    if (!has) return false;

    /* think 1.5–3 s for realistic-looking pacing */
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
        { timeout: 3000, polling: 40 },
    ).catch(() => {});
    return true;
}

/* Wait until the player can act again — after the previous turn's enemy
 * attacks finish, KQ's combat loop calls showActionPanel(), which is the
 * only state where pressing "1" / "2" / "3" / "4" is meaningful. The
 * action panel doesn't have a tag we can query, so we watch the player's
 * HP changing (proxy for enemy attacks finishing) AND the absence of
 * any question-overlay. After all enemy attacks land, sleep one more
 * beat for animations to settle. */
async function waitForPlayerTurn(page, sleep) {
    /* wait until no active question/timing overlay */
    await page.waitForFunction(
        () => {
            try { return window.__edgameBot.k.get("question-overlay").length === 0; }
            catch { return true; }
        },
        { timeout: 8000, polling: 80 },
    ).catch(() => {});
    /* enemy turns each animate ~0.7 s + a 1.5–2 s message; for 2 alive
       enemies that's ~5 s. Sit through it. */
    await sleep(2200);
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
    await sleep(1500); // linger on title

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
    await sleep(2500); // let combat scene fully render before first turn

    /* Spell button positions, derived from combat.js showSpellMenu:
         For chapter 1 (3 spells), totalBtnW = 3*(150+12)-12 = 474,
         startBtnX = (1280 - 474)/2 = 403, buttons at x=403, 565, 727
         (each 150 wide). y=590, height 56 → click center at y=618.
       Spell buttons:
         #0 Spark         (enemy target, MP 2): center (478, 618)
         #1 Frost Wave    (enemy target, MP 3): center (640, 618)
         #2 Healing Light (ally target,  MP 3): center (802, 618)
       We pick enemy-targeting spells only (Spark, Frost Wave) so the
       target-select step always fires and the camera moves between
       enemies. */
    const SPELL_POSITIONS = [
        { x: 478, y: 618, name: "Spark" },
        { x: 640, y: 618, name: "Frost Wave" },
    ];
    /* enemy targetBtns at (540, 180) and (740, 180), 70×90 centered.
       click center of either → target lock */
    const ENEMY_CLICK = [{ x: 540, y: 180 }, { x: 740, y: 180 }];

    /* combat loop: action panel → spell button → target → MCQ → timing ring */
    const start = Date.now();
    let turns = 0;
    const MAX_MS = 38_000;

    while (Date.now() - start < MAX_MS && turns < 4) {
        /* check if combat is still active (player or all enemies died) */
        const inCombat = await page.evaluate(() => {
            try { return window.__edgameBot.gameStateStore.getState().phase === "combat"; }
            catch { return false; }
        });
        if (!inCombat) break;

        /* wait for the action panel to be ready */
        await waitForPlayerTurn(page, sleep);

        /* press 1 → resolve "spell" → spell-menu shows */
        await page.keyboard.press("1");
        await sleep(900);

        /* click a spell button (alternate Spark / Frost Wave per turn) */
        const spell = SPELL_POSITIONS[turns % SPELL_POSITIONS.length];
        await page.mouse.click(spell.x, spell.y);
        await sleep(800);

        /* target select: click an enemy that's still alive (alternate so
           the camera moves between them across turns) */
        const tgt = ENEMY_CLICK[turns % ENEMY_CLICK.length];
        await page.mouse.click(tgt.x, tgt.y);
        await sleep(600);

        /* answer MCQ */
        const answered = await answerCombatQuestion(page, sleep);
        if (!answered) { await sleep(1500); continue; }

        /* timing ring — press Space ~halfway through the ring's shrink */
        await sleep(600);
        await page.keyboard.press("Space");
        await sleep(2200); // damage animation + showMessage durations

        turns++;
    }

    /* outro: linger so viewer sees the final HP / win state */
    await sleep(2500);
};
