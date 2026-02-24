import { ACTION_IDS, ARENA_CONFIG, DEFAULT_SETTINGS, ROLE_IDS, TEAM_IDS } from "../config/constants.js";
import { getRole, ROLE_CONFIG } from "../config/roles.js";
import { arena1 } from "../data/maps/arena1.js";
import { createQuestionEngine } from "../systems/questionEngine.js";
import { createBotAI } from "../systems/botAI.js";
import { createCombatSystem } from "../systems/combatSystem.js";
import { createQuestionOverlay } from "../components/questionOverlay.js";
import { createHudRenderer } from "../components/hudRenderer.js";
import { playerComp } from "../components/playerComp.js";
import { botComp } from "../components/botComp.js";
import { createActionEffects } from "../components/actionEffects.js";

let spritesLoaded = false;

function distance(a, b) {
    const dx = a.pos.x - b.pos.x;
    const dy = a.pos.y - b.pos.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function getNearest(source, targets) {
    let best = null;
    let bestDist = Infinity;
    for (const target of targets) {
        const d = distance(source, target);
        if (d < bestDist) {
            best = target;
            bestDist = d;
        }
    }
    return { target: best, distance: bestDist };
}

function loadSprites(k) {
    if (spritesLoaded) return;
    for (let i = 1; i <= 5; i += 1) {
        const folder = `player${i}`;
        const base = `./public/characters/${folder}`;
        k.loadSprite(`${folder}_idle`, `${base}/Idle.png`, {
            sliceX: 4,
            anims: { idle: { from: 0, to: 3, speed: 8, loop: true } },
        });
        k.loadSprite(`${folder}_walk`, `${base}/Walk.png`, {
            sliceX: 6,
            anims: { walk: { from: 0, to: 5, speed: 10, loop: true } },
        });
        k.loadSprite(`${folder}_attack`, `${base}/${i === 3 ? "Attack1.png" : "Attack.png"}`, {
            sliceX: i === 3 ? 4 : 6,
            anims: { attack: { from: 0, to: i === 3 ? 3 : 5, speed: 12, loop: false } },
        });
        k.loadSprite(`${folder}_hurt`, `${base}/Hurt.png`, {
            sliceX: 2,
            anims: { hurt: { from: 0, to: 1, speed: 12, loop: false } },
        });
        k.loadSprite(`${folder}_death`, `${base}/Death.png`, {
            sliceX: 6,
            anims: { death: { from: 0, to: 5, speed: 8, loop: false } },
        });
    }
    spritesLoaded = true;
}

function chooseBotRoles(playerRoleId) {
    const allRoles = Object.keys(ROLE_CONFIG);
    const others = allRoles.filter((r) => r !== playerRoleId);
    return [others[0], others[1] ?? others[0]];
}

export function registerArenaScene({
    k,
    telemetry,
    progression,
    gameStateStore,
}) {
    k.scene("arena", async ({ roleId = ROLE_IDS.ATTACKER, subjectId = "general" }) => {
        loadSprites(k);

        const questionEngine = createQuestionEngine();
        const botAI = createBotAI();
        const overlay = createQuestionOverlay(k);
        const hud = createHudRenderer(k, { progression });
        const actionEffects = createActionEffects(k);

        const combatSystem = createCombatSystem({
            questionEngine,
            overlay,
            telemetry,
            progression,
            gameStateStore,
            onEffect: ({ effectType, actorObj, targetObj, value, power }) => {
                const fromX = actorObj?.pos?.x ?? 0;
                const fromY = actorObj?.pos?.y ?? 0;
                const toX = (targetObj?.pos?.x ?? actorObj?.pos?.x) ?? 0;
                const toY = (targetObj?.pos?.y ?? actorObj?.pos?.y) ?? 0;
                const from = { x: fromX, y: fromY };
                const to = { x: toX, y: toY };
                if (effectType === "damage") {
                    actionEffects.attackBeam(from, to, [255, 90, 90]);
                    actionEffects.damage(to, power, targetObj?.isPlayerControlled ?? false);
                } else if (effectType === "heal") {
                    actionEffects.attackBeam(from, to, [80, 255, 140]);
                    actionEffects.heal(to, value);
                } else if (effectType === "shield" || effectType === "barrier") {
                    actionEffects.attackBeam(from, to, [90, 180, 255]);
                    actionEffects.shield(to);
                } else if (effectType === "miss") {
                    actionEffects.miss(to);
                }
            },
        });

        const sessionId = telemetry.beginSession({
            roleId,
            subjectId,
            mode: "singleplayer_bots",
            mapId: arena1.id,
        });
        telemetry.event("game_started", { role: roleId, questionSubject: subjectId });
        gameStateStore.startMatch({ sessionId, selectedRoleId: roleId, selectedSubject: subjectId });

        const logs = ["Omniverse simulation online."];
        function pushLog(msg) {
            logs.push(msg);
            if (logs.length > 10) logs.shift();
        }

        k.add([k.rect(k.width(), k.height()), k.color(8, 10, 24)]);
        arena1.walls.forEach((w) => {
            k.add([
                k.rect(w.w, w.h),
                k.pos(w.x, w.y),
                k.color(48, 56, 82),
                k.area(),
                k.body({ isStatic: true }),
                "wall",
            ]);
        });
        k.add([
            k.circle(ARENA_CONFIG.objectiveCaptureRadius),
            k.pos(arena1.objectivePoint.x, arena1.objectivePoint.y),
            k.anchor("center"),
            k.color(130, 100, 255),
            k.opacity(0.12),
        ]);

        const actorObjects = [];

        function spawnActor({ actorId, displayName, teamId, roleId: actorRoleId, spawnPos, spritePrefix, isPlayer }) {
            const baseComps = [
                k.sprite(`${spritePrefix}_idle`),
                k.pos(spawnPos.x, spawnPos.y),
                k.anchor("center"),
                k.scale(1.35),
                actorRoleId === ROLE_IDS.ATTACKER
                    ? k.color(255, 255, 255)
                    : actorRoleId === ROLE_IDS.HEALER
                        ? k.color(200, 255, 220)
                        : k.color(255, 230, 200),
                teamId,
                "actor",
            ];

            if (isPlayer) {
                baseComps.push(
                    playerComp({
                        k,
                        actorId,
                        roleId: actorRoleId,
                        teamId,
                        displayName,
                        maxHp: ARENA_CONFIG.baseHp,
                        speed: ARENA_CONFIG.playerMoveSpeed,
                        spritePrefix,
                    }),
                );
            } else {
                baseComps.push(
                    k.state("idle", ["idle", "patrol", "engage", "retreat", "support", "dead"]),
                    botComp({
                        k,
                        actorId,
                        roleId: actorRoleId,
                        teamId,
                        displayName,
                        maxHp: ARENA_CONFIG.baseHp,
                        speed: ARENA_CONFIG.botMoveSpeed,
                        spritePrefix,
                    }),
                );
            }

            const obj = k.add(baseComps);
            // Keep first frame by default; animation is triggered by movement/actions.
            gameStateStore.registerActor({
                id: actorId,
                teamId,
                roleId: actorRoleId,
                displayName,
                hp: ARENA_CONFIG.baseHp,
                maxHp: ARENA_CONFIG.baseHp,
                isAlive: true,
            });
            actorObjects.push(obj);
            return obj;
        }

        const player = spawnActor({
            actorId: "player_1",
            displayName: "You",
            teamId: TEAM_IDS.ALLY,
            roleId,
            spawnPos: arena1.spawns.ally[0],
            spritePrefix: "player1",
            isPlayer: true,
        });
        const allyRoles = chooseBotRoles(roleId);
        spawnActor({
            actorId: "ally_bot_1",
            displayName: "Lyra",
            teamId: TEAM_IDS.ALLY,
            roleId: allyRoles[0],
            spawnPos: arena1.spawns.ally[1],
            spritePrefix: "player2",
            isPlayer: false,
        });
        spawnActor({
            actorId: "ally_bot_2",
            displayName: "Orion",
            teamId: TEAM_IDS.ALLY,
            roleId: allyRoles[1],
            spawnPos: arena1.spawns.ally[2],
            spritePrefix: "player3",
            isPlayer: false,
        });
        spawnActor({
            actorId: "enemy_bot_1",
            displayName: "Raze",
            teamId: TEAM_IDS.ENEMY,
            roleId: ROLE_IDS.ATTACKER,
            spawnPos: arena1.spawns.enemy[0],
            spritePrefix: "player4",
            isPlayer: false,
        });
        spawnActor({
            actorId: "enemy_bot_2",
            displayName: "Mend",
            teamId: TEAM_IDS.ENEMY,
            roleId: ROLE_IDS.HEALER,
            spawnPos: arena1.spawns.enemy[1],
            spritePrefix: "player5",
            isPlayer: false,
        });
        spawnActor({
            actorId: "enemy_bot_3",
            displayName: "Forge",
            teamId: TEAM_IDS.ENEMY,
            roleId: ROLE_IDS.BUILDER,
            spawnPos: arena1.spawns.enemy[2],
            spritePrefix: "player2",
            isPlayer: false,
        });

        const playerRole = getRole(roleId);
        hud.init({ abilities: playerRole.actions });
        k.add([
            k.rect(840, 58),
            k.pos(220, 640),
            k.color(15, 20, 36),
            k.opacity(0.9),
            k.fixed(),
            k.z(1200),
        ]);
        k.add([
            k.text("How to play: Move with WASD/Arrows. Use action 1 and action 2 keys to trigger role abilities. Hold center objective to score. Hover ability cards for details.", { size: 16, width: 820 }),
            k.pos(230, 652),
            k.fixed(),
            k.z(1202),
            k.color(190, 200, 235),
        ]);

        const keyState = new Set();
        ["w", "a", "s", "d", "arrowup", "arrowleft", "arrowdown", "arrowright"].forEach((key) => {
            k.onKeyDown(key, () => keyState.add(key));
            k.onKeyRelease(key, () => keyState.delete(key));
        });

        function aliveAllies() {
            return actorObjects.filter((a) => a.teamId === TEAM_IDS.ALLY && a.isAlive);
        }
        function aliveEnemies() {
            return actorObjects.filter((a) => a.teamId === TEAM_IDS.ENEMY && a.isAlive);
        }

        function roleActionsForActor(actor) {
            return getRole(actor.roleId).actions;
        }

        function getActionRange(actionId) {
            if (actionId === ACTION_IDS.HEAL || actionId === ACTION_IDS.SHIELD) {
                return ARENA_CONFIG.healRange;
            }
            if (actionId === ACTION_IDS.POWER_STRIKE) {
                return ARENA_CONFIG.attackRange * 0.55;
            }
            if (actionId === ACTION_IDS.BUILD_BARRIER) {
                return ARENA_CONFIG.buildRange;
            }
            return ARENA_CONFIG.attackRange;
        }

        function showRangePreview(action) {
            if (!action) return;
            const radius = getActionRange(action.id);
            const ring = k.add([
                k.circle(radius),
                k.pos(player.pos.x, player.pos.y),
                k.anchor("center"),
                k.color(80, 220, 255),
                k.opacity(0.1),
                k.lifespan(0.45, { fade: 0.2 }),
                k.z(900),
            ]);
            ring.add([
                k.circle(radius),
                k.anchor("center"),
                k.color(80, 220, 255),
                k.opacity(0),
                k.outline(2, k.rgb(80, 220, 255)),
            ]);
        }

        async function playerUseAction(slotIndex) {
            if (overlay.isActive() || !player.isAlive) return;
            const action = roleActionsForActor(player)[slotIndex];
            if (!action) return;
            const nextReadyAt = player.cooldowns[action.id] ?? 0;
            if (Date.now() < nextReadyAt) {
                pushLog(`${action.label} recharging...`);
                return;
            }

            let target = null;
            if (action.id === ACTION_IDS.HEAL || action.id === ACTION_IDS.SHIELD) {
                const candidates = aliveAllies().filter((a) => a.actorId !== player.actorId);
                target = candidates.sort((a, b) => a.hp - b.hp)[0] ?? null;
                if (!target) {
                    pushLog("No ally target in need.");
                    return;
                }
                const supportRange = distance(player, target);
                if (supportRange > ARENA_CONFIG.healRange) {
                    pushLog("Move closer to your ally to use support ability.");
                    return;
                }
            } else if (action.id === ACTION_IDS.BUILD_BARRIER) {
                target = player;
            } else {
                const nearestEnemy = getNearest(player, aliveEnemies());
                target = nearestEnemy.target;
                if (!target) return;
                const maxRange = action.id === ACTION_IDS.POWER_STRIKE
                    ? ARENA_CONFIG.attackRange * 0.55
                    : ARENA_CONFIG.attackRange;
                if (nearestEnemy.distance > maxRange) {
                    pushLog(`Move closer to enemy to use ${action.label}.`);
                    return;
                }
            }

            player.setAnimation("attack");
            const result = await combatSystem.resolveWithQuestion({
                actorObj: player,
                targetObj: target,
                actionId: action.id,
                subjectId,
            });

            player.cooldowns[action.id] = Date.now() + action.cooldownSec * 1000;
            if (result.correct) {
                pushLog(`${action.label} successful (${Math.round(result.power)} power).`);
            } else {
                pushLog(`${action.label} failed. Review the explanation in your mind and retry.`);
            }
        }

        k.onKeyPress("1", () => {
            showRangePreview(roleActionsForActor(player)[0]);
            void playerUseAction(0);
        });
        k.onKeyPress("2", () => {
            showRangePreview(roleActionsForActor(player)[1]);
            void playerUseAction(1);
        });
        k.onKeyPress("h", () => {
            pushLog("Tips: Stay near allies for support, hold center objective to score, and answer fast for stronger effects.");
        });
        k.onKeyPress("escape", () => {
            overlay.destroy();
            const summary = finalizeMatch("enemy");
            k.go("postGame", { summary });
        });

        let botActionCooldown = 0;
        let objectiveTickCooldown = 0;
        let matchEnded = false;

        function computePulseScore() {
            const recent = player.questionStats.recent;
            if (!recent.length) return 0.5;
            return recent.reduce((a, b) => a + b, 0) / recent.length;
        }

        function finalizeMatch(winnerTeamId) {
            if (matchEnded) return gameStateStore.getState().finalSummary;
            matchEnded = true;
            const durationMs = Date.now() - gameStateStore.getState().startedAt;
            const qTotal = player.questionStats.total;
            const qCorrect = player.questionStats.correct;
            const avgResponseMs = (() => {
                const questionEvents = telemetry.getCurrentSession()?.events?.filter((e) => e.type === "question_answered") ?? [];
                if (!questionEvents.length) return 0;
                return questionEvents.reduce((sum, e) => sum + e.payload.responseTimeMs, 0) / questionEvents.length;
            })();
            const pulseScore = computePulseScore();
            const pulseLabel = pulseScore > 0.75 ? "Focused" : pulseScore > 0.45 ? "Developing" : "Needs Support";
            const profile = progression.getProfile();
            const summary = {
                winnerTeamId,
                durationMs,
                questionsAnswered: qTotal,
                correctRate: qCorrect / Math.max(1, qTotal),
                avgResponseMs,
                pulseLabel,
                playerFinalHp: player.hp,
                profile,
            };
            telemetry.event("game_ended", summary);
            telemetry.endSession(summary);
            gameStateStore.endMatch(summary);
            return summary;
        }

        function syncStoreFromActors() {
            for (const actor of actorObjects) {
                gameStateStore.updateActor(actor.actorId, (prev) => ({
                    ...prev,
                    hp: actor.hp,
                    isAlive: actor.isAlive,
                }));
            }
        }

        k.onUpdate(async () => {
            if (matchEnded) return;
            gameStateStore.updateElapsed();

            // Player movement
            if (!overlay.isActive() && player.isAlive) {
                let dx = 0;
                let dy = 0;
                if (keyState.has("w") || keyState.has("arrowup")) dy -= 1;
                if (keyState.has("s") || keyState.has("arrowdown")) dy += 1;
                if (keyState.has("a") || keyState.has("arrowleft")) dx -= 1;
                if (keyState.has("d") || keyState.has("arrowright")) dx += 1;
                const moving = dx !== 0 || dy !== 0;
                if (moving) {
                    const len = Math.sqrt(dx * dx + dy * dy);
                    dx /= len;
                    dy /= len;
                    player.pos.x += dx * player.speed * k.dt();
                    player.pos.y += dy * player.speed * k.dt();
                    player.pos.x = Math.max(24, Math.min(k.width() - 24, player.pos.x));
                    player.pos.y = Math.max(24, Math.min(k.height() - 24, player.pos.y));
                    player.flipX = dx < 0;
                    player.setAnimation("walk");
                } else {
                    player.setAnimation("idle");
                }
            }

            // Objective capture
            objectiveTickCooldown -= k.dt();
            if (objectiveTickCooldown <= 0) {
                objectiveTickCooldown = ARENA_CONFIG.objectiveTickSeconds;
                const nearAllies = aliveAllies().filter((a) => distance(a, { pos: arena1.objectivePoint }) < ARENA_CONFIG.objectiveCaptureRadius).length;
                const nearEnemies = aliveEnemies().filter((a) => distance(a, { pos: arena1.objectivePoint }) < ARENA_CONFIG.objectiveCaptureRadius).length;
                if (nearAllies > nearEnemies) {
                    const objective = gameStateStore.getState().objective;
                    gameStateStore.setObjective({ allyPoints: objective.allyPoints + ARENA_CONFIG.objectiveTickPoints });
                } else if (nearEnemies > nearAllies) {
                    const objective = gameStateStore.getState().objective;
                    gameStateStore.setObjective({ enemyPoints: objective.enemyPoints + ARENA_CONFIG.objectiveTickPoints });
                }
            }

            // Bot movement logic each frame:
            // - attackers/builders push nearest enemy
            // - healers move to lowest-health ally
            for (const bot of actorObjects.filter((a) => !a.isPlayerControlled && a.isAlive)) {
                const movementTarget = botAI.getMovementTarget(bot, actorObjects);
                if (movementTarget) {
                    botAI.moveBotTowards(k, bot, movementTarget, k.dt(), arena1.walls);
                } else {
                    bot.setAnimation("idle");
                }
            }

            // Bot action resolution loop
            botActionCooldown -= k.dt();
            if (botActionCooldown <= 0 && !overlay.isActive()) {
                botActionCooldown = 0.8;
                for (const bot of actorObjects.filter((a) => !a.isPlayerControlled && a.isAlive)) {
                    const intent = botAI.chooseIntent(bot, actorObjects);
                    if (!intent) continue;
                    if (!intent.actionId) continue;
                    const action = roleActionsForActor(bot).find((a) => a.id === intent.actionId);
                    if (!action) continue;
                    const cooldownReadyAt = bot.cooldowns[action.id] ?? 0;
                    if (Date.now() < cooldownReadyAt) continue;
                    const target = actorObjects.find((a) => a.actorId === intent.targetId);
                    if (!target) continue;
                    const rangeToTarget = distance(bot, target);
                    const actionRange = getActionRange(action.id);
                    if (rangeToTarget > actionRange) continue;
                    const question = await questionEngine.getQuestion({
                        playerId: bot.actorId,
                        subjectId,
                        requestedDifficulty: 3 + action.difficultyBias,
                    });
                    const botOutcome = botAI.simulateQuestionOutcome(question.difficulty);
                    await combatSystem.resolveWithQuestion({
                        actorObj: bot,
                        targetObj: target,
                        actionId: action.id,
                        subjectId,
                        botOutcome,
                    });
                    bot.cooldowns[action.id] = Date.now() + action.cooldownSec * 1000;
                }
            }

            syncStoreFromActors();

            const allyAlive = aliveAllies().length;
            const enemyAlive = aliveEnemies().length;
            const elapsedSec = Math.floor(gameStateStore.getState().elapsedMs / 1000);
            const remainingSec = DEFAULT_SETTINGS.matchDurationSec - elapsedSec;
            const objective = gameStateStore.getState().objective;

            if (enemyAlive === 0 || objective.allyPoints >= 100) {
                const summary = finalizeMatch(TEAM_IDS.ALLY);
                k.go("postGame", { summary });
                return;
            }
            if (allyAlive === 0 || objective.enemyPoints >= 100 || remainingSec <= 0) {
                const winner = objective.allyPoints > objective.enemyPoints ? TEAM_IDS.ALLY : TEAM_IDS.ENEMY;
                const summary = finalizeMatch(winner);
                k.go("postGame", { summary });
                return;
            }

            hud.update({
                playerObj: player,
                profile: progression.getProfile(),
                roleName: getRole(roleId).name,
                pulseScore: computePulseScore(),
                elapsedMs: gameStateStore.getState().elapsedMs,
                durationSec: DEFAULT_SETTINGS.matchDurationSec,
                logLines: logs.concat(gameStateStore.getState().events.map((e) => e.msg)),
                allies: aliveAllies().filter((a) => a.actorId !== player.actorId),
                objective,
                abilityCooldowns: player.cooldowns,
            });
        });
    });
}
