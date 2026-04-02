import { COLORS } from "../config/constants.js";
import { ROLE_CONFIG } from "../config/roles.js";
import { createAssessmentEngine } from "../systems/assessmentEngine.js";
import { createActionEffects } from "../components/actionEffects.js";

export function registerScenarioResultsScene({ k, gameStateStore, telemetry, progression }) {
    k.scene("scenarioResults", () => {
        const state = gameStateStore.getState();
        const scenario = state.scenarioData;
        const effects = createActionEffects(k);
        const assessment = createAssessmentEngine();

        // Build assessment
        const commStats = state.lastCommStats || {
            totalMessages: state.messageLog.length,
            onTaskRatio: 0.7,
            infoShareRate: 0.3,
            playerMessageCount: state.messageStats.totalSent,
            infoRequestCount: state.messageStats.infoRequests,
        };
        const report = assessment.buildAssessment(state, commStats, [], state.puzzlesCompleted);

        // Record scenario completion
        progression.recordScenarioComplete(state.scenarioId);
        const endSummary = {
            score: report.overall.score,
            scenarioId: state.scenarioId,
            daysSurvived: state.currentDay,
            puzzlesSolved: state.puzzlesCompleted.length,
        };
        gameStateStore.endScenario(endSummary);

        telemetry.event("scenario_complete", {
            scenarioId: state.scenarioId,
            score: report.overall.score,
            grade: report.overall.grade,
            daysSurvived: state.currentDay,
            puzzlesSolved: state.puzzlesCompleted.length,
        });

        // Background
        k.add([k.rect(k.width(), k.height()), k.color(...COLORS.bgDark)]);

        // Victory effects
        if (report.overall.score >= 0.6) {
            effects.teamCheer();
        }

        // Title
        k.add([
            k.text("SCENARIO COMPLETE", { size: 40 }),
            k.pos(k.width() / 2, 35),
            k.anchor("center"),
            k.color(...COLORS.xpGold),
        ]);
        k.add([
            k.text(`${scenario.name} -- ${scenario.subtitle}`, { size: 18 }),
            k.pos(k.width() / 2, 72),
            k.anchor("center"),
            k.color(...COLORS.textSecondary),
        ]);

        // Overall grade
        const gradeColor = report.overall.score >= 0.7 ? COLORS.safeGreen
            : report.overall.score >= 0.5 ? COLORS.xpGold
            : COLORS.dangerOrange;
        k.add([
            k.text(report.overall.grade, { size: 72 }),
            k.pos(120, 120),
            k.anchor("center"),
            k.color(...gradeColor),
        ]);
        k.add([
            k.text(report.overall.label, { size: 18 }),
            k.pos(120, 165),
            k.anchor("center"),
            k.color(...COLORS.textPrimary),
        ]);
        k.add([
            k.text(`Score: ${Math.round(report.overall.score * 100)}%`, { size: 16 }),
            k.pos(120, 190),
            k.anchor("center"),
            k.color(...COLORS.textSecondary),
        ]);

        // Stats column
        const statsX = 250;
        const statsY = 110;
        k.add([k.rect(350, 200), k.pos(statsX, statsY), k.color(...COLORS.bgPanel), k.outline(1, k.rgb(...COLORS.earth))]);
        k.add([k.text("Survival Stats", { size: 18 }), k.pos(statsX + 10, statsY + 8), k.color(...COLORS.earthLight)]);

        const stats = [
            `Days survived: ${state.currentDay} / ${scenario.totalDays}`,
            `Puzzles solved: ${state.puzzlesCompleted.length} / ${scenario.totalDays}`,
            `Food remaining: ${state.resources.food}`,
            `Water remaining: ${state.resources.water}`,
            `Materials remaining: ${state.resources.materials}`,
            `Messages sent: ${state.messageStats.totalSent}`,
        ];
        for (let i = 0; i < stats.length; i++) {
            k.add([
                k.text(stats[i], { size: 14 }),
                k.pos(statsX + 15, statsY + 35 + i * 22),
                k.color(...COLORS.textPrimary),
            ]);
        }

        // Team health
        let hIdx = 0;
        for (const [roleId, config] of Object.entries(ROLE_CONFIG)) {
            const hp = state.teamHealth[roleId] || 0;
            k.add([
                k.text(`${config.name}: ${Math.round(hp)}%`, { size: 13 }),
                k.pos(statsX + 200, statsY + 35 + hIdx * 22),
                k.color(...config.color),
            ]);
            hIdx++;
        }

        // Dimension scores
        const dimX = 620;
        const dimY = 110;
        k.add([k.rect(400, 200), k.pos(dimX, dimY), k.color(...COLORS.bgPanel), k.outline(1, k.rgb(...COLORS.earth))]);
        k.add([k.text("Assessment Dimensions", { size: 18 }), k.pos(dimX + 10, dimY + 8), k.color(...COLORS.earthLight)]);

        const dims = Object.entries(report.dimensions);
        for (let i = 0; i < dims.length; i++) {
            const [key, dim] = dims[i];
            const dy = dimY + 35 + i * 25;
            const isPrimary = dim.primary;
            const dimColor = dim.score >= 0.7 ? COLORS.safeGreen
                : dim.score >= 0.5 ? COLORS.xpGold
                : COLORS.dangerOrange;

            k.add([
                k.text(`${dim.label}${isPrimary ? " (PRIMARY)" : ""}`, { size: 13 }),
                k.pos(dimX + 15, dy),
                k.color(...(isPrimary ? COLORS.accentTeal : COLORS.textPrimary)),
            ]);
            // Score bar
            k.add([k.rect(120, 10), k.pos(dimX + 260, dy + 3), k.color(30, 30, 40)]);
            k.add([k.rect(120 * dim.score, 10), k.pos(dimX + 260, dy + 3), k.color(...dimColor)]);
            k.add([
                k.text(`${Math.round(dim.score * 100)}%`, { size: 12 }),
                k.pos(dimX + 385, dy),
                k.color(...dimColor),
            ]);
        }

        // Strengths & Growth areas
        const feedbackY = 330;
        k.add([k.rect(510, 120), k.pos(250, feedbackY), k.color(...COLORS.bgPanel), k.outline(1, k.rgb(...COLORS.safeGreen))]);
        k.add([k.text("Strengths", { size: 16 }), k.pos(260, feedbackY + 8), k.color(...COLORS.safeGreen)]);
        for (let i = 0; i < report.strengths.length; i++) {
            const s = report.strengths[i];
            k.add([
                k.text(`+ ${s.label}: ${s.score}%`, { size: 14 }),
                k.pos(270, feedbackY + 32 + i * 22),
                k.color(...COLORS.textPrimary),
            ]);
        }

        k.add([k.rect(510, 120), k.pos(250, feedbackY + 130), k.color(...COLORS.bgPanel), k.outline(1, k.rgb(...COLORS.dangerOrange))]);
        k.add([k.text("Areas for Growth", { size: 16 }), k.pos(260, feedbackY + 138), k.color(...COLORS.dangerOrange)]);
        for (let i = 0; i < report.growthAreas.length; i++) {
            const g = report.growthAreas[i];
            k.add([
                k.text(`- ${g.label}: ${g.score}%`, { size: 14 }),
                k.pos(270, feedbackY + 162 + i * 22),
                k.color(...COLORS.textPrimary),
            ]);
        }

        // Communication quality details
        const d4 = report.dimensions.d4;
        if (d4 && d4.details) {
            const cqX = 780;
            const cqY = feedbackY;
            k.add([k.rect(260, 200), k.pos(cqX, cqY), k.color(...COLORS.bgPanel), k.outline(1, k.rgb(...COLORS.accentTeal))]);
            k.add([k.text("Team Communication", { size: 14 }), k.pos(cqX + 10, cqY + 8), k.color(...COLORS.accentTeal)]);
            const cqStats = [
                `Quality: ${d4.details.messageQuality}%`,
                `Info Flow: ${d4.details.infoFlow}%`,
                `Partner Equity: ${d4.details.partnerEquity}%`,
                `Participation: ${d4.details.participation}%`,
                `Leadership: ${d4.details.leadership}%`,
                `Total Messages: ${d4.details.totalMessages}`,
            ];
            for (let i = 0; i < cqStats.length; i++) {
                k.add([
                    k.text(cqStats[i], { size: 12 }),
                    k.pos(cqX + 15, cqY + 30 + i * 18),
                    k.color(...COLORS.textPrimary),
                ]);
            }
        }

        // Continue button
        const continueBtn = k.add([
            k.rect(300, 56),
            k.pos(k.width() / 2 - 150, k.height() - 80),
            k.color(...COLORS.earth),
            k.area(),
            k.outline(3, k.rgb(...COLORS.xpGold)),
        ]);
        continueBtn.add([
            k.text("VIEW FULL RESULTS", { size: 22 }),
            k.pos(150, 28),
            k.anchor("center"),
            k.color(255, 255, 255),
        ]);
        continueBtn.onClick(() => k.go("postGame"));
        k.onKeyPress("enter", () => k.go("postGame"));
    });
}
