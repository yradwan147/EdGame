// ---------------------------------------------------------------------------
//  questionOverlay.js  --  Knowledge-check overlay for Concept Cascade
// ---------------------------------------------------------------------------
//  Adapted from Pulse Realms' question overlay with tower defense theming.
//
//  Usage:
//    const overlay = createQuestionOverlay(k);
//    const result = await overlay.show(question);
//    // result: { correct, responseTimeMs, answerIndex, timedOut }
// ---------------------------------------------------------------------------

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

            // Dark backdrop
            root.add([
                k.rect(k.width(), k.height()),
                k.color(0, 0, 0),
                k.opacity(0.75),
            ]);

            // Decorative border lines (tower defense themed)
            root.add([
                k.rect(k.width() - 60, k.height() - 60),
                k.pos(30, 30),
                k.color(0, 0, 0),
                k.opacity(0),
                k.outline(2, k.rgb(...COLORS.gold)),
            ]);

            // Title: "Knowledge Check"
            root.add([
                k.text("Knowledge Check", { size: 36 }),
                k.pos(k.width() / 2, 90),
                k.anchor("center"),
                k.color(...COLORS.waveText),
            ]);

            // Difficulty + subject indicator
            const diffText = question.difficulty
                ? `Difficulty ${question.difficulty}`
                : "";
            const subjectText = question.subject
                ? ` - ${question.subject}`
                : "";
            if (diffText || subjectText) {
                root.add([
                    k.text(`${diffText}${subjectText}`, { size: 16 }),
                    k.pos(k.width() / 2, 130),
                    k.anchor("center"),
                    k.color(...COLORS.hudText),
                ]);
            }

            // Question panel background
            root.add([
                k.rect(920, 100),
                k.pos(k.width() / 2 - 460, 160),
                k.color(...COLORS.hud),
                k.outline(2, k.rgb(...COLORS.gold)),
            ]);

            // Question text
            root.add([
                k.text(question.text, { size: 26, width: 880 }),
                k.pos(k.width() / 2, 210),
                k.anchor("center"),
                k.color(255, 255, 255),
            ]);

            // Timer bar background
            const timerBg = root.add([
                k.rect(920, 16),
                k.pos(k.width() / 2 - 460, 280),
                k.color(40, 40, 55),
            ]);

            // Timer bar fill
            const timerFill = root.add([
                k.rect(920, 16),
                k.pos(timerBg.pos.x, timerBg.pos.y),
                k.color(80, 220, 140),
            ]);

            // Answer buttons
            const labels = ["1", "2", "3", "4"];
            const btnColors = [
                COLORS.numberBastion,   // blue
                COLORS.operationCannon, // orange
                COLORS.fractionFreezer, // purple
                COLORS.geometryGuard,   // red
            ];

            let answered = false;

            function finish(answerIndex) {
                if (answered) return;
                answered = true;
                const responseTimeMs = Date.now() - startedAt;
                const timedOut = answerIndex === null;
                const correct =
                    !timedOut && answerIndex === question.correctIndex;

                // Brief feedback flash before cleanup
                if (!timedOut) {
                    const feedbackColor = correct
                        ? [80, 220, 100]
                        : [240, 70, 70];
                    const feedbackText = correct ? "Correct!" : "Wrong!";
                    const fb = root.add([
                        k.text(feedbackText, { size: 40 }),
                        k.pos(k.width() / 2, k.height() / 2 + 140),
                        k.anchor("center"),
                        k.color(...feedbackColor),
                        k.opacity(1),
                    ]);

                    // Cleanup after short delay
                    k.wait(0.5, () => {
                        cleanup();
                        resolve({ correct, responseTimeMs, answerIndex, timedOut });
                    });
                } else {
                    cleanup();
                    resolve({ correct: false, responseTimeMs, answerIndex, timedOut });
                }
            }

            for (let i = 0; i < 4; i++) {
                const col = i % 2;
                const row = Math.floor(i / 2);
                const x = k.width() / 2 - 440 + col * 470;
                const y = 320 + row * 110;

                const btn = root.add([
                    k.rect(420, 85),
                    k.pos(x, y),
                    k.color(...btnColors[i]),
                    k.area(),
                    k.opacity(0.85),
                ]);

                // Option label + text
                const optionText =
                    question.options && question.options[i]
                        ? question.options[i]
                        : "";
                btn.add([
                    k.text(`(${labels[i]}) ${optionText}`, {
                        size: 20,
                        width: 380,
                    }),
                    k.pos(210, 43),
                    k.anchor("center"),
                    k.color(255, 255, 255),
                ]);

                // Hover effect
                btn.onHoverUpdate(() => {
                    btn.opacity = 1;
                });
                btn.onHoverEnd(() => {
                    btn.opacity = 0.85;
                });

                btn.onClick(() => finish(i));
            }

            // Hint text
            const hint = root.add([
                k.text("Press 1/2/3/4 or click an answer", { size: 15 }),
                k.pos(k.width() / 2, 560),
                k.anchor("center"),
                k.color(...COLORS.hudText),
            ]);

            // Keyboard shortcuts
            const cancelFns = [];
            ["1", "2", "3", "4"].forEach((key, index) => {
                const maybeCancel = k.onKeyPress(key, () => finish(index));
                cancelFns.push(maybeCancel);
            });

            // Timer countdown
            const timeCancel = k.onUpdate(() => {
                const elapsed = (Date.now() - startedAt) / 1000;
                remaining = Math.max(0, question.timeLimitSec - elapsed);
                timerFill.width = (remaining / question.timeLimitSec) * 920;

                // Color shift as time runs out
                if (remaining < 3) {
                    timerFill.color = k.rgb(240, 80, 60);
                    hint.text = `Hurry! ${remaining.toFixed(1)}s`;
                    hint.color = k.rgb(240, 80, 60);
                } else if (remaining < 5) {
                    timerFill.color = k.rgb(240, 200, 60);
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
