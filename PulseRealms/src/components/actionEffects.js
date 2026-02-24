/**
 * Visual effects for combat actions - damage, heal, shield, attack beam, miss.
 * Call from arena when combat effects occur so players see what teammates do.
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
                k.lifespan(0.35, { fade: 0.2 }),
                k.z(800),
                "effect-particle",
            ]);
            p.onUpdate(() => {
                p.pos.x += vx * k.dt();
                p.pos.y += vy * k.dt();
                p.opacity -= k.dt() * 2.5;
            });
        }
    }

    function floatText(x, y, text, color) {
        const obj = k.add([
            k.text(text, { size: 20 }),
            k.pos(x, y),
            k.anchor("center"),
            k.color(color[0], color[1], color[2]),
            k.lifespan(0.8, { fade: 0.5 }),
            k.z(850),
        ]);
        obj.onUpdate(() => {
            obj.pos.y -= 45 * k.dt();
        });
    }

    function damageEffect(targetPos, amount, isPlayerHit = false) {
        const x = targetPos.x;
        const y = targetPos.y - 20;
        burstParticles(x, y, [255, 70, 90], 12, 100, 6);
        floatText(x, y - 15, `-${Math.round(amount)}`, [255, 100, 120]);
        if (isPlayerHit && k.shake) {
            k.shake(3);
        }
    }

    function healEffect(targetPos, amount) {
        const x = targetPos.x;
        const y = targetPos.y;
        burstParticles(x, y, [80, 255, 140], 8, 60, 6);
        floatText(x, y - 20, `+${Math.round(amount)}`, [100, 255, 160]);
        // Soft green ring
        const ring = k.add([
            k.circle(35),
            k.pos(x, y),
            k.anchor("center"),
            k.color(80, 255, 140),
            k.opacity(0.4),
            k.lifespan(0.5, { fade: 0.4 }),
            k.z(790),
        ]);
    }

    function shieldEffect(targetPos) {
        const x = targetPos.x;
        const y = targetPos.y;
        // Blue pulse rings
        for (let r = 25; r <= 55; r += 10) {
            k.add([
                k.circle(r),
                k.pos(x, y),
                k.anchor("center"),
                k.color(90, 180, 255),
                k.opacity(0.3),
                k.lifespan(0.4, { fade: 0.3 }),
                k.z(790),
            ]);
        }
    }

    function attackBeam(actorPos, targetPos, beamColor = [255, 200, 80]) {
        const dx = targetPos.x - actorPos.x;
        const dy = targetPos.y - actorPos.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        k.add([
            k.rect(len, 8),
            k.pos(actorPos.x, actorPos.y),
            k.anchor("left"),
            k.color(beamColor[0], beamColor[1], beamColor[2]),
            k.opacity(0.85),
            k.rotate(Math.atan2(dy, dx)),
            k.lifespan(0.18, { fade: 0.12 }),
            k.z(780),
        ]);
    }

    function missEffect(targetPos) {
        const x = targetPos.x;
        const y = targetPos.y - 15;
        burstParticles(x, y, [120, 120, 130], 5, 50, 4);
        floatText(x, y, "MISS", [140, 140, 150]);
    }

    return {
        damage: damageEffect,
        heal: healEffect,
        shield: shieldEffect,
        attackBeam,
        miss: missEffect,
    };
}
