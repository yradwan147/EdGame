import { COLORS } from "../config/constants.js";
import { EXPERIMENTS } from "../config/experiments.js";

/**
 * Post-lab session results screen.
 * Shows total score, per-category breakdown, discoveries, assessment, badges, XP.
 */
export function registerPostLabScene({ k, telemetry, progression }) {
    k.scene("postLab", ({ summary }) => {
        const profile = progression.getProfile();

        k.add([k.rect(k.width(), k.height()), k.color(10, 16, 30)]);

        // Title
        k.add([
            k.text("Lab Report", { size: 52 }),
            k.pos(k.width() / 2, 40),
            k.anchor("center"),
            k.color(...COLORS.accentBright),
        ]);

        k.add([
            k.text(summary.experimentName, { size: 24 }),
            k.pos(k.width() / 2, 82),
            k.anchor("center"),
            k.color(...COLORS.teal),
        ]);

        // Star rating
        const starStr = [];
        for (let i = 0; i < 5; i++) {
            starStr.push(i < summary.stars ? "*" : ".");
        }
        k.add([
            k.text(`Rating: ${starStr.join(" ")}`, { size: 28 }),
            k.pos(k.width() / 2, 118),
            k.anchor("center"),
            k.color(...COLORS.discoveryGold),
        ]);

        // ---- Left panel: Score breakdown ----
        const leftX = 50;
        const panelY = 160;

        k.add([
            k.rect(540, 340),
            k.pos(leftX, panelY),
            k.color(18, 28, 48),
            k.outline(2, k.rgb(50, 70, 110)),
        ]);

        k.add([
            k.text("Score Breakdown", { size: 22 }),
            k.pos(leftX + 20, panelY + 12),
            k.color(...COLORS.accentBright),
        ]);

        const scores = summary.scores;
        const categories = [
            { label: "Hypothesis", value: scores.hypothesis, max: 20, color: [100, 180, 255] },
            { label: "Equipment", value: scores.equipment, max: 20, color: [60, 200, 120] },
            { label: "Exploration", value: scores.exploration, max: 20, color: [255, 180, 60] },
            { label: "Accuracy", value: scores.accuracy, max: 20, color: [220, 100, 100] },
            { label: "Conclusion", value: scores.conclusion, max: 20, color: [180, 120, 255] },
        ];

        let barY = panelY + 50;
        for (const cat of categories) {
            k.add([
                k.text(`${cat.label}: ${cat.value}/${cat.max}`, { size: 16 }),
                k.pos(leftX + 20, barY),
                k.color(200, 215, 240),
            ]);

            // Bar background
            k.add([
                k.rect(320, 14),
                k.pos(leftX + 190, barY + 2),
                k.color(30, 40, 55),
            ]);
            // Bar fill
            k.add([
                k.rect(Math.max(1, (cat.value / cat.max) * 320), 14),
                k.pos(leftX + 190, barY + 2),
                k.color(cat.color[0], cat.color[1], cat.color[2]),
            ]);

            barY += 35;
        }

        // Total score
        k.add([
            k.text(`TOTAL: ${summary.totalScore} / 100`, { size: 24 }),
            k.pos(leftX + 20, barY + 15),
            k.color(...COLORS.accentBright),
        ]);

        // Stats
        const statsText = [
            `Runs: ${summary.runCount}`,
            `Systematic: ${summary.systematic ? "Yes" : "No"}`,
            `Self-corrections: ${summary.selfCorrections}`,
            `Duration: ${Math.round(summary.durationMs / 1000)}s`,
            `Questions: ${summary.questionsCorrect}/${summary.questionsAnswered}`,
            `Safety goggles: ${summary.gogglesWorn ? "Worn" : "Not worn"}`,
        ].join("\n");

        k.add([
            k.text(statsText, { size: 14, width: 480 }),
            k.pos(leftX + 20, barY + 55),
            k.color(160, 175, 200),
        ]);

        // ---- Right panel: Discoveries + Assessment ----
        const rightX = 620;

        k.add([
            k.rect(620, 160),
            k.pos(rightX, panelY),
            k.color(18, 28, 48),
            k.outline(2, k.rgb(80, 100, 50)),
        ]);

        k.add([
            k.text("Discoveries This Run", { size: 20 }),
            k.pos(rightX + 15, panelY + 10),
            k.color(...COLORS.discoveryGold),
        ]);

        if (summary.discoveries.length > 0) {
            k.add([
                k.text(
                    summary.discoveries.map((d) => `  - ${d}`).join("\n"),
                    { size: 14, width: 580 },
                ),
                k.pos(rightX + 15, panelY + 38),
                k.color(220, 200, 130),
            ]);
        } else {
            k.add([
                k.text("No new discoveries this time. Try extreme values!", { size: 14 }),
                k.pos(rightX + 15, panelY + 38),
                k.color(130, 140, 160),
            ]);
        }

        if (summary.failures.length > 0) {
            k.add([
                k.text(
                    "Disasters: " + summary.failures.join(", "),
                    { size: 14, width: 580 },
                ),
                k.pos(rightX + 15, panelY + 110),
                k.color(...COLORS.disasterPurple),
            ]);
        }

        // Assessment highlights
        k.add([
            k.rect(620, 150),
            k.pos(rightX, panelY + 175),
            k.color(18, 28, 48),
            k.outline(2, k.rgb(60, 80, 120)),
        ]);

        k.add([
            k.text("Assessment Highlights", { size: 20 }),
            k.pos(rightX + 15, panelY + 185),
            k.color(...COLORS.accent),
        ]);

        const assessment = summary.assessment;
        if (assessment) {
            const dims = assessment.dimensions;
            const assessText = [
                `Process (D3): ${dims.d3.score}% — ${dims.d3.details.systematicRate >= 50 ? "Systematic approach" : "Try changing one variable at a time"}`,
                `Knowledge (D1): ${dims.d1.score}% — ${dims.d1.details.questionAccuracy >= 70 ? "Strong knowledge" : "Review the concepts"}`,
                `Dispositions (D5): ${dims.d5.score}% — ${dims.d5.details.curiosity >= 50 ? "Curious explorer" : "Try more extreme values"}`,
                `Overall: ${assessment.overallScore}%`,
            ].join("\n");

            k.add([
                k.text(assessText, { size: 13, width: 580 }),
                k.pos(rightX + 15, panelY + 215),
                k.color(170, 185, 210),
            ]);
        }

        // XP and badges
        k.add([
            k.rect(620, 80),
            k.pos(rightX, panelY + 340),
            k.color(18, 28, 48),
            k.outline(2, k.rgb(80, 120, 60)),
        ]);

        const xp = summary.xpResult;
        k.add([
            k.text(
                `+${xp.xpGained} XP | Level ${xp.level} | Total XP: ${xp.xp}`,
                { size: 18 },
            ),
            k.pos(rightX + 15, panelY + 355),
            k.color(...COLORS.beakerGreen),
        ]);

        if (xp.badges.length > 0) {
            k.add([
                k.text(`Badges: ${xp.badges.join(", ")}`, { size: 13, width: 580 }),
                k.pos(rightX + 15, panelY + 385),
                k.color(200, 180, 100),
            ]);
        }

        // ---- Bottom buttons ----
        // Find next unlocked experiment
        const currentIdx = EXPERIMENTS.findIndex((e) => e.id === summary.experimentId);
        const nextIdx = currentIdx + 1;
        const hasNext = nextIdx < EXPERIMENTS.length && progression.isExperimentUnlocked(nextIdx);

        if (hasNext) {
            const nextBtn = k.add([
                k.rect(260, 55),
                k.pos(k.width() - 310, k.height() - 80),
                k.color(20, 80, 100),
                k.area(),
                k.outline(3, k.rgb(...COLORS.accentBright)),
            ]);
            nextBtn.add([
                k.text("NEXT EXPERIMENT", { size: 22 }),
                k.pos(130, 28),
                k.anchor("center"),
                k.color(...COLORS.accentBright),
            ]);
            const nextExpId = EXPERIMENTS[nextIdx].id;
            nextBtn.onClick(() => k.go("experiment", { experimentId: nextExpId }));
        }

        const backBtn = k.add([
            k.rect(200, 55),
            k.pos(50, k.height() - 80),
            k.color(30, 50, 80),
            k.area(),
            k.outline(2, k.rgb(140, 170, 220)),
        ]);
        backBtn.add([
            k.text("BACK TO LAB", { size: 20 }),
            k.pos(100, 28),
            k.anchor("center"),
            k.color(160, 190, 230),
        ]);
        backBtn.onClick(() => k.go("labSelect"));

        // Export button
        const exportBtn = k.add([
            k.rect(220, 45),
            k.pos(280, k.height() - 75),
            k.color(35, 60, 85),
            k.area(),
            k.outline(2, k.rgb(100, 180, 220)),
        ]);
        exportBtn.add([
            k.text("Export Session JSON", { size: 16 }),
            k.pos(110, 23),
            k.anchor("center"),
            k.color(140, 190, 230),
        ]);
        exportBtn.onClick(() => {
            const blob = new Blob([telemetry.exportSessions()], { type: "application/json" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "lab-explorer-sessions.json";
            link.click();
            URL.revokeObjectURL(link.href);
        });

        // Retry button
        const retryBtn = k.add([
            k.rect(160, 55),
            k.pos(530, k.height() - 80),
            k.color(60, 40, 30),
            k.area(),
            k.outline(2, k.rgb(200, 150, 80)),
        ]);
        retryBtn.add([
            k.text("RETRY", { size: 20 }),
            k.pos(80, 28),
            k.anchor("center"),
            k.color(220, 180, 120),
        ]);
        retryBtn.onClick(() => k.go("experiment", { experimentId: summary.experimentId }));

        k.onKeyPress("enter", () => {
            if (hasNext) {
                k.go("experiment", { experimentId: EXPERIMENTS[nextIdx].id });
            } else {
                k.go("labSelect");
            }
        });
        k.onKeyPress("escape", () => k.go("labSelect"));
    });
}
