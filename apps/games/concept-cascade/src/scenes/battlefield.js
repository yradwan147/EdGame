// ---------------------------------------------------------------------------
//  battlefield.js  --  Core tower defense gameplay scene
// ---------------------------------------------------------------------------
//  Export: registerBattlefieldScene({ k, settings, gameStateStore, telemetry, progression })
//
//  Orchestrates ALL systems and components into a playable game:
//    - Tile grid rendering and interaction
//    - Tower placement / upgrade via question overlay
//    - Wave management and enemy spawning
//    - Projectile creation on tower fire
//    - Synergy detection and visual beams
//    - HUD updates, prep/combat phase transitions
//    - Win/loss conditions
// ---------------------------------------------------------------------------

import { GAME_CONFIG, COLORS, SUBJECT_IDS } from "../config/constants.js";
import { TOWER_TYPES } from "../config/towers.js";
import { ENEMY_TYPES } from "../config/enemies.js";
import { WAVES } from "../config/waves.js";
import { map1 } from "../data/maps/map1.js";
import { map2 } from "../data/maps/map2.js";
import { createQuestionEngine } from "../systems/questionEngine.js";
import { createQuestionOverlay } from "../components/questionOverlay.js";
import { createWaveManager } from "../systems/waveManager.js";
import { createTowerSystem } from "../systems/towerSystem.js";
import { createSynergySystem } from "../systems/synergySystem.js";
import { createAssessmentEngine } from "../systems/assessmentEngine.js";
import { createHudRenderer } from "../components/hudRenderer.js";
import { createActionEffects } from "../components/actionEffects.js";
import { enemyComp } from "../components/enemyComp.js";
import { towerComp } from "../components/towerComp.js";
import { projectileComp } from "../components/projectileComp.js";

export function registerBattlefieldScene({ k, settings, gameStateStore, telemetry, progression }) {
    const MAPS = { map1, map2 };
    const TILE = GAME_CONFIG.tileSize;
    const W = GAME_CONFIG.width;
    const H = GAME_CONFIG.height;
    const TOTAL_WAVES = WAVES.length;

    k.scene("battlefield", ({ mapId = "map1" } = {}) => {
        // =================================================================
        //  1. LOAD MAP DATA
        // =================================================================
        const map = MAPS[mapId] || map1;
        const gridRows = map.grid.map((row) => row.split(""));

        // Convert tile-coord path to pixel-coord waypoints
        const pathWaypoints = map.path.map(([col, row]) =>
            k.vec2(col * TILE + TILE / 2, row * TILE + TILE / 2),
        );

        // Core position in pixels
        const corePixel = k.vec2(
            map.corePosition.col * TILE + TILE / 2,
            map.corePosition.row * TILE + TILE / 2,
        );

        // Spawn position in pixels
        const spawnPixel = map.spawnPoints[0]
            ? k.vec2(
                map.spawnPoints[0].col * TILE + TILE / 2,
                map.spawnPoints[0].row * TILE + TILE / 2,
            )
            : pathWaypoints[0];

        // =================================================================
        //  2. INITIALIZE GAME STATE
        // =================================================================
        gameStateStore.startGame();
        telemetry.beginSession({
            environmentId: "concept-cascade",
            mapId,
        });

        // =================================================================
        //  3. INITIALIZE SYSTEMS
        // =================================================================
        const questionEngine = createQuestionEngine();
        const questionOverlay = createQuestionOverlay(k);
        const actionEffects = createActionEffects(k);

        const towerSystem = createTowerSystem({
            k,
            gameStateStore,
            telemetry,
            progression,
            questionEngine,
            questionOverlay,
        });

        const synergySystem = createSynergySystem({
            gameStateStore,
            telemetry,
            progression,
        });

        const assessmentEngine = createAssessmentEngine({
            gameStateStore,
            telemetry,
        });

        const hudRenderer = createHudRenderer(k, { progression });

        // waveManager is created per-wave (needs onEnemySpawn); declared here
        let waveManager = null;

        // =================================================================
        //  4. LOCAL STATE
        // =================================================================
        let prepTimer = GAME_CONFIG.prepPhaseSec;
        let paused = false;
        let gameEnded = false;
        let currentWaveIndex = -1; // -1 = haven't started first wave yet
        let previousSynergyCount = 0;
        let synergyBeamTimer = 0;
        const SYNERGY_BEAM_INTERVAL = 0.8; // seconds between beam redraws

        // Tower game object lookup by towerId
        const towerObjects = new Map();

        // =================================================================
        //  5. DRAW TILE GRID
        // =================================================================
        const gridContainer = k.add([k.pos(0, 0), k.z(1)]);

        gridContainer.onDraw(() => {
            for (let row = 0; row < map.rows; row++) {
                for (let col = 0; col < map.cols; col++) {
                    const cell = gridRows[row][col];
                    const x = col * TILE;
                    const y = row * TILE;

                    let tileColor;
                    if (cell === "P") {
                        tileColor = COLORS.path;
                    } else if (cell === "B") {
                        tileColor = COLORS.buildable;
                    } else {
                        tileColor = COLORS.blocked;
                    }

                    k.drawRect({
                        pos: k.vec2(x, y),
                        width: TILE,
                        height: TILE,
                        color: k.rgb(...tileColor),
                    });

                    // Grid line borders
                    k.drawRect({
                        pos: k.vec2(x, y),
                        width: TILE,
                        height: TILE,
                        fill: false,
                        outline: {
                            width: 1,
                            color: k.rgb(255, 255, 255),
                        },
                        opacity: 0.04,
                    });

                    // Path border highlight
                    if (cell === "P") {
                        k.drawRect({
                            pos: k.vec2(x + 2, y + 2),
                            width: TILE - 4,
                            height: TILE - 4,
                            fill: false,
                            outline: {
                                width: 1,
                                color: k.rgb(...COLORS.pathBorder),
                            },
                            opacity: 0.3,
                        });
                    }
                }
            }
        });

        // =================================================================
        //  6. TILE HOVER HIGHLIGHT
        // =================================================================
        const hoverOverlay = k.add([k.pos(0, 0), k.z(5)]);

        hoverOverlay.onDraw(() => {
            if (questionOverlay.isActive() || paused || gameEnded) return;

            const mpos = k.mousePos();
            const col = Math.floor(mpos.x / TILE);
            const row = Math.floor(mpos.y / TILE);

            if (row < 0 || row >= map.rows || col < 0 || col >= map.cols) return;
            if (gridRows[row][col] !== "B") return;

            // Highlight buildable tile
            k.drawRect({
                pos: k.vec2(col * TILE, row * TILE),
                width: TILE,
                height: TILE,
                color: k.rgb(...COLORS.buildableHover),
                opacity: 0.4,
            });

            // Range preview if a tower type is selected
            const selected = hudRenderer.getSelectedTower();
            if (selected) {
                const tDef = TOWER_TYPES[selected];
                if (tDef) {
                    k.drawCircle({
                        pos: k.vec2(col * TILE + TILE / 2, row * TILE + TILE / 2),
                        radius: tDef.range,
                        color: k.rgb(...tDef.color),
                        opacity: 0.08,
                    });
                    k.drawCircle({
                        pos: k.vec2(col * TILE + TILE / 2, row * TILE + TILE / 2),
                        radius: tDef.range,
                        fill: false,
                        outline: { width: 1, color: k.rgb(...tDef.color) },
                        opacity: 0.25,
                    });
                }
            }
        });

        // =================================================================
        //  7. KNOWLEDGE CORE (end of path)
        // =================================================================
        const core = k.add([
            k.pos(corePixel),
            k.anchor("center"),
            k.z(50),
        ]);
        core.onDraw(() => {
            const pulse = 0.6 + 0.4 * Math.sin(k.time() * 2.5);
            // Outer glow
            k.drawCircle({
                pos: k.vec2(0, 0),
                radius: 28,
                color: k.rgb(...COLORS.gold),
                opacity: 0.15 * pulse,
            });
            // Inner core
            k.drawCircle({
                pos: k.vec2(0, 0),
                radius: 16,
                color: k.rgb(...COLORS.gold),
                opacity: 0.7 + 0.3 * pulse,
            });
            // Bright center
            k.drawCircle({
                pos: k.vec2(0, 0),
                radius: 8,
                color: k.rgb(255, 255, 255),
                opacity: 0.5 + 0.3 * pulse,
            });
            // Label
            k.drawText({
                text: "CORE",
                pos: k.vec2(0, -28),
                size: 10,
                anchor: "center",
                color: k.rgb(...COLORS.gold),
            });
        });

        // =================================================================
        //  8. SPAWN POINT INDICATOR
        // =================================================================
        const spawnIndicator = k.add([
            k.pos(spawnPixel),
            k.anchor("center"),
            k.z(50),
        ]);
        spawnIndicator.onDraw(() => {
            const pulse = 0.5 + 0.5 * Math.sin(k.time() * 3);
            k.drawCircle({
                pos: k.vec2(0, 0),
                radius: 12,
                fill: false,
                outline: { width: 2, color: k.rgb(255, 100, 100) },
                opacity: 0.4 + 0.3 * pulse,
            });
            k.drawText({
                text: "SPAWN",
                pos: k.vec2(0, -20),
                size: 9,
                anchor: "center",
                color: k.rgb(255, 120, 120),
            });
        });

        // =================================================================
        //  9. INITIALIZE HUD
        // =================================================================
        hudRenderer.init();

        // =================================================================
        //  10. PREP TIMER DISPLAY (top center, below HUD bar)
        // =================================================================
        const prepLabel = k.add([
            k.text("", { size: 20 }),
            k.pos(W / 2, 58),
            k.anchor("center"),
            k.color(...COLORS.waveText),
            k.fixed(),
            k.z(1002),
        ]);

        // =================================================================
        //  11. PHASE MANAGEMENT
        // =================================================================

        function startPrepPhase() {
            gameStateStore.startPrep();
            prepTimer = GAME_CONFIG.prepPhaseSec;
            const nextWave = currentWaveIndex + 1;
            if (nextWave < TOTAL_WAVES) {
                const waveCfg = WAVES[nextWave];
                hudRenderer.setWaveTitle(waveCfg.title || "");
                hudRenderer.showWaveBanner(
                    `Wave ${waveCfg.number}: ${waveCfg.title}`,
                    waveCfg.subtitle || "",
                );
            }
        }

        function startCombatPhase() {
            currentWaveIndex += 1;
            if (currentWaveIndex >= TOTAL_WAVES) {
                endGame(true);
                return;
            }

            const waveCfg = WAVES[currentWaveIndex];
            gameStateStore.nextWave();
            hudRenderer.setWaveTitle(waveCfg.title || "");

            // Create waveManager for this wave
            if (waveManager) waveManager.destroy();
            waveManager = createWaveManager({
                k,
                gameStateStore,
                telemetry,
                onEnemySpawn: (enemyType) => spawnEnemy(enemyType),
            });
            waveManager.startWave(waveCfg);

            gameStateStore.pushEvent(`Wave ${waveCfg.number} started`);
        }

        function handleEarlyCall() {
            const state = gameStateStore.getState();
            if (state.phase !== "prep") return;

            // Gold bonus for early call
            const bonusGold = Math.floor(
                prepTimer * GAME_CONFIG.earlyCallBonus * 2,
            );
            if (bonusGold > 0) {
                gameStateStore.addGold(bonusGold);
                actionEffects.goldPopup(
                    k.vec2(W / 2, H / 2),
                    bonusGold,
                );
                gameStateStore.pushEvent(`Early call! +${bonusGold} KC bonus`);
            }

            gameStateStore.recordEarlyCall();
            telemetry.event("early_call", {
                wave: currentWaveIndex + 1,
                bonusGold,
                remainingPrepTime: prepTimer,
            });

            startCombatPhase();
        }

        function handleWaveComplete() {
            if (!waveManager || !waveManager.isWaveComplete()) return;

            const waveCfg = WAVES[currentWaveIndex];
            const progress = waveManager.getWaveProgress();

            // Apply interest
            const interest = gameStateStore.applyInterest();
            if (interest > 0) {
                telemetry.event("interest_earned", { amount: interest });
                gameStateStore.pushEvent(`Interest: +${interest} KC`);
            }

            // Bonus gold for wave
            const bonusGold = waveCfg.bonusGold || 0;
            if (bonusGold > 0) {
                gameStateStore.addGold(bonusGold);
            }

            actionEffects.waveClear(`Wave ${waveCfg.number} Clear!`);
            progression.recordWaveCleared();

            telemetry.event("wave_completed", {
                waveNumber: waveCfg.number,
                enemiesKilled: progress.killed,
                enemiesLeaked: progress.leaked,
                interest,
                bonusGold,
            });

            // Check win condition (last wave cleared)
            if (currentWaveIndex >= TOTAL_WAVES - 1) {
                k.wait(1.5, () => endGame(true));
                return;
            }

            // Go to waveResults scene
            k.wait(1.5, () => {
                const state = gameStateStore.getState();
                k.go("waveResults", {
                    waveNumber: waveCfg.number,
                    enemiesKilled: progress.killed,
                    enemiesLeaked: progress.leaked,
                    goldEarned: bonusGold,
                    interest,
                    bonusGold,
                    mapId,
                    nextWaveIndex: currentWaveIndex + 1,
                    gold: state.gold,
                    lives: state.lives,
                });
            });
        }

        function endGame(won) {
            if (gameEnded) return;
            gameEnded = true;

            const summary = gameStateStore.endGame(won);
            const metrics = assessmentEngine.emitMetrics();

            telemetry.endSession({
                score: summary.score,
                won,
                wavesCleared: summary.wave,
            });

            k.wait(1.0, () => {
                k.go("postGame", {
                    summary,
                    metrics,
                });
            });
        }

        // =================================================================
        //  12. ENEMY SPAWNING
        // =================================================================

        function spawnEnemy(enemyType, overrides = {}) {
            const config = ENEMY_TYPES[enemyType];
            if (!config) return;

            const startPos = overrides.pos || spawnPixel;
            const wpIndex = overrides.waypointIndex || 0;

            // Build waypoint list from the override starting index
            const wp = pathWaypoints.slice(wpIndex);

            const e = k.add([
                k.pos(startPos),
                k.anchor("center"),
                enemyComp({
                    k,
                    config: {
                        ...config,
                        hp: overrides.hp || config.hp,
                        speed: overrides.speed || config.speed,
                    },
                    pathWaypoints: wp,
                }),
                k.z(100),
                "enemy",
            ]);

            // --- Enemy killed event ---
            e.on("enemy_killed", (data) => {
                if (waveManager) waveManager.onEnemyKilled();
                gameStateStore.recordKill(data.type);
                gameStateStore.addGold(data.reward);
                gameStateStore.addScore(data.reward * 10);
                progression.recordEnemyKill(data.type);
                actionEffects.enemyDeath(data.position, config.color);
                actionEffects.goldPopup(data.position, data.reward);
                gameStateStore.pushEvent(`${config.name} defeated! +${data.reward} KC`);

                // Boss hit effect
                if (config.behavior === "boss") {
                    actionEffects.bossHit(data.position);
                }
            });

            // --- Enemy leaked event ---
            e.on("enemy_leaked", (data) => {
                if (waveManager) waveManager.onEnemyLeaked();
                gameStateStore.recordLeak();
                const dead = gameStateStore.loseLives(data.liveCost);
                gameStateStore.pushEvent(`${config.name} leaked! -${data.liveCost} lives`);

                if (dead) {
                    endGame(false);
                }
            });

            // --- Enemy split event (Geometry Golem) ---
            e.on("enemy_split", (data) => {
                for (let i = 0; i < data.splitCount; i++) {
                    const offset = k.vec2(
                        (Math.random() - 0.5) * 30,
                        (Math.random() - 0.5) * 30,
                    );
                    spawnEnemy(config.id, {
                        pos: data.pos.add(offset),
                        hp: data.splitHp,
                        speed: data.splitSpeed,
                        waypointIndex: data.waypointIndex,
                    });
                }
            });

            // --- Boss phase change ---
            e.on("boss_phase", (data) => {
                gameStateStore.pushEvent(`Boss entering phase ${data.phase + 1}!`);
                actionEffects.bossHit(data.pos);
            });

            // --- Boss minion spawn ---
            e.on("boss_spawn", (data) => {
                for (let i = 0; i < data.spawnCount; i++) {
                    const offset = k.vec2(
                        (Math.random() - 0.5) * 40,
                        (Math.random() - 0.5) * 40,
                    );
                    spawnEnemy(data.spawnType, {
                        pos: data.pos.add(offset),
                        waypointIndex: data.waypointIndex,
                    });
                }
            });

            return e;
        }

        // =================================================================
        //  13. TOWER BUILDING (click on buildable tile)
        // =================================================================

        k.onClick(() => {
            if (questionOverlay.isActive() || paused || gameEnded) return;

            const mpos = k.mousePos();
            const col = Math.floor(mpos.x / TILE);
            const row = Math.floor(mpos.y / TILE);

            // Out of grid bounds
            if (row < 0 || row >= map.rows || col < 0 || col >= map.cols) return;

            // Check if clicking an existing tower for upgrade panel
            const clickedTowerObj = findTowerObjectAt(col, row);
            if (clickedTowerObj) {
                showUpgradePanel(clickedTowerObj);
                return;
            }

            // Check if buildable
            const selectedType = hudRenderer.getSelectedTower();
            if (!selectedType) return;
            if (!towerSystem.canBuildAt(col, row, gridRows)) return;

            // Initiate build (async — question overlay will appear)
            buildTowerAt(selectedType, col, row);
        });

        async function buildTowerAt(towerType, col, row) {
            const tower = await towerSystem.buildTower(towerType, col, row);
            if (!tower) {
                gameStateStore.pushEvent("Build failed - wrong answer!");
                return;
            }

            // Create KAPLAY tower game object
            const px = col * TILE + TILE / 2;
            const py = row * TILE + TILE / 2;

            const tObj = k.add([
                k.pos(px, py),
                k.anchor("center"),
                towerComp({ k, towerType, tileCol: col, tileRow: row, towerId: tower.id }),
                k.z(200),
                "tower",
            ]);

            towerObjects.set(tower.id, tObj);

            // Tower fire event -> spawn projectile
            tObj.on("tower_fire", (data) => {
                spawnProjectile(data);
            });

            actionEffects.buildEffect(k.vec2(px, py));
            gameStateStore.pushEvent(`${TOWER_TYPES[towerType].name} built!`);
            hudRenderer.clearSelectedTower();

            // Re-evaluate synergies
            evaluateSynergies();
        }

        // =================================================================
        //  14. TOWER UPGRADE PANEL
        // =================================================================

        function findTowerObjectAt(col, row) {
            for (const [, tObj] of towerObjects) {
                if (tObj.tileCol === col && tObj.tileRow === row) return tObj;
            }
            return null;
        }

        async function showUpgradePanel(tObj) {
            const stats = tObj.getStats();
            const towerDef = TOWER_TYPES[stats.towerType];
            if (!towerDef) return;

            const nextLevel = stats.level + 1;
            if (nextLevel >= towerDef.upgrades.length) {
                gameStateStore.pushEvent(`${towerDef.name} already max level!`);
                return;
            }

            // Simple approach: try normal upgrade
            // A more polished version would show a panel with buttons,
            // but for now we ask directly
            const result = await towerSystem.upgradeTower(tObj.towerId);
            if (result) {
                tObj.upgrade(result.newLevel, result.branch || null);
                gameStateStore.pushEvent(
                    `${towerDef.name} upgraded to level ${result.newLevel + 1}!`,
                );
                evaluateSynergies();
            } else {
                gameStateStore.pushEvent("Upgrade failed!");
            }
        }

        // =================================================================
        //  15. PROJECTILE SPAWNING
        // =================================================================

        function spawnProjectile(data) {
            // Brief beam effect
            actionEffects.towerShot(data.from, data.targetPos, data.color);

            const proj = k.add([
                k.pos(data.from),
                k.anchor("center"),
                projectileComp({
                    k,
                    from: data.from,
                    target: data.targetObj,
                    speed: data.speed,
                    damage: data.damage,
                    color: data.color,
                    towerType: data.towerType,
                    splashRadius: data.splashRadius || 0,
                    effects: {
                        slowFactor: data.slowFactor || 0,
                        slowDuration: data.slowDuration || 0,
                        missed: data.missed || false,
                        splashSlow: data.synergyExtras?.splashSlow || null,
                    },
                }),
                k.z(250),
                "projectile",
            ]);

            proj.on("projectile_miss", (d) => {
                actionEffects.miss(d.pos);
            });
        }

        // =================================================================
        //  16. SYNERGY EVALUATION
        // =================================================================

        function evaluateSynergies() {
            const state = gameStateStore.getState();
            const activeSynergies = synergySystem.evaluate(state.towers);

            // Check for newly discovered synergies
            const newCount = state.discoveredSynergies.length;
            if (newCount > previousSynergyCount) {
                // Show discovery animation for the latest
                const latestId = state.discoveredSynergies[state.discoveredSynergies.length - 1];
                const synEntry = activeSynergies.find((s) => s.synergyId === latestId);
                if (synEntry) {
                    hudRenderer.showSynergyDiscovery(synEntry.synergyName);
                    gameStateStore.pushEvent(`Synergy: ${synEntry.synergyName}!`);
                }
                previousSynergyCount = newCount;
            }

            return activeSynergies;
        }

        function applySynergyEffects(activeSynergies) {
            // Apply synergy modifiers to tower components
            for (const synergy of activeSynergies) {
                const effect = synergy.effect;

                for (const towerId of synergy.towerIds) {
                    const tObj = towerObjects.get(towerId);
                    if (!tObj || !tObj.exists()) continue;

                    // Determine which modifier to apply based on effect type
                    if (effect.type === "markAndBoost") {
                        if (tObj.towerType === effect.beneficiary) {
                            tObj.applySynergyModifier({
                                damageMultiplier: effect.damageMultiplier,
                            });
                        }
                    } else if (effect.type === "conditionalBoost") {
                        if (tObj.towerType === effect.beneficiary) {
                            tObj.applySynergyModifier({
                                damageMultiplier: effect.damageMultiplier,
                            });
                        }
                    } else if (effect.type === "auraBoost") {
                        tObj.applySynergyModifier({
                            fireRateMultiplier: effect.fireRateMultiplier,
                        });
                    } else if (effect.type === "splashSlow") {
                        if (tObj.towerType === effect.beneficiary) {
                            tObj.applySynergyModifier({
                                splashSlow: {
                                    factor: effect.slowFactor,
                                    duration: effect.slowDuration,
                                },
                            });
                        }
                    } else if (effect.type === "mutualBoost") {
                        tObj.applySynergyModifier({
                            rangeMultiplier: effect.rangeMultiplier,
                        });
                    }
                }
            }
        }

        // =================================================================
        //  17. HUD BUTTON CALLBACKS
        // =================================================================

        // Early Call button
        const earlyCallBtn = hudRenderer.getEarlyCallBtn();
        if (earlyCallBtn) {
            earlyCallBtn.onClick(() => {
                handleEarlyCall();
            });
        }

        // Study button
        const studyBtn = hudRenderer.getStudyBtn();
        if (studyBtn) {
            studyBtn.onClick(async () => {
                const state = gameStateStore.getState();
                if (state.phase !== "prep") return;

                // Cycle through subjects for study questions
                const subjects = Object.values(SUBJECT_IDS);
                const subjectIdx = state.studyQuestionsThisPrep % subjects.length;
                const result = await towerSystem.studyQuestion(subjects[subjectIdx]);

                if (!result.allowed) {
                    gameStateStore.pushEvent("Max study questions this prep!");
                } else if (result.correct) {
                    gameStateStore.pushEvent(`Study correct! +${result.goldEarned} KC`);
                } else {
                    gameStateStore.pushEvent("Study wrong, no gold earned");
                }
            });
        }

        // Pause button
        const pauseBtn = hudRenderer.getPauseBtn();
        if (pauseBtn) {
            pauseBtn.onClick(() => togglePause());
        }

        // =================================================================
        //  18. KEYBOARD INPUT
        // =================================================================
        const towerKeys = Object.keys(TOWER_TYPES);

        k.onKeyPress("1", () => {
            if (!questionOverlay.isActive()) hudRenderer.setSelectedTower(towerKeys[0]);
        });
        k.onKeyPress("2", () => {
            if (!questionOverlay.isActive()) hudRenderer.setSelectedTower(towerKeys[1]);
        });
        k.onKeyPress("3", () => {
            if (!questionOverlay.isActive()) hudRenderer.setSelectedTower(towerKeys[2]);
        });
        k.onKeyPress("4", () => {
            if (!questionOverlay.isActive()) hudRenderer.setSelectedTower(towerKeys[3]);
        });

        k.onKeyPress("escape", () => {
            if (questionOverlay.isActive()) return;
            togglePause();
        });

        k.onKeyPress("space", () => {
            if (questionOverlay.isActive()) return;
            const state = gameStateStore.getState();
            if (state.phase === "prep") {
                handleEarlyCall();
            }
        });

        function togglePause() {
            paused = !paused;
            if (paused) {
                gameStateStore.setPhase("paused");
            } else {
                // Restore previous phase
                const state = gameStateStore.getState();
                if (currentWaveIndex < 0 || state.wave === 0) {
                    gameStateStore.setPhase("prep");
                } else {
                    // Check if we were in combat or prep
                    gameStateStore.setPhase("combat");
                }
            }
        }

        // =================================================================
        //  19. PAUSE OVERLAY
        // =================================================================
        const pauseOverlay = k.add([
            k.pos(0, 0),
            k.fixed(),
            k.z(5000),
        ]);
        pauseOverlay.onDraw(() => {
            if (!paused) return;
            k.drawRect({
                pos: k.vec2(0, 0),
                width: W,
                height: H,
                color: k.rgb(0, 0, 0),
                opacity: 0.6,
            });
            k.drawText({
                text: "PAUSED",
                pos: k.vec2(W / 2, H / 2 - 20),
                size: 48,
                anchor: "center",
                color: k.rgb(...COLORS.waveText),
            });
            k.drawText({
                text: "Press ESC to resume",
                pos: k.vec2(W / 2, H / 2 + 30),
                size: 18,
                anchor: "center",
                color: k.rgb(...COLORS.hudText),
            });
        });

        // =================================================================
        //  20. MAIN UPDATE LOOP
        // =================================================================
        startPrepPhase();

        k.onUpdate(() => {
            if (paused || gameEnded) return;

            const dt = k.dt();
            const state = gameStateStore.getState();

            gameStateStore.updateElapsed();

            // --- PREP PHASE ---
            if (state.phase === "prep") {
                prepTimer -= dt;
                prepLabel.text = `Prep: ${Math.max(0, Math.ceil(prepTimer))}s`;

                if (prepTimer <= 3) {
                    prepLabel.color = k.rgb(240, 80, 60);
                } else {
                    prepLabel.color = k.rgb(...COLORS.waveText);
                }

                if (prepTimer <= 0) {
                    prepLabel.text = "";
                    startCombatPhase();
                }
            }

            // --- COMBAT PHASE ---
            if (state.phase === "combat") {
                prepLabel.text = "";

                // Check wave completion
                if (waveManager && waveManager.isWaveComplete()) {
                    handleWaveComplete();
                }

                // Check game over (lives depleted)
                if (state.lives <= 0) {
                    endGame(false);
                }
            }

            // --- SYNERGY EFFECTS (each frame, towers reset their multipliers) ---
            const activeSynergies = synergySystem.getActiveSynergies();
            applySynergyEffects(activeSynergies);

            // Synergy beam visuals (periodic)
            synergyBeamTimer += dt;
            if (synergyBeamTimer >= SYNERGY_BEAM_INTERVAL && activeSynergies.length > 0) {
                synergyBeamTimer = 0;
                for (const syn of activeSynergies) {
                    const positions = syn.towerIds
                        .map((id) => towerObjects.get(id))
                        .filter((t) => t && t.exists())
                        .map((t) => t.pos);

                    for (let i = 0; i < positions.length; i++) {
                        for (let j = i + 1; j < positions.length; j++) {
                            actionEffects.synergyBeam(positions[i], positions[j], syn.color);
                        }
                    }
                }
            }

            // --- HUD UPDATE ---
            hudRenderer.update(state);

            // Clean up destroyed tower objects
            for (const [id, tObj] of towerObjects) {
                if (!tObj.exists()) {
                    towerObjects.delete(id);
                }
            }
        });
    });
}
