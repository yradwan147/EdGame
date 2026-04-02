import { COLORS } from "../config/constants.js";

export function registerPostGameScene({ k, gameStateStore, telemetry, progression }) {
    k.scene("postGame", () => {
        const state = gameStateStore.getState();
        const profile = progression.getProfile();

        // End telemetry session
        telemetry.endSession({
            score: state.finalSummary?.score || 0,
            scenarioId: state.scenarioId,
            daysSurvived: state.currentDay,
            puzzlesSolved: state.puzzlesCompleted.length,
        });

        k.add([k.rect(k.width(), k.height()), k.color(...COLORS.bgDark)]);

        // Title
        k.add([
            k.text("SURVIVAL COMPLETE", { size: 44 }),
            k.pos(k.width() / 2, 40),
            k.anchor("center"),
            k.color(...COLORS.xpGold),
        ]);

        // Profile summary
        k.add([
            k.rect(500, 160),
            k.pos(k.width() / 2 - 250, 90),
            k.color(...COLORS.bgPanel),
            k.outline(2, k.rgb(...COLORS.xpGold)),
        ]);
        k.add([
            k.text("Survivor Profile", { size: 22 }),
            k.pos(k.width() / 2, 105),
            k.anchor("center"),
            k.color(...COLORS.xpGold),
        ]);

        const nextLevelXp = progression.requiredXpForLevel(profile.level + 1);
        const profileLines = [
            `Level: ${profile.level}`,
            `XP: ${profile.xp} / ${nextLevelXp} (next level)`,
            `Scenarios completed: ${profile.scenariosCompleted}`,
            `Puzzles solved: ${profile.puzzlesSolved}`,
            `Questions answered: ${profile.totalQuestionsAnswered} (${profile.totalQuestionsCorrect} correct)`,
            `Messages sent: ${profile.messagesSent}`,
        ];
        for (let i = 0; i < profileLines.length; i++) {
            k.add([
                k.text(profileLines[i], { size: 15 }),
                k.pos(k.width() / 2 - 230, 135 + i * 20),
                k.color(...COLORS.textPrimary),
            ]);
        }

        // XP bar
        const barW = 460;
        const xpFrac = Math.min(1, profile.xp / nextLevelXp);
        k.add([k.rect(barW, 14), k.pos(k.width() / 2 - barW / 2, 260), k.color(30, 30, 40)]);
        k.add([k.rect(barW * xpFrac, 14), k.pos(k.width() / 2 - barW / 2, 260), k.color(...COLORS.xpGold)]);
        k.add([
            k.text(`${Math.round(xpFrac * 100)}% to Level ${profile.level + 1}`, { size: 12 }),
            k.pos(k.width() / 2, 278),
            k.anchor("center"),
            k.color(...COLORS.textSecondary),
        ]);

        // Badges
        k.add([
            k.rect(700, 140),
            k.pos(k.width() / 2 - 350, 300),
            k.color(...COLORS.bgPanel),
            k.outline(1, k.rgb(...COLORS.earth)),
        ]);
        k.add([
            k.text(`Badges (${profile.badges.length})`, { size: 20 }),
            k.pos(k.width() / 2, 312),
            k.anchor("center"),
            k.color(...COLORS.earthLight),
        ]);

        const BADGE_NAMES = {
            communicator: "Communicator",
            master_communicator: "Master Communicator",
            generous_leader: "Generous Leader",
            philanthropist: "Philanthropist",
            puzzle_novice: "Puzzle Novice",
            puzzle_master: "Puzzle Master",
            puzzle_legend: "Puzzle Legend",
            first_survival: "First Survival",
            survival_expert: "Survival Expert",
            all_scenarios: "All Scenarios",
            sharp_mind: "Sharp Mind",
            genius_survivor: "Genius Survivor",
            knowledge_marathon: "Knowledge Marathon",
            team_player: "Team Player",
            born_leader: "Born Leader",
            rank_iii: "Rank III",
            rank_v: "Rank V",
        };

        const badges = profile.badges;
        const badgeStartX = k.width() / 2 - 330;
        for (let i = 0; i < badges.length; i++) {
            const col = i % 5;
            const row = Math.floor(i / 5);
            const bx = badgeStartX + col * 135;
            const by = 340 + row * 40;

            k.add([
                k.rect(125, 32),
                k.pos(bx, by),
                k.color(...COLORS.bgCard),
                k.outline(1, k.rgb(...COLORS.xpGold)),
            ]);
            k.add([
                k.text(BADGE_NAMES[badges[i]] || badges[i], { size: 11 }),
                k.pos(bx + 63, by + 16),
                k.anchor("center"),
                k.color(...COLORS.xpGold),
            ]);
        }

        if (badges.length === 0) {
            k.add([
                k.text("No badges yet -- keep playing to earn them!", { size: 14 }),
                k.pos(k.width() / 2, 365),
                k.anchor("center"),
                k.color(...COLORS.textMuted),
            ]);
        }

        // Session stats
        const sessionSummary = state.finalSummary;
        if (sessionSummary) {
            k.add([
                k.text(`This Session: Score ${Math.round((sessionSummary.score || 0) * 100)}% | ${sessionSummary.daysSurvived} days survived | ${sessionSummary.puzzlesSolved} puzzles`, { size: 15 }),
                k.pos(k.width() / 2, 460),
                k.anchor("center"),
                k.color(...COLORS.accentTeal),
            ]);
        }

        // Action buttons
        const btnY = 500;

        // Play again
        const playBtn = k.add([
            k.rect(240, 56),
            k.pos(k.width() / 2 - 260, btnY),
            k.color(...COLORS.earth),
            k.area(),
            k.outline(3, k.rgb(...COLORS.dangerOrange)),
        ]);
        playBtn.add([
            k.text("PLAY AGAIN", { size: 24 }),
            k.pos(120, 28),
            k.anchor("center"),
            k.color(255, 255, 255),
        ]);
        playBtn.onClick(() => {
            gameStateStore.reset();
            k.go("scenarioSelect");
        });

        // Return to menu
        const menuBtn = k.add([
            k.rect(240, 56),
            k.pos(k.width() / 2 + 20, btnY),
            k.color(...COLORS.bgCard),
            k.area(),
            k.outline(2, k.rgb(...COLORS.earth)),
        ]);
        menuBtn.add([
            k.text("MAIN MENU", { size: 24 }),
            k.pos(120, 28),
            k.anchor("center"),
            k.color(...COLORS.textPrimary),
        ]);
        menuBtn.onClick(() => {
            gameStateStore.reset();
            k.go("menu");
        });

        // Footer
        k.add([
            k.text("Survival Equation | Collaborative Puzzle Survival | An EdGame by TIEVenture", { size: 12 }),
            k.pos(k.width() / 2, k.height() - 25),
            k.anchor("center"),
            k.color(...COLORS.textMuted),
        ]);

        k.onKeyPress("enter", () => {
            gameStateStore.reset();
            k.go("scenarioSelect");
        });
        k.onKeyPress("escape", () => {
            gameStateStore.reset();
            k.go("menu");
        });
    });
}
