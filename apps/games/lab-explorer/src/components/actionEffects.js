import { COLORS } from "../config/constants.js";

/**
 * Lab-themed visual effects:
 * - Bubbling: particles rising in liquid
 * - Sparks: electrical sparks
 * - Foam eruption: expanding white mass
 * - Steam cloud: wispy rising clouds
 * - Color change: smooth liquid color shift
 * - Glow pulse: gentle glow around an area
 * - Safety warning: yellow flash
 * - Discovery found: golden sparkle + "DISCOVERY!" text
 * - Failure triggered: red flash + comedic text
 */
export function createActionEffects(k) {

    function burstParticles(x, y, color, count = 12, speed = 80, size = 5) {
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
            const spd = speed * (0.5 + Math.random() * 1.0);
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

    function floatText(x, y, text, color, size = 24) {
        const obj = k.add([
            k.text(text, { size }),
            k.pos(x, y),
            k.anchor("center"),
            k.color(color[0], color[1], color[2]),
            k.lifespan(1.5, { fade: 0.8 }),
            k.z(950),
        ]);
        obj.onUpdate(() => {
            obj.pos.y -= 35 * k.dt();
        });
    }

    /** Bubbling effect — particles rising from a point */
    function bubbling(x, y, color = [100, 200, 255], duration = 3) {
        const start = Date.now();
        const cancel = k.onUpdate(() => {
            if (Date.now() - start > duration * 1000) {
                cancel();
                return;
            }
            if (Math.random() < 0.15) {
                const bx = x + (Math.random() - 0.5) * 60;
                const bubble = k.add([
                    k.circle(2 + Math.random() * 5),
                    k.pos(bx, y),
                    k.anchor("center"),
                    k.color(color[0], color[1], color[2]),
                    k.opacity(0.7),
                    k.lifespan(1.2, { fade: 0.6 }),
                    k.z(900),
                ]);
                bubble.onUpdate(() => {
                    bubble.pos.y -= 50 * k.dt();
                    bubble.pos.x += (Math.random() - 0.5) * 20 * k.dt();
                });
            }
        });
        return cancel;
    }

    /** Electric sparks — bright snappy particles */
    function sparks(x, y, count = 20) {
        for (let i = 0; i < count; i++) {
            const delay = Math.random() * 400;
            setTimeout(() => {
                const angle = Math.random() * Math.PI * 2;
                const speed = 100 + Math.random() * 200;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;
                const spark = k.add([
                    k.rect(3, 3),
                    k.pos(x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 20),
                    k.color(255, 255, 100 + Math.floor(Math.random() * 155)),
                    k.opacity(1),
                    k.lifespan(0.2 + Math.random() * 0.2, { fade: 0.15 }),
                    k.z(910),
                ]);
                spark.onUpdate(() => {
                    spark.pos.x += vx * k.dt();
                    spark.pos.y += vy * k.dt() + 50 * k.dt();
                });
            }, delay);
        }
        // Flash
        const flash = k.add([
            k.circle(60),
            k.pos(x, y),
            k.anchor("center"),
            k.color(255, 255, 200),
            k.opacity(0.6),
            k.lifespan(0.15, { fade: 0.1 }),
            k.z(905),
        ]);
    }

    /** Foam eruption — expanding white bubbly mass */
    function foamEruption(x, y) {
        floatText(x, y - 80, "FOAM ERUPTION!", [255, 255, 255], 30);

        for (let wave = 0; wave < 4; wave++) {
            setTimeout(() => {
                for (let i = 0; i < 15; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 20 + Math.random() * (40 + wave * 30);
                    const fx = x + Math.cos(angle) * dist;
                    const fy = y + Math.sin(angle) * dist * 0.6;
                    k.add([
                        k.circle(6 + Math.random() * 10),
                        k.pos(fx, fy),
                        k.anchor("center"),
                        k.color(240, 245, 255),
                        k.opacity(0.8),
                        k.lifespan(1.5 + Math.random(), { fade: 0.8 }),
                        k.z(920),
                    ]);
                }
            }, wave * 200);
        }
    }

    /** Steam cloud — wispy rising vapor */
    function steamCloud(x, y, duration = 3) {
        floatText(x, y - 60, "PSSSHHHH!", [200, 220, 240], 26);

        const start = Date.now();
        const cancel = k.onUpdate(() => {
            if (Date.now() - start > duration * 1000) {
                cancel();
                return;
            }
            if (Math.random() < 0.25) {
                const sx = x + (Math.random() - 0.5) * 80;
                const cloud = k.add([
                    k.circle(10 + Math.random() * 20),
                    k.pos(sx, y),
                    k.anchor("center"),
                    k.color(200, 210, 230),
                    k.opacity(0.5),
                    k.lifespan(2.0, { fade: 1.2 }),
                    k.z(915),
                ]);
                cloud.onUpdate(() => {
                    cloud.pos.y -= 25 * k.dt();
                    cloud.pos.x += (Math.random() - 0.5) * 30 * k.dt();
                });
            }
        });
        return cancel;
    }

    /** Glow pulse around an area */
    function glowPulse(x, y, color = COLORS.accent, radius = 50) {
        const glow = k.add([
            k.circle(radius),
            k.pos(x, y),
            k.anchor("center"),
            k.color(color[0], color[1], color[2]),
            k.opacity(0),
            k.z(890),
        ]);
        let t = 0;
        const cancel = k.onUpdate(() => {
            t += k.dt() * 3;
            glow.opacity = 0.15 + Math.sin(t) * 0.12;
            if (t > Math.PI * 4) {
                k.destroy(glow);
                cancel();
            }
        });
        return cancel;
    }

    /** Safety warning — yellow flash across screen */
    function safetyWarning(message = "SAFETY WARNING!") {
        const flash = k.add([
            k.rect(k.width(), k.height()),
            k.pos(0, 0),
            k.color(...COLORS.safetyYellow),
            k.opacity(0.3),
            k.fixed(),
            k.z(9500),
            k.lifespan(0.6, { fade: 0.4 }),
        ]);

        floatText(k.width() / 2, k.height() / 2, message, COLORS.safetyYellow, 36);
    }

    /** Discovery found — golden sparkle + "DISCOVERY!" text */
    function discoveryFound(x, y, discoveryName) {
        // Golden sparkle burst
        for (let i = 0; i < 25; i++) {
            const angle = (i / 25) * Math.PI * 2;
            const speed = 60 + Math.random() * 100;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const sparkle = k.add([
                k.rect(4, 4),
                k.pos(x, y),
                k.anchor("center"),
                k.color(255, 215 + Math.floor(Math.random() * 40), 40 + Math.floor(Math.random() * 60)),
                k.opacity(1),
                k.lifespan(0.8, { fade: 0.5 }),
                k.z(960),
            ]);
            sparkle.onUpdate(() => {
                sparkle.pos.x += vx * k.dt();
                sparkle.pos.y += vy * k.dt();
            });
        }

        // Big "DISCOVERY!" text
        const title = k.add([
            k.text("DISCOVERY!", { size: 40 }),
            k.pos(x, y - 40),
            k.anchor("center"),
            k.color(...COLORS.discoveryGold),
            k.z(970),
            k.lifespan(2.5, { fade: 1.0 }),
        ]);
        title.onUpdate(() => {
            title.pos.y -= 20 * k.dt();
        });

        // Discovery name subtitle
        if (discoveryName) {
            const sub = k.add([
                k.text(discoveryName, { size: 20 }),
                k.pos(x, y),
                k.anchor("center"),
                k.color(255, 230, 140),
                k.z(965),
                k.lifespan(2.5, { fade: 1.0 }),
            ]);
            sub.onUpdate(() => {
                sub.pos.y -= 20 * k.dt();
            });
        }
    }

    /** Failure triggered — red flash + comedic text (KSP style) */
    function failureTriggered(x, y, failureDesc) {
        // Red screen flash
        k.add([
            k.rect(k.width(), k.height()),
            k.pos(0, 0),
            k.color(...COLORS.dangerRed),
            k.opacity(0.35),
            k.fixed(),
            k.z(9500),
            k.lifespan(0.5, { fade: 0.35 }),
        ]);

        // Shake screen
        if (k.shake) k.shake(5);

        // Comedic failure messages (KSP style)
        const quips = [
            "Well THAT escalated quickly!",
            "Lab safety violation #247",
            "The janitor will NOT be happy",
            "Achievement unlocked: Chaos",
            "Write-up material for sure",
            "Professor saw that...",
            "This is why we have safety goggles",
        ];
        const quip = quips[Math.floor(Math.random() * quips.length)];

        // Big red failure text
        const failText = k.add([
            k.text("EXPERIMENT FAILED!", { size: 36 }),
            k.pos(k.width() / 2, k.height() / 2 - 60),
            k.anchor("center"),
            k.color(...COLORS.dangerRed),
            k.fixed(),
            k.z(9600),
            k.lifespan(3.0, { fade: 1.5 }),
        ]);

        // Quip
        const quipText = k.add([
            k.text(quip, { size: 22 }),
            k.pos(k.width() / 2, k.height() / 2 - 20),
            k.anchor("center"),
            k.color(255, 180, 180),
            k.fixed(),
            k.z(9600),
            k.lifespan(3.0, { fade: 1.5 }),
        ]);

        // Explosion particles
        burstParticles(x, y, [255, 100, 50], 20, 150, 8);
        burstParticles(x, y, [255, 200, 50], 15, 100, 6);
    }

    /** Beaker dissolve effect */
    function beakerDissolve(x, y) {
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const px = x + (Math.random() - 0.5) * 80;
                const py = y + Math.random() * 100;
                const piece = k.add([
                    k.rect(4 + Math.random() * 6, 4 + Math.random() * 6),
                    k.pos(px, py),
                    k.color(140, 180, 220),
                    k.opacity(0.8),
                    k.lifespan(1.0, { fade: 0.6 }),
                    k.z(910),
                ]);
                piece.onUpdate(() => {
                    piece.pos.y += 40 * k.dt();
                    piece.pos.x += (Math.random() - 0.5) * 20 * k.dt();
                });
            }, i * 50);
        }
    }

    /** String break effect */
    function stringBreak(x, y) {
        floatText(x, y, "SNAP!", [255, 200, 100], 32);
        burstParticles(x, y, [180, 160, 130], 8, 60, 3);
    }

    /** Bulb pop effect */
    function bulbPop(x, y) {
        // Bright flash
        k.add([
            k.circle(80),
            k.pos(x, y),
            k.anchor("center"),
            k.color(255, 255, 255),
            k.opacity(0.9),
            k.lifespan(0.1, { fade: 0.08 }),
            k.z(920),
        ]);

        // Glass shards
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * 120;
            const shard = k.add([
                k.rect(2, 6 + Math.random() * 8),
                k.pos(x, y),
                k.color(200, 210, 230),
                k.opacity(0.9),
                k.rotate(Math.random() * 360),
                k.lifespan(0.8, { fade: 0.5 }),
                k.z(925),
            ]);
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            shard.onUpdate(() => {
                shard.pos.x += vx * k.dt();
                shard.pos.y += vy * k.dt() + 80 * k.dt();
            });
        }

        floatText(x, y - 40, "POP!", [255, 255, 200], 30);
    }

    /** Overflow splash */
    function overflow(x, y) {
        for (let i = 0; i < 20; i++) {
            const drop = k.add([
                k.circle(3 + Math.random() * 5),
                k.pos(x + (Math.random() - 0.5) * 60, y),
                k.anchor("center"),
                k.color(80, 160, 240),
                k.opacity(0.8),
                k.lifespan(1.0, { fade: 0.6 }),
                k.z(910),
            ]);
            const vx = (Math.random() - 0.5) * 120;
            const vy = -60 - Math.random() * 80;
            drop.onUpdate(() => {
                drop.pos.x += vx * k.dt();
                drop.pos.y += vy * k.dt();
                vy + 200 * k.dt(); // gravity (note: simplified)
            });
        }
        floatText(x, y - 50, "SPLASH!", [80, 180, 255], 28);
    }

    return {
        burstParticles,
        floatText,
        bubbling,
        sparks,
        foamEruption,
        steamCloud,
        glowPulse,
        safetyWarning,
        discoveryFound,
        failureTriggered,
        beakerDissolve,
        stringBreak,
        bulbPop,
        overflow,
    };
}
