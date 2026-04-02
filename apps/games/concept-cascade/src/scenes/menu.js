// ---------------------------------------------------------------------------
//  menu.js  --  Main menu scene for Concept Cascade
// ---------------------------------------------------------------------------
//  Export: registerMenuScene({ k, progression })
//
//  Shows title, player stats, and a PLAY button to enter the battlefield.
// ---------------------------------------------------------------------------

import { GAME_CONFIG, COLORS } from "../config/constants.js";
import { TOWER_TYPES } from "../config/towers.js";

export function registerMenuScene({ k, progression }) {
    const W = GAME_CONFIG.width;
    const H = GAME_CONFIG.height;

    k.scene("menu", () => {
        // =================================================================
        //  Background — dark with subtle floating particles
        // =================================================================
        const particles = [];
        for (let i = 0; i < 60; i++) {
            particles.push({
                x: Math.random() * W,
                y: Math.random() * H,
                vx: (Math.random() - 0.5) * 15,
                vy: -8 - Math.random() * 20,
                radius: 1 + Math.random() * 2.5,
                opacity: 0.15 + Math.random() * 0.25,
            });
        }

        // Particle renderer
        const particleBg = k.add([
            k.pos(0, 0),
            k.z(0),
        ]);
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
                    color: k.rgb(...COLORS.waveText),
                    opacity: p.opacity,
                });
            }
        });

        // =================================================================
        //  Title — "CONCEPT CASCADE" with pulse animation
        // =================================================================
        const title = k.add([
            k.text("CONCEPT CASCADE", { size: 64 }),
            k.pos(W / 2, 140),
            k.anchor("center"),
            k.color(...COLORS.waveText),
            k.opacity(1),
            k.z(10),
        ]);

        // Glow layer behind title (slightly larger, lower opacity)
        const titleGlow = k.add([
            k.text("CONCEPT CASCADE", { size: 64 }),
            k.pos(W / 2, 140),
            k.anchor("center"),
            k.color(255, 255, 255),
            k.opacity(0.15),
            k.z(9),
        ]);

        // Title pulse via onUpdate
        title.onUpdate(() => {
            const pulse = 0.85 + 0.15 * Math.sin(k.time() * 2.0);
            title.opacity = pulse;
            titleGlow.opacity = 0.08 + 0.08 * Math.sin(k.time() * 2.0 + 0.5);
        });

        // Subtitle
        k.add([
            k.text("Tower Defense", { size: 24 }),
            k.pos(W / 2, 195),
            k.anchor("center"),
            k.color(...COLORS.hudText),
            k.opacity(0.7),
            k.z(10),
        ]);

        // =================================================================
        //  Player stats
        // =================================================================
        const profile = progression.getProfile();

        // Level
        k.add([
            k.text(`Level ${profile.level}`, { size: 22 }),
            k.pos(W / 2, 260),
            k.anchor("center"),
            k.color(...COLORS.gold),
            k.z(10),
        ]);

        // XP bar
        const nextXp = progression.requiredXpForLevel(profile.level + 1);
        const xpRatio = nextXp > 0 ? Math.min(1, profile.xp / nextXp) : 0;
        const barW = 300;
        const barH = 12;

        k.add([
            k.rect(barW, barH),
            k.pos(W / 2 - barW / 2, 285),
            k.color(40, 40, 55),
            k.z(10),
        ]);
        k.add([
            k.rect(barW * xpRatio, barH),
            k.pos(W / 2 - barW / 2, 285),
            k.color(80, 220, 140),
            k.z(11),
        ]);
        k.add([
            k.text(`${profile.xp} / ${nextXp} XP`, { size: 12 }),
            k.pos(W / 2, 285 + barH / 2),
            k.anchor("center"),
            k.color(220, 220, 235),
            k.z(12),
        ]);

        // Badges earned
        const badgeCount = profile.badges ? profile.badges.length : 0;
        k.add([
            k.text(`Badges Earned: ${badgeCount}`, { size: 16 }),
            k.pos(W / 2 - 160, 320),
            k.anchor("left"),
            k.color(...COLORS.hudText),
            k.z(10),
        ]);

        // Tower mastery counts
        const towerKeys = Object.keys(TOWER_TYPES);
        const masteryText = towerKeys.map((key) => {
            const def = TOWER_TYPES[key];
            const count = (profile.towerMastery && profile.towerMastery[key]) || 0;
            return `${def.name}: ${count}`;
        }).join("  |  ");

        k.add([
            k.text(`Tower Mastery: ${masteryText}`, { size: 13 }),
            k.pos(W / 2, 350),
            k.anchor("center"),
            k.color(...COLORS.hudText),
            k.opacity(0.7),
            k.z(10),
        ]);

        // =================================================================
        //  PLAY button
        // =================================================================
        const btnW = 240;
        const btnH = 60;
        const btnX = W / 2 - btnW / 2;
        const btnY = 420;

        const playBtn = k.add([
            k.rect(btnW, btnH),
            k.pos(btnX, btnY),
            k.color(60, 140, 80),
            k.outline(3, k.rgb(...COLORS.gold)),
            k.area(),
            k.anchor("topleft"),
            k.z(10),
        ]);

        const playLabel = k.add([
            k.text("PLAY", { size: 32 }),
            k.pos(W / 2, btnY + btnH / 2),
            k.anchor("center"),
            k.color(255, 255, 255),
            k.z(11),
        ]);

        // Hover effects
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

        // Scale pulse on hover
        playBtn.onUpdate(() => {
            if (btnHovered) {
                const s = 1.0 + 0.03 * Math.sin(k.time() * 6);
                playBtn.scale = k.vec2(s, s);
                playLabel.scale = k.vec2(s, s);
            } else {
                playBtn.scale = k.vec2(1, 1);
                playLabel.scale = k.vec2(1, 1);
            }
        });

        playBtn.onClick(() => {
            k.go("battlefield", { mapId: "map1" });
        });

        // Keyboard shortcut
        k.onKeyPress("enter", () => {
            k.go("battlefield", { mapId: "map1" });
        });
        k.onKeyPress("space", () => {
            k.go("battlefield", { mapId: "map1" });
        });

        // =================================================================
        //  Instructions hint at bottom
        // =================================================================
        k.add([
            k.text("Press ENTER or click PLAY to start  |  1-4: Select towers  |  ESC: Pause", {
                size: 14,
            }),
            k.pos(W / 2, H - 40),
            k.anchor("center"),
            k.color(...COLORS.hudText),
            k.opacity(0.5),
            k.z(10),
        ]);

        // Version / credit line
        k.add([
            k.text("TIEVenture  -  Concept Cascade v1.0", { size: 11 }),
            k.pos(W / 2, H - 18),
            k.anchor("center"),
            k.color(...COLORS.hudText),
            k.opacity(0.3),
            k.z(10),
        ]);
    });
}
