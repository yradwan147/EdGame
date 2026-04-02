import { COLORS } from "../config/constants.js";

export function createQuestionOverlay(k) {
    let active = null;

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

        return new Promise((resolve) => {
            const root = k.add([
                k.pos(0, 0),
                k.fixed(),
                k.z(10000),
                "question-overlay",
            ]);

            root.add([
                k.rect(k.width(), k.height()),
                k.color(0, 0, 0),
                k.opacity(0.75),
            ]);

            root.add([
                k.text("Survival Check", { size: 36 }),
                k.pos(k.width() / 2, 100),
                k.anchor("center"),
                k.color(...COLORS.dangerOrange),
            ]);

            root.add([
                k.text(`Difficulty ${question.difficulty}`, { size: 18 }),
                k.pos(k.width() / 2, 140),
                k.anchor("center"),
                k.color(...COLORS.textSecondary),
            ]);

            root.add([
                k.rect(900, 90),
                k.pos(k.width() / 2 - 450, 175),
                k.color(...COLORS.bgPanel),
                k.outline(2, k.rgb(...COLORS.earth)),
            ]);

            root.add([
                k.text(question.text, { size: 26, width: 860 }),
                k.pos(k.width() / 2, 220),
                k.anchor("center"),
                k.color(...COLORS.textPrimary),
            ]);

            const timerBg = root.add([
                k.rect(900, 16),
                k.pos(k.width() / 2 - 450, 290),
                k.color(45, 45, 55),
            ]);
            const timerFill = root.add([
                k.rect(900, 16),
                k.pos(timerBg.pos.x, timerBg.pos.y),
                k.color(...COLORS.safeGreen),
            ]);

            const labels = ["A", "B", "C", "D"];
            const btnColors = [
                COLORS.dangerOrange,
                COLORS.waterBlue,
                COLORS.safeGreen,
                COLORS.earthLight,
            ];

            function finish(answerIndex) {
                const responseTimeMs = Date.now() - startedAt;
                const timedOut = answerIndex === null;
                const correct = !timedOut && answerIndex === question.correctIndex;
                cleanup();
                resolve({ correct, responseTimeMs, answerIndex, timedOut });
            }

            for (let i = 0; i < 4; i += 1) {
                const col = i % 2;
                const row = Math.floor(i / 2);
                const x = k.width() / 2 - 420 + col * 450;
                const y = 330 + row * 110;
                const btn = root.add([
                    k.rect(400, 85),
                    k.pos(x, y),
                    k.color(...btnColors[i]),
                    k.area(),
                    k.outline(2, k.rgb(255, 255, 255)),
                ]);
                btn.add([
                    k.text(`(${labels[i]}) ${question.options[i]}`, { size: 21, width: 370 }),
                    k.pos(200, 42),
                    k.anchor("center"),
                    k.color(255, 255, 255),
                ]);
                btn.onClick(() => finish(i));
            }

            const hint = root.add([
                k.text("Press 1/2/3/4 or click an option", { size: 16 }),
                k.pos(k.width() / 2, 590),
                k.anchor("center"),
                k.color(...COLORS.textMuted),
            ]);

            const cancelFns = [];
            ["1", "2", "3", "4"].forEach((key, index) => {
                const maybeCancel = k.onKeyPress(key, () => finish(index));
                cancelFns.push(maybeCancel);
            });

            const timeCancel = k.onUpdate(() => {
                const elapsed = (Date.now() - startedAt) / 1000;
                remaining = Math.max(0, question.timeLimitSec - elapsed);
                timerFill.width = (remaining / question.timeLimitSec) * 900;
                if (remaining < 3) {
                    timerFill.color = k.rgb(...COLORS.dangerRed);
                    hint.text = `Hurry: ${remaining.toFixed(1)}s`;
                }
                if (remaining <= 0) {
                    finish(null);
                }
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
