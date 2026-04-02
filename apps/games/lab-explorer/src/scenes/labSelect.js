import { COLORS } from "../config/constants.js";
import { EXPERIMENTS } from "../config/experiments.js";

export function registerLabSelectScene({ k, progression }) {
    k.scene("labSelect", () => {
        const profile = progression.getProfile();

        k.add([k.rect(k.width(), k.height()), k.color(...COLORS.labBg)]);

        k.add([
            k.text("Select Experiment", { size: 44 }),
            k.pos(k.width() / 2, 45),
            k.anchor("center"),
            k.color(...COLORS.accentBright),
        ]);

        k.add([
            k.text("Complete experiments to unlock the next one", { size: 16 }),
            k.pos(k.width() / 2, 80),
            k.anchor("center"),
            k.color(120, 150, 190),
        ]);

        const CARD_W = 220;
        const CARD_H = 340;
        const CARD_GAP = 20;
        const totalWidth = EXPERIMENTS.length * CARD_W + (EXPERIMENTS.length - 1) * CARD_GAP;
        const startX = (k.width() - totalWidth) / 2;
        const cardY = 120;

        const difficultyStars = (d) => {
            let s = "";
            for (let i = 0; i < 5; i++) s += i < d ? "*" : ".";
            return s;
        };

        for (let i = 0; i < EXPERIMENTS.length; i++) {
            const exp = EXPERIMENTS[i];
            const x = startX + i * (CARD_W + CARD_GAP);
            const isUnlocked = progression.isExperimentUnlocked(i);
            const stars = profile.experimentStars[exp.id] || 0;
            const isCompleted = profile.experimentsCompleted.includes(exp.id);

            // Card background
            const cardColor = isUnlocked
                ? [24, 42, 68]
                : [20, 25, 35];
            const borderColor = isCompleted
                ? k.rgb(...COLORS.beakerGreen)
                : isUnlocked
                    ? k.rgb(...COLORS.accent)
                    : k.rgb(50, 55, 70);

            const card = k.add([
                k.rect(CARD_W, CARD_H),
                k.pos(x, cardY),
                k.color(...cardColor),
                k.outline(3, borderColor),
                k.area(),
            ]);

            // Subject badge color
            const subjColor = exp.subject === "chemistry"
                ? [80, 200, 130]
                : [100, 160, 255];

            // Subject label
            card.add([
                k.rect(CARD_W - 20, 24),
                k.pos(10, 10),
                k.color(subjColor[0] * 0.3, subjColor[1] * 0.3, subjColor[2] * 0.3),
                k.outline(1, k.rgb(subjColor[0], subjColor[1], subjColor[2])),
            ]);
            card.add([
                k.text(exp.subject.toUpperCase(), { size: 12 }),
                k.pos(CARD_W / 2, 22),
                k.anchor("center"),
                k.color(subjColor[0], subjColor[1], subjColor[2]),
            ]);

            // Experiment name
            card.add([
                k.text(exp.name, { size: 17, width: CARD_W - 20 }),
                k.pos(10, 45),
                k.color(isUnlocked ? 230 : 100, isUnlocked ? 245 : 110, 255),
            ]);

            // Difficulty
            card.add([
                k.text(`Difficulty: ${difficultyStars(exp.difficulty)}`, { size: 13 }),
                k.pos(10, 95),
                k.color(200, 180, 100),
            ]);

            // Description
            card.add([
                k.text(
                    isUnlocked ? exp.description : "LOCKED - Complete previous experiments",
                    { size: 12, width: CARD_W - 20 },
                ),
                k.pos(10, 120),
                k.color(isUnlocked ? 160 : 80, isUnlocked ? 175 : 90, isUnlocked ? 200 : 110),
            ]);

            // Star rating (if completed)
            if (isCompleted) {
                let starStr = "";
                for (let s = 0; s < 5; s++) starStr += s < stars ? "*" : ".";
                card.add([
                    k.text(`Rating: ${starStr}`, { size: 15 }),
                    k.pos(10, 230),
                    k.color(...COLORS.discoveryGold),
                ]);

                card.add([
                    k.text("COMPLETED", { size: 14 }),
                    k.pos(CARD_W / 2, 260),
                    k.anchor("center"),
                    k.color(...COLORS.beakerGreen),
                ]);
            }

            // Lock icon for locked experiments
            if (!isUnlocked) {
                card.add([
                    k.rect(60, 60),
                    k.pos(CARD_W / 2 - 30, CARD_H / 2 - 30),
                    k.color(40, 40, 50),
                    k.outline(2, k.rgb(80, 80, 100)),
                ]);
                card.add([
                    k.text("LOCKED", { size: 16 }),
                    k.pos(CARD_W / 2, CARD_H / 2),
                    k.anchor("center"),
                    k.color(100, 100, 120),
                ]);
            }

            // "Start" button area at bottom of card
            if (isUnlocked) {
                const btnY = CARD_H - 55;
                const btn = card.add([
                    k.rect(CARD_W - 30, 40),
                    k.pos(15, btnY),
                    k.color(30, 90, 120),
                    k.area(),
                    k.outline(2, k.rgb(...COLORS.accentBright)),
                ]);
                btn.add([
                    k.text(isCompleted ? "RETRY" : "BEGIN", { size: 18 }),
                    k.pos((CARD_W - 30) / 2, 20),
                    k.anchor("center"),
                    k.color(...COLORS.accentBright),
                ]);

                const expId = exp.id;
                card.onClick(() => {
                    k.go("experiment", { experimentId: expId });
                });
            }
        }

        // Back button
        const backBtn = k.add([
            k.rect(160, 44),
            k.pos(30, k.height() - 70),
            k.color(40, 30, 30),
            k.area(),
            k.outline(2, k.rgb(180, 140, 140)),
        ]);
        backBtn.add([
            k.text("Back to Menu", { size: 18 }),
            k.pos(80, 22),
            k.anchor("center"),
            k.color(200, 170, 170),
        ]);
        backBtn.onClick(() => k.go("menu"));

        k.onKeyPress("escape", () => k.go("menu"));
    });
}
