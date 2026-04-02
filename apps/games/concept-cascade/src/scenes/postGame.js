// ---------------------------------------------------------------------------
//  postGame.js  --  End-of-game results screen
// ---------------------------------------------------------------------------
//  Export: registerPostGameScene({ k, gameStateStore, telemetry, progression })
//
//  Shows victory/defeat state, final score, assessment highlights,
//  badges earned, XP gained, and a PLAY AGAIN button.
// ---------------------------------------------------------------------------

import { GAME_CONFIG, COLORS } from "../config/constants.js";
import { WAVES } from "../config/waves.js";

export function registerPostGameScene({ k, gameStateStore, telemetry, progression }) {
    const W = GAME_CONFIG.width;
    const H = GAME_CONFIG.height;

    k.scene("postGame", (params = {}) => {
        const { summary = {}, metrics = {} } = params;
        const won = summary.won || false;

        // =================================================================
        //  Background
        // =================================================================
        k.add([
            k.rect(W, H),
            k.pos(0, 0),
            k.color(...COLORS.bg),
            k.z(0),
        ]);

        // Decorative particles (celebration or somber)
        const particles = [];
        const particleCount = won ? 50 : 20;
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * W,
                y: Math.random() * H,
                vx: (Math.random() - 0.5) * (won ? 40 : 10),
                vy: won ? -(20 + Math.random() * 40) : -(5 + Math.random() * 10),
                radius: 1 + Math.random() * 3,
                opacity: 0.1 + Math.random() * 0.3,
                color: won ? COLORS.gold : COLORS.lives,
            });
        }

        const particleBg = k.add([k.pos(0, 0), k.z(1)]);
        particleBg.onUpdate(() => {
            const dt = k.dt();
            for (const p of particles) {
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                if (p.y < -10) {
                    p.y = H + 10;
                    p.x = Math.random() * W;
                }
                if (p.x < -10) p.x = W + 10;
                if (p.x > W + 10) p.x = -10;
            }
        });
        particleBg.onDraw(() => {
            for (const p of particles) {
                k.drawCircle({
                    pos: k.vec2(p.x, p.y),
                    radius: p.radius,
                    color: k.rgb(...p.color),
                    opacity: p.opacity,
                });
            }
        });

        // =================================================================
        //  Title — VICTORY or DEFEAT
        // =================================================================
        const titleColor = won ? [80, 255, 140] : [255, 80, 80];
        const titleStr = won ? "VICTORY!" : "DEFEAT";

        const title = k.add([
            k.text(titleStr, { size: 60 }),
            k.pos(W / 2, 70),
            k.anchor("center"),
            k.color(...titleColor),
            k.opacity(1),
            k.scale(0.3),
            k.z(10),
        ]);

        // Scale-up and pulse animation
        let titleAge = 0;
        title.onUpdate(() => {
            titleAge += k.dt();
            const s = Math.min(1.1, 0.3 + titleAge * 2.5);
            title.scale = k.vec2(s, s);
            if (titleAge > 0.5) {
                const pulse = 0.9 + 0.1 * Math.sin(k.time() * 3);
                title.opacity = pulse;
            }
        });

        // Subtitle
        const subtitleStr = won
            ? "You defended the Knowledge Core!"
            : "The Knowledge Core was breached...";
        k.add([
            k.text(subtitleStr, { size: 18 }),
            k.pos(W / 2, 120),
            k.anchor("center"),
            k.color(...COLORS.hudText),
            k.opacity(0.7),
            k.z(10),
        ]);

        // =================================================================
        //  Stats panel
        // =================================================================
        const panelX = 80;
        const panelY = 155;
        const panelW = 440;
        const panelH = 260;

        k.add([
            k.rect(panelW, panelH),
            k.pos(panelX, panelY),
            k.color(...COLORS.hud),
            k.outline(1, k.rgb(60, 70, 100)),
            k.z(5),
        ]);

        k.add([
            k.text("Game Summary", { size: 20 }),
            k.pos(panelX + panelW / 2, panelY + 18),
            k.anchor("center"),
            k.color(...COLORS.waveText),
            k.z(6),
        ]);

        const totalWaves = WAVES.length;
        const accuracy = summary.questionsAnswered > 0
            ? Math.round((summary.questionsCorrect / summary.questionsAnswered) * 100)
            : 0;

        const statLines = [
            { label: "Final Score", value: `${summary.score || 0}` },
            { label: "Waves Cleared", value: `${summary.wave || 0} / ${totalWaves}` },
            { label: "Enemies Killed", value: `${summary.enemiesKilled || 0}` },
            { label: "Enemies Leaked", value: `${summary.enemiesLeaked || 0}` },
            { label: "Questions Answered", value: `${summary.questionsAnswered || 0}` },
            { label: "Accuracy", value: `${accuracy}%` },
            { label: "Towers Built", value: `${summary.towersBuilt || 0}` },
            { label: "Synergies Discovered", value: `${summary.synergiesDiscovered || 0}` },
        ];

        for (let i = 0; i < statLines.length; i++) {
            const stat = statLines[i];
            const sy = panelY + 45 + i * 26;

            k.add([
                k.text(stat.label, { size: 14 }),
                k.pos(panelX + 20, sy),
                k.anchor("left"),
                k.color(...COLORS.hudText),
                k.z(6),
            ]);

            const valueLabel = k.add([
                k.text(stat.value, { size: 14 }),
                k.pos(panelX + panelW - 20, sy),
                k.anchor("right"),
                k.color(...COLORS.gold),
                k.z(6),
                k.opacity(0),
            ]);

            // Staggered reveal
            k.wait(0.3 + i * 0.15, () => {
                valueLabel.opacity = 1;
            });
        }

        // =================================================================
        //  Assessment highlights panel (right side)
        // =================================================================
        const assessX = W - 480;
        const assessY = 155;
        const assessW = 400;
        const assessH = 260;

        k.add([
            k.rect(assessW, assessH),
            k.pos(assessX, assessY),
            k.color(...COLORS.hud),
            k.outline(1, k.rgb(60, 70, 100)),
            k.z(5),
        ]);

        k.add([
            k.text("Assessment Highlights", { size: 20 }),
            k.pos(assessX + assessW / 2, assessY + 18),
            k.anchor("center"),
            k.color(...COLORS.waveText),
            k.z(6),
        ]);

        const highlights = [];

        // Cognitive profile
        const cog = metrics.cognitive || {};
        if (cog.speedAccuracyProfile) {
            const profileLabels = {
                fast_accurate: "Fast and Accurate -- Excellent!",
                fast_inaccurate: "Fast but Inaccurate -- Slow down a bit",
                slow_accurate: "Careful and Precise -- Great accuracy",
                slow_inaccurate: "Needs Practice -- Keep trying!",
            };
            highlights.push({
                label: "Learning Profile",
                value: profileLabels[cog.speedAccuracyProfile] || cog.speedAccuracyProfile,
            });
        }

        // Tower diversity
        const strat = metrics.strategic || {};
        if (strat.towerDiversity !== undefined) {
            const diversityPct = Math.round(strat.towerDiversity * 100);
            const diversityLabel = diversityPct >= 70
                ? "High diversity -- Great variety!"
                : diversityPct >= 40
                    ? "Moderate diversity"
                    : "Low diversity -- Try more tower types!";
            highlights.push({ label: "Tower Diversity", value: `${diversityPct}% - ${diversityLabel}` });
        }

        // Strategy shifts
        if (strat.strategyShifts !== undefined) {
            highlights.push({
                label: "Strategy Shifts",
                value: strat.strategyShifts > 0
                    ? `${strat.strategyShifts} shifts -- Adaptive player!`
                    : "No shifts detected",
            });
        }

        // Synergy count
        if (strat.synergyCount !== undefined) {
            highlights.push({
                label: "Synergies Found",
                value: `${strat.synergyCount} / 5`,
            });
        }

        // Learning velocity
        const temporal = metrics.temporal || {};
        if (temporal.learningVelocity !== undefined && temporal.learningVelocity !== 0) {
            const velLabel = temporal.learningVelocity > 0
                ? `+${Math.round(temporal.learningVelocity * 100)}% improvement!`
                : `${Math.round(temporal.learningVelocity * 100)}% -- keep practicing`;
            highlights.push({ label: "Learning Velocity", value: velLabel });
        }

        // Frustration check
        const affect = metrics.affective || {};
        if (affect.frustrationIndex > 1) {
            highlights.push({
                label: "Difficulty Note",
                value: "Some tough stretches detected -- you persevered!",
            });
        }

        for (let i = 0; i < highlights.length && i < 6; i++) {
            const h = highlights[i];
            const hy = assessY + 48 + i * 38;

            k.add([
                k.text(h.label, { size: 12 }),
                k.pos(assessX + 15, hy),
                k.anchor("left"),
                k.color(...COLORS.hudText),
                k.opacity(0.7),
                k.z(6),
            ]);

            k.add([
                k.text(h.value, { size: 13, width: assessW - 30 }),
                k.pos(assessX + 15, hy + 16),
                k.anchor("left"),
                k.color(220, 230, 255),
                k.z(6),
            ]);
        }

        // =================================================================
        //  Badges earned
        // =================================================================
        const badgesY = panelY + panelH + 20;
        const profile = progression.getProfile();

        k.add([
            k.text("Badges", { size: 18 }),
            k.pos(panelX, badgesY),
            k.anchor("left"),
            k.color(...COLORS.gold),
            k.z(10),
        ]);

        const badgeNames = {
            cascade_defender: "Cascade Defender",
            tower_architect: "Tower Architect",
            math_marathon: "Math Marathon",
            precision_builder: "Precision Builder",
            wave_survivor: "Wave Survivor",
            exterminator: "Exterminator",
            synergy_seeker: "Synergy Seeker",
            combo_master: "Combo Master",
            tower_specialist: "Tower Specialist",
            tower_legend: "Tower Legend",
        };

        const badges = profile.badges || [];
        if (badges.length === 0) {
            k.add([
                k.text("No badges yet -- keep playing!", { size: 13 }),
                k.pos(panelX, badgesY + 26),
                k.anchor("left"),
                k.color(...COLORS.hudText),
                k.opacity(0.5),
                k.z(10),
            ]);
        } else {
            const badgeRowW = W - 160;
            for (let i = 0; i < badges.length && i < 10; i++) {
                const bx = panelX + (i % 5) * 150;
                const by = badgesY + 26 + Math.floor(i / 5) * 28;
                const bName = badgeNames[badges[i]] || badges[i];

                k.add([
                    k.text(`* ${bName}`, { size: 12 }),
                    k.pos(bx, by),
                    k.anchor("left"),
                    k.color(...COLORS.gold),
                    k.z(10),
                ]);
            }
        }

        // =================================================================
        //  XP bar animation
        // =================================================================
        const xpY = badgesY + (badges.length > 5 ? 90 : 60);
        const nextXp = progression.requiredXpForLevel(profile.level + 1);
        const xpRatio = nextXp > 0 ? Math.min(1, profile.xp / nextXp) : 0;
        const barW = 400;
        const barH = 16;

        k.add([
            k.text(`Level ${profile.level}`, { size: 16 }),
            k.pos(panelX, xpY),
            k.anchor("left"),
            k.color(...COLORS.waveText),
            k.z(10),
        ]);

        k.add([
            k.text(`${profile.xp} / ${nextXp} XP`, { size: 12 }),
            k.pos(panelX + barW, xpY + 2),
            k.anchor("right"),
            k.color(...COLORS.hudText),
            k.opacity(0.6),
            k.z(10),
        ]);

        // Bar background
        k.add([
            k.rect(barW, barH),
            k.pos(panelX, xpY + 22),
            k.color(40, 40, 55),
            k.z(10),
        ]);

        // Bar fill (animated)
        const xpFill = k.add([
            k.rect(0, barH),
            k.pos(panelX, xpY + 22),
            k.color(80, 220, 140),
            k.z(11),
        ]);

        let xpAnimProgress = 0;
        xpFill.onUpdate(() => {
            xpAnimProgress = Math.min(1, xpAnimProgress + k.dt() * 0.8);
            xpFill.width = barW * xpRatio * xpAnimProgress;
        });

        // =================================================================
        //  Duration display
        // =================================================================
        const durationMs = summary.durationMs || 0;
        const durationMin = Math.floor(durationMs / 60000);
        const durationSec = Math.floor((durationMs % 60000) / 1000);
        k.add([
            k.text(`Time: ${durationMin}m ${durationSec}s`, { size: 14 }),
            k.pos(W - 100, xpY + 22),
            k.anchor("right"),
            k.color(...COLORS.hudText),
            k.opacity(0.6),
            k.z(10),
        ]);

        // =================================================================
        //  PLAY AGAIN button
        // =================================================================
        const btnW = 240;
        const btnH = 52;
        const btnX = W / 2 - btnW / 2;
        const btnY = H - 80;

        const playBtn = k.add([
            k.rect(btnW, btnH),
            k.pos(btnX, btnY),
            k.color(60, 140, 80),
            k.outline(2, k.rgb(...COLORS.gold)),
            k.area(),
            k.z(10),
        ]);

        const playLabel = k.add([
            k.text("PLAY AGAIN", { size: 24 }),
            k.pos(W / 2, btnY + btnH / 2),
            k.anchor("center"),
            k.color(255, 255, 255),
            k.z(11),
        ]);

        let btnHovered = false;
        playBtn.onHoverUpdate(() => {
            if (!btnHovered) {
                btnHovered = true;
                playBtn.color = k.rgb(80, 180, 100);
                playLabel.color = k.rgb(...COLORS.gold);
            }
        });
        playBtn.onHoverEnd(() => {
            btnHovered = false;
            playBtn.color = k.rgb(60, 140, 80);
            playLabel.color = k.rgb(255, 255, 255);
        });

        function goMenu() {
            k.go("menu");
        }

        playBtn.onClick(goMenu);
        k.onKeyPress("enter", goMenu);
        k.onKeyPress("space", goMenu);
    });
}
