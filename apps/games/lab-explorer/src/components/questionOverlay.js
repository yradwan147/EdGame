/**
 * Lab-themed MCQ overlay. "Lab Check" title.
 * Blue/teal color scheme. Same mechanics as Pulse Realms.
 */
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

            // Dim background
            root.add([
                k.rect(k.width(), k.height()),
                k.color(0, 0, 0),
                k.opacity(0.75),
            ]);

            // Title
            root.add([
                k.text("Lab Check", { size: 38 }),
                k.pos(k.width() / 2, 100),
                k.anchor("center"),
                k.color(60, 200, 220),
            ]);

            // Difficulty badge
            root.add([
                k.text(`Difficulty ${question.difficulty}`, { size: 16 }),
                k.pos(k.width() / 2, 140),
                k.anchor("center"),
                k.color(140, 160, 200),
            ]);

            // Question box
            root.add([
                k.rect(900, 90),
                k.pos(k.width() / 2 - 450, 170),
                k.color(18, 32, 56),
                k.outline(2, k.rgb(60, 200, 220)),
            ]);

            root.add([
                k.text(question.text, { size: 26, width: 860 }),
                k.pos(k.width() / 2, 215),
                k.anchor("center"),
                k.color(230, 245, 255),
            ]);

            // Timer bar
            const timerBg = root.add([
                k.rect(900, 16),
                k.pos(k.width() / 2 - 450, 285),
                k.color(30, 40, 60),
            ]);
            const timerFill = root.add([
                k.rect(900, 16),
                k.pos(timerBg.pos.x, timerBg.pos.y),
                k.color(60, 200, 220),
            ]);

            // Answer buttons (2x2 grid)
            const labels = ["A", "B", "C", "D"];
            const btnColors = [
                [40, 100, 160],
                [30, 130, 140],
                [50, 120, 100],
                [60, 90, 150],
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
                const x = k.width() / 2 - 430 + col * 460;
                const y = 330 + row * 120;
                const btn = root.add([
                    k.rect(410, 95),
                    k.pos(x, y),
                    k.color(...btnColors[i]),
                    k.area(),
                    k.outline(2, k.rgb(80, 200, 220)),
                ]);
                btn.add([
                    k.text(`(${labels[i]}) ${question.options[i]}`, { size: 21, width: 380 }),
                    k.pos(205, 48),
                    k.anchor("center"),
                    k.color(230, 245, 255),
                ]);
                btn.onClick(() => finish(i));
            }

            // Hint text
            const hint = root.add([
                k.text("Press 1/2/3/4 or click an option", { size: 15 }),
                k.pos(k.width() / 2, 600),
                k.anchor("center"),
                k.color(130, 150, 190),
            ]);

            // Keyboard shortcuts
            const cancelFns = [];
            ["1", "2", "3", "4"].forEach((key, index) => {
                const maybeCancel = k.onKeyPress(key, () => finish(index));
                cancelFns.push(maybeCancel);
            });

            // Timer update
            const timeCancel = k.onUpdate(() => {
                const elapsed = (Date.now() - startedAt) / 1000;
                remaining = Math.max(0, question.timeLimitSec - elapsed);
                timerFill.width = (remaining / question.timeLimitSec) * 900;
                if (remaining < 3) {
                    timerFill.color = k.rgb(255, 75, 75);
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
