import { COLORS } from "../config/constants.js";

export function registerMenuScene({ k, progression }) {
    k.scene("menu", () => {
        const profile = progression.getProfile();

        // Background
        k.add([k.rect(k.width(), k.height()), k.color(...COLORS.labBg)]);

        // Title
        k.add([
            k.text("LAB EXPLORER", { size: 72 }),
            k.pos(k.width() / 2, 140),
            k.anchor("center"),
            k.color(...COLORS.accentBright),
        ]);
        k.add([
            k.text("Virtual Science Lab", { size: 32 }),
            k.pos(k.width() / 2, 200),
            k.anchor("center"),
            k.color(...COLORS.teal),
        ]);

        // Bubbling beaker animation (left side)
        const beakerX = 220;
        const beakerY = 420;
        k.add([
            k.rect(100, 160),
            k.pos(beakerX - 50, beakerY - 80),
            k.color(25, 40, 65),
            k.outline(3, k.rgb(100, 160, 220)),
        ]);
        // Liquid
        k.add([
            k.rect(92, 110),
            k.pos(beakerX - 46, beakerY - 30),
            k.color(60, 200, 130),
            k.opacity(0.7),
        ]);
        // Animated bubbles
        k.onUpdate(() => {
            if (Math.random() < 0.06) {
                const bx = beakerX - 30 + Math.random() * 60;
                const bubble = k.add([
                    k.circle(2 + Math.random() * 5),
                    k.pos(bx, beakerY + 60),
                    k.anchor("center"),
                    k.color(80, 230, 150),
                    k.opacity(0.5),
                    k.lifespan(1.8, { fade: 1.0 }),
                    k.z(50),
                ]);
                bubble.onUpdate(() => {
                    bubble.pos.y -= 45 * k.dt();
                    bubble.pos.x += (Math.random() - 0.5) * 15 * k.dt();
                });
            }
        });

        // Bubbling beaker (right side — different color)
        const beaker2X = k.width() - 220;
        k.add([
            k.rect(100, 160),
            k.pos(beaker2X - 50, beakerY - 80),
            k.color(25, 40, 65),
            k.outline(3, k.rgb(100, 160, 220)),
        ]);
        k.add([
            k.rect(92, 110),
            k.pos(beaker2X - 46, beakerY - 30),
            k.color(180, 80, 220),
            k.opacity(0.7),
        ]);
        k.onUpdate(() => {
            if (Math.random() < 0.06) {
                const bx = beaker2X - 30 + Math.random() * 60;
                const bubble = k.add([
                    k.circle(2 + Math.random() * 5),
                    k.pos(bx, beakerY + 60),
                    k.anchor("center"),
                    k.color(200, 100, 240),
                    k.opacity(0.5),
                    k.lifespan(1.8, { fade: 1.0 }),
                    k.z(50),
                ]);
                bubble.onUpdate(() => {
                    bubble.pos.y -= 45 * k.dt();
                    bubble.pos.x += (Math.random() - 0.5) * 15 * k.dt();
                });
            }
        });

        // Stats panel
        k.add([
            k.rect(400, 120),
            k.pos(k.width() / 2 - 200, 250),
            k.color(...COLORS.panelDark),
            k.outline(2, k.rgb(...COLORS.accent)),
        ]);

        const expCount = profile.experimentsCompleted.length;
        const discCount = profile.discoveriesFound.length;
        const disasterCount = profile.failuresTriggered.length;
        const starTotal = Object.values(profile.experimentStars).reduce((a, b) => a + b, 0);

        k.add([
            k.text(
                `Level ${profile.level} Scientist\n` +
                `Experiments: ${expCount}/5 | Stars: ${starTotal}\n` +
                `Discoveries: ${discCount} | Disasters: ${disasterCount}\n` +
                `Badges: ${profile.badges.length}`,
                { size: 18, width: 370 },
            ),
            k.pos(k.width() / 2 - 180, 268),
            k.color(...COLORS.white),
        ]);

        // Start button
        const startBtn = k.add([
            k.rect(340, 72),
            k.pos(k.width() / 2 - 170, 430),
            k.color(20, 80, 120),
            k.area(),
            k.outline(3, k.rgb(...COLORS.accentBright)),
        ]);
        startBtn.add([
            k.text("START LAB", { size: 34 }),
            k.pos(170, 36),
            k.anchor("center"),
            k.color(...COLORS.accentBright),
        ]);
        startBtn.onClick(() => k.go("labSelect"));

        // Journal button
        const journalBtn = k.add([
            k.rect(240, 50),
            k.pos(k.width() / 2 - 120, 520),
            k.color(30, 50, 80),
            k.area(),
            k.outline(2, k.rgb(...COLORS.discoveryGold)),
        ]);
        journalBtn.add([
            k.text("Discovery Journal", { size: 20 }),
            k.pos(120, 25),
            k.anchor("center"),
            k.color(...COLORS.discoveryGold),
        ]);
        journalBtn.onClick(() => k.go("journal"));

        // Footer
        k.add([
            k.text("Press ENTER to start", { size: 16 }),
            k.pos(k.width() / 2, 620),
            k.anchor("center"),
            k.color(120, 140, 170),
        ]);

        k.onKeyPress("enter", () => k.go("labSelect"));
    });
}
