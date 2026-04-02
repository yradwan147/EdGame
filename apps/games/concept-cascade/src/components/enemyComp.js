// ---------------------------------------------------------------------------
//  enemyComp.js  --  KAPLAY custom component for Concept Cascade enemies
// ---------------------------------------------------------------------------
//  Usage:
//    const e = k.add([
//        k.pos(startX, startY),
//        k.anchor("center"),
//        enemyComp({ k, config, pathWaypoints }),
//        "enemy",
//    ]);
// ---------------------------------------------------------------------------

export function enemyComp({ k, config, pathWaypoints }) {
    let waypointIndex = 0;
    let flickerTimer = 0;
    let isFlickering = false;
    let flexTimer = 0;
    let flexCooldown = 0;
    let scatterDir = null;
    let scatterTimer = 0;
    let spawnScale = 0;
    let alive = true;
    let hasSplitEmitted = false;
    let currentPhaseIndex = 0;
    let bossSpawnTimer = 0;
    let trail = []; // for visual trail behind enemy

    // Pre-compute slow state
    let slowFactor = 1;
    let slowTimer = 0;

    return {
        id: "enemy",
        require: ["pos"],

        // -- Exposed properties ------------------------------------------------
        hp: config.hp,
        maxHp: config.hp,
        speed: config.speed,
        reward: config.reward,
        liveCost: config.liveCost,
        enemyType: config.id,
        knowledgeComponent: config.knowledgeComponent,
        isFlickering: false,
        isAlive: true,

        // -- Lifecycle ---------------------------------------------------------
        add() {
            spawnScale = 0;

            // Swarm scatter listener
            if (config.behavior === "swarm") {
                this.on("swarm_scatter", () => {
                    if (!alive) return;
                    const angle = k.rand(0, Math.PI * 2);
                    scatterDir = k.vec2(Math.cos(angle), Math.sin(angle));
                    scatterTimer = 0.35;
                });
            }
        },

        update() {
            if (!alive) return;
            const dt = k.dt();

            // --- Spawn animation (scale pulse 0 -> 1) -------------------------
            if (spawnScale < 1) {
                spawnScale = Math.min(1, spawnScale + dt * 4);
                return; // don't move while spawning
            }

            // --- Slow timer decay ----------------------------------------------
            if (slowTimer > 0) {
                slowTimer -= dt;
                if (slowTimer <= 0) {
                    slowFactor = 1;
                    slowTimer = 0;
                }
            }

            // --- Behavior: flicker ---------------------------------------------
            if (config.behavior === "flicker") {
                flickerTimer += dt;
                const interval = config.flickerInterval || 1.5;
                const duration = config.flickerDuration || 0.4;
                const cycle = flickerTimer % (interval + duration);
                if (cycle > interval) {
                    isFlickering = true;
                    this.isFlickering = true;
                    this.opacity = 0.2;
                    if (!this.is("flickering")) this.use(k.z(this.z)); // tag below
                } else {
                    isFlickering = false;
                    this.isFlickering = false;
                    this.opacity = 1.0;
                }
                // Tag management for tower hit-chance checks
                if (isFlickering && !this.is("flickering")) {
                    this.tag("flickering");
                } else if (!isFlickering && this.is("flickering")) {
                    this.untag("flickering");
                }
            }

            // --- Behavior: lockstep flex ---------------------------------------
            if (config.behavior === "lockstep") {
                flexCooldown += dt;
                if (flexCooldown >= 4.0) {
                    flexCooldown = 0;
                    flexTimer = 0.3;
                }
                if (flexTimer > 0) {
                    flexTimer -= dt;
                    return; // paused while flexing
                }
            }

            // --- Behavior: crack (split at threshold) --------------------------
            if (config.behavior === "crack" && !hasSplitEmitted) {
                const threshold = config.splitAt || 0.5;
                if (this.hp / this.maxHp <= threshold) {
                    hasSplitEmitted = true;
                    this.trigger("enemy_split", {
                        pos: this.pos.clone(),
                        splitCount: config.splitCount || 2,
                        splitHp: config.splitHp || 40,
                        splitSpeed: config.splitSpeed || 60,
                        waypointIndex: waypointIndex,
                        knowledgeComponent: config.knowledgeComponent,
                        color: config.color,
                    });
                }
            }

            // --- Behavior: boss phases -----------------------------------------
            if (config.behavior === "boss" && config.phases) {
                const hpRatio = this.hp / this.maxHp;
                // Advance phase
                while (
                    currentPhaseIndex < config.phases.length - 1 &&
                    hpRatio <= config.phases[currentPhaseIndex + 1].hpThreshold
                ) {
                    currentPhaseIndex += 1;
                    this.trigger("boss_phase", {
                        phase: currentPhaseIndex,
                        phaseConfig: config.phases[currentPhaseIndex],
                        pos: this.pos.clone(),
                    });
                }
                // Speed boost per phase
                const phase = config.phases[currentPhaseIndex];
                if (phase && phase.speedBoost) {
                    // Applied additively each frame below via effective speed
                }
                // Periodic minion spawns
                bossSpawnTimer += dt;
                const phase0 = config.phases[currentPhaseIndex];
                if (phase0 && bossSpawnTimer >= (phase0.spawnInterval || 99)) {
                    bossSpawnTimer = 0;
                    this.trigger("boss_spawn", {
                        spawnType: phase0.spawnType,
                        spawnCount: phase0.spawnCount,
                        pos: this.pos.clone(),
                        waypointIndex: waypointIndex,
                    });
                }
            }

            // --- Scatter override (swarm) --------------------------------------
            if (scatterTimer > 0) {
                scatterTimer -= dt;
                if (scatterDir) {
                    this.pos = this.pos.add(scatterDir.scale(200 * dt));
                }
                if (scatterTimer <= 0) {
                    scatterDir = null;
                }
                return;
            }

            // --- Movement along path -------------------------------------------
            if (waypointIndex >= pathWaypoints.length) {
                // Reached end
                alive = false;
                this.isAlive = false;
                this.trigger("enemy_leaked", {
                    type: config.id,
                    liveCost: this.liveCost,
                });
                k.destroy(this);
                return;
            }

            const target = pathWaypoints[waypointIndex];
            const dir = target.sub(this.pos);
            const dist = dir.len();

            // Effective speed (phase boost + slow)
            let effectiveSpeed = this.speed * slowFactor;
            if (config.behavior === "boss" && config.phases) {
                const phase = config.phases[currentPhaseIndex];
                if (phase && phase.speedBoost) {
                    effectiveSpeed *= phase.speedBoost;
                }
            }

            const step = effectiveSpeed * dt;

            if (dist <= step) {
                this.pos = target.clone();
                waypointIndex += 1;
            } else {
                this.pos = this.pos.add(dir.unit().scale(step));
            }

            // Trail positions for visual
            trail.unshift(this.pos.clone());
            if (trail.length > 4) trail.pop();
        },

        draw() {
            if (!alive) return;

            const sz = config.size;
            const effectiveScale = spawnScale < 1 ? spawnScale : 1;
            const flexScale =
                flexTimer > 0 ? 1 + 0.25 * Math.sin((0.3 - flexTimer) / 0.3 * Math.PI) : 1;
            const s = effectiveScale * flexScale;

            // Trail (fading copies)
            for (let i = 0; i < trail.length; i++) {
                const tp = trail[i].sub(this.pos);
                const alpha = (1 - (i + 1) / (trail.length + 1)) * 0.3;
                k.drawCircle({
                    pos: tp,
                    radius: sz * s * 0.7,
                    color: k.rgb(...config.color),
                    opacity: alpha * (isFlickering ? 0.2 : 1),
                });
            }

            // Body
            k.drawCircle({
                pos: k.vec2(0, 0),
                radius: sz * s,
                color: k.rgb(...config.color),
                opacity: isFlickering ? 0.2 : 1,
            });

            // Inner highlight
            k.drawCircle({
                pos: k.vec2(-sz * 0.2 * s, -sz * 0.2 * s),
                radius: sz * 0.35 * s,
                color: k.rgb(255, 255, 255),
                opacity: 0.25 * (isFlickering ? 0.2 : 1),
            });

            // Boss: concentric rings
            if (config.behavior === "boss") {
                k.drawCircle({
                    pos: k.vec2(0, 0),
                    radius: sz * s + 4,
                    color: k.rgb(255, 50, 200),
                    opacity: 0.4 + 0.2 * Math.sin(k.time() * 3),
                    fill: false,
                    outline: { width: 2, color: k.rgb(255, 50, 200) },
                });
            }

            // Crack visual
            if (config.behavior === "crack" && hasSplitEmitted) {
                // Draw a crack line across the body
                k.drawLine({
                    p1: k.vec2(-sz * 0.6 * s, -sz * 0.2 * s),
                    p2: k.vec2(sz * 0.6 * s, sz * 0.2 * s),
                    width: 2,
                    color: k.rgb(255, 255, 255),
                    opacity: 0.7,
                });
                k.drawLine({
                    p1: k.vec2(-sz * 0.3 * s, sz * 0.4 * s),
                    p2: k.vec2(sz * 0.4 * s, -sz * 0.5 * s),
                    width: 1.5,
                    color: k.rgb(255, 255, 255),
                    opacity: 0.5,
                });
            }

            // --- Health bar (above enemy) --------------------------------------
            const barWidth = sz * 2.2;
            const barHeight = 4;
            const barY = -sz * s - 8;
            const hpRatio = Math.max(0, this.hp / this.maxHp);

            // BG
            k.drawRect({
                pos: k.vec2(-barWidth / 2, barY),
                width: barWidth,
                height: barHeight,
                color: k.rgb(30, 30, 30),
                opacity: 0.8,
            });

            // Fill (green -> yellow -> red)
            let barR, barG, barB;
            if (hpRatio > 0.6) {
                barR = 80;
                barG = 220;
                barB = 100;
            } else if (hpRatio > 0.3) {
                barR = 240;
                barG = 200;
                barB = 60;
            } else {
                barR = 240;
                barG = 60;
                barB = 60;
            }

            k.drawRect({
                pos: k.vec2(-barWidth / 2, barY),
                width: barWidth * hpRatio,
                height: barHeight,
                color: k.rgb(barR, barG, barB),
                opacity: 0.9,
            });
        },

        // -- Public Methods ----------------------------------------------------
        hurt(damage) {
            if (!alive) return;
            this.hp -= damage;

            // Floating damage number
            const dmgText = k.add([
                k.text(`${Math.round(damage)}`, { size: 14 }),
                k.pos(this.pos.x + k.rand(-10, 10), this.pos.y - config.size - 12),
                k.anchor("center"),
                k.color(255, 255, 100),
                k.opacity(1),
                k.lifespan(0.7, { fade: 0.4 }),
                k.z(500),
            ]);
            // Float upward
            dmgText.onUpdate(() => {
                dmgText.pos.y -= 40 * k.dt();
            });

            if (this.hp <= 0) {
                alive = false;
                this.isAlive = false;

                // Notify swarm scatter
                if (config.behavior === "swarm") {
                    // Broadcast to all enemy objects
                    const allEnemies = k.get("enemy");
                    for (const e of allEnemies) {
                        if (e !== this && e.enemyType === config.id && e.isAlive) {
                            e.trigger("swarm_scatter");
                        }
                    }
                }

                this.trigger("enemy_killed", {
                    type: config.id,
                    reward: this.reward,
                    position: this.pos.clone(),
                    knowledgeComponent: config.knowledgeComponent,
                });

                k.destroy(this);
            }
        },

        getProgress() {
            // Returns 0-1 how far along the entire path the enemy has traveled
            if (pathWaypoints.length <= 1) return waypointIndex > 0 ? 1 : 0;

            // Distance already covered (sum of completed segments)
            let covered = 0;
            for (let i = 0; i < waypointIndex && i < pathWaypoints.length - 1; i++) {
                covered += pathWaypoints[i + 1].sub(pathWaypoints[i]).len();
            }
            // Partial progress toward current waypoint
            if (waypointIndex < pathWaypoints.length) {
                const segStart =
                    waypointIndex > 0
                        ? pathWaypoints[waypointIndex - 1]
                        : pathWaypoints[0];
                covered += this.pos.sub(segStart).len();
            }

            // Total path length
            let total = 0;
            for (let i = 0; i < pathWaypoints.length - 1; i++) {
                total += pathWaypoints[i + 1].sub(pathWaypoints[i]).len();
            }

            return total > 0 ? Math.min(1, covered / total) : 0;
        },

        applySlow(factor, duration) {
            slowFactor = Math.min(slowFactor, factor);
            slowTimer = Math.max(slowTimer, duration);
        },

        get waypointIndex() {
            return waypointIndex;
        },
    };
}
