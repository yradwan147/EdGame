import { COLORS } from "../config/constants.js";

/**
 * Visual effects for combat and exploration.
 *
 * Every method spawns self-cleaning KAPLAY objects that auto-destroy
 * after their animation completes.
 */
export function createActionEffects(k) {
    const rgb = (arr) => k.rgb(arr[0], arr[1], arr[2]);

    /* ---- internal helpers ----------------------------------------- */

    /** Spawn N particles that expand outward from pos then fade. */
    function burst(pos, count, color, speed, life) {
        for (let i = 0; i < count; i++) {
            const angle = k.rand(0, Math.PI * 2);
            const spd = k.rand(speed * 0.5, speed);
            const sz = k.rand(2, 5);
            const p = k.add([
                k.rect(sz, sz),
                k.pos(pos.x, pos.y),
                k.anchor("center"),
                k.color(...color),
                k.opacity(1),
                k.z(9500),
                k.fixed(),
            ]);
            p.onUpdate(() => {
                p.pos.x += Math.cos(angle) * spd * k.dt();
                p.pos.y += Math.sin(angle) * spd * k.dt();
                p.opacity -= k.dt() / life;
                if (p.opacity <= 0) k.destroy(p);
            });
        }
    }

    /** Floating text that drifts upward and fades. */
    function floatText(pos, text, color, size, dur) {
        const t = k.add([
            k.text(text, { size }),
            k.pos(pos.x, pos.y),
            k.anchor("center"),
            k.color(...color),
            k.opacity(1),
            k.z(9600),
            k.fixed(),
        ]);
        let elapsed = 0;
        t.onUpdate(() => {
            elapsed += k.dt();
            t.pos.y -= 50 * k.dt();
            t.opacity = 1 - elapsed / dur;
            if (elapsed >= dur) k.destroy(t);
        });
        return t;
    }

    /** Expanding ring that fades. */
    function expandingRing(pos, color, maxRadius, dur) {
        const r = k.add([
            k.circle(1),
            k.pos(pos.x, pos.y),
            k.anchor("center"),
            k.color(0, 0, 0),
            k.opacity(0),
            k.outline(3, rgb(color)),
            k.z(9500),
            k.fixed(),
        ]);
        let t = 0;
        r.onUpdate(() => {
            t += k.dt();
            const frac = t / dur;
            r.radius = frac * maxRadius;
            r.outline.color = rgb(color);
            r.outline.width = Math.max(1, 3 * (1 - frac));
            if (frac >= 1) k.destroy(r);
        });
    }

    /* ---- public API ----------------------------------------------- */

    const ELEMENT_COLORS = {
        fire: [255, 120, 60],
        ice: COLORS.frost,
        light: [255, 255, 200],
        nature: COLORS.nature,
        lightning: COLORS.lightning,
        arcane: COLORS.primary,
        dark: COLORS.dark,
    };

    return {
        /** Elemental spell cast -- particles + spell name text. */
        spellCast(pos, element, spellName) {
            const col = ELEMENT_COLORS[element] || COLORS.primary;
            burst(pos, 16, col, 160, 0.8);
            expandingRing(pos, col, 60, 0.5);
            floatText(
                { x: pos.x, y: pos.y - 30 },
                spellName,
                col,
                22,
                1.0,
            );
        },

        /** Red floating damage number + impact flash. */
        damage(pos, amount) {
            /* flash */
            const fl = k.add([
                k.circle(20),
                k.pos(pos.x, pos.y),
                k.anchor("center"),
                k.color(...COLORS.danger),
                k.opacity(0.7),
                k.z(9500),
                k.fixed(),
            ]);
            fl.onUpdate(() => {
                fl.opacity -= k.dt() * 4;
                fl.radius += k.dt() * 40;
                if (fl.opacity <= 0) k.destroy(fl);
            });
            floatText(pos, "-" + amount, COLORS.danger, 28, 1.0);
        },

        /** Green floating heal number + sparkle. */
        heal(pos, amount) {
            burst(pos, 8, COLORS.heal, 80, 0.6);
            floatText(pos, "+" + amount, COLORS.heal, 28, 1.0);
        },

        /** Blue shield icon briefly. */
        defend(pos) {
            const sh = k.add([
                k.rect(36, 42),
                k.pos(pos.x, pos.y),
                k.anchor("center"),
                k.color(60, 140, 255),
                k.opacity(0.9),
                k.outline(3, k.rgb(100, 180, 255)),
                k.z(9500),
                k.fixed(),
            ]);
            /* simple shield shape approximation with inner text */
            sh.add([
                k.text("D", { size: 20 }),
                k.anchor("center"),
                k.pos(18, 21),
                k.color(255, 255, 255),
            ]);
            let t = 0;
            sh.onUpdate(() => {
                t += k.dt();
                sh.opacity = Math.max(0, 0.9 - t * 0.9);
                if (t >= 1) k.destroy(sh);
            });
        },

        /** Gray puff + "Fizzle!" text. */
        fizzle(pos) {
            burst(pos, 10, [120, 120, 120], 100, 0.6);
            floatText(pos, "Fizzle!", [160, 160, 160], 24, 1.0);
        },

        /** Enemy death burst particles. */
        enemyDeath(pos, color) {
            const col = color || COLORS.danger;
            burst(pos, 28, col, 200, 1.0);
            expandingRing(pos, col, 80, 0.6);
        },

        /** Golden expanding ring + "LEVEL UP!" text. */
        levelUp(pos) {
            expandingRing(pos, COLORS.secondary, 120, 1.0);
            expandingRing(pos, COLORS.secondary, 80, 0.7);
            floatText(
                { x: pos.x, y: pos.y - 20 },
                "LEVEL UP!",
                COLORS.secondary,
                36,
                1.5,
            );
            burst(pos, 20, COLORS.secondary, 150, 1.2);
        },

        /** Glowing spark falling from defeated enemy. */
        companionSparkDrop(pos) {
            const sp = k.add([
                k.circle(6),
                k.pos(pos.x, pos.y),
                k.anchor("center"),
                k.color(...COLORS.secondary),
                k.opacity(1),
                k.z(9500),
                k.fixed(),
            ]);
            let t = 0;
            sp.onUpdate(() => {
                t += k.dt();
                sp.pos.y += 60 * k.dt();
                sp.opacity = 0.6 + Math.sin(t * 8) * 0.4;
                if (t >= 2) k.destroy(sp);
            });
            /* trail sparkles */
            let sparkTimer = 0;
            const trail = k.onUpdate(() => {
                sparkTimer += k.dt();
                if (sparkTimer > 0.1) {
                    sparkTimer = 0;
                    burst({ x: sp.pos.x, y: sp.pos.y }, 2, COLORS.secondary, 30, 0.4);
                }
                if (t >= 2) trail.cancel();
            });
        },

        /** Big golden starburst + "PERFECT!" text. */
        perfectCast(pos) {
            expandingRing(pos, [255, 215, 0], 100, 0.6);
            expandingRing(pos, [255, 215, 0], 60, 0.4);
            burst(pos, 24, [255, 215, 0], 200, 0.9);
            floatText(
                { x: pos.x, y: pos.y - 30 },
                "PERFECT!",
                [255, 215, 0],
                40,
                1.2,
            );
        },

        /** Small icon + text for status effects (frozen, stunned, etc). */
        statusApplied(pos, statusName) {
            const statusColors = {
                slow: COLORS.frost,
                stun: COLORS.nature,
                frozen: COLORS.frost,
                burn: [255, 120, 60],
                poison: [120, 200, 60],
            };
            const col = statusColors[statusName] || COLORS.textSecondary;
            burst(pos, 6, col, 60, 0.5);
            floatText(
                { x: pos.x, y: pos.y - 20 },
                statusName.charAt(0).toUpperCase() + statusName.slice(1) + "!",
                col,
                20,
                1.0,
            );
        },
    };
}
