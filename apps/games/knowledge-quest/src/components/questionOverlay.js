import { COLORS } from "../config/constants.js";

/**
 * RPG-themed MCQ overlay -- "Arcane Knowledge" panel.
 * Same functional pattern as Pulse Realms but with purple/gold magic theme.
 */
export function createQuestionOverlay(k) {
    let active = null;

    /* ---- helpers -------------------------------------------------- */

    const rgb = (arr) => k.rgb(arr[0], arr[1], arr[2]);

    function spawnSparkle(parent, x, y) {
        const s = parent.add([
            k.rect(3, 3),
            k.pos(x + k.rand(-6, 6), y + k.rand(-4, 4)),
            k.color(255, 220, 80),
            k.opacity(1),
            k.anchor("center"),
            k.z(1),
        ]);
        const life = k.rand(0.4, 0.9);
        let t = 0;
        const upd = s.onUpdate(() => {
            t += k.dt();
            s.opacity = 1 - t / life;
            s.pos.y -= k.dt() * k.rand(10, 30);
            if (t >= life) {
                upd.cancel();
                k.destroy(s);
            }
        });
    }

    /* ---- public --------------------------------------------------- */

    function cleanup() {
        if (!active) return;
        if (active.root) k.destroy(active.root);
        for (const cancel of active.cancelFns) {
            if (typeof cancel === "function") cancel();
            if (cancel && typeof cancel.cancel === "function") cancel.cancel();
        }
        active = null;
    }

    function show(question) {
        cleanup();
        const startedAt = Date.now();
        let remaining = question.timeLimitSec;
        const W = k.width();
        const H = k.height();

        return new Promise((resolve) => {
            const root = k.add([k.pos(0, 0), k.fixed(), k.z(10000), "question-overlay"]);
            const cancelFns = [];

            /* dim background */
            root.add([k.rect(W, H), k.color(0, 0, 0), k.opacity(0.75)]);

            /* ---- panel frame ---- */
            const panelW = Math.min(920, W - 40);
            const panelX = (W - panelW) / 2;
            const panelY = 70;
            const panelH = 510;

            /* outer border glow */
            root.add([
                k.rect(panelW + 8, panelH + 8),
                k.pos(panelX - 4, panelY - 4),
                k.color(...COLORS.secondary),
                k.opacity(0.35),
                k.outline(3, rgb(COLORS.secondary)),
            ]);

            /* inner panel */
            root.add([
                k.rect(panelW, panelH),
                k.pos(panelX, panelY),
                k.color(...COLORS.panelBg),
                k.outline(2, rgb(COLORS.panelBorder)),
            ]);

            /* ---- magic border corners (decorative rects) ---- */
            const cornerSize = 14;
            const corners = [
                [panelX, panelY],
                [panelX + panelW - cornerSize, panelY],
                [panelX, panelY + panelH - cornerSize],
                [panelX + panelW - cornerSize, panelY + panelH - cornerSize],
            ];
            for (const [cx, cy] of corners) {
                root.add([
                    k.rect(cornerSize, cornerSize),
                    k.pos(cx, cy),
                    k.color(...COLORS.secondary),
                ]);
            }

            /* ---- title ---- */
            root.add([
                k.text("Arcane Knowledge", { size: 32 }),
                k.pos(W / 2, panelY + 36),
                k.anchor("center"),
                k.color(...COLORS.secondary),
            ]);

            /* difficulty badge */
            if (question.difficulty !== undefined) {
                root.add([
                    k.text("Difficulty " + question.difficulty, { size: 16 }),
                    k.pos(W / 2, panelY + 64),
                    k.anchor("center"),
                    k.color(...COLORS.textSecondary),
                ]);
            }

            /* ---- question text ---- */
            root.add([
                k.rect(panelW - 40, 80),
                k.pos(panelX + 20, panelY + 85),
                k.color(16, 12, 32),
                k.outline(1, rgb(COLORS.panelBorder)),
            ]);

            root.add([
                k.text(question.text, { size: 24, width: panelW - 80 }),
                k.pos(W / 2, panelY + 125),
                k.anchor("center"),
                k.color(...COLORS.textPrimary),
            ]);

            /* ---- timer bar ---- */
            const timerY = panelY + 180;
            root.add([
                k.rect(panelW - 40, 14),
                k.pos(panelX + 20, timerY),
                k.color(40, 30, 60),
            ]);

            const timerFill = root.add([
                k.rect(panelW - 40, 14),
                k.pos(panelX + 20, timerY),
                k.color(...COLORS.primary),
            ]);

            /* timer sparkle emitter */
            let sparkleTimer = 0;

            /* ---- answer buttons ---- */
            const labels = ["1", "2", "3", "4"];
            const btnW = (panelW - 60) / 2;
            const btnH = 80;
            const btnGap = 16;
            const btnStartY = timerY + 30;

            function finish(answerIndex) {
                const responseTimeMs = Date.now() - startedAt;
                const timedOut = answerIndex === null;
                const correct = !timedOut && answerIndex === question.correctIndex;
                cleanup();
                resolve({ correct, responseTimeMs, answerIndex, timedOut });
            }

            for (let i = 0; i < 4; i++) {
                const col = i % 2;
                const row = Math.floor(i / 2);
                const bx = panelX + 20 + col * (btnW + btnGap);
                const by = btnStartY + row * (btnH + btnGap);

                const isEven = i % 2 === 0;
                const baseColor = isEven ? COLORS.primary : COLORS.secondary;

                const btn = root.add([
                    k.rect(btnW, btnH),
                    k.pos(bx, by),
                    k.color(
                        Math.floor(baseColor[0] * 0.25),
                        Math.floor(baseColor[1] * 0.25),
                        Math.floor(baseColor[2] * 0.25),
                    ),
                    k.outline(2, rgb(baseColor)),
                    k.area(),
                    k.z(1),
                ]);

                btn.add([
                    k.text("(" + labels[i] + ") " + question.options[i], {
                        size: 20,
                        width: btnW - 30,
                    }),
                    k.pos(btnW / 2, btnH / 2),
                    k.anchor("center"),
                    k.color(...COLORS.textPrimary),
                ]);

                btn.onClick(() => finish(i));

                /* hover highlight */
                btn.onHover(() => {
                    btn.color = k.rgb(
                        Math.floor(baseColor[0] * 0.4),
                        Math.floor(baseColor[1] * 0.4),
                        Math.floor(baseColor[2] * 0.4),
                    );
                });
                btn.onHoverEnd(() => {
                    btn.color = k.rgb(
                        Math.floor(baseColor[0] * 0.25),
                        Math.floor(baseColor[1] * 0.25),
                        Math.floor(baseColor[2] * 0.25),
                    );
                });
            }

            /* ---- keyboard shortcuts ---- */
            ["1", "2", "3", "4"].forEach((key, idx) => {
                cancelFns.push(k.onKeyPress(key, () => finish(idx)));
            });

            /* ---- hint label ---- */
            const hintLabel = root.add([
                k.text("Press 1-4 or click an answer", { size: 14 }),
                k.pos(W / 2, btnStartY + 2 * (btnH + btnGap) + 12),
                k.anchor("center"),
                k.color(...COLORS.textSecondary),
            ]);

            /* ---- per-frame update ---- */
            const timerBarFullW = panelW - 40;
            const timeCancel = k.onUpdate(() => {
                const elapsed = (Date.now() - startedAt) / 1000;
                remaining = Math.max(0, question.timeLimitSec - elapsed);
                const frac = remaining / question.timeLimitSec;
                timerFill.width = frac * timerBarFullW;

                /* color shift when low */
                if (frac < 0.25) {
                    timerFill.color = rgb(COLORS.danger);
                    hintLabel.text = "Hurry! " + remaining.toFixed(1) + "s";
                } else if (frac < 0.5) {
                    timerFill.color = rgb(COLORS.secondary);
                }

                /* sparkle at leading edge of timer */
                sparkleTimer += k.dt();
                if (sparkleTimer > 0.08) {
                    sparkleTimer = 0;
                    spawnSparkle(
                        root,
                        timerFill.pos.x + timerFill.width,
                        timerFill.pos.y + 7,
                    );
                }

                if (remaining <= 0) finish(null);
            });
            cancelFns.push(timeCancel);

            active = { root, cancelFns };
        });
    }

    return {
        show,
        isActive() {
            return Boolean(active);
        },
        destroy: cleanup,
    };
}
