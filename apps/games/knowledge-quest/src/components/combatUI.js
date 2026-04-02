import { COLORS } from "../config/constants.js";

/**
 * Turn-based combat interface.
 *
 * Draws player stats (left), enemy area (right), action panel (bottom),
 * combat log, damage/heal floaters, and turn banners.
 */
export function createCombatUI(k, { gameStateStore }) {
    const rgb = (arr) => k.rgb(arr[0], arr[1], arr[2]);
    const W = k.width();
    const H = k.height();

    /* ---- layer containers ---- */
    let root = null;
    let actionPanel = null;
    let spellMenu = null;
    let turnBanner = null;
    let combatLogEntries = [];
    const MAX_LOG = 3;

    /* ---- references to updatable objects ---- */
    let playerHpBar = null;
    let playerHpText = null;
    let playerMpBar = null;
    let playerMpText = null;
    let playerStatusGroup = null;
    let enemyGroup = null;

    /* ------------------------------------------------------------------ */
    /*  init()                                                            */
    /* ------------------------------------------------------------------ */
    function init() {
        destroy();

        root = k.add([k.pos(0, 0), k.fixed(), k.z(8000), "combat-ui"]);

        /* ---- player area (left) ---- */
        const pX = 30;
        const pY = 60;

        /* character rect */
        root.add([
            k.rect(60, 80),
            k.pos(pX, pY),
            k.color(...COLORS.primary),
            k.outline(2, rgb(COLORS.secondary)),
        ]);
        root.add([
            k.text("P", { size: 32 }),
            k.pos(pX + 30, pY + 40),
            k.anchor("center"),
            k.color(255, 255, 255),
        ]);

        /* HP bar */
        const hpBarW = 140;
        root.add([k.rect(hpBarW, 14), k.pos(pX + 70, pY + 10), k.color(40, 20, 20)]);
        playerHpBar = root.add([
            k.rect(hpBarW, 14),
            k.pos(pX + 70, pY + 10),
            k.color(...COLORS.danger),
        ]);
        playerHpText = root.add([
            k.text("HP", { size: 12 }),
            k.pos(pX + 70, pY + 6),
            k.color(...COLORS.textPrimary),
        ]);

        /* MP bar */
        root.add([k.rect(hpBarW, 10), k.pos(pX + 70, pY + 30), k.color(20, 20, 40)]);
        playerMpBar = root.add([
            k.rect(hpBarW, 10),
            k.pos(pX + 70, pY + 30),
            k.color(80, 120, 255),
        ]);
        playerMpText = root.add([
            k.text("MP", { size: 12 }),
            k.pos(pX + 70, pY + 28),
            k.color(...COLORS.textPrimary),
        ]);

        /* status effects area */
        playerStatusGroup = root.add([k.pos(pX + 70, pY + 50)]);

        /* ---- enemy area placeholder ---- */
        enemyGroup = root.add([k.pos(W - 250, 60)]);

        /* ---- combat log (bottom-left) ---- */
        combatLogEntries = [];
    }

    /* ------------------------------------------------------------------ */
    /*  update(combatState)                                               */
    /* ------------------------------------------------------------------ */
    function update(combatState) {
        if (!root) return;
        const player = combatState.player;
        const hpBarW = 140;

        /* player HP */
        if (playerHpBar && player) {
            const frac = Math.max(0, player.currentHp / player.maxHp);
            playerHpBar.width = frac * hpBarW;
            playerHpText.text = player.currentHp + "/" + player.maxHp;
        }

        /* player MP */
        if (playerMpBar && player) {
            const frac = Math.max(0, player.currentMp / player.maxMp);
            playerMpBar.width = frac * hpBarW;
            playerMpText.text = player.currentMp + "/" + player.maxMp;
        }

        /* status effects */
        if (playerStatusGroup && player && player.statusEffects) {
            /* clear old */
            for (const c of playerStatusGroup.children) k.destroy(c);
            player.statusEffects.forEach((eff, i) => {
                playerStatusGroup.add([
                    k.text(eff.type, { size: 11 }),
                    k.pos(i * 60, 0),
                    k.color(...COLORS.frost),
                ]);
            });
        }

        /* enemies */
        if (enemyGroup && combatState.enemies) {
            for (const c of enemyGroup.children) k.destroy(c);
            combatState.enemies.forEach((enemy, i) => {
                const ey = i * 90;
                const eBarW = 120;

                /* name */
                enemyGroup.add([
                    k.text(enemy.name, { size: 14 }),
                    k.pos(0, ey),
                    k.color(...COLORS.textPrimary),
                ]);

                /* HP bar bg */
                enemyGroup.add([
                    k.rect(eBarW, 10),
                    k.pos(0, ey + 18),
                    k.color(40, 20, 20),
                ]);

                /* HP bar fill */
                const eFrac = Math.max(0, enemy.currentHp / enemy.maxHp);
                enemyGroup.add([
                    k.rect(eFrac * eBarW, 10),
                    k.pos(0, ey + 18),
                    k.color(...COLORS.danger),
                ]);

                /* HP number */
                enemyGroup.add([
                    k.text(enemy.currentHp + "/" + enemy.maxHp, { size: 11 }),
                    k.pos(eBarW + 6, ey + 16),
                    k.color(...COLORS.textSecondary),
                ]);

                /* status bubbles */
                if (enemy.statusEffects && enemy.statusEffects.length) {
                    enemyGroup.add([
                        k.text(enemy.statusEffects.map((s) => s.type).join(", "), {
                            size: 10,
                        }),
                        k.pos(0, ey + 32),
                        k.color(...COLORS.frost),
                    ]);
                }

                /* asleep indicator */
                if (enemy.isAsleep) {
                    enemyGroup.add([
                        k.text("Zzz...", { size: 14 }),
                        k.pos(eBarW + 6, ey),
                        k.color(...COLORS.textSecondary),
                    ]);
                }
            });
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Action panel                                                      */
    /* ------------------------------------------------------------------ */
    function showActionPanel(callbacks) {
        hideActionPanel();
        const panelH = 80;
        const panelY = H - panelH - 10;

        actionPanel = root.add([k.pos(0, 0), k.z(1)]);

        /* background bar */
        actionPanel.add([
            k.rect(W, panelH),
            k.pos(0, panelY),
            k.color(...COLORS.panelBg),
            k.outline(2, rgb(COLORS.panelBorder)),
        ]);

        const btns = [
            { label: "Spell", icon: "*", color: COLORS.primary, cb: callbacks.onSpell },
            { label: "Defend", icon: "D", color: COLORS.frost, cb: callbacks.onDefend },
            { label: "Item", icon: "+", color: COLORS.heal, cb: callbacks.onItem },
            {
                label: "Mentor (" + (callbacks.mentorTokens ?? 0) + ")",
                icon: "?",
                color: COLORS.secondary,
                cb: callbacks.onMentor,
            },
        ];

        const btnW = 160;
        const gap = 20;
        const totalW = btns.length * btnW + (btns.length - 1) * gap;
        const startX = (W - totalW) / 2;

        btns.forEach((b, i) => {
            const bx = startX + i * (btnW + gap);
            const btn = actionPanel.add([
                k.rect(btnW, 54),
                k.pos(bx, panelY + 13),
                k.color(
                    Math.floor(b.color[0] * 0.25),
                    Math.floor(b.color[1] * 0.25),
                    Math.floor(b.color[2] * 0.25),
                ),
                k.outline(2, rgb(b.color)),
                k.area(),
            ]);
            btn.add([
                k.text(b.icon + " " + b.label, { size: 18 }),
                k.pos(btnW / 2, 27),
                k.anchor("center"),
                k.color(...b.color),
            ]);
            btn.onClick(() => {
                if (b.cb) b.cb();
            });
            btn.onHover(() => {
                btn.color = k.rgb(
                    Math.floor(b.color[0] * 0.4),
                    Math.floor(b.color[1] * 0.4),
                    Math.floor(b.color[2] * 0.4),
                );
            });
            btn.onHoverEnd(() => {
                btn.color = k.rgb(
                    Math.floor(b.color[0] * 0.25),
                    Math.floor(b.color[1] * 0.25),
                    Math.floor(b.color[2] * 0.25),
                );
            });
        });
    }

    function hideActionPanel() {
        if (actionPanel) {
            k.destroy(actionPanel);
            actionPanel = null;
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Spell submenu                                                     */
    /* ------------------------------------------------------------------ */
    function showSpellMenu(spells, currentMp, onSelect) {
        hideSpellMenu();

        const menuW = 260;
        const rowH = 44;
        const menuH = spells.length * rowH + 50;
        const mx = W / 2 - menuW / 2;
        const my = H - menuH - 100;

        spellMenu = root.add([k.pos(0, 0), k.z(2)]);

        /* bg */
        spellMenu.add([
            k.rect(menuW, menuH),
            k.pos(mx, my),
            k.color(...COLORS.panelBg),
            k.outline(2, rgb(COLORS.panelBorder)),
        ]);

        spellMenu.add([
            k.text("Spells", { size: 18 }),
            k.pos(mx + menuW / 2, my + 16),
            k.anchor("center"),
            k.color(...COLORS.secondary),
        ]);

        spells.forEach((spell, i) => {
            const sy = my + 36 + i * rowH;
            const canCast = currentMp >= spell.mpCost;
            const textCol = canCast ? COLORS.textPrimary : [80, 70, 100];

            const row = spellMenu.add([
                k.rect(menuW - 16, rowH - 6),
                k.pos(mx + 8, sy),
                k.color(canCast ? 30 : 20, canCast ? 24 : 16, canCast ? 50 : 30),
                k.outline(1, canCast ? rgb(COLORS.panelBorder) : k.rgb(50, 40, 70)),
                k.area(),
            ]);

            row.add([
                k.text(spell.name + "  (MP " + spell.mpCost + ")", { size: 15, width: menuW - 40 }),
                k.pos(8, rowH / 2 - 3),
                k.anchor("left"),
                k.color(...textCol),
            ]);

            if (canCast) {
                row.onClick(() => {
                    hideSpellMenu();
                    onSelect(spell);
                });
                row.onHover(() => {
                    row.color = k.rgb(45, 36, 70);
                });
                row.onHoverEnd(() => {
                    row.color = k.rgb(30, 24, 50);
                });
            }
        });

        /* close button */
        const closeBtn = spellMenu.add([
            k.rect(80, 30),
            k.pos(mx + menuW / 2 - 40, my + menuH - 38),
            k.color(60, 40, 80),
            k.outline(1, rgb(COLORS.panelBorder)),
            k.area(),
        ]);
        closeBtn.add([
            k.text("Back", { size: 14 }),
            k.pos(40, 15),
            k.anchor("center"),
            k.color(...COLORS.textSecondary),
        ]);
        closeBtn.onClick(() => hideSpellMenu());
    }

    function hideSpellMenu() {
        if (spellMenu) {
            k.destroy(spellMenu);
            spellMenu = null;
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Turn banner                                                       */
    /* ------------------------------------------------------------------ */
    function showTurnBanner(text) {
        hideTurnBanner();
        turnBanner = root.add([k.pos(0, 0), k.z(3)]);

        turnBanner.add([
            k.rect(W, 50),
            k.pos(0, H / 2 - 25),
            k.color(...COLORS.panelBg),
            k.opacity(0.85),
        ]);
        turnBanner.add([
            k.text(text, { size: 28 }),
            k.pos(W / 2, H / 2),
            k.anchor("center"),
            k.color(...COLORS.secondary),
        ]);

        k.wait(1.2, () => hideTurnBanner());
    }

    function hideTurnBanner() {
        if (turnBanner) {
            k.destroy(turnBanner);
            turnBanner = null;
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Floating numbers                                                  */
    /* ------------------------------------------------------------------ */
    function showDamageNumber(pos, amount, color) {
        const col = color || COLORS.danger;
        const t = root.add([
            k.text("-" + amount, { size: 26 }),
            k.pos(pos.x, pos.y),
            k.anchor("center"),
            k.color(...col),
            k.opacity(1),
            k.z(5),
        ]);
        let elapsed = 0;
        t.onUpdate(() => {
            elapsed += k.dt();
            t.pos.y -= 55 * k.dt();
            t.opacity = 1 - elapsed / 1.0;
            if (elapsed >= 1) k.destroy(t);
        });
    }

    function showHealNumber(pos, amount) {
        const t = root.add([
            k.text("+" + amount, { size: 26 }),
            k.pos(pos.x, pos.y),
            k.anchor("center"),
            k.color(...COLORS.heal),
            k.opacity(1),
            k.z(5),
        ]);
        let elapsed = 0;
        t.onUpdate(() => {
            elapsed += k.dt();
            t.pos.y -= 45 * k.dt();
            t.opacity = 1 - elapsed / 1.0;
            if (elapsed >= 1) k.destroy(t);
        });
    }

    function showStatusText(pos, text) {
        const t = root.add([
            k.text(text, { size: 18 }),
            k.pos(pos.x, pos.y),
            k.anchor("center"),
            k.color(...COLORS.frost),
            k.opacity(1),
            k.z(5),
        ]);
        let elapsed = 0;
        t.onUpdate(() => {
            elapsed += k.dt();
            t.pos.y -= 30 * k.dt();
            t.opacity = 1 - elapsed / 1.2;
            if (elapsed >= 1.2) k.destroy(t);
        });
    }

    /* ------------------------------------------------------------------ */
    /*  Combat log                                                        */
    /* ------------------------------------------------------------------ */
    function addLogEntry(message) {
        combatLogEntries.push(message);
        if (combatLogEntries.length > MAX_LOG) combatLogEntries.shift();
        renderLog();
    }

    let logGroup = null;
    function renderLog() {
        if (logGroup) k.destroy(logGroup);
        if (!root) return;

        logGroup = root.add([k.pos(10, H - 180), k.z(4)]);
        combatLogEntries.forEach((msg, i) => {
            logGroup.add([
                k.text(msg, { size: 12, width: 300 }),
                k.pos(0, i * 18),
                k.color(...COLORS.textSecondary),
                k.opacity(0.7),
            ]);
        });
    }

    /* ------------------------------------------------------------------ */
    /*  destroy                                                           */
    /* ------------------------------------------------------------------ */
    function destroy() {
        hideActionPanel();
        hideSpellMenu();
        hideTurnBanner();
        if (logGroup) {
            k.destroy(logGroup);
            logGroup = null;
        }
        if (root) {
            k.destroy(root);
            root = null;
        }
        combatLogEntries = [];
    }

    /* ------------------------------------------------------------------ */
    return {
        init,
        update,
        showActionPanel,
        hideActionPanel,
        showSpellMenu,
        hideSpellMenu,
        showTurnBanner,
        showDamageNumber,
        showHealNumber,
        showStatusText,
        addLogEntry,
        destroy,
    };
}
