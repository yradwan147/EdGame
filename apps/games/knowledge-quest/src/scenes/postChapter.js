import { COLORS } from "../config/constants.js";
import { createAssessmentEngine } from "../systems/assessmentEngine.js";

/**
 * postChapter.js -- Chapter completion screen with stats, badges, and assessment.
 */
export function registerPostChapterScene({ k, gameStateStore, telemetry, progression }) {
    const rgb = (arr) => k.rgb(arr[0], arr[1], arr[2]);

    k.scene("postChapter", ({ chapterResult }) => {
        const W = k.width();
        const H = k.height();
        const state = gameStateStore.getState();
        const profile = progression.getProfile();
        const result = chapterResult || {};

        /* ---- record chapter completion ---- */
        progression.recordChapterCompleted();

        /* ---- compute assessment metrics ---- */
        const assessment = createAssessmentEngine({ gameStateStore, telemetry });
        const metrics = assessment.emitMetrics();

        /* ---- background ---- */
        k.add([k.rect(W, H), k.pos(0, 0), k.color(...COLORS.bg)]);

        /* ---- celebration particles ---- */
        for (let i = 0; i < 50; i++) {
            const isPurple = Math.random() < 0.5;
            const col = isPurple ? COLORS.primary : COLORS.secondary;
            const size = k.rand(3, 8);

            const p = k.add([
                k.rect(size, size),
                k.pos(k.rand(0, W), k.rand(-200, H)),
                k.color(...col),
                k.opacity(k.rand(0.3, 0.8)),
                k.anchor("center"),
                k.z(-1),
            ]);

            const speedY = k.rand(30, 80);
            const drift = k.rand(-20, 20);
            const rotSpeed = k.rand(-3, 3);

            p.onUpdate(() => {
                p.pos.y += speedY * k.dt();
                p.pos.x += drift * k.dt();
                p.angle += rotSpeed * k.dt() * 57;
                p.opacity = 0.3 + Math.sin(k.time() * 2 + i) * 0.3;
                if (p.pos.y > H + 20) {
                    p.pos.y = -20;
                    p.pos.x = k.rand(0, W);
                }
            });
        }

        /* ---- title with glow ---- */
        const titleGlow = k.add([
            k.text("CHAPTER COMPLETE!", { size: 48 }),
            k.pos(W / 2, 50),
            k.anchor("center"),
            k.color(...COLORS.secondary),
            k.opacity(0.3),
        ]);
        titleGlow.onUpdate(() => {
            titleGlow.opacity = 0.15 + Math.sin(k.time() * 2) * 0.15;
        });

        k.add([
            k.text("CHAPTER COMPLETE!", { size: 44 }),
            k.pos(W / 2, 50),
            k.anchor("center"),
            k.color(...COLORS.secondary),
        ]);

        /* chapter name */
        k.add([
            k.text("Chapter " + (result.chapterId || state.chapter), { size: 20 }),
            k.pos(W / 2, 85),
            k.anchor("center"),
            k.color(...COLORS.textSecondary),
        ]);

        /* ---- stats panel ---- */
        const panelX = 60;
        const panelY = 115;
        const panelW = W / 2 - 80;
        const panelH = 300;

        k.add([
            k.rect(panelW, panelH),
            k.pos(panelX, panelY),
            k.color(...COLORS.panelBg),
            k.outline(2, rgb(COLORS.panelBorder)),
        ]);
        k.add([
            k.text("Battle Stats", { size: 20 }),
            k.pos(panelX + panelW / 2, panelY + 20),
            k.anchor("center"),
            k.color(...COLORS.secondary),
        ]);

        const enemiesDefeated = result.enemiesDefeated || profile.totalEnemiesDefeated;
        const enemiesSpared = result.enemiesSpared || profile.totalEnemiesSpared;
        const accuracy = state.questionsAnswered > 0
            ? Math.round((state.questionsCorrect / state.questionsAnswered) * 100)
            : 0;

        const statLines = [
            "Enemies Defeated: " + enemiesDefeated,
            "Enemies Spared: " + enemiesSpared,
            "Questions Answered: " + state.questionsAnswered,
            "Accuracy: " + accuracy + "%",
            "Spells Cast: " + state.spellsCast,
            "Defend Actions: " + state.defendActions,
            "Total Damage: " + state.totalDamageDealt,
            "Total Healing: " + state.totalHealingDone,
        ];

        for (let i = 0; i < statLines.length; i++) {
            k.add([
                k.text(statLines[i], { size: 15 }),
                k.pos(panelX + 20, panelY + 48 + i * 28),
                k.color(...COLORS.textPrimary),
            ]);
        }

        /* ---- dialogue choices panel ---- */
        const rightPanelX = W / 2 + 20;
        k.add([
            k.rect(panelW, 140),
            k.pos(rightPanelX, panelY),
            k.color(...COLORS.panelBg),
            k.outline(2, rgb(COLORS.panelBorder)),
        ]);
        k.add([
            k.text("Dialogue Choices", { size: 20 }),
            k.pos(rightPanelX + panelW / 2, panelY + 20),
            k.anchor("center"),
            k.color(...COLORS.secondary),
        ]);

        const prosocial = profile.prosocialChoices;
        const selfInterest = profile.selfInterestChoices;
        const totalMoral = prosocial + selfInterest;
        const empathyPct = totalMoral > 0 ? Math.round((prosocial / totalMoral) * 100) : 0;

        k.add([
            k.text("Prosocial: " + prosocial + "   Self-interest: " + selfInterest, { size: 15 }),
            k.pos(rightPanelX + 20, panelY + 50),
            k.color(...COLORS.textPrimary),
        ]);
        k.add([
            k.text("Empathy Score: " + empathyPct + "%", { size: 15 }),
            k.pos(rightPanelX + 20, panelY + 78),
            k.color(...(empathyPct >= 50 ? COLORS.heal : COLORS.danger)),
        ]);

        /* empathy bar */
        const barW = panelW - 40;
        k.add([
            k.rect(barW, 14),
            k.pos(rightPanelX + 20, panelY + 105),
            k.color(40, 30, 60),
        ]);
        k.add([
            k.rect(Math.floor(barW * empathyPct / 100), 14),
            k.pos(rightPanelX + 20, panelY + 105),
            k.color(...COLORS.heal),
        ]);

        /* ---- companions collected ---- */
        const companionPanelY = panelY + 150;
        k.add([
            k.rect(panelW, 140),
            k.pos(rightPanelX, companionPanelY),
            k.color(...COLORS.panelBg),
            k.outline(2, rgb(COLORS.panelBorder)),
        ]);
        k.add([
            k.text("Companions", { size: 20 }),
            k.pos(rightPanelX + panelW / 2, companionPanelY + 20),
            k.anchor("center"),
            k.color(...COLORS.secondary),
        ]);

        const collected = profile.companionsCollected;
        if (collected.length === 0) {
            k.add([
                k.text("None collected yet", { size: 14 }),
                k.pos(rightPanelX + panelW / 2, companionPanelY + 55),
                k.anchor("center"),
                k.color(...COLORS.textSecondary),
            ]);
        } else {
            const compNames = collected.map((id) =>
                id.charAt(0).toUpperCase() + id.slice(1),
            ).join(", ");
            k.add([
                k.text(compNames, { size: 14, width: panelW - 30 }),
                k.pos(rightPanelX + 15, companionPanelY + 48),
                k.color(...COLORS.textPrimary),
            ]);
            k.add([
                k.text("Total: " + collected.length + " / 8", { size: 14 }),
                k.pos(rightPanelX + 15, companionPanelY + 100),
                k.color(...COLORS.textSecondary),
            ]);
        }

        /* ---- assessment highlights ---- */
        const assessY = panelY + panelH + 15;
        k.add([
            k.rect(W - 120, 90),
            k.pos(panelX, assessY),
            k.color(...COLORS.panelBg),
            k.outline(2, rgb(COLORS.panelBorder)),
        ]);
        k.add([
            k.text("Assessment Highlights", { size: 18 }),
            k.pos(W / 2, assessY + 16),
            k.anchor("center"),
            k.color(...COLORS.secondary),
        ]);

        const highlights = [
            "Learning Style: " + (metrics.cognitive.speedAccuracyProfile || "N/A").replace(/_/g, " "),
            "Combat Strategy: " + (metrics.strategic.combatStrategy || "N/A").replace(/_/g, " "),
            "Growth Mindset: " + Math.round((metrics.affective.growthMindset.score || 0) * 100) + "%",
            "Learning Velocity: " + (metrics.temporal.learningVelocity > 0 ? "Improving" : metrics.temporal.learningVelocity < 0 ? "Needs Practice" : "Steady"),
        ];
        const highlightText = highlights.join("   |   ");
        k.add([
            k.text(highlightText, { size: 14, width: W - 160 }),
            k.pos(panelX + 20, assessY + 40),
            k.color(...COLORS.textPrimary),
        ]);

        /* ---- badges ---- */
        if (profile.badges.length > 0) {
            const badgeY = assessY + 95;
            k.add([
                k.text("Badges Earned", { size: 16 }),
                k.pos(W / 2, badgeY),
                k.anchor("center"),
                k.color(...COLORS.secondary),
            ]);

            const badgeNames = profile.badges.map((b) =>
                b.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            );

            const badgeStartX = 100;
            const badgeSize = 80;
            const badgeGap = 12;
            for (let i = 0; i < Math.min(badgeNames.length, 8); i++) {
                const bx = badgeStartX + i * (badgeSize + badgeGap);
                k.add([
                    k.rect(badgeSize, 30),
                    k.pos(bx, badgeY + 22),
                    k.color(COLORS.panelBg[0] + 10, COLORS.panelBg[1] + 8, COLORS.panelBg[2] + 20),
                    k.outline(1, rgb(COLORS.secondary)),
                ]);
                k.add([
                    k.text(badgeNames[i], { size: 10, width: badgeSize - 6 }),
                    k.pos(bx + badgeSize / 2, badgeY + 37),
                    k.anchor("center"),
                    k.color(...COLORS.secondary),
                ]);
            }
        }

        /* ---- XP bar ---- */
        const xpBarY = H - 110;
        const xpBarW = W - 200;
        const xpBarH = 24;
        const nextLevelXp = progression.requiredXpForLevel(profile.level + 1);
        const prevLevelXp = progression.requiredXpForLevel(profile.level);
        const xpInLevel = profile.xp - prevLevelXp;
        const xpNeeded = nextLevelXp - prevLevelXp;
        const xpFrac = xpNeeded > 0 ? Math.min(1, xpInLevel / xpNeeded) : 1;

        k.add([
            k.text("Level " + profile.level + "   XP: " + profile.xp + " / " + nextLevelXp, { size: 16 }),
            k.pos(W / 2, xpBarY - 8),
            k.anchor("center"),
            k.color(...COLORS.textPrimary),
        ]);

        /* bar bg */
        k.add([
            k.rect(xpBarW, xpBarH),
            k.pos((W - xpBarW) / 2, xpBarY + 8),
            k.color(40, 30, 60),
        ]);

        /* animated bar fill */
        const xpFill = k.add([
            k.rect(1, xpBarH),
            k.pos((W - xpBarW) / 2, xpBarY + 8),
            k.color(...COLORS.secondary),
        ]);

        const targetWidth = Math.floor(xpBarW * xpFrac);
        xpFill.onUpdate(() => {
            if (xpFill.width < targetWidth) {
                xpFill.width = Math.min(targetWidth, xpFill.width + k.dt() * 300);
            }
        });

        /* ---- navigation buttons ---- */
        const btnY = H - 50;
        const completedChapter = result.chapterId || state.chapter;
        const hasNextChapter = completedChapter < 3;

        function makeNavButton(label, x, y, w, h, onClick) {
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
                k.text(label, { size: 20 }),
                k.anchor("center"),
                k.color(...COLORS.textPrimary),
            ]);
            btn.onHover(() => {
                btn.color = k.rgb(
                    Math.floor(COLORS.primary[0] * 0.4),
                    Math.floor(COLORS.primary[1] * 0.4),
                    Math.floor(COLORS.primary[2] * 0.4),
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

        if (hasNextChapter) {
            makeNavButton("NEXT CHAPTER", W / 2 - 140, btnY, 240, 50, () => {
                gameStateStore.startChapter(completedChapter + 1);
                k.go("chapterMap", { chapterId: completedChapter + 1 });
            });
        }

        makeNavButton("RETURN TO MENU", hasNextChapter ? W / 2 + 140 : W / 2, btnY, 240, 50, () => {
            k.go("menu");
        });
    });
}
