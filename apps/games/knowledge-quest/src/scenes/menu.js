import { COLORS } from "../config/constants.js";

/**
 * menu.js -- Animated main menu for Knowledge Quest.
 */
export function registerMenuScene({ k, progression }) {
    const rgb = (arr) => k.rgb(arr[0], arr[1], arr[2]);

    k.scene("menu", () => {
        const W = k.width();
        const H = k.height();
        const profile = progression.getProfile();

        /* ---- background ---- */
        k.add([k.rect(W, H), k.pos(0, 0), k.color(...COLORS.bg)]);

        /* ---- floating particles ---- */
        for (let i = 0; i < 40; i++) {
            const isPurple = Math.random() < 0.6;
            const col = isPurple ? COLORS.primary : COLORS.secondary;
            const size = k.rand(2, 6);
            const startX = k.rand(0, W);
            const startY = k.rand(0, H);
            const speed = k.rand(10, 40);
            const drift = k.rand(-15, 15);

            const p = k.add([
                k.rect(size, size),
                k.pos(startX, startY),
                k.color(...col),
                k.opacity(k.rand(0.15, 0.5)),
                k.anchor("center"),
                k.z(-1),
            ]);

            p.onUpdate(() => {
                p.pos.y -= speed * k.dt();
                p.pos.x += drift * k.dt();
                p.opacity = 0.15 + Math.sin(k.time() * 2 + i) * 0.2;
                if (p.pos.y < -10) {
                    p.pos.y = H + 10;
                    p.pos.x = k.rand(0, W);
                }
            });
        }

        /* ---- title glow effect ---- */
        const glowTitle = k.add([
            k.text("KNOWLEDGE QUEST", { size: 64 }),
            k.pos(W / 2, 160),
            k.anchor("center"),
            k.color(...COLORS.secondary),
            k.opacity(0.3),
            k.z(0),
        ]);
        glowTitle.onUpdate(() => {
            glowTitle.opacity = 0.15 + Math.sin(k.time() * 1.5) * 0.15;
        });

        /* main title */
        k.add([
            k.text("KNOWLEDGE QUEST", { size: 60 }),
            k.pos(W / 2, 160),
            k.anchor("center"),
            k.color(...COLORS.secondary),
            k.z(1),
        ]);

        /* subtitle */
        k.add([
            k.text("A Learning RPG Adventure", { size: 22 }),
            k.pos(W / 2, 210),
            k.anchor("center"),
            k.color(...COLORS.textSecondary),
        ]);

        /* ---- player stats panel ---- */
        const statsY = 260;
        k.add([
            k.rect(440, 120),
            k.pos(W / 2 - 220, statsY),
            k.color(...COLORS.panelBg),
            k.outline(2, rgb(COLORS.panelBorder)),
        ]);

        const statLines = [
            "Level: " + profile.level + "    XP: " + profile.xp,
            "Companions: " + profile.companionsCollected.length + " / 8",
            "Chapters Completed: " + profile.chaptersCompleted + " / 3",
        ];
        for (let i = 0; i < statLines.length; i++) {
            k.add([
                k.text(statLines[i], { size: 18 }),
                k.pos(W / 2, statsY + 25 + i * 32),
                k.anchor("center"),
                k.color(...COLORS.textPrimary),
            ]);
        }

        /* ---- badges display ---- */
        if (profile.badges.length > 0) {
            const badgeY = statsY + 140;
            k.add([
                k.text("Badges", { size: 16 }),
                k.pos(W / 2, badgeY),
                k.anchor("center"),
                k.color(...COLORS.secondary),
            ]);

            const badgeNames = profile.badges.map((b) =>
                b.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            );
            const badgeRow = badgeNames.join("  *  ");
            k.add([
                k.text(badgeRow, { size: 14, width: 600 }),
                k.pos(W / 2, badgeY + 24),
                k.anchor("center"),
                k.color(...COLORS.textSecondary),
            ]);
        }

        /* ---- buttons ---- */
        function makeButton(label, x, y, w, h, onClick) {
            const btn = k.add([
                k.rect(w, h),
                k.pos(x, y),
                k.anchor("center"),
                k.color(Math.floor(COLORS.primary[0] * 0.25),
                        Math.floor(COLORS.primary[1] * 0.25),
                        Math.floor(COLORS.primary[2] * 0.25)),
                k.outline(2, rgb(COLORS.primary)),
                k.area(),
            ]);

            btn.add([
                k.text(label, { size: 24 }),
                k.anchor("center"),
                k.color(...COLORS.textPrimary),
            ]);

            const pulse = btn.onUpdate(() => {
                const s = 1.0 + Math.sin(k.time() * 3) * 0.02;
                btn.scale = k.vec2(s, s);
            });

            btn.onHover(() => {
                btn.color = k.rgb(
                    Math.floor(COLORS.primary[0] * 0.45),
                    Math.floor(COLORS.primary[1] * 0.45),
                    Math.floor(COLORS.primary[2] * 0.45),
                );
            });
            btn.onHoverEnd(() => {
                btn.color = k.rgb(
                    Math.floor(COLORS.primary[0] * 0.25),
                    Math.floor(COLORS.primary[1] * 0.25),
                    Math.floor(COLORS.primary[2] * 0.25),
                );
            });

            btn.onClick(onClick);
            return btn;
        }

        const btnY = 520;
        makeButton("NEW ADVENTURE", W / 2, btnY, 280, 56, () => {
            progression.reset();
            k.go("chapterSelect");
        });

        if (profile.chaptersCompleted > 0 || profile.totalQuestionsAnswered > 0) {
            makeButton("CONTINUE", W / 2, btnY + 76, 280, 56, () => {
                k.go("chapterSelect");
            });
        }

        /* ---- version tag ---- */
        k.add([
            k.text("v1.0 -- TIEVenture", { size: 12 }),
            k.pos(W / 2, H - 20),
            k.anchor("center"),
            k.color(...COLORS.textSecondary),
            k.opacity(0.5),
        ]);
    });
}
