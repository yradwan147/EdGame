import { COLORS } from "../config/constants.js";

/**
 * Branching dialogue UI with typewriter effect.
 *
 * Dark panel at bottom of screen, NPC portrait, typewriter text,
 * optional choice buttons.
 */
export function createDialogueBox(k) {
    const rgb = (arr) => k.rgb(arr[0], arr[1], arr[2]);
    const W = k.width();
    const H = k.height();
    const PANEL_H = 200;
    const PANEL_Y = H - PANEL_H;

    let root = null;
    let cancelFns = [];

    /* ---- helpers ---- */

    function cleanup() {
        for (const c of cancelFns) {
            if (typeof c === "function") c();
            if (c && typeof c.cancel === "function") c.cancel();
        }
        cancelFns = [];
        if (root) {
            k.destroy(root);
            root = null;
        }
    }

    /* ---- public ---- */

    /**
     * show(npcName, text, choices?)
     *
     * @param {string} npcName
     * @param {string} text
     * @param {string[]|null} choices  - if provided, show choice buttons
     * @returns {Promise<number|null>}  choice index, or null for "continue"
     */
    function show(npcName, text, choices) {
        cleanup();

        return new Promise((resolve) => {
            root = k.add([k.pos(0, 0), k.fixed(), k.z(9000), "dialogue-box"]);

            /* ---- dim overlay (light) ---- */
            root.add([
                k.rect(W, H),
                k.color(0, 0, 0),
                k.opacity(0.3),
            ]);

            /* ---- panel background ---- */
            root.add([
                k.rect(W, PANEL_H),
                k.pos(0, PANEL_Y),
                k.color(...COLORS.panelBg),
                k.outline(2, rgb(COLORS.panelBorder)),
            ]);

            /* ---- NPC portrait (colored circle with initial) ---- */
            const portraitX = 60;
            const portraitY = PANEL_Y + PANEL_H / 2;
            root.add([
                k.circle(36),
                k.pos(portraitX, portraitY),
                k.anchor("center"),
                k.color(...COLORS.primary),
                k.outline(3, rgb(COLORS.secondary)),
            ]);
            root.add([
                k.text(npcName.charAt(0).toUpperCase(), { size: 30 }),
                k.pos(portraitX, portraitY),
                k.anchor("center"),
                k.color(255, 255, 255),
            ]);

            /* ---- NPC name ---- */
            root.add([
                k.text(npcName, { size: 18 }),
                k.pos(110, PANEL_Y + 16),
                k.color(...COLORS.secondary),
            ]);

            /* ---- typewriter text ---- */
            const textStartX = 110;
            const textStartY = PANEL_Y + 44;
            const maxTextW = choices ? W - 360 : W - 140;

            const typeObj = root.add([
                k.text("", { size: 18, width: maxTextW }),
                k.pos(textStartX, textStartY),
                k.color(...COLORS.textPrimary),
            ]);

            let charIndex = 0;
            let typewriterDone = false;
            const CHAR_DELAY = 0.03; // seconds per character
            let charTimer = 0;

            const typeUpd = k.onUpdate(() => {
                if (typewriterDone) return;
                charTimer += k.dt();
                while (charTimer >= CHAR_DELAY && charIndex < text.length) {
                    charIndex++;
                    charTimer -= CHAR_DELAY;
                }
                typeObj.text = text.slice(0, charIndex);
                if (charIndex >= text.length) typewriterDone = true;
            });
            cancelFns.push(typeUpd);

            /* skip typewriter on click / space */
            function skipTypewriter() {
                charIndex = text.length;
                typeObj.text = text;
                typewriterDone = true;
            }

            if (choices && choices.length > 0) {
                /* ---- choice buttons ---- */
                const choiceBtnW = 220;
                const choiceBtnH = 36;
                const choiceGap = 8;
                const choiceX = W - choiceBtnW - 30;
                const choiceStartY =
                    PANEL_Y + (PANEL_H - choices.length * (choiceBtnH + choiceGap)) / 2;

                choices.forEach((choice, i) => {
                    const cy = choiceStartY + i * (choiceBtnH + choiceGap);
                    const btn = root.add([
                        k.rect(choiceBtnW, choiceBtnH),
                        k.pos(choiceX, cy),
                        k.color(30, 24, 50),
                        k.outline(1, rgb(COLORS.panelBorder)),
                        k.area(),
                        k.z(1),
                    ]);
                    btn.add([
                        k.text(choice, { size: 15, width: choiceBtnW - 16 }),
                        k.pos(choiceBtnW / 2, choiceBtnH / 2),
                        k.anchor("center"),
                        k.color(...COLORS.textPrimary),
                    ]);
                    btn.onHover(() => {
                        btn.color = k.rgb(50, 40, 80);
                        btn.outline.color = rgb(COLORS.secondary);
                    });
                    btn.onHoverEnd(() => {
                        btn.color = k.rgb(30, 24, 50);
                        btn.outline.color = rgb(COLORS.panelBorder);
                    });
                    btn.onClick(() => {
                        cleanup();
                        resolve(i);
                    });
                });
            } else {
                /* ---- "Continue" prompt ---- */
                const contObj = root.add([
                    k.text("Click or press SPACE to continue", { size: 13 }),
                    k.pos(W / 2, PANEL_Y + PANEL_H - 20),
                    k.anchor("center"),
                    k.color(...COLORS.textSecondary),
                    k.opacity(0),
                ]);
                /* blink after typewriter finishes */
                let blinkT = 0;
                const blinkUpd = k.onUpdate(() => {
                    if (!typewriterDone) return;
                    blinkT += k.dt();
                    contObj.opacity = 0.5 + Math.sin(blinkT * 3) * 0.5;
                });
                cancelFns.push(blinkUpd);

                const spaceHandler = k.onKeyPress("space", () => {
                    if (!typewriterDone) {
                        skipTypewriter();
                        return;
                    }
                    cleanup();
                    resolve(null);
                });
                cancelFns.push(spaceHandler);

                /* click handler on full panel area */
                const clickArea = root.add([
                    k.rect(W, PANEL_H),
                    k.pos(0, PANEL_Y),
                    k.area(),
                    k.opacity(0),
                ]);
                clickArea.onClick(() => {
                    if (!typewriterDone) {
                        skipTypewriter();
                        return;
                    }
                    cleanup();
                    resolve(null);
                });
            }
        });
    }

    return {
        show,
        isActive() {
            return Boolean(root);
        },
        destroy: cleanup,
    };
}
