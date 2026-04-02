import { COLORS, PHASE_IDS } from "../config/constants.js";
import { ROLE_CONFIG } from "../config/roles.js";
import { createActionEffects } from "../components/actionEffects.js";
import { createResourceSystem } from "../systems/resourceSystem.js";

export function registerSurvivalHubScene({ k, gameStateStore, telemetry }) {
    k.scene("survivalHub", () => {
        const state = gameStateStore.getState();
        const scenario = state.scenarioData;
        const day = state.currentDay;
        const dayData = scenario.days[day - 1];
        const effects = createActionEffects(k);
        const resourceSys = createResourceSystem();

        // Background
        k.add([k.rect(k.width(), k.height()), k.color(...(scenario.bgColor || COLORS.bgDark))]);

        // Day transition effect
        effects.dayTransition(day);

        // Header
        k.add([k.rect(k.width(), 60), k.pos(0, 0), k.color(...COLORS.bgPanel), k.opacity(0.92)]);
        k.add([
            k.text(`${scenario.name} -- Day ${day} of ${scenario.totalDays}`, { size: 24 }),
            k.pos(20, 18),
            k.color(...COLORS.xpGold),
        ]);

        // Player role indicator
        const playerRole = ROLE_CONFIG[state.playerRole];
        k.add([
            k.text(`Playing as: ${playerRole.name} (${playerRole.title})`, { size: 16 }),
            k.pos(k.width() - 20, 22),
            k.anchor("topright"),
            k.color(...playerRole.color),
        ]);

        // Day title + briefing
        k.add([
            k.text(dayData.title, { size: 36 }),
            k.pos(k.width() / 2, 95),
            k.anchor("center"),
            k.color(...COLORS.dangerOrange),
        ]);

        // Breaking news style briefing
        k.add([
            k.rect(800, 80),
            k.pos(k.width() / 2 - 400, 130),
            k.color(...COLORS.bgPanel),
            k.outline(2, k.rgb(...COLORS.dangerOrange)),
        ]);
        k.add([
            k.text("SITUATION REPORT", { size: 14 }),
            k.pos(k.width() / 2, 137),
            k.anchor("center"),
            k.color(...COLORS.dangerOrange),
        ]);
        k.add([
            k.text(dayData.briefing, { size: 16, width: 760 }),
            k.pos(k.width() / 2, 165),
            k.anchor("center"),
            k.color(...COLORS.textPrimary),
        ]);

        // Resource display
        const resY = 230;
        k.add([k.rect(300, 110), k.pos(30, resY), k.color(...COLORS.bgPanel), k.outline(1, k.rgb(...COLORS.earth))]);
        k.add([k.text("Resources", { size: 16 }), k.pos(40, resY + 8), k.color(...COLORS.earthLight)]);

        const resItems = [
            { key: "food", label: "Food", color: COLORS.resourceFood },
            { key: "water", label: "Water", color: COLORS.resourceWater },
            { key: "materials", label: "Materials", color: COLORS.resourceMaterials },
        ];
        for (let i = 0; i < resItems.length; i++) {
            const ri = resItems[i];
            const ry = resY + 32 + i * 24;
            k.add([k.text(`${ri.label}: ${state.resources[ri.key]}`, { size: 15 }), k.pos(50, ry), k.color(...ri.color)]);
            k.add([k.rect(150, 10), k.pos(160, ry + 4), k.color(30, 30, 40)]);
            k.add([k.rect(150 * Math.min(1, state.resources[ri.key] / 100), 10), k.pos(160, ry + 4), k.color(...ri.color)]);
        }

        // Team health display
        k.add([k.rect(300, 130), k.pos(350, resY), k.color(...COLORS.bgPanel), k.outline(1, k.rgb(...COLORS.earth))]);
        k.add([k.text("Team Health", { size: 16 }), k.pos(360, resY + 8), k.color(...COLORS.earthLight)]);
        let hIdx = 0;
        for (const [roleId, config] of Object.entries(ROLE_CONFIG)) {
            const hp = state.teamHealth[roleId] || 0;
            const hy = resY + 32 + hIdx * 24;
            const isPlayer = roleId === state.playerRole;
            k.add([
                k.text(`${config.name}${isPlayer ? " (YOU)" : ""}: ${Math.round(hp)}%`, { size: 14 }),
                k.pos(360, hy),
                k.color(...config.color),
            ]);
            hIdx++;
        }

        // Event warning
        if (dayData.event) {
            k.add([
                k.rect(400, 70),
                k.pos(680, resY),
                k.color(60, 20, 20),
                k.outline(2, k.rgb(...COLORS.dangerRed)),
            ]);
            k.add([
                k.text("INCOMING EVENT", { size: 14 }),
                k.pos(880, resY + 8),
                k.anchor("center"),
                k.color(...COLORS.dangerRed),
            ]);
            k.add([
                k.text(dayData.event.name, { size: 18 }),
                k.pos(880, resY + 28),
                k.anchor("center"),
                k.color(...COLORS.dangerOrange),
            ]);
            k.add([
                k.text(dayData.event.description, { size: 11, width: 370 }),
                k.pos(690, resY + 48),
                k.color(...COLORS.textSecondary),
            ]);
        }

        // Puzzle card
        k.add([
            k.rect(500, 100),
            k.pos(k.width() / 2 - 250, 390),
            k.color(...COLORS.bgCard),
            k.outline(2, k.rgb(...COLORS.accentTeal)),
        ]);
        k.add([
            k.text("TODAY'S CHALLENGE", { size: 14 }),
            k.pos(k.width() / 2, 400),
            k.anchor("center"),
            k.color(...COLORS.accentTeal),
        ]);
        k.add([
            k.text(dayData.puzzleId.replace(/_/g, " ").toUpperCase(), { size: 26 }),
            k.pos(k.width() / 2, 430),
            k.anchor("center"),
            k.color(...COLORS.textPrimary),
        ]);

        // Start puzzle button
        const puzzleBtn = k.add([
            k.rect(300, 56),
            k.pos(k.width() / 2 - 150, 460),
            k.color(...COLORS.earth),
            k.area(),
            k.outline(3, k.rgb(...COLORS.xpGold)),
        ]);
        puzzleBtn.add([
            k.text("ENTER PUZZLE ROOM", { size: 22 }),
            k.pos(150, 28),
            k.anchor("center"),
            k.color(255, 255, 255),
        ]);
        puzzleBtn.onClick(() => {
            // Apply daily consumption before the puzzle
            gameStateStore.consumeDailyResources(scenario.dailyConsumption);

            // Apply resource bonus for the day
            if (dayData.resourceBonus) {
                gameStateStore.modifyResources(dayData.resourceBonus);
            }

            gameStateStore.set({ currentPuzzleId: dayData.puzzleId });
            gameStateStore.setPhase(PHASE_IDS.PUZZLE);
            telemetry.event("puzzle_entered", { day, puzzleId: dayData.puzzleId });
            k.go("puzzleRoom");
        });

        puzzleBtn.onHover(() => { puzzleBtn.color = k.rgb(...COLORS.earthLight); });
        puzzleBtn.onHoverEnd(() => { puzzleBtn.color = k.rgb(...COLORS.earth); });

        // Puzzles completed this scenario
        const completed = state.puzzlesCompleted.length;
        k.add([
            k.text(`Puzzles completed: ${completed} / ${scenario.totalDays}`, { size: 14 }),
            k.pos(k.width() / 2, 530),
            k.anchor("center"),
            k.color(...COLORS.textMuted),
        ]);

        // Resource warnings
        const status = resourceSys.getResourceStatus(state.resources, scenario.dailyConsumption);
        if (status.warnings.length > 0) {
            for (let i = 0; i < status.warnings.length; i++) {
                k.add([
                    k.text(status.warnings[i], { size: 14 }),
                    k.pos(k.width() / 2, 560 + i * 20),
                    k.anchor("center"),
                    k.color(...COLORS.dangerOrange),
                ]);
            }
        }

        k.add([
            k.text("Press ENTER to start puzzle", { size: 14 }),
            k.pos(k.width() / 2, k.height() - 30),
            k.anchor("center"),
            k.color(...COLORS.textMuted),
        ]);
        k.onKeyPress("enter", () => {
            gameStateStore.consumeDailyResources(scenario.dailyConsumption);
            if (dayData.resourceBonus) gameStateStore.modifyResources(dayData.resourceBonus);
            gameStateStore.set({ currentPuzzleId: dayData.puzzleId });
            gameStateStore.setPhase(PHASE_IDS.PUZZLE);
            telemetry.event("puzzle_entered", { day, puzzleId: dayData.puzzleId });
            k.go("puzzleRoom");
        });
    });
}
