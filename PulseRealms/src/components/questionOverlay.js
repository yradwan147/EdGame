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
                k.opacity(0.7),
            ]);

            root.add([
                k.text("Knowledge Prompt", { size: 36 }),
                k.pos(k.width() / 2, 110),
                k.anchor("center"),
                k.color(90, 235, 255),
            ]);

            root.add([
                k.text(`Difficulty ${question.difficulty}`, { size: 18 }),
                k.pos(k.width() / 2, 150),
                k.anchor("center"),
                k.color(160, 170, 220),
            ]);

            root.add([
                k.rect(900, 90),
                k.pos(k.width() / 2 - 450, 190),
                k.color(22, 30, 54),
                k.outline(2, k.rgb(90, 108, 150)),
            ]);

            root.add([
                k.text(question.text, { size: 28, width: 860 }),
                k.pos(k.width() / 2, 235),
                k.anchor("center"),
            ]);

            const timerBg = root.add([
                k.rect(900, 18),
                k.pos(k.width() / 2 - 450, 305),
                k.color(45, 45, 65),
            ]);
            const timerFill = root.add([
                k.rect(900, 18),
                k.pos(timerBg.pos.x, timerBg.pos.y),
                k.color(80, 220, 140),
            ]);

            const labels = ["A", "B", "C", "D"];
            const btnColors = [
                [240, 85, 85],
                [80, 120, 255],
                [85, 200, 115],
                [245, 170, 75],
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
                const y = 350 + row * 120;
                const btn = root.add([
                    k.rect(390, 90),
                    k.pos(x, y),
                    k.color(...btnColors[i]),
                    k.area(),
                ]);
                btn.add([
                    k.text(`(${labels[i]}) ${question.options[i]}`, { size: 22, width: 360 }),
                    k.pos(195, 46),
                    k.anchor("center"),
                ]);
                btn.onClick(() => finish(i));
            }

            const hint = root.add([
                k.text("Press 1/2/3/4 or click an option", { size: 16 }),
                k.pos(k.width() / 2, 610),
                k.anchor("center"),
                k.color(150, 160, 200),
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
                if (remaining < 2.5) {
                    timerFill.color = k.rgb(245, 120, 95);
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
