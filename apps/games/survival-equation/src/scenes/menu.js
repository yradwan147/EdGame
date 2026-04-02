import { COLORS } from "../config/constants.js";

export function registerMenuScene({ k, progression }) {
    k.scene("menu", () => {
        const profile = progression.getProfile();

        // Background
        k.add([k.rect(k.width(), k.height()), k.color(...COLORS.bgDark)]);

        // Atmospheric particles (floating embers)
        for (let i = 0; i < 25; i++) {
            const px = Math.random() * k.width();
            const py = Math.random() * k.height();
            const ember = k.add([
                k.circle(2 + Math.random() * 2),
                k.pos(px, py),
                k.color(...COLORS.dangerOrange),
                k.opacity(0.2 + Math.random() * 0.3),
                k.z(10),
            ]);
            const speed = 10 + Math.random() * 20;
            const drift = (Math.random() - 0.5) * 15;
            ember.onUpdate(() => {
                ember.pos.y -= speed * k.dt();
                ember.pos.x += drift * k.dt();
                if (ember.pos.y < -10) {
                    ember.pos.y = k.height() + 10;
                    ember.pos.x = Math.random() * k.width();
                }
            });
        }

        // Title
        k.add([
            k.text("SURVIVAL", { size: 72 }),
            k.pos(k.width() / 2, 140),
            k.anchor("center"),
            k.color(...COLORS.dangerOrange),
        ]);
        k.add([
            k.text("EQUATION", { size: 72 }),
            k.pos(k.width() / 2, 210),
            k.anchor("center"),
            k.color(...COLORS.earthLight),
        ]);

        // Subtitle
        k.add([
            k.text("Collaborate. Calculate. Survive.", { size: 26 }),
            k.pos(k.width() / 2, 270),
            k.anchor("center"),
            k.color(...COLORS.textSecondary),
        ]);

        // Tagline
        k.add([
            k.text("Communicate with your team -> Gather intel -> Solve survival puzzles -> Stay alive", { size: 16 }),
            k.pos(k.width() / 2, 310),
            k.anchor("center"),
            k.color(...COLORS.textMuted),
        ]);

        // Stats
        const statLines = [
            `Survivor Level ${profile.level} | ${profile.badges.length} Badges`,
            `Scenarios: ${profile.scenariosCompleted} completed | Puzzles: ${profile.puzzlesSolved} solved`,
        ];
        for (let i = 0; i < statLines.length; i++) {
            k.add([
                k.text(statLines[i], { size: 18 }),
                k.pos(k.width() / 2, 370 + i * 28),
                k.anchor("center"),
                k.color(...COLORS.safeGreen),
            ]);
        }

        // Start button
        const startBtn = k.add([
            k.rect(380, 78),
            k.pos(k.width() / 2 - 190, 460),
            k.color(...COLORS.earth),
            k.area(),
            k.outline(3, k.rgb(...COLORS.dangerOrange)),
        ]);
        startBtn.add([
            k.text("START SURVIVAL", { size: 32 }),
            k.pos(190, 39),
            k.anchor("center"),
            k.color(255, 255, 255),
        ]);
        startBtn.onClick(() => k.go("scenarioSelect"));

        // Hover effect
        startBtn.onHover(() => {
            startBtn.color = k.rgb(...COLORS.earthLight);
        });
        startBtn.onHoverEnd(() => {
            startBtn.color = k.rgb(...COLORS.earth);
        });

        k.add([
            k.text("Press ENTER to begin", { size: 16 }),
            k.pos(k.width() / 2, 570),
            k.anchor("center"),
            k.color(...COLORS.textMuted),
        ]);
        k.onKeyPress("enter", () => k.go("scenarioSelect"));

        // Footer
        k.add([
            k.text("Survival Equation v0.1 | An EdGame by TIEVenture", { size: 12 }),
            k.pos(k.width() / 2, 690),
            k.anchor("center"),
            k.color(...COLORS.textMuted),
        ]);
    });
}
