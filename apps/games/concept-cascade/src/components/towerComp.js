// ---------------------------------------------------------------------------
//  towerComp.js  --  KAPLAY custom component for placed towers
// ---------------------------------------------------------------------------
//  Usage:
//    const t = k.add([
//        k.pos(pixelX, pixelY),
//        k.anchor("center"),
//        towerComp({ k, towerType, tileCol, tileRow, towerId }),
//        "tower",
//    ]);
// ---------------------------------------------------------------------------

import { TOWER_TYPES, getTowerStats } from "../config/towers.js";
import { GAME_CONFIG, COLORS } from "../config/constants.js";

export function towerComp({ k, towerType, tileCol, tileRow, towerId }) {
    const baseDef = TOWER_TYPES[towerType];
    if (!baseDef) throw new Error(`Unknown tower type: ${towerType}`);

    let level = 0;
    let branch = null; // "a" or "b" for level 3
    let kills = 0;
    let cooldownTimer = 0;
    let currentTarget = null;
    let facingAngle = 0;
    let hovered = false;

    // Synergy modifier accumulators (reset & reapplied each frame by scene)
    let synergyDamageMult = 1;
    let synergyFireRateMult = 1;
    let synergyRangeMult = 1;
    let synergyExtras = {}; // e.g. { splashSlow: { factor, duration } }

    // Computed stats (recalculated on upgrade)
    let stats = computeStats();

    function computeStats() {
        const base = getTowerStats(towerType, level);

        // Apply branch bonuses for level 3
        if (level >= 3 && branch && baseDef.upgrades[2]) {
            const branchDef = baseDef.upgrades[2][branch];
            if (branchDef) {
                base.damage += branchDef.damageBonus || 0;
                base.range += branchDef.rangeBonus || 0;
                base.special = branchDef.special || null;
            }
        }

        return base;
    }

    function getEffectiveStats() {
        return {
            damage: stats.damage * synergyDamageMult,
            range: stats.range * synergyRangeMult,
            fireRate: stats.fireRate * synergyFireRateMult,
            splashRadius: stats.splashRadius,
            slowFactor: stats.slowFactor,
            slowDuration: stats.slowDuration,
            special: stats.special,
        };
    }

    function findTarget(selfPos) {
        const eff = getEffectiveStats();
        const enemies = k.get("enemy");
        let best = null;
        let bestProgress = -1;

        for (const e of enemies) {
            if (!e.isAlive) continue;
            const dist = selfPos.dist(e.pos);
            if (dist > eff.range) continue;
            // Prefer the enemy farthest along the path
            const progress = typeof e.getProgress === "function" ? e.getProgress() : 0;
            if (progress > bestProgress) {
                bestProgress = progress;
                best = e;
            }
        }
        return best;
    }

    return {
        id: "tower",
        require: ["pos"],

        // -- Exposed properties ------------------------------------------------
        towerId,
        towerType,
        tileCol,
        tileRow,

        get level() { return level; },
        get branch() { return branch; },
        get kills() { return kills; },
        get range() { return getEffectiveStats().range; },
        get damage() { return getEffectiveStats().damage; },
        get fireRate() { return getEffectiveStats().fireRate; },
        get cooldownTimer() { return cooldownTimer; },

        // -- Lifecycle ---------------------------------------------------------
        add() {
            // Nothing special at spawn
        },

        update() {
            const dt = k.dt();
            cooldownTimer = Math.max(0, cooldownTimer - dt);

            // Reset synergy modifiers every frame (scene will re-apply)
            synergyDamageMult = 1;
            synergyFireRateMult = 1;
            synergyRangeMult = 1;
            synergyExtras = {};

            // Target acquisition
            currentTarget = findTarget(this.pos);

            // Smooth rotation toward target
            if (currentTarget) {
                const dir = currentTarget.pos.sub(this.pos);
                const targetAngle = Math.atan2(dir.y, dir.x);
                // Lerp angle
                let diff = targetAngle - facingAngle;
                // Normalize to [-PI, PI]
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                facingAngle += diff * Math.min(1, dt * 10);
            }

            // Shoot
            if (currentTarget && cooldownTimer <= 0) {
                const eff = getEffectiveStats();
                cooldownTimer = 1 / eff.fireRate;

                // Flicker dodge check
                let missed = false;
                if (currentTarget.isFlickering) {
                    missed = k.rand() < 0.5; // 50% miss chance vs flickering
                }

                this.trigger("tower_fire", {
                    towerId,
                    towerType,
                    from: this.pos.clone(),
                    targetPos: currentTarget.pos.clone(),
                    targetObj: currentTarget,
                    damage: eff.damage,
                    speed: baseDef.projectileSpeed,
                    color: baseDef.color,
                    splashRadius: eff.splashRadius,
                    slowFactor: eff.slowFactor,
                    slowDuration: eff.slowDuration,
                    special: eff.special,
                    missed,
                    synergyExtras,
                });
            }

            // Hover detection (mouse)
            const mpos = k.mousePos();
            const dist = mpos.dist(this.pos);
            hovered = dist < GAME_CONFIG.tileSize * 0.6;
        },

        draw() {
            const sz = GAME_CONFIG.tileSize;
            const eff = getEffectiveStats();

            // Range circle on hover
            if (hovered) {
                k.drawCircle({
                    pos: k.vec2(0, 0),
                    radius: eff.range,
                    color: k.rgb(...baseDef.color),
                    opacity: 0.1,
                });
                k.drawCircle({
                    pos: k.vec2(0, 0),
                    radius: eff.range,
                    fill: false,
                    outline: { width: 1.5, color: k.rgb(...baseDef.color) },
                    opacity: 0.35,
                });
            }

            // Tower base (colored square with rounded feel)
            const baseSize = sz * 0.6;
            k.drawRect({
                pos: k.vec2(-baseSize / 2, -baseSize / 2),
                width: baseSize,
                height: baseSize,
                color: k.rgb(...baseDef.color),
                radius: 4,
                opacity: 0.9,
            });

            // Inner detail
            const innerSize = baseSize * 0.55;
            k.drawRect({
                pos: k.vec2(-innerSize / 2, -innerSize / 2),
                width: innerSize,
                height: innerSize,
                color: k.rgb(
                    Math.min(255, baseDef.color[0] + 50),
                    Math.min(255, baseDef.color[1] + 50),
                    Math.min(255, baseDef.color[2] + 50),
                ),
                radius: 2,
                opacity: 0.6,
            });

            // Turret barrel (rotated line)
            const barrelLen = baseSize * 0.55;
            const bx = Math.cos(facingAngle) * barrelLen;
            const by = Math.sin(facingAngle) * barrelLen;
            k.drawLine({
                p1: k.vec2(0, 0),
                p2: k.vec2(bx, by),
                width: 4,
                color: k.rgb(220, 220, 230),
                opacity: 0.9,
            });

            // Barrel tip circle
            k.drawCircle({
                pos: k.vec2(bx, by),
                radius: 3,
                color: k.rgb(255, 255, 255),
                opacity: 0.8,
            });

            // Upgrade level indicator dots
            for (let i = 0; i < level; i++) {
                const dotX = -((level - 1) * 5) / 2 + i * 5;
                k.drawCircle({
                    pos: k.vec2(dotX, baseSize / 2 + 6),
                    radius: 2.5,
                    color: k.rgb(255, 230, 100),
                });
            }

            // Branch indicator
            if (branch) {
                k.drawText({
                    text: branch.toUpperCase(),
                    pos: k.vec2(0, -baseSize / 2 - 8),
                    size: 10,
                    anchor: "center",
                    color: k.rgb(255, 230, 100),
                });
            }
        },

        // -- Public methods ----------------------------------------------------
        upgrade(newLevel, chosenBranch) {
            level = newLevel;
            if (chosenBranch) branch = chosenBranch;
            stats = computeStats();
        },

        applySynergyModifier(modifier) {
            if (modifier.damageMultiplier) {
                synergyDamageMult *= modifier.damageMultiplier;
            }
            if (modifier.fireRateMultiplier) {
                synergyFireRateMult *= modifier.fireRateMultiplier;
            }
            if (modifier.rangeMultiplier) {
                synergyRangeMult *= modifier.rangeMultiplier;
            }
            if (modifier.splashSlow) {
                synergyExtras.splashSlow = modifier.splashSlow;
            }
        },

        getStats() {
            return {
                ...getEffectiveStats(),
                level,
                branch,
                kills,
                towerType,
                towerId,
                baseCost: baseDef.cost,
                name: baseDef.name,
            };
        },

        recordKill() {
            kills += 1;
        },

        isHovered() {
            return hovered;
        },

        getCurrentTarget() {
            return currentTarget;
        },
    };
}
