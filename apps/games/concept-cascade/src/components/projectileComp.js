// ---------------------------------------------------------------------------
//  projectileComp.js  --  KAPLAY custom component for projectiles
// ---------------------------------------------------------------------------
//  Usage:
//    k.add([
//        k.pos(from),
//        k.anchor("center"),
//        projectileComp({ k, from, target, speed, damage, color, towerType,
//                         splashRadius, effects }),
//        "projectile",
//    ]);
// ---------------------------------------------------------------------------

export function projectileComp({
    k,
    from,
    target,
    speed,
    damage,
    color,
    towerType,
    splashRadius = 0,
    effects = {},
}) {
    // `target` can be a game object (enemy) or a vec2 position
    let targetObj = null;
    let targetPos = null;
    let alive = true;
    let lifeTimer = 0;
    const maxLifespan = 3; // safety net

    // Trail history for particle effect
    const trail = [];
    const TRAIL_MAX = 4;

    if (target && typeof target.pos !== "undefined" && target.isAlive !== undefined) {
        targetObj = target;
        targetPos = target.pos.clone();
    } else if (target && target.x !== undefined && target.y !== undefined) {
        targetPos = k.vec2(target.x, target.y);
    }

    function applyHit(self) {
        if (!alive) return;
        alive = false;

        const hitPos = self.pos.clone();

        // --- Splash damage ---------------------------------------------------
        if (splashRadius > 0) {
            const enemies = k.get("enemy");
            for (const e of enemies) {
                if (!e.isAlive) continue;
                const dist = hitPos.dist(e.pos);
                if (dist <= splashRadius) {
                    // Damage falls off linearly with distance
                    const falloff = 1 - dist / (splashRadius * 1.5);
                    const splashDmg = Math.max(1, Math.round(damage * Math.max(0.3, falloff)));
                    if (typeof e.hurt === "function") e.hurt(splashDmg);

                    // Synergy: splash slow
                    if (effects.splashSlow && typeof e.applySlow === "function") {
                        e.applySlow(effects.splashSlow.factor, effects.splashSlow.duration);
                    }
                }
            }

            // Splash visual: expanding ring
            const ring = k.add([
                k.pos(hitPos),
                k.anchor("center"),
                k.opacity(0.6),
                k.lifespan(0.4, { fade: 0.3 }),
                k.z(300),
            ]);
            let ringRadius = 5;
            ring.onUpdate(() => {
                ringRadius += splashRadius * 3 * k.dt();
            });
            ring.onDraw(() => {
                k.drawCircle({
                    pos: k.vec2(0, 0),
                    radius: ringRadius,
                    fill: false,
                    outline: {
                        width: 2,
                        color: k.rgb(...color),
                    },
                    opacity: ring.opacity,
                });
                k.drawCircle({
                    pos: k.vec2(0, 0),
                    radius: ringRadius * 0.6,
                    color: k.rgb(...color),
                    opacity: ring.opacity * 0.15,
                });
            });
        } else {
            // Single-target hit
            if (targetObj && targetObj.isAlive && typeof targetObj.hurt === "function") {
                targetObj.hurt(damage);
            }
        }

        // --- Slow effect (Fraction Freezer) ----------------------------------
        if (effects.slowFactor && effects.slowDuration) {
            const hitTarget = targetObj && targetObj.isAlive ? targetObj : null;
            if (hitTarget && typeof hitTarget.applySlow === "function") {
                hitTarget.applySlow(effects.slowFactor, effects.slowDuration);
            }
        }

        // --- Missed indicator ------------------------------------------------
        if (effects.missed) {
            self.trigger("projectile_miss", { pos: hitPos });
        }

        // --- Impact flash ----------------------------------------------------
        const flash = k.add([
            k.pos(hitPos),
            k.anchor("center"),
            k.lifespan(0.15, { fade: 0.1 }),
            k.z(350),
        ]);
        flash.onDraw(() => {
            k.drawCircle({
                pos: k.vec2(0, 0),
                radius: 8,
                color: k.rgb(255, 255, 255),
                opacity: flash.opacity * 0.7,
            });
        });

        // Notify scene
        self.trigger("projectile_hit", {
            pos: hitPos,
            towerType,
            damage,
            splashRadius,
            missed: effects.missed || false,
        });

        k.destroy(self);
    }

    return {
        id: "projectile",
        require: ["pos"],

        add() {
            // Start at from position
            this.pos = k.vec2(from.x, from.y);
        },

        update() {
            if (!alive) return;
            const dt = k.dt();

            // Safety lifespan
            lifeTimer += dt;
            if (lifeTimer >= maxLifespan) {
                alive = false;
                k.destroy(this);
                return;
            }

            // Track the living target
            if (targetObj && targetObj.isAlive) {
                targetPos = targetObj.pos.clone();
            }
            // If target died, keep flying to last known position

            if (!targetPos) {
                alive = false;
                k.destroy(this);
                return;
            }

            // Move toward target
            const dir = targetPos.sub(this.pos);
            const dist = dir.len();

            if (dist < 10) {
                // Reached target
                if (effects.missed) {
                    // Miss: just trigger visual, no damage
                    this.trigger("projectile_miss", { pos: this.pos.clone() });
                    alive = false;
                    k.destroy(this);
                } else {
                    applyHit(this);
                }
                return;
            }

            const step = speed * dt;
            this.pos = this.pos.add(dir.unit().scale(Math.min(step, dist)));

            // Update trail
            trail.unshift(this.pos.clone());
            if (trail.length > TRAIL_MAX) trail.pop();
        },

        draw() {
            if (!alive) return;

            // Trailing particles (fading copies behind)
            for (let i = 0; i < trail.length; i++) {
                const tp = trail[i].sub(this.pos);
                const alpha = (1 - (i + 1) / (trail.length + 1)) * 0.5;
                const sz = 4 - i * 0.7;
                k.drawCircle({
                    pos: tp,
                    radius: Math.max(1, sz),
                    color: k.rgb(...color),
                    opacity: alpha,
                });
            }

            // Main projectile body
            k.drawCircle({
                pos: k.vec2(0, 0),
                radius: 5,
                color: k.rgb(...color),
            });

            // Bright center
            k.drawCircle({
                pos: k.vec2(0, 0),
                radius: 2.5,
                color: k.rgb(255, 255, 255),
                opacity: 0.8,
            });
        },
    };
}
