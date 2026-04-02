// ---------------------------------------------------------------------------
//  waveResults.js  --  Between-wave results screen
// ---------------------------------------------------------------------------
//  Export: registerWaveResultsScene({ k, gameStateStore })
//
//  Shows brief stats after each wave, then returns to battlefield.
// ---------------------------------------------------------------------------

import { GAME_CONFIG, COLORS } from "../config/constants.js";
import { ENEMY_TYPES } from "../config/enemies.js";
import { WAVES } from "../config/waves.js";

export function registerWaveResultsScene({ k, gameStateStore }) {
    const W = GAME_CONFIG.width;
    const H = GAME_CONFIG.height;

    k.scene("waveResults", (params = {}) => {
        const {
            waveNumber = 1,
            enemiesKilled = 0,
            enemiesLeaked = 0,
            goldEarned = 0,
            interest = 0,
            bonusGold = 0,
            mapId = "map1",
        } = params;

        // =================================================================
        //  Star rating
        // =================================================================
        let stars = 1;
        if (enemiesLeaked === 0) stars = 3;
        else if (enemiesLeaked < 3) stars = 2;

        // =================================================================
        //  Background
        // =================================================================
        k.add([
            k.rect(W, H),
            k.pos(0, 0),
            k.color(...COLORS.bg),
            k.z(0),
        ]);

        // Subtle border
        k.add([
            k.rect(W - 80, H - 80),
            k.pos(40, 40),
            k.color(0, 0, 0),
            k.opacity(0),
            k.outline(2, k.rgb(...COLORS.gold)),
            k.z(1),
        ]);

        // =================================================================
        //  Title
        // =================================================================
        const titleText = `WAVE ${waveNumber} COMPLETE`;
        const title = k.add([
            k.text(titleText, { size: 44 }),
            k.pos(W / 2, 80),
            k.anchor("center"),
            k.color(...COLORS.waveText),
            k.scale(0.5),
            k.z(10),
        ]);

        // Scale-in animation
        let titleAge = 0;
        title.onUpdate(() => {
            titleAge += k.dt();
            const s = Math.min(1.0, 0.5 + titleAge * 2);
            title.scale = k.vec2(s, s);
        });

        // =================================================================
        //  Star display
        // =================================================================
        const starY = 140;
        for (let i = 0; i < 3; i++) {
            const filled = i < stars;
            const starX = W / 2 - 50 + i * 50;

            const star = k.add([
                k.pos(starX, starY),
                k.anchor("center"),
                k.z(10),
            ]);
            star.onDraw(() => {
                k.drawCircle({
                    pos: k.vec2(0, 0),
                    radius: 16,
                    color: filled
                        ? k.rgb(...COLORS.gold)
                        : k.rgb(60, 60, 80),
                    opacity: filled ? 1 : 0.4,
                });
                // Inner bright dot
                if (filled) {
                    k.drawCircle({
                        pos: k.vec2(0, 0),
                        radius: 8,
                        color: k.rgb(255, 255, 255),
                        opacity: 0.5,
                    });
                }
            });

            // Animate stars appearing with delay
            star.opacity = 0;
            k.wait(0.3 + i * 0.3, () => {
                star.opacity = 1;
            });
        }

        // Star label
        const starLabels = ["Survived!", "Good Defense!", "Perfect Wave!"];
        k.add([
            k.text(starLabels[stars - 1], { size: 16 }),
            k.pos(W / 2, starY + 30),
            k.anchor("center"),
            k.color(...COLORS.gold),
            k.opacity(0.8),
            k.z(10),
        ]);

        // =================================================================
        //  Stats panel
        // =================================================================
        const panelX = W / 2 - 200;
        const panelY = 200;
        const panelW = 400;
        const panelH = 200;

        k.add([
            k.rect(panelW, panelH),
            k.pos(panelX, panelY),
            k.color(...COLORS.hud),
            k.outline(1, k.rgb(60, 70, 100)),
            k.z(5),
        ]);

        const statLines = [
            { label: "Enemies Killed", value: `${enemiesKilled}`, color: COLORS.hudText },
            { label: "Enemies Leaked", value: `${enemiesLeaked}`, color: enemiesLeaked > 0 ? COLORS.lives : COLORS.hudText },
            { label: "Wave Bonus", value: `+${bonusGold} KC`, color: COLORS.gold },
            { label: "Interest Earned", value: `+${interest} KC`, color: COLORS.gold },
        ];

        for (let i = 0; i < statLines.length; i++) {
            const stat = statLines[i];
            const sy = panelY + 25 + i * 42;

            // Label
            k.add([
                k.text(stat.label, { size: 18 }),
                k.pos(panelX + 30, sy),
                k.anchor("left"),
                k.color(...COLORS.hudText),
                k.z(6),
            ]);

            // Value (animate counting up)
            const valueLabel = k.add([
                k.text(stat.value, { size: 18 }),
                k.pos(panelX + panelW - 30, sy),
                k.anchor("right"),
                k.color(...stat.color),
                k.z(6),
                k.opacity(0),
            ]);

            // Staggered reveal
            k.wait(0.5 + i * 0.3, () => {
                valueLabel.opacity = 1;
            });
        }

        // =================================================================
        //  Concept gap warnings
        // =================================================================
        if (enemiesLeaked > 0) {
            // Identify which KC types leaked by looking at the wave config
            const waveCfg = WAVES[waveNumber - 1];
            if (waveCfg) {
                const leakedTypes = new Set();
                for (const group of waveCfg.enemies) {
                    const eDef = ENEMY_TYPES[group.type];
                    if (eDef && eDef.knowledgeComponent) {
                        leakedTypes.add(eDef.knowledgeComponent);
                    }
                }

                const gapMessages = {
                    number_sense: "Number Sprites broke through -- review number sense!",
                    operations: "Operation Ogres broke through -- review operations!",
                    fractions: "Fraction Phantoms broke through -- review fractions!",
                    geometry: "Geometry Golems broke through -- review geometry!",
                };

                let gapY = panelY + panelH + 15;
                for (const kc of leakedTypes) {
                    const msg = gapMessages[kc];
                    if (msg) {
                        k.add([
                            k.text(msg, { size: 14 }),
                            k.pos(W / 2, gapY),
                            k.anchor("center"),
                            k.color(255, 180, 80),
                            k.opacity(0.9),
                            k.z(10),
                        ]);
                        gapY += 22;
                    }
                }
            }
        }

        // =================================================================
        //  NEXT WAVE button
        // =================================================================
        const btnW = 220;
        const btnH = 50;
        const btnX = W / 2 - btnW / 2;
        const btnY = H - 130;

        const nextBtn = k.add([
            k.rect(btnW, btnH),
            k.pos(btnX, btnY),
            k.color(60, 140, 80),
            k.outline(2, k.rgb(...COLORS.gold)),
            k.area(),
            k.z(10),
        ]);

        const nextLabel = k.add([
            k.text("NEXT WAVE", { size: 24 }),
            k.pos(W / 2, btnY + btnH / 2),
            k.anchor("center"),
            k.color(255, 255, 255),
            k.z(11),
        ]);

        // Hover effect
        let btnHovered = false;
        nextBtn.onHoverUpdate(() => {
            if (!btnHovered) {
                btnHovered = true;
                nextBtn.color = k.rgb(80, 180, 100);
                nextLabel.color = k.rgb(...COLORS.gold);
            }
        });
        nextBtn.onHoverEnd(() => {
            btnHovered = false;
            nextBtn.color = k.rgb(60, 140, 80);
            nextLabel.color = k.rgb(255, 255, 255);
        });

        function goNext() {
            k.go("battlefield", { mapId });
        }

        nextBtn.onClick(goNext);

        // Keyboard shortcuts
        k.onKeyPress("enter", goNext);
        k.onKeyPress("space", goNext);

        // =================================================================
        //  Auto-continue timer
        // =================================================================
        const autoTimer = k.add([
            k.text("Auto-continuing in 5s...", { size: 13 }),
            k.pos(W / 2, btnY + btnH + 25),
            k.anchor("center"),
            k.color(...COLORS.hudText),
            k.opacity(0.5),
            k.z(10),
        ]);

        let countdown = 5;
        const timerUpdate = k.onUpdate(() => {
            countdown -= k.dt();
            const secs = Math.max(0, Math.ceil(countdown));
            autoTimer.text = `Auto-continuing in ${secs}s...`;

            if (countdown <= 0) {
                timerUpdate.cancel();
                goNext();
            }
        });
    });
}
