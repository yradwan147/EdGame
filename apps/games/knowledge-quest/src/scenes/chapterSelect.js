import { COLORS } from "../config/constants.js";
import { CHAPTERS } from "../config/chapters.js";

/**
 * chapterSelect.js -- Chapter selection screen with 3 chapter cards.
 */
export function registerChapterSelectScene({ k, progression }) {
    const rgb = (arr) => k.rgb(arr[0], arr[1], arr[2]);

    k.scene("chapterSelect", () => {
        const W = k.width();
        const H = k.height();
        const profile = progression.getProfile();

        /* ---- background ---- */
        k.add([k.rect(W, H), k.pos(0, 0), k.color(...COLORS.bg)]);

        /* ---- title ---- */
        k.add([
            k.text("SELECT CHAPTER", { size: 40 }),
            k.pos(W / 2, 50),
            k.anchor("center"),
            k.color(...COLORS.secondary),
        ]);

        /* ---- chapter cards ---- */
        const cardW = 350;
        const cardH = 380;
        const gap = 30;
        const totalW = 3 * cardW + 2 * gap;
        const startX = (W - totalW) / 2;
        const cardY = 110;

        for (let i = 0; i < CHAPTERS.length; i++) {
            const ch = CHAPTERS[i];
            const cx = startX + i * (cardW + gap);

            /* determine lock state */
            let isLocked = false;
            if (ch.unlockRequirement) {
                isLocked = profile.chaptersCompleted < ch.unlockRequirement.chapter;
            }

            const isCompleted = profile.chaptersCompleted >= ch.id;
            const themeCol = ch.themeColors.primary;

            /* card background */
            const card = k.add([
                k.rect(cardW, cardH),
                k.pos(cx, cardY),
                k.color(...(isLocked ? [30, 28, 40] : COLORS.panelBg)),
                k.outline(2, rgb(isLocked ? [60, 55, 80] : themeCol)),
                k.area(),
                k.opacity(isLocked ? 0.5 : 1),
            ]);

            /* chapter number badge */
            const badgeSize = 40;
            card.add([
                k.rect(badgeSize, badgeSize),
                k.pos(cardW / 2 - badgeSize / 2, 12),
                k.color(...(isLocked ? [50, 45, 70] : themeCol)),
            ]);

            card.add([
                k.text("" + ch.id, { size: 24 }),
                k.pos(cardW / 2, 32),
                k.anchor("center"),
                k.color(...COLORS.textPrimary),
            ]);

            /* chapter name */
            card.add([
                k.text(ch.name, { size: 22, width: cardW - 30 }),
                k.pos(cardW / 2, 68),
                k.anchor("center"),
                k.color(...(isLocked ? COLORS.textSecondary : COLORS.textPrimary)),
            ]);

            /* description */
            card.add([
                k.text(ch.description, { size: 13, width: cardW - 40 }),
                k.pos(20, 95),
                k.color(...COLORS.textSecondary),
            ]);

            /* difficulty indicator */
            const minDiff = Math.min(...ch.nodes.map((n) => n.difficulty[0]));
            const maxDiff = Math.max(...ch.nodes.map((n) => n.difficulty[1]));
            card.add([
                k.text("Difficulty: " + minDiff + " - " + maxDiff, { size: 14 }),
                k.pos(cardW / 2, cardH - 85),
                k.anchor("center"),
                k.color(...COLORS.textSecondary),
            ]);

            /* nodes count */
            card.add([
                k.text(ch.nodes.length + " Nodes", { size: 14 }),
                k.pos(cardW / 2, cardH - 65),
                k.anchor("center"),
                k.color(...COLORS.textSecondary),
            ]);

            /* status label */
            let statusText = "AVAILABLE";
            let statusColor = COLORS.heal;
            if (isLocked) {
                statusText = "LOCKED (Complete Ch. " + ch.unlockRequirement.chapter + ")";
                statusColor = COLORS.danger;
            } else if (isCompleted) {
                statusText = "COMPLETED";
                statusColor = COLORS.secondary;
            }

            card.add([
                k.text(statusText, { size: 16 }),
                k.pos(cardW / 2, cardH - 35),
                k.anchor("center"),
                k.color(...statusColor),
            ]);

            /* click handler */
            if (!isLocked) {
                card.onHover(() => {
                    card.color = k.rgb(
                        COLORS.panelBg[0] + 15,
                        COLORS.panelBg[1] + 12,
                        COLORS.panelBg[2] + 25,
                    );
                });
                card.onHoverEnd(() => {
                    card.color = rgb(COLORS.panelBg);
                });
                card.onClick(() => {
                    k.go("chapterMap", { chapterId: ch.id });
                });
            }
        }

        /* ---- back button ---- */
        const backBtn = k.add([
            k.rect(160, 44),
            k.pos(W / 2, H - 50),
            k.anchor("center"),
            k.color(Math.floor(COLORS.primary[0] * 0.25),
                    Math.floor(COLORS.primary[1] * 0.25),
                    Math.floor(COLORS.primary[2] * 0.25)),
            k.outline(2, rgb(COLORS.primary)),
            k.area(),
        ]);

        backBtn.add([
            k.text("Back to Menu", { size: 18 }),
            k.anchor("center"),
            k.color(...COLORS.textPrimary),
        ]);

        backBtn.onHover(() => {
            backBtn.color = k.rgb(
                Math.floor(COLORS.primary[0] * 0.4),
                Math.floor(COLORS.primary[1] * 0.4),
                Math.floor(COLORS.primary[2] * 0.4),
            );
        });
        backBtn.onHoverEnd(() => {
            backBtn.color = k.rgb(
                Math.floor(COLORS.primary[0] * 0.25),
                Math.floor(COLORS.primary[1] * 0.25),
                Math.floor(COLORS.primary[2] * 0.25),
            );
        });
        backBtn.onClick(() => k.go("menu"));
    });
}
