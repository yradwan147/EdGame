import { COLORS, DEFAULT_SETTINGS } from "../config/constants.js";
import { getSpellsForChapter } from "../config/spells.js";
import { spawnEnemy } from "../config/enemies.js";
import { createCombatSystem } from "../systems/combatSystem.js";
import { createQuestionEngine } from "../systems/questionEngine.js";
import { createQuestionOverlay } from "../components/questionOverlay.js";
import { createMentorSystem } from "../systems/mentorSystem.js";

/**
 * combat.js -- Full turn-based combat scene with question + timing sequences.
 *
 * This is the core gameplay loop:
 *   1. Player selects action (Spell / Defend / Item / Mentor)
 *   2. Spell: pick spell -> pick target -> answer question -> timing minigame -> apply
 *   3. Enemy turns: each alive enemy acts
 *   4. End-of-turn: regen MP, check win/loss
 *   5. Loop until combat ends
 */
export function registerCombatScene({ k, settings, gameStateStore, telemetry, progression }) {
    const rgb = (arr) => k.rgb(arr[0], arr[1], arr[2]);

    k.scene("combat", ({ nodeId, enemies, isBoss }) => {
        const W = k.width();
        const H = k.height();
        const state = gameStateStore.getState();
        const chapterId = state.chapter;

        /* ================================================================ */
        /*  System initialization                                           */
        /* ================================================================ */

        const questionEngine = createQuestionEngine();
        const questionOverlay = createQuestionOverlay(k);
        const mentorSystem = createMentorSystem({ gameStateStore, telemetry });

        const combatSystem = createCombatSystem({
            k,
            questionEngine,
            questionOverlay: (q) => questionOverlay.show(q),
            telemetry,
            progression,
            gameStateStore,
        });

        /* spawn combat-ready enemies */
        const spawnedEnemies = enemies.map((e) => ({
            ...e,
            currentHp: e.currentHp || e.hp || e.maxHp,
            maxHp: e.maxHp || e.hp,
            currentAtk: e.currentAtk || e.atk,
            statusEffects: e.statusEffects || [],
            idleTurns: 0,
            isAsleep: false,
        }));

        combatSystem.startCombat(spawnedEnemies);

        /* available spells */
        const spells = getSpellsForChapter(chapterId);

        /* ================================================================ */
        /*  Background and static UI                                        */
        /* ================================================================ */

        k.add([k.rect(W, H), k.pos(0, 0), k.color(...COLORS.bg)]);

        /* battle particles */
        for (let i = 0; i < 12; i++) {
            const p = k.add([
                k.rect(k.rand(2, 4), k.rand(2, 4)),
                k.pos(k.rand(0, W), k.rand(0, H)),
                k.color(...(Math.random() < 0.5 ? COLORS.primary : COLORS.danger)),
                k.opacity(k.rand(0.08, 0.2)),
                k.z(-1),
            ]);
            const spd = k.rand(10, 30);
            p.onUpdate(() => {
                p.pos.y -= spd * k.dt();
                if (p.pos.y < -10) { p.pos.y = H + 10; p.pos.x = k.rand(0, W); }
            });
        }

        /* boss intro text */
        if (isBoss) {
            const bossIntro = k.add([
                k.text("--- BOSS BATTLE ---", { size: 30 }),
                k.pos(W / 2, H / 2),
                k.anchor("center"),
                k.color(...COLORS.danger),
                k.opacity(1),
                k.z(500),
            ]);
            let introTimer = 0;
            bossIntro.onUpdate(() => {
                introTimer += k.dt();
                if (introTimer > 2) {
                    bossIntro.opacity = Math.max(0, bossIntro.opacity - k.dt() * 2);
                    if (bossIntro.opacity <= 0) k.destroy(bossIntro);
                }
            });
        }

        /* ================================================================ */
        /*  HUD - persistent status bars                                    */
        /* ================================================================ */

        const hudRoot = k.add([k.pos(0, 0), k.z(50)]);

        /* HUD background */
        hudRoot.add([k.rect(W, 56), k.pos(0, 0), k.color(...COLORS.hudBg), k.opacity(0.92)]);

        /* HP display */
        function drawHUD() {
            /* we redraw the HUD values by simply adding new text each call
               but to avoid stacking, use a sub-container that we destroy/rebuild */
            return;
        }

        const hpLabel = hudRoot.add([
            k.text("HP", { size: 14 }), k.pos(15, 8), k.color(...COLORS.danger),
        ]);
        const hpBarBg = hudRoot.add([
            k.rect(180, 14), k.pos(40, 10), k.color(40, 20, 20),
        ]);
        const hpBarFill = hudRoot.add([
            k.rect(180, 14), k.pos(40, 10), k.color(...COLORS.danger),
        ]);
        const hpText = hudRoot.add([
            k.text("", { size: 12 }), k.pos(228, 11), k.color(...COLORS.textPrimary),
        ]);

        /* MP display */
        const mpLabel = hudRoot.add([
            k.text("MP", { size: 14 }), k.pos(15, 30), k.color(...COLORS.frost),
        ]);
        const mpBarBg = hudRoot.add([
            k.rect(180, 14), k.pos(40, 32), k.color(20, 20, 40),
        ]);
        const mpBarFill = hudRoot.add([
            k.rect(180, 14), k.pos(40, 32), k.color(...COLORS.frost),
        ]);
        const mpText = hudRoot.add([
            k.text("", { size: 12 }), k.pos(228, 33), k.color(...COLORS.textPrimary),
        ]);

        /* turn counter */
        const turnLabel = hudRoot.add([
            k.text("Turn 1", { size: 16 }), k.pos(320, 10), k.color(...COLORS.secondary),
        ]);

        /* mentor tokens */
        const mentorLabel = hudRoot.add([
            k.text("Hints: " + mentorSystem.getRemainingTokens(), { size: 14 }),
            k.pos(320, 32), k.color(...COLORS.primary),
        ]);

        function refreshHUD() {
            const s = gameStateStore.getState();
            const p = s.player;
            hpBarFill.width = Math.max(0, Math.floor(180 * (p.hp / p.maxHp)));
            hpText.text = p.hp + "/" + p.maxHp;
            mpBarFill.width = Math.max(0, Math.floor(180 * (p.mp / p.maxMp)));
            mpText.text = p.mp + "/" + p.maxMp;
            if (s.combat) turnLabel.text = "Turn " + s.combat.turnNumber;
            mentorLabel.text = "Hints: " + mentorSystem.getRemainingTokens();
        }

        refreshHUD();

        /* ================================================================ */
        /*  Enemy display area                                              */
        /* ================================================================ */

        const ENEMY_AREA_Y = 120;
        const enemyObjects = [];

        function drawEnemies() {
            const combatState = gameStateStore.getState().combat;
            if (!combatState) return;

            const gap = Math.min(200, (W - 100) / combatState.enemies.length);
            const startX = (W - gap * combatState.enemies.length) / 2 + gap / 2;

            for (let i = 0; i < combatState.enemies.length; i++) {
                const e = combatState.enemies[i];
                const ex = startX + i * gap;
                const ey = ENEMY_AREA_Y + 60;

                const spriteCol = COLORS[e.spriteColor] || COLORS.danger;

                /* enemy body */
                const body = k.add([
                    k.rect(60, 80),
                    k.pos(ex, ey),
                    k.anchor("center"),
                    k.color(...spriteCol),
                    k.opacity(e.currentHp > 0 ? 1 : 0.2),
                    k.z(5),
                ]);

                /* enemy inner */
                k.add([
                    k.rect(40, 50),
                    k.pos(ex, ey + 5),
                    k.anchor("center"),
                    k.color(spriteCol[0] * 0.5, spriteCol[1] * 0.5, spriteCol[2] * 0.5),
                    k.opacity(e.currentHp > 0 ? 0.8 : 0.1),
                    k.z(6),
                ]);

                /* name */
                k.add([
                    k.text(e.name, { size: 13 }),
                    k.pos(ex, ey - 55),
                    k.anchor("center"),
                    k.color(...COLORS.textPrimary),
                    k.opacity(e.currentHp > 0 ? 1 : 0.3),
                    k.z(7),
                ]);

                /* HP bar */
                const hpFrac = e.maxHp > 0 ? Math.max(0, e.currentHp / e.maxHp) : 0;
                k.add([
                    k.rect(60, 8),
                    k.pos(ex - 30, ey - 42),
                    k.color(40, 20, 20),
                    k.z(7),
                ]);
                k.add([
                    k.rect(Math.floor(60 * hpFrac), 8),
                    k.pos(ex - 30, ey - 42),
                    k.color(...COLORS.danger),
                    k.z(8),
                ]);
                k.add([
                    k.text(Math.max(0, e.currentHp) + "/" + e.maxHp, { size: 10 }),
                    k.pos(ex, ey - 32),
                    k.anchor("center"),
                    k.color(...COLORS.textSecondary),
                    k.z(8),
                ]);

                /* status effects */
                if (e.statusEffects && e.statusEffects.length > 0) {
                    const statuses = e.statusEffects.map((s) => s.type).join(", ");
                    k.add([
                        k.text(statuses, { size: 10 }),
                        k.pos(ex, ey + 48),
                        k.anchor("center"),
                        k.color(...COLORS.frost),
                        k.z(8),
                    ]);
                }

                /* target selection area */
                const targetBtn = k.add([
                    k.rect(70, 90),
                    k.pos(ex, ey),
                    k.anchor("center"),
                    k.area(),
                    k.opacity(0),
                    k.z(9),
                ]);

                enemyObjects.push({ index: i, body, targetBtn, enemy: e });
            }
        }

        drawEnemies();

        /* ================================================================ */
        /*  Action UI layer                                                 */
        /* ================================================================ */

        let actionRoot = null;
        let combatRunning = true;

        function clearActionUI() {
            if (actionRoot) {
                k.destroy(actionRoot);
                actionRoot = null;
            }
        }

        /* ================================================================ */
        /*  Message display                                                 */
        /* ================================================================ */

        const MSG_Y = H - 180;
        let messageRoot = null;

        function showMessage(text, color, duration) {
            if (messageRoot) k.destroy(messageRoot);
            messageRoot = k.add([k.pos(0, 0), k.z(80)]);
            const msg = messageRoot.add([
                k.text(text, { size: 20, width: W - 100 }),
                k.pos(W / 2, MSG_Y),
                k.anchor("center"),
                k.color(...(color || COLORS.textPrimary)),
            ]);
            if (duration) {
                let t = 0;
                const upd = msg.onUpdate(() => {
                    t += k.dt();
                    if (t > duration) {
                        upd.cancel();
                        if (messageRoot) { k.destroy(messageRoot); messageRoot = null; }
                    }
                });
            }
        }

        /* ================================================================ */
        /*  Timing Ring Minigame                                            */
        /* ================================================================ */

        function showTimingRing(pattern) {
            return new Promise((resolve) => {
                const overlay = k.add([k.pos(0, 0), k.z(10001)]);
                overlay.add([k.rect(W, H), k.color(0, 0, 0), k.opacity(0.5)]);

                const cx = W / 2;
                const cy = H / 2;
                const targetRadius = 50;
                let ringRadius = 150;
                let shrinkSpeed = 120;
                let result = null;

                if (pattern === "rapid_shrink") shrinkSpeed = 180;
                if (pattern === "pulse") shrinkSpeed = 80;

                /* target circle */
                overlay.add([
                    k.circle(targetRadius + 4),
                    k.pos(cx, cy),
                    k.anchor("center"),
                    k.color(...COLORS.secondary),
                    k.opacity(0.3),
                ]);
                overlay.add([
                    k.circle(targetRadius),
                    k.pos(cx, cy),
                    k.anchor("center"),
                    k.color(...COLORS.panelBg),
                    k.opacity(0.8),
                ]);

                overlay.add([
                    k.text("Press SPACE or Click!", { size: 18 }),
                    k.pos(cx, cy + targetRadius + 40),
                    k.anchor("center"),
                    k.color(...COLORS.textSecondary),
                ]);

                /* shrinking ring */
                const ring = overlay.add([
                    k.circle(ringRadius),
                    k.pos(cx, cy),
                    k.anchor("center"),
                    k.color(...COLORS.primary),
                    k.opacity(0.6),
                ]);
                /* hollow center of ring */
                const ringInner = overlay.add([
                    k.circle(ringRadius - 6),
                    k.pos(cx, cy),
                    k.anchor("center"),
                    k.color(...COLORS.bg),
                    k.opacity(0.9),
                ]);

                function evaluatePress() {
                    if (result !== null) return;
                    const diff = Math.abs(ringRadius - targetRadius);
                    if (diff < 5) result = "PERFECT";
                    else if (diff < 15) result = "GOOD";
                    else if (diff < 30) result = "OK";
                    else result = "MISS";

                    /* show result text */
                    const resColor = result === "PERFECT" ? COLORS.secondary
                        : result === "GOOD" ? COLORS.heal
                        : result === "OK" ? COLORS.textPrimary
                        : COLORS.danger;

                    overlay.add([
                        k.text(result + "!", { size: 36 }),
                        k.pos(cx, cy),
                        k.anchor("center"),
                        k.color(...resColor),
                    ]);

                    /* brief delay then resolve */
                    let t = 0;
                    const wait = k.onUpdate(() => {
                        t += k.dt();
                        if (t > 0.6) {
                            wait.cancel();
                            k.destroy(overlay);
                            resolve(result);
                        }
                    });
                }

                const spaceHandler = k.onKeyPress("space", evaluatePress);
                const clickHandler = k.onClick(evaluatePress);

                /* animate the ring */
                let pulsing = pattern === "pulse";
                let pulseDir = -1;

                const ringUpdate = ring.onUpdate(() => {
                    if (result !== null) return;

                    if (pulsing) {
                        ringRadius += pulseDir * shrinkSpeed * k.dt();
                        if (ringRadius < 30) pulseDir = 1;
                        if (ringRadius > 150) pulseDir = -1;
                    } else {
                        ringRadius -= shrinkSpeed * k.dt();
                    }

                    if (ringRadius < 10 && !pulsing) {
                        /* missed entirely */
                        result = "MISS";
                        overlay.add([
                            k.text("MISS!", { size: 36 }),
                            k.pos(cx, cy),
                            k.anchor("center"),
                            k.color(...COLORS.danger),
                        ]);
                        let t = 0;
                        const wait = k.onUpdate(() => {
                            t += k.dt();
                            if (t > 0.6) {
                                wait.cancel();
                                spaceHandler.cancel();
                                clickHandler.cancel();
                                k.destroy(overlay);
                                resolve("MISS");
                            }
                        });
                        return;
                    }

                    ring.radius = ringRadius;
                    ringInner.radius = Math.max(0, ringRadius - 6);
                });
            });
        }

        /* ================================================================ */
        /*  Action effects (damage/heal animations)                         */
        /* ================================================================ */

        function showDamageEffect(x, y, amount, isHeal) {
            const label = isHeal ? "+" + amount : "-" + amount;
            const col = isHeal ? COLORS.heal : COLORS.danger;
            const fx = k.add([
                k.text(label, { size: 28 }),
                k.pos(x, y),
                k.anchor("center"),
                k.color(...col),
                k.z(100),
            ]);
            let t = 0;
            fx.onUpdate(() => {
                t += k.dt();
                fx.pos.y -= 40 * k.dt();
                fx.opacity = Math.max(0, 1 - t / 1.2);
                if (t > 1.2) k.destroy(fx);
            });
        }

        function showSpellEffect(x, y, element) {
            const colors = {
                fire: COLORS.danger,
                ice: COLORS.frost,
                light: COLORS.secondary,
                nature: COLORS.nature,
                lightning: COLORS.lightning,
                arcane: COLORS.dark,
            };
            const col = colors[element] || COLORS.primary;

            for (let i = 0; i < 8; i++) {
                const particle = k.add([
                    k.rect(k.rand(4, 10), k.rand(4, 10)),
                    k.pos(x + k.rand(-20, 20), y + k.rand(-20, 20)),
                    k.anchor("center"),
                    k.color(...col),
                    k.opacity(1),
                    k.z(99),
                ]);
                const vx = k.rand(-80, 80);
                const vy = k.rand(-100, -30);
                let t = 0;
                particle.onUpdate(() => {
                    t += k.dt();
                    particle.pos.x += vx * k.dt();
                    particle.pos.y += vy * k.dt();
                    particle.opacity = Math.max(0, 1 - t / 0.8);
                    if (t > 0.8) k.destroy(particle);
                });
            }
        }

        function showShieldEffect() {
            const shield = k.add([
                k.circle(60),
                k.pos(W / 2, H - 300),
                k.anchor("center"),
                k.color(...COLORS.frost),
                k.opacity(0.4),
                k.z(90),
            ]);
            let t = 0;
            shield.onUpdate(() => {
                t += k.dt();
                shield.opacity = Math.max(0, 0.4 - t / 1.5);
                if (t > 1.5) k.destroy(shield);
            });
        }

        /* ================================================================ */
        /*  Player visual                                                   */
        /* ================================================================ */

        const playerVisX = W / 2;
        const playerVisY = H - 280;

        k.add([
            k.rect(50, 70),
            k.pos(playerVisX, playerVisY),
            k.anchor("center"),
            k.color(...COLORS.primary),
            k.z(5),
        ]);
        k.add([
            k.rect(30, 40),
            k.pos(playerVisX, playerVisY + 5),
            k.anchor("center"),
            k.color(COLORS.primary[0] * 0.6, COLORS.primary[1] * 0.6, COLORS.primary[2] * 0.6),
            k.z(6),
        ]);
        k.add([
            k.text("You", { size: 14 }),
            k.pos(playerVisX, playerVisY - 50),
            k.anchor("center"),
            k.color(...COLORS.textPrimary),
            k.z(7),
        ]);

        /* ================================================================ */
        /*  Wait helper                                                     */
        /* ================================================================ */

        function wait(sec) {
            return new Promise((resolve) => {
                let t = 0;
                const upd = k.onUpdate(() => {
                    t += k.dt();
                    if (t >= sec) { upd.cancel(); resolve(); }
                });
            });
        }

        /* ================================================================ */
        /*  Show action panel and await player choice                       */
        /* ================================================================ */

        function showActionPanel() {
            return new Promise((resolve) => {
                clearActionUI();
                actionRoot = k.add([k.pos(0, 0), k.z(60)]);

                const panelY = H - 140;
                const panelH = 130;

                actionRoot.add([
                    k.rect(W, panelH),
                    k.pos(0, panelY),
                    k.color(...COLORS.hudBg),
                    k.opacity(0.95),
                ]);

                actionRoot.add([
                    k.text("Choose Action", { size: 16 }),
                    k.pos(W / 2, panelY + 12),
                    k.anchor("center"),
                    k.color(...COLORS.textSecondary),
                ]);

                const actions = [
                    { id: "spell", label: "Spell", color: COLORS.primary },
                    { id: "defend", label: "Defend", color: COLORS.frost },
                    { id: "item", label: "Item", color: COLORS.heal },
                    { id: "mentor", label: "Mentor", color: COLORS.secondary },
                ];

                const btnW = 140;
                const btnH = 50;
                const gap = 20;
                const totalBtnW = actions.length * btnW + (actions.length - 1) * gap;
                const startBtnX = (W - totalBtnW) / 2;

                for (let i = 0; i < actions.length; i++) {
                    const act = actions[i];
                    const bx = startBtnX + i * (btnW + gap);
                    const by = panelY + 35;

                    /* disable mentor if no tokens */
                    const disabled = (act.id === "mentor" && !mentorSystem.canUseHint())
                        || (act.id === "item" && !gameStateStore.getState().inventory.some((it) => it.quantity > 0));

                    const btn = actionRoot.add([
                        k.rect(btnW, btnH),
                        k.pos(bx, by),
                        k.color(
                            Math.floor(act.color[0] * (disabled ? 0.1 : 0.25)),
                            Math.floor(act.color[1] * (disabled ? 0.1 : 0.25)),
                            Math.floor(act.color[2] * (disabled ? 0.1 : 0.25)),
                        ),
                        k.outline(2, rgb(disabled ? COLORS.textSecondary : act.color)),
                        k.area(),
                        k.opacity(disabled ? 0.4 : 1),
                    ]);

                    btn.add([
                        k.text(act.label, { size: 20 }),
                        k.pos(btnW / 2, btnH / 2),
                        k.anchor("center"),
                        k.color(...COLORS.textPrimary),
                    ]);

                    if (!disabled) {
                        btn.onHover(() => {
                            btn.color = k.rgb(
                                Math.floor(act.color[0] * 0.4),
                                Math.floor(act.color[1] * 0.4),
                                Math.floor(act.color[2] * 0.4),
                            );
                        });
                        btn.onHoverEnd(() => {
                            btn.color = k.rgb(
                                Math.floor(act.color[0] * 0.25),
                                Math.floor(act.color[1] * 0.25),
                                Math.floor(act.color[2] * 0.25),
                            );
                        });
                        btn.onClick(() => {
                            clearActionUI();
                            resolve(act.id);
                        });
                    }
                }

                /* keyboard shortcuts */
                const keys = [
                    k.onKeyPress("1", () => { clearActionUI(); resolve("spell"); }),
                    k.onKeyPress("2", () => { clearActionUI(); resolve("defend"); }),
                    k.onKeyPress("3", () => { clearActionUI(); resolve("item"); }),
                    k.onKeyPress("4", () => {
                        if (mentorSystem.canUseHint()) { clearActionUI(); resolve("mentor"); }
                    }),
                ];

                /* store cancel refs so they get cleaned up with actionRoot */
            });
        }

        /* ================================================================ */
        /*  Spell submenu                                                   */
        /* ================================================================ */

        function showSpellMenu() {
            return new Promise((resolve) => {
                clearActionUI();
                actionRoot = k.add([k.pos(0, 0), k.z(60)]);

                const panelY = H - 160;
                const panelH = 150;

                actionRoot.add([
                    k.rect(W, panelH),
                    k.pos(0, panelY),
                    k.color(...COLORS.hudBg),
                    k.opacity(0.95),
                ]);

                actionRoot.add([
                    k.text("Select Spell", { size: 16 }),
                    k.pos(W / 2, panelY + 10),
                    k.anchor("center"),
                    k.color(...COLORS.textSecondary),
                ]);

                const playerMp = gameStateStore.getState().player.mp;
                const btnW = 150;
                const btnH = 56;
                const gap = 12;
                const rowMax = 4;

                /* may shuffle spell order if confusion_crawler behavior active */
                let sortedSpells = [...spells];
                const combatSt = gameStateStore.getState().combat;
                if (combatSt) {
                    const hasCrawler = combatSt.enemies.some(
                        (e) => e.currentHp > 0 && e.behavior === "shuffle",
                    );
                    if (hasCrawler) {
                        /* Fisher-Yates shuffle */
                        for (let i = sortedSpells.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [sortedSpells[i], sortedSpells[j]] = [sortedSpells[j], sortedSpells[i]];
                        }
                    }
                }

                const totalBtnW = Math.min(sortedSpells.length, rowMax) * (btnW + gap) - gap;
                const startBtnX = (W - totalBtnW) / 2;

                for (let i = 0; i < sortedSpells.length; i++) {
                    const spell = sortedSpells[i];
                    const col = i % rowMax;
                    const row = Math.floor(i / rowMax);
                    const bx = startBtnX + col * (btnW + gap);
                    const by = panelY + 30 + row * (btnH + gap);

                    const canCast = playerMp >= spell.mpCost;

                    const btn = actionRoot.add([
                        k.rect(btnW, btnH),
                        k.pos(bx, by),
                        k.color(
                            Math.floor(COLORS.primary[0] * (canCast ? 0.2 : 0.08)),
                            Math.floor(COLORS.primary[1] * (canCast ? 0.2 : 0.08)),
                            Math.floor(COLORS.primary[2] * (canCast ? 0.2 : 0.08)),
                        ),
                        k.outline(2, rgb(canCast ? COLORS.primary : COLORS.textSecondary)),
                        k.area(),
                        k.opacity(canCast ? 1 : 0.4),
                    ]);

                    btn.add([
                        k.text(spell.name, { size: 16 }),
                        k.pos(btnW / 2, 16),
                        k.anchor("center"),
                        k.color(...COLORS.textPrimary),
                    ]);
                    btn.add([
                        k.text("MP: " + spell.mpCost + "  DMG: " + (spell.baseDamage || spell.healAmount || 0), { size: 11 }),
                        k.pos(btnW / 2, 38),
                        k.anchor("center"),
                        k.color(...COLORS.textSecondary),
                    ]);

                    if (canCast) {
                        btn.onHover(() => {
                            btn.color = k.rgb(
                                Math.floor(COLORS.primary[0] * 0.35),
                                Math.floor(COLORS.primary[1] * 0.35),
                                Math.floor(COLORS.primary[2] * 0.35),
                            );
                        });
                        btn.onHoverEnd(() => {
                            btn.color = k.rgb(
                                Math.floor(COLORS.primary[0] * 0.2),
                                Math.floor(COLORS.primary[1] * 0.2),
                                Math.floor(COLORS.primary[2] * 0.2),
                            );
                        });
                        btn.onClick(() => {
                            clearActionUI();
                            resolve(spell);
                        });
                    }
                }

                /* back button */
                const backBtn = actionRoot.add([
                    k.rect(80, 34),
                    k.pos(20, panelY + panelH - 42),
                    k.color(...COLORS.panelBg),
                    k.outline(1, rgb(COLORS.panelBorder)),
                    k.area(),
                ]);
                backBtn.add([
                    k.text("Back", { size: 14 }),
                    k.pos(40, 17),
                    k.anchor("center"),
                    k.color(...COLORS.textPrimary),
                ]);
                backBtn.onClick(() => {
                    clearActionUI();
                    resolve(null); /* null = go back to action panel */
                });
            });
        }

        /* ================================================================ */
        /*  Target selection                                                */
        /* ================================================================ */

        function showTargetSelect(spell) {
            return new Promise((resolve) => {
                clearActionUI();
                actionRoot = k.add([k.pos(0, 0), k.z(60)]);

                const combatSt = gameStateStore.getState().combat;
                if (!combatSt) { resolve(null); return; }

                /* AoE and ally spells don't need target selection */
                if (spell.targetType === "all_enemies") {
                    resolve(-1); /* special: all enemies */
                    return;
                }
                if (spell.targetType === "ally") {
                    resolve(-2); /* special: self-heal */
                    return;
                }

                actionRoot.add([
                    k.text("Select Target (click an enemy)", { size: 16 }),
                    k.pos(W / 2, H - 130),
                    k.anchor("center"),
                    k.color(...COLORS.textSecondary),
                ]);

                const aliveEnemies = combatSt.enemies.filter((e) => e.currentHp > 0);
                for (const eo of enemyObjects) {
                    if (eo.enemy.currentHp > 0) {
                        /* highlight clickable enemies */
                        eo.body.opacity = 1;
                        const handler = eo.targetBtn.onClick(() => {
                            clearActionUI();
                            resolve(eo.index);
                        });
                    }
                }

                /* back button */
                const backBtn = actionRoot.add([
                    k.rect(80, 34),
                    k.pos(20, H - 130),
                    k.color(...COLORS.panelBg),
                    k.outline(1, rgb(COLORS.panelBorder)),
                    k.area(),
                ]);
                backBtn.add([
                    k.text("Back", { size: 14 }),
                    k.pos(40, 17),
                    k.anchor("center"),
                    k.color(...COLORS.textPrimary),
                ]);
                backBtn.onClick(() => {
                    clearActionUI();
                    resolve(null);
                });
            });
        }

        /* ================================================================ */
        /*  Item submenu                                                    */
        /* ================================================================ */

        function showItemMenu() {
            return new Promise((resolve) => {
                clearActionUI();
                actionRoot = k.add([k.pos(0, 0), k.z(60)]);

                const items = gameStateStore.getState().inventory.filter(
                    (it) => it.quantity > 0 && it.type !== "currency" && it.type !== "quest_item",
                );

                const panelY = H - 150;

                actionRoot.add([
                    k.rect(W, 140),
                    k.pos(0, panelY),
                    k.color(...COLORS.hudBg),
                    k.opacity(0.95),
                ]);

                actionRoot.add([
                    k.text("Select Item", { size: 16 }),
                    k.pos(W / 2, panelY + 10),
                    k.anchor("center"),
                    k.color(...COLORS.textSecondary),
                ]);

                if (items.length === 0) {
                    actionRoot.add([
                        k.text("No usable items", { size: 18 }),
                        k.pos(W / 2, panelY + 55),
                        k.anchor("center"),
                        k.color(...COLORS.textSecondary),
                    ]);
                } else {
                    const btnW = 160;
                    const gap = 12;
                    const totalW = items.length * (btnW + gap) - gap;
                    const startX = (W - totalW) / 2;

                    for (let i = 0; i < items.length; i++) {
                        const item = items[i];
                        const bx = startX + i * (btnW + gap);

                        const btn = actionRoot.add([
                            k.rect(btnW, 50),
                            k.pos(bx, panelY + 35),
                            k.color(Math.floor(COLORS.heal[0] * 0.2),
                                    Math.floor(COLORS.heal[1] * 0.2),
                                    Math.floor(COLORS.heal[2] * 0.2)),
                            k.outline(2, rgb(COLORS.heal)),
                            k.area(),
                        ]);
                        btn.add([
                            k.text(item.name + " x" + item.quantity, { size: 14 }),
                            k.pos(btnW / 2, 25),
                            k.anchor("center"),
                            k.color(...COLORS.textPrimary),
                        ]);

                        btn.onClick(() => {
                            clearActionUI();
                            resolve(item.id);
                        });
                    }
                }

                /* back */
                const backBtn = actionRoot.add([
                    k.rect(80, 34),
                    k.pos(20, panelY + 96),
                    k.color(...COLORS.panelBg),
                    k.outline(1, rgb(COLORS.panelBorder)),
                    k.area(),
                ]);
                backBtn.add([
                    k.text("Back", { size: 14 }),
                    k.pos(40, 17),
                    k.anchor("center"),
                    k.color(...COLORS.textPrimary),
                ]);
                backBtn.onClick(() => {
                    clearActionUI();
                    resolve(null);
                });
            });
        }

        /* ================================================================ */
        /*  Mentor hint display                                             */
        /* ================================================================ */

        function showMentorHint() {
            /* The mentor provides a conceptual hint.
               In combat, we show it as an overlay before the next question. */
            const hint = mentorSystem.useHint("pre_combat", "mixed", 3);
            if (hint) {
                showMessage("Prof. Sage: \"" + hint + "\"", COLORS.secondary, 3);
            } else {
                showMessage("No mentor hints remaining.", COLORS.textSecondary, 2);
            }
        }

        /* ================================================================ */
        /*  MAIN COMBAT LOOP                                                */
        /* ================================================================ */

        async function combatLoop() {
            while (combatRunning) {
                refreshHUD();

                /* ---- Player Turn ---- */
                const action = await showActionPanel();

                if (!combatRunning) break;

                /* -- SPELL -- */
                if (action === "spell") {
                    const spell = await showSpellMenu();
                    if (!spell) continue; /* back to action panel */

                    /* target selection */
                    let targetIndex = 0;
                    if (spell.targetType === "all_enemies") {
                        targetIndex = 0; /* combatSystem handles AoE internally */
                    } else if (spell.targetType === "ally") {
                        targetIndex = 0; /* self */
                    } else {
                        const selected = await showTargetSelect(spell);
                        if (selected === null) continue; /* back */
                        targetIndex = selected >= 0 ? selected : 0;
                    }

                    /* execute spell: question overlay + answer */
                    showMessage("Casting " + spell.name + "...", COLORS.primary, 1.5);
                    const castResult = await combatSystem.castSpell(spell.id, targetIndex);
                    refreshHUD();

                    if (!castResult.success) {
                        showMessage("Not enough MP!", COLORS.danger, 2);
                        continue;
                    }

                    if (castResult.fizzled) {
                        showMessage("Wrong answer! " + spell.name + " fizzled!", COLORS.danger, 2);
                        /* mentor commentary */
                        const commentary = mentorSystem.getCommentary("wrong");
                        if (commentary) showMessage(commentary, COLORS.textSecondary, 2.5);
                        await wait(1.2);
                    } else {
                        /* correct answer -- timing minigame */
                        const timingQuality = await showTimingRing(spell.timingPattern);
                        const finishResult = castResult.finishCast(timingQuality);

                        /* animate effect */
                        if (finishResult.type === "heal") {
                            showDamageEffect(playerVisX, playerVisY, finishResult.amount, true);
                            showSpellEffect(playerVisX, playerVisY, spell.element);
                            showMessage(spell.name + " heals " + finishResult.amount + " HP! (" + timingQuality + ")", COLORS.heal, 2);
                        } else if (finishResult.type === "damage") {
                            const eObj = enemyObjects[targetIndex];
                            if (eObj) {
                                showDamageEffect(eObj.body.pos.x, eObj.body.pos.y, finishResult.damage, false);
                                showSpellEffect(eObj.body.pos.x, eObj.body.pos.y, spell.element);
                            }
                            showMessage(spell.name + " deals " + finishResult.damage + " damage! (" + timingQuality + ")", COLORS.primary, 2);
                        } else if (finishResult.type === "aoe_damage") {
                            for (const r of finishResult.results) {
                                const eObj = enemyObjects[r.enemyIndex];
                                if (eObj) {
                                    showDamageEffect(eObj.body.pos.x, eObj.body.pos.y, r.damage, false);
                                    showSpellEffect(eObj.body.pos.x, eObj.body.pos.y, spell.element);
                                }
                            }
                            showMessage(spell.name + " hits all enemies! (" + timingQuality + ")", COLORS.primary, 2);
                        }

                        /* mentor commentary on correct answer speed */
                        if (castResult.responseTimeMs < 5000) {
                            const c = mentorSystem.getCommentary("correct_fast");
                            if (c) showMessage(c, COLORS.textSecondary, 2);
                        } else {
                            const c = mentorSystem.getCommentary("correct_slow");
                            if (c) showMessage(c, COLORS.textSecondary, 2);
                        }

                        await wait(0.8);
                    }
                }

                /* -- DEFEND -- */
                else if (action === "defend") {
                    combatSystem.defend();
                    showShieldEffect();
                    showMessage("You raise your guard! Damage halved this turn.", COLORS.frost, 2);
                    await wait(0.6);
                }

                /* -- ITEM -- */
                else if (action === "item") {
                    const itemId = await showItemMenu();
                    if (!itemId) continue; /* back */

                    const itemResult = combatSystem.useItem(itemId);
                    refreshHUD();

                    if (!itemResult.success) {
                        showMessage("Cannot use that item.", COLORS.danger, 2);
                        continue;
                    }

                    if (itemResult.effect.type === "heal") {
                        showDamageEffect(playerVisX, playerVisY, itemResult.effect.amount, true);
                        showMessage("Used " + itemResult.item.name + "! Healed " + itemResult.effect.amount + " HP.", COLORS.heal, 2);
                    } else if (itemResult.effect.type === "mana") {
                        showMessage("Used " + itemResult.item.name + "! Recovered " + itemResult.effect.amount + " MP.", COLORS.frost, 2);
                    } else {
                        showMessage("Used " + itemResult.item.name + "!", COLORS.textPrimary, 2);
                    }
                    await wait(0.6);
                }

                /* -- MENTOR -- */
                else if (action === "mentor") {
                    showMentorHint();
                    await wait(2);
                    continue; /* mentor does not end the turn */
                }

                /* ---- Check win/loss after player action ---- */
                const midCheck = combatSystem.checkCombatEnd();
                refreshHUD();

                if (midCheck.ended) {
                    await handleCombatEnd(midCheck);
                    return;
                }

                /* ---- update enemy display for HP changes ---- */
                refreshEnemyDisplay();

                /* ---- Enemy Turns ---- */
                const enemyResults = combatSystem.executeEnemyTurns();
                refreshHUD();

                for (const er of enemyResults) {
                    if (er.action === "stunned") {
                        showMessage(er.enemyName + " is stunned!", COLORS.frost, 1.5);
                    } else if (er.action === "sleeping") {
                        showMessage(er.enemyName + " is sleeping...", COLORS.textSecondary, 1.5);
                    } else {
                        /* enemy attacked */
                        showDamageEffect(playerVisX, playerVisY, er.damage, false);
                        let atkMsg = er.enemyName + " attacks for " + er.damage + " damage!";
                        if (er.wasDefending) atkMsg += " (Reduced by guard)";
                        showMessage(atkMsg, COLORS.danger, 1.8);

                        /* special behavior messages */
                        if (er.action === "attack_shuffle") {
                            showMessage(er.enemyName + " scrambles your spell order!", COLORS.dark, 2);
                        } else if (er.action === "attack_reduce_timer") {
                            showMessage(er.enemyName + " whispers doubt... Timer reduced!", COLORS.dark, 2);
                        }
                    }
                    await wait(0.7);
                }

                /* ---- Low HP warning ---- */
                const postEnemyState = gameStateStore.getState();
                if (postEnemyState.player.hp > 0 && postEnemyState.player.hp <= postEnemyState.player.maxHp * 0.3) {
                    const c = mentorSystem.getCommentary("low_hp");
                    if (c) showMessage(c, COLORS.secondary, 2);
                }

                /* ---- Check win/loss after enemy turns ---- */
                const endCheck = combatSystem.checkCombatEnd();
                refreshHUD();
                refreshEnemyDisplay();

                if (endCheck.ended) {
                    await handleCombatEnd(endCheck);
                    return;
                }

                /* ---- Check for defeated enemies (loot/companion sparks) ---- */
                await checkDefeatedEnemies();
            }
        }

        /* ================================================================ */
        /*  Refresh enemy visual state                                      */
        /* ================================================================ */

        function refreshEnemyDisplay() {
            const combatSt = gameStateStore.getState().combat;
            if (!combatSt) return;

            for (const eo of enemyObjects) {
                const e = combatSt.enemies[eo.index];
                if (!e) continue;
                eo.enemy = e;
                eo.body.opacity = e.currentHp > 0 ? 1 : 0.15;
            }
        }

        /* ================================================================ */
        /*  Check for newly defeated enemies                                */
        /* ================================================================ */

        async function checkDefeatedEnemies() {
            const combatSt = gameStateStore.getState().combat;
            if (!combatSt) return;

            for (const e of combatSt.enemies) {
                if (e.currentHp <= 0 && !e._deathHandled) {
                    e._deathHandled = true;

                    /* grant gold */
                    const goldReward = e.goldReward || 0;
                    if (goldReward > 0) {
                        gameStateStore.addItem({ id: "gold", name: "Gold", type: "currency", quantity: goldReward });
                    }

                    /* companion spark chance */
                    const dropRate = e.companionDropRate || 0;
                    if (Math.random() < dropRate) {
                        const possibleCompanions = ["algebrix", "reactia", "voltaire", "florae", "chronox", "luminos", "gravitas", "ember"];
                        const companionId = possibleCompanions[Math.floor(Math.random() * possibleCompanions.length)];
                        const profile = progression.getProfile();
                        if (!profile.companionsCollected.includes(companionId)) {
                            progression.recordCompanionCollected(companionId);
                            gameStateStore.addCompanion(companionId, 1);
                            showMessage("A companion spark! " + companionId.charAt(0).toUpperCase() + companionId.slice(1) + " joins you!", COLORS.secondary, 3);
                            await wait(1.5);
                        }
                    }
                }
            }
        }

        /* ================================================================ */
        /*  Combat end handler                                              */
        /* ================================================================ */

        async function handleCombatEnd(result) {
            combatRunning = false;
            clearActionUI();

            if (result.result === "victory") {
                await showVictoryScreen(result);
            } else {
                await showDefeatScreen();
            }
        }

        async function showVictoryScreen(result) {
            const overlay = k.add([k.pos(0, 0), k.z(500)]);
            overlay.add([k.rect(W, H), k.color(0, 0, 0), k.opacity(0.7)]);

            const pW = 450;
            const pH = 320;
            const px = (W - pW) / 2;
            const py = (H - pH) / 2;

            overlay.add([
                k.rect(pW, pH),
                k.pos(px, py),
                k.color(...COLORS.panelBg),
                k.outline(2, rgb(COLORS.heal)),
            ]);

            overlay.add([
                k.text("VICTORY!", { size: 36 }),
                k.pos(W / 2, py + 40),
                k.anchor("center"),
                k.color(...COLORS.secondary),
            ]);

            /* XP earned */
            const xpEarned = Math.floor((result.enemiesDefeated || 1) * 20 + (result.turnsTaken || 1) * 5);
            overlay.add([
                k.text("Enemies Defeated: " + (result.enemiesDefeated || 0), { size: 18 }),
                k.pos(W / 2, py + 85),
                k.anchor("center"),
                k.color(...COLORS.textPrimary),
            ]);
            overlay.add([
                k.text("Turns: " + (result.turnsTaken || 0), { size: 16 }),
                k.pos(W / 2, py + 112),
                k.anchor("center"),
                k.color(...COLORS.textSecondary),
            ]);

            /* gold earned */
            const goldEarned = spawnedEnemies.reduce((sum, e) => sum + (e.goldReward || 0), 0);
            overlay.add([
                k.text("Gold Earned: " + goldEarned, { size: 18 }),
                k.pos(W / 2, py + 140),
                k.anchor("center"),
                k.color(...COLORS.secondary),
            ]);

            /* celebration particles */
            for (let i = 0; i < 20; i++) {
                const pp = overlay.add([
                    k.rect(k.rand(3, 7), k.rand(3, 7)),
                    k.pos(W / 2 + k.rand(-150, 150), py + k.rand(-20, pH + 20)),
                    k.color(...(Math.random() < 0.5 ? COLORS.secondary : COLORS.heal)),
                    k.opacity(k.rand(0.3, 0.7)),
                    k.anchor("center"),
                ]);
                const vx = k.rand(-30, 30);
                const vy = k.rand(-40, -10);
                pp.onUpdate(() => {
                    pp.pos.x += vx * k.dt();
                    pp.pos.y += vy * k.dt();
                    pp.opacity -= k.dt() * 0.3;
                    if (pp.opacity <= 0) k.destroy(pp);
                });
            }

            /* continue button */
            await new Promise((resolve) => {
                const btn = overlay.add([
                    k.rect(200, 50),
                    k.pos(W / 2, py + pH - 55),
                    k.anchor("center"),
                    k.color(Math.floor(COLORS.heal[0] * 0.25),
                            Math.floor(COLORS.heal[1] * 0.25),
                            Math.floor(COLORS.heal[2] * 0.25)),
                    k.outline(2, rgb(COLORS.heal)),
                    k.area(),
                ]);
                btn.add([
                    k.text("Continue", { size: 20 }),
                    k.anchor("center"),
                    k.color(...COLORS.textPrimary),
                ]);
                btn.onClick(() => resolve());
            });

            gameStateStore.endCombat();
            k.go("chapterMap", { chapterId });
        }

        async function showDefeatScreen() {
            const overlay = k.add([k.pos(0, 0), k.z(500)]);
            overlay.add([k.rect(W, H), k.color(0, 0, 0), k.opacity(0.8)]);

            const pW = 450;
            const pH = 280;
            const px = (W - pW) / 2;
            const py = (H - pH) / 2;

            overlay.add([
                k.rect(pW, pH),
                k.pos(px, py),
                k.color(...COLORS.panelBg),
                k.outline(2, rgb(COLORS.danger)),
            ]);

            overlay.add([
                k.text("DEFEATED", { size: 36 }),
                k.pos(W / 2, py + 40),
                k.anchor("center"),
                k.color(...COLORS.danger),
            ]);

            overlay.add([
                k.text("You fell in battle...", { size: 18 }),
                k.pos(W / 2, py + 85),
                k.anchor("center"),
                k.color(...COLORS.textSecondary),
            ]);

            overlay.add([
                k.text("But every failure is a lesson.", { size: 16 }),
                k.pos(W / 2, py + 115),
                k.anchor("center"),
                k.color(...COLORS.textPrimary),
            ]);

            /* retry and return buttons */
            await new Promise((resolve) => {
                const retryBtn = overlay.add([
                    k.rect(160, 44),
                    k.pos(W / 2 - 100, py + pH - 60),
                    k.anchor("center"),
                    k.color(Math.floor(COLORS.primary[0] * 0.25),
                            Math.floor(COLORS.primary[1] * 0.25),
                            Math.floor(COLORS.primary[2] * 0.25)),
                    k.outline(2, rgb(COLORS.primary)),
                    k.area(),
                ]);
                retryBtn.add([
                    k.text("Retry", { size: 18 }),
                    k.anchor("center"),
                    k.color(...COLORS.textPrimary),
                ]);
                retryBtn.onClick(() => {
                    /* restore some HP for retry */
                    const s = gameStateStore.getState();
                    s.player.hp = Math.floor(s.player.maxHp * 0.5);
                    s.player.mp = Math.floor(s.player.maxMp * 0.5);
                    gameStateStore.endCombat();
                    resolve("retry");
                });

                const returnBtn = overlay.add([
                    k.rect(160, 44),
                    k.pos(W / 2 + 100, py + pH - 60),
                    k.anchor("center"),
                    k.color(Math.floor(COLORS.danger[0] * 0.25),
                            Math.floor(COLORS.danger[1] * 0.25),
                            Math.floor(COLORS.danger[2] * 0.25)),
                    k.outline(2, rgb(COLORS.danger)),
                    k.area(),
                ]);
                returnBtn.add([
                    k.text("Return to Map", { size: 14 }),
                    k.anchor("center"),
                    k.color(...COLORS.textPrimary),
                ]);
                returnBtn.onClick(() => {
                    const s = gameStateStore.getState();
                    s.player.hp = Math.floor(s.player.maxHp * 0.3);
                    s.player.mp = s.player.maxMp;
                    gameStateStore.endCombat();
                    resolve("return");
                });
            }).then((choice) => {
                if (choice === "retry") {
                    k.go("combat", { nodeId, enemies, isBoss });
                } else {
                    k.go("chapterMap", { chapterId });
                }
            });
        }

        /* ================================================================ */
        /*  Start the combat loop                                           */
        /* ================================================================ */

        combatLoop();
    });
}
