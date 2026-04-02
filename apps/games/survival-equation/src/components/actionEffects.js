import { COLORS } from "../config/constants.js";

/**
 * Visual effects for survival events.
 */
export function createActionEffects(k) {
    function burstParticles(x, y, color, count = 10, speed = 80, size = 5) {
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
            const spd = speed * (0.6 + Math.random() * 0.8);
            const vx = Math.cos(angle) * spd;
            const vy = Math.sin(angle) * spd;
            const p = k.add([
                k.circle(size),
                k.pos(x, y),
                k.anchor("center"),
                k.color(color[0], color[1], color[2]),
                k.opacity(0.9),
                k.lifespan(0.5, { fade: 0.3 }),
                k.z(900),
                "effect-particle",
            ]);
            p.onUpdate(() => {
                p.pos.x += vx * k.dt();
                p.pos.y += vy * k.dt();
            });
        }
    }

    function floatText(x, y, text, color, size = 20) {
        const obj = k.add([
            k.text(text, { size }),
            k.pos(x, y),
            k.anchor("center"),
            k.color(color[0], color[1], color[2]),
            k.lifespan(1.2, { fade: 0.6 }),
            k.z(950),
        ]);
        obj.onUpdate(() => {
            obj.pos.y -= 40 * k.dt();
        });
    }

    return {
        resourceGain(x, y, type) {
            const colorMap = {
                food: COLORS.resourceFood,
                water: COLORS.resourceWater,
                materials: COLORS.resourceMaterials,
            };
            const color = colorMap[type] || COLORS.safeGreen;
            burstParticles(x, y, color, 8, 60, 4);
            floatText(x, y - 20, `+${type}`, color, 18);
        },

        dangerAlert(x, y) {
            burstParticles(x, y, COLORS.dangerRed, 15, 100, 6);
            floatText(x, y - 20, "DANGER!", COLORS.dangerRed, 28);
            if (k.shake) k.shake(4);
        },

        discoveryEffect(x, y, label) {
            burstParticles(x, y, COLORS.xpGold, 12, 70, 5);
            floatText(x, y - 20, label || "DISCOVERED!", COLORS.xpGold, 22);
        },

        dayTransition(dayNumber) {
            // Full-screen day transition overlay
            const overlay = k.add([
                k.rect(k.width(), k.height()),
                k.pos(0, 0),
                k.color(0, 0, 0),
                k.opacity(0),
                k.fixed(),
                k.z(9000),
            ]);
            const dayText = k.add([
                k.text(`Day ${dayNumber}`, { size: 64 }),
                k.pos(k.width() / 2, k.height() / 2),
                k.anchor("center"),
                k.opacity(0),
                k.fixed(),
                k.z(9001),
                k.color(...COLORS.xpGold),
            ]);

            let phase = 0; // 0=fade in, 1=hold, 2=fade out
            let timer = 0;
            const cancelUpdate = k.onUpdate(() => {
                timer += k.dt();
                if (phase === 0) {
                    overlay.opacity = Math.min(0.7, timer);
                    dayText.opacity = Math.min(1, timer * 1.5);
                    if (timer >= 0.8) { phase = 1; timer = 0; }
                } else if (phase === 1) {
                    if (timer >= 1.0) { phase = 2; timer = 0; }
                } else {
                    overlay.opacity = Math.max(0, 0.7 - timer);
                    dayText.opacity = Math.max(0, 1 - timer * 1.5);
                    if (timer >= 0.8) {
                        k.destroy(overlay);
                        k.destroy(dayText);
                        if (typeof cancelUpdate === "function") cancelUpdate();
                        if (cancelUpdate && typeof cancelUpdate.cancel === "function") cancelUpdate.cancel();
                    }
                }
            });
        },

        stormEffect() {
            // Rapid screen shakes + grey streaks
            if (k.shake) k.shake(6);
            for (let i = 0; i < 15; i++) {
                const sx = Math.random() * k.width();
                const sy = Math.random() * 100;
                const streak = k.add([
                    k.rect(2, 60 + Math.random() * 80),
                    k.pos(sx, sy),
                    k.color(180, 200, 220),
                    k.opacity(0.4),
                    k.lifespan(0.3, { fade: 0.2 }),
                    k.z(850),
                    k.rotate(-15 + Math.random() * 30),
                ]);
                streak.onUpdate(() => {
                    streak.pos.y += 600 * k.dt();
                });
            }
        },

        sicknessEffect(x, y) {
            burstParticles(x, y, [120, 200, 80], 10, 40, 4);
            floatText(x, y - 15, "ILLNESS", [120, 200, 80], 20);
        },

        rescueSignal(x, y) {
            // Golden pulse rings expanding
            for (let r = 10; r <= 80; r += 15) {
                setTimeout(() => {
                    k.add([
                        k.circle(r),
                        k.pos(x, y),
                        k.anchor("center"),
                        k.color(...COLORS.xpGold),
                        k.opacity(0.5),
                        k.lifespan(0.6, { fade: 0.4 }),
                        k.z(900),
                    ]);
                }, r * 20);
            }
            floatText(x, y - 40, "SIGNAL SENT!", COLORS.xpGold, 26);
        },

        teamCheer() {
            const cx = k.width() / 2;
            const cy = k.height() / 2;
            burstParticles(cx, cy, COLORS.xpGold, 20, 120, 6);
            burstParticles(cx - 100, cy + 50, COLORS.safeGreen, 10, 80, 5);
            burstParticles(cx + 100, cy + 50, COLORS.waterBlue, 10, 80, 5);
            floatText(cx, cy - 60, "TEAM SUCCESS!", COLORS.xpGold, 32);
        },

        puzzleComplete(x, y) {
            burstParticles(x, y, COLORS.safeGreen, 15, 90, 5);
            burstParticles(x, y, COLORS.xpGold, 8, 50, 3);
            floatText(x, y - 30, "PUZZLE SOLVED!", COLORS.safeGreen, 24);
        },

        puzzleFailed(x, y) {
            burstParticles(x, y, COLORS.dangerOrange, 10, 60, 4);
            floatText(x, y - 30, "Not quite...", COLORS.dangerOrange, 20);
        },
    };
}
