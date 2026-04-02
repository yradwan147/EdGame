import { COLORS } from "../config/constants.js";
import { getScenarioList } from "../config/scenarios.js";

export function registerScenarioSelectScene({ k, gameStateStore, progression }) {
    k.scene("scenarioSelect", () => {
        const profile = progression.getProfile();
        const scenarios = getScenarioList();

        k.add([k.rect(k.width(), k.height()), k.color(...COLORS.bgDark)]);

        k.add([
            k.text("SELECT SCENARIO", { size: 40 }),
            k.pos(k.width() / 2, 50),
            k.anchor("center"),
            k.color(...COLORS.dangerOrange),
        ]);

        k.add([
            k.text("Choose your survival challenge", { size: 18 }),
            k.pos(k.width() / 2, 95),
            k.anchor("center"),
            k.color(...COLORS.textSecondary),
        ]);

        const CARD_W = 360;
        const CARD_H = 380;
        const GAP = 30;
        const startX = (k.width() - (scenarios.length * CARD_W + (scenarios.length - 1) * GAP)) / 2;

        for (let i = 0; i < scenarios.length; i++) {
            const sc = scenarios[i];
            const cx = startX + i * (CARD_W + GAP);
            const cy = 140;
            const isCompleted = profile.completedScenarios.includes(sc.id);

            // Card background
            const card = k.add([
                k.rect(CARD_W, CARD_H),
                k.pos(cx, cy),
                k.color(...sc.bgColor),
                k.area(),
                k.outline(3, k.rgb(...sc.accentColor)),
            ]);

            // Scenario name
            card.add([
                k.text(sc.name, { size: 28 }),
                k.pos(CARD_W / 2, 25),
                k.anchor("center"),
                k.color(...sc.accentColor),
            ]);

            // Subtitle
            card.add([
                k.text(sc.subtitle, { size: 16 }),
                k.pos(CARD_W / 2, 58),
                k.anchor("center"),
                k.color(...COLORS.textSecondary),
            ]);

            // Difficulty
            const diffStars = "* ".repeat(sc.difficulty).trim();
            card.add([
                k.text(`Difficulty: ${diffStars}`, { size: 14 }),
                k.pos(CARD_W / 2, 85),
                k.anchor("center"),
                k.color(...COLORS.xpGold),
            ]);

            // Duration
            card.add([
                k.text(`${sc.totalDays} days | ${sc.totalDays} puzzles`, { size: 14 }),
                k.pos(CARD_W / 2, 108),
                k.anchor("center"),
                k.color(...COLORS.textMuted),
            ]);

            // Description
            card.add([
                k.text(sc.description, { size: 13, width: CARD_W - 30 }),
                k.pos(15, 135),
                k.color(...COLORS.textPrimary),
            ]);

            // Completion status
            if (isCompleted) {
                card.add([
                    k.text("COMPLETED", { size: 18 }),
                    k.pos(CARD_W / 2, CARD_H - 50),
                    k.anchor("center"),
                    k.color(...COLORS.safeGreen),
                ]);
            }

            // Select button
            const selectBtn = card.add([
                k.rect(CARD_W - 40, 42),
                k.pos(20, CARD_H - 55),
                k.color(...sc.accentColor),
                k.area(),
                k.opacity(0.8),
            ]);
            selectBtn.add([
                k.text(isCompleted ? "REPLAY" : "BEGIN", { size: 20 }),
                k.pos((CARD_W - 40) / 2, 21),
                k.anchor("center"),
                k.color(255, 255, 255),
            ]);

            card.onClick(() => {
                gameStateStore.set({ scenarioId: sc.id });
                k.go("roleAssignment");
            });

            card.onHover(() => {
                card.outline.color = k.rgb(255, 255, 255);
            });
            card.onHoverEnd(() => {
                card.outline.color = k.rgb(...sc.accentColor);
            });
        }

        // Back button
        const backBtn = k.add([
            k.rect(120, 40),
            k.pos(20, k.height() - 60),
            k.color(...COLORS.bgCard),
            k.area(),
            k.outline(1, k.rgb(...COLORS.earth)),
        ]);
        backBtn.add([
            k.text("BACK", { size: 18 }),
            k.pos(60, 20),
            k.anchor("center"),
            k.color(...COLORS.textPrimary),
        ]);
        backBtn.onClick(() => k.go("menu"));
        k.onKeyPress("escape", () => k.go("menu"));
    });
}
