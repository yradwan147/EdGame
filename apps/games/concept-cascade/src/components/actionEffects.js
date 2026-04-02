// ---------------------------------------------------------------------------
//  actionEffects.js  --  Visual effects system for Concept Cascade
// ---------------------------------------------------------------------------
//  Usage:
//    const fx = createActionEffects(k);
//    fx.enemyDeath(pos, color);
//    fx.goldPopup(pos, amount);
//    fx.chainKill(pos, count);
//    ...
// ---------------------------------------------------------------------------

import { COLORS } from "../config/constants.js";

export function createActionEffects(k) {

    // =====================================================================
    //  enemyDeath(pos, color)  --  particle burst on enemy death
    // =====================================================================
    function enemyDeath(pos, color) {
        const count = 8 + Math.floor(Math.random() * 5); // 8-12 particles
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
            const spd = 80 + Math.random() * 120;
            const vx = Math.cos(angle) * spd;
            const vy = Math.sin(angle) * spd;
            const sz = 2 + Math.random() * 4;

            const p = k.add([
                k.pos(pos.x, pos.y),
                k.anchor("center"),
                k.opacity(1),
                k.lifespan(0.5 + Math.random() * 0.3, { fade: 0.3 }),
                k.z(400),
            ]);

            p.onUpdate(() => {
                p.pos.x += vx * k.dt();
                p.pos.y += vy * k.dt();
            });

            p.onDraw(() => {
                k.drawCircle({
                    pos: k.vec2(0, 0),
                    radius: sz,
                    color: k.rgb(...color),
                    opacity: p.opacity,
                });
            });
        }

        // Central flash
        const flash = k.add([
            k.pos(pos.x, pos.y),
            k.anchor("center"),
            k.opacity(0.9),
            k.lifespan(0.2, { fade: 0.15 }),
            k.z(401),
        ]);
        flash.onDraw(() => {
            k.drawCircle({
                pos: k.vec2(0, 0),
                radius: 18,
                color: k.rgb(255, 255, 255),
                opacity: flash.opacity * 0.6,
            });
        });
    }

    // =====================================================================
    //  goldPopup(pos, amount)  --  floating "+15 KC" text
    // =====================================================================
    function goldPopup(pos, amount) {
        const label = k.add([
            k.text(`+${amount} KC`, { size: 16 }),
            k.pos(pos.x, pos.y - 10),
            k.anchor("center"),
            k.color(...COLORS.gold),
            k.opacity(1),
            k.lifespan(1.0, { fade: 0.5 }),
            k.z(500),
        ]);

        // Arc upward with slight curve
        let age = 0;
        const startX = pos.x;
        const drift = (Math.random() - 0.5) * 30;
        label.onUpdate(() => {
            age += k.dt();
            label.pos.y -= 50 * k.dt();
            label.pos.x = startX + drift * Math.sin(age * 2);
        });
    }

    // =====================================================================
    //  chainKill(pos, count)  --  "CHAIN x3!" text with screen flash
    // =====================================================================
    function chainKill(pos, count) {
        // Big text
        const txt = k.add([
            k.text(`CHAIN x${count}!`, { size: 32 }),
            k.pos(pos.x, pos.y - 20),
            k.anchor("center"),
            k.color(255, 200, 50),
            k.opacity(1),
            k.scale(0.5),
            k.lifespan(1.2, { fade: 0.6 }),
            k.z(600),
        ]);

        let txtAge = 0;
        txt.onUpdate(() => {
            txtAge += k.dt();
            const s = Math.min(1.3, 0.5 + txtAge * 3);
            txt.scale = k.vec2(s, s);
            txt.pos.y -= 25 * k.dt();
        });

        // Screen flash overlay
        const overlay = k.add([
            k.rect(k.width(), k.height()),
            k.pos(0, 0),
            k.color(255, 230, 100),
            k.opacity(0.15),
            k.fixed(),
            k.lifespan(0.2, { fade: 0.15 }),
            k.z(950),
        ]);
    }

    // =====================================================================
    //  towerShot(from, to, color)  --  brief beam between tower and target
    // =====================================================================
    function towerShot(from, to, color) {
        const beam = k.add([
            k.pos(0, 0),
            k.opacity(0.7),
            k.lifespan(0.1, { fade: 0.08 }),
            k.z(280),
        ]);

        beam.onDraw(() => {
            k.drawLine({
                p1: k.vec2(from.x, from.y),
                p2: k.vec2(to.x, to.y),
                width: 2,
                color: k.rgb(...color),
                opacity: beam.opacity,
            });
        });
    }

    // =====================================================================
    //  synergyBeam(posA, posB, color)  --  glowing connecting line
    // =====================================================================
    function synergyBeam(posA, posB, color) {
        const beam = k.add([
            k.pos(0, 0),
            k.opacity(0.5),
            k.lifespan(0.5, { fade: 0.3 }),
            k.z(270),
        ]);

        beam.onDraw(() => {
            // Outer glow
            k.drawLine({
                p1: k.vec2(posA.x, posA.y),
                p2: k.vec2(posB.x, posB.y),
                width: 6,
                color: k.rgb(...color),
                opacity: beam.opacity * 0.3,
            });
            // Inner bright line
            k.drawLine({
                p1: k.vec2(posA.x, posA.y),
                p2: k.vec2(posB.x, posB.y),
                width: 2,
                color: k.rgb(
                    Math.min(255, color[0] + 80),
                    Math.min(255, color[1] + 80),
                    Math.min(255, color[2] + 80),
                ),
                opacity: beam.opacity * 0.8,
            });
        });
    }

    // =====================================================================
    //  waveClear(text)  --  big centered text that scales up then fades
    // =====================================================================
    function waveClear(text) {
        const label = k.add([
            k.text(text || "WAVE CLEAR!", { size: 52 }),
            k.pos(k.width() / 2, k.height() / 2),
            k.anchor("center"),
            k.color(...COLORS.waveText),
            k.opacity(1),
            k.scale(0.3),
            k.fixed(),
            k.lifespan(2.0, { fade: 0.8 }),
            k.z(900),
        ]);

        let age = 0;
        label.onUpdate(() => {
            age += k.dt();
            const s = Math.min(1.4, 0.3 + age * 2.5);
            label.scale = k.vec2(s, s);
        });

        // Subtitle
        const sub = k.add([
            k.text("Prepare for the next wave...", { size: 18 }),
            k.pos(k.width() / 2, k.height() / 2 + 45),
            k.anchor("center"),
            k.color(...COLORS.hudText),
            k.opacity(0.7),
            k.fixed(),
            k.lifespan(2.0, { fade: 0.8 }),
            k.z(900),
        ]);
    }

    // =====================================================================
    //  bossHit(pos)  --  screen shake + impact flash
    // =====================================================================
    function bossHit(pos) {
        // Screen shake
        k.shake(4);

        // Impact flash at position
        const impact = k.add([
            k.pos(pos.x, pos.y),
            k.anchor("center"),
            k.opacity(1),
            k.lifespan(0.25, { fade: 0.2 }),
            k.z(450),
        ]);

        impact.onDraw(() => {
            // White flash ring
            k.drawCircle({
                pos: k.vec2(0, 0),
                radius: 25,
                color: k.rgb(255, 255, 255),
                opacity: impact.opacity * 0.5,
            });
            // Colored inner
            k.drawCircle({
                pos: k.vec2(0, 0),
                radius: 15,
                color: k.rgb(...COLORS.boss),
                opacity: impact.opacity * 0.7,
            });
        });

        // Brief red overlay
        const redFlash = k.add([
            k.rect(k.width(), k.height()),
            k.pos(0, 0),
            k.color(255, 50, 50),
            k.opacity(0.08),
            k.fixed(),
            k.lifespan(0.12, { fade: 0.1 }),
            k.z(940),
        ]);
    }

    // =====================================================================
    //  buildEffect(pos)  --  sparkle particles at tower placement
    // =====================================================================
    function buildEffect(pos) {
        const count = 10;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const dist = 15 + Math.random() * 20;
            const tx = pos.x + Math.cos(angle) * dist;
            const ty = pos.y + Math.sin(angle) * dist;
            const delay = Math.random() * 0.15;

            const sparkle = k.add([
                k.pos(pos.x, pos.y),
                k.anchor("center"),
                k.opacity(0),
                k.lifespan(0.6 + Math.random() * 0.3, { fade: 0.3 }),
                k.z(350),
            ]);

            let sparkAge = 0;
            sparkle.onUpdate(() => {
                sparkAge += k.dt();
                if (sparkAge < delay) return;
                sparkle.opacity = 1;
                const t = Math.min(1, (sparkAge - delay) / 0.3);
                sparkle.pos.x = pos.x + (tx - pos.x) * t;
                sparkle.pos.y = pos.y + (ty - pos.y) * t;
            });

            sparkle.onDraw(() => {
                // Small star shape (diamond)
                const sz = 3;
                k.drawRect({
                    pos: k.vec2(-sz / 2, -sz / 2),
                    width: sz,
                    height: sz,
                    color: k.rgb(255, 255, 200),
                    opacity: sparkle.opacity,
                });
                // Rotated diamond
                k.drawCircle({
                    pos: k.vec2(0, 0),
                    radius: 1.5,
                    color: k.rgb(255, 255, 255),
                    opacity: sparkle.opacity,
                });
            });
        }

        // Central glow
        const glow = k.add([
            k.pos(pos.x, pos.y),
            k.anchor("center"),
            k.opacity(0.8),
            k.lifespan(0.4, { fade: 0.3 }),
            k.z(349),
        ]);
        glow.onDraw(() => {
            k.drawCircle({
                pos: k.vec2(0, 0),
                radius: 20,
                color: k.rgb(...COLORS.gold),
                opacity: glow.opacity * 0.3,
            });
        });
    }

    // =====================================================================
    //  miss(pos)  --  red "MISS" floating text
    // =====================================================================
    function miss(pos) {
        const label = k.add([
            k.text("MISS", { size: 16 }),
            k.pos(pos.x + (Math.random() - 0.5) * 20, pos.y),
            k.anchor("center"),
            k.color(255, 80, 80),
            k.opacity(1),
            k.lifespan(0.7, { fade: 0.4 }),
            k.z(500),
        ]);

        label.onUpdate(() => {
            label.pos.y -= 35 * k.dt();
        });
    }

    // =====================================================================
    //  Public API
    // =====================================================================
    return {
        enemyDeath,
        goldPopup,
        chainKill,
        towerShot,
        synergyBeam,
        waveClear,
        bossHit,
        buildEffect,
        miss,
    };
}
