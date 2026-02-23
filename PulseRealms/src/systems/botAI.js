import { ACTION_IDS, ARENA_CONFIG, BOT_ACCURACY_BY_DIFFICULTY, ROLE_IDS } from "../config/constants.js";

function dist(a, b) {
    const dx = a.pos.x - b.pos.x;
    const dy = a.pos.y - b.pos.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function nearest(source, targets) {
    let best = null;
    let bestDist = Infinity;
    for (const target of targets) {
        const d = dist(source, target);
        if (d < bestDist) {
            best = target;
            bestDist = d;
        }
    }
    return { target: best, distance: bestDist };
}

function circleRectIntersect(cx, cy, radius, rx, ry, rw, rh) {
    const nearestX = Math.max(rx, Math.min(cx, rx + rw));
    const nearestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    return (dx * dx + dy * dy) < (radius * radius);
}

function collidesWithWall(x, y, walls, radius) {
    return walls.some((w) => circleRectIntersect(x, y, radius, w.x, w.y, w.w, w.h));
}

export function createBotAI() {
    function getMovementTarget(bot, allActors) {
        if (!bot.isAlive) return null;
        const allies = allActors.filter((a) => a.teamId === bot.teamId && a.actorId !== bot.actorId && a.isAlive);
        const enemies = allActors.filter((a) => a.teamId !== bot.teamId && a.isAlive);
        if (!enemies.length) return null;

        if (bot.roleId === ROLE_IDS.HEALER) {
            const lowAlly = allies
                .sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0];
            return lowAlly ?? nearest(bot, enemies).target;
        }

        // Attackers and builders pressure nearest enemy.
        return nearest(bot, enemies).target;
    }

    return {
        getMovementTarget,
        chooseIntent(bot, allActors) {
            if (!bot.isAlive) return null;
            const allies = allActors.filter((a) => a.teamId === bot.teamId && a.actorId !== bot.actorId && a.isAlive);
            const enemies = allActors.filter((a) => a.teamId !== bot.teamId && a.isAlive);
            if (!enemies.length) return null;

            if (bot.roleId === ROLE_IDS.HEALER) {
                const lowAlly = allies
                    .filter((a) => a.hp / a.maxHp < 0.7)
                    .sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0];
                if (lowAlly) {
                    const toAlly = dist(bot, lowAlly);
                    return {
                        actionId: toAlly <= ARENA_CONFIG.healRange ? ACTION_IDS.HEAL : null,
                        moveTargetId: lowAlly.actorId,
                        targetId: lowAlly.actorId,
                    };
                }
            }

            if (bot.roleId === ROLE_IDS.BUILDER && Math.random() < 0.25) {
                const { target } = nearest(bot, enemies);
                return {
                    actionId: ACTION_IDS.DEPLOY_TURRET,
                    targetId: target.actorId,
                    moveTargetId: target.actorId,
                };
            }

            const { target, distance } = nearest(bot, enemies);
            const actionId = bot.roleId === ROLE_IDS.ATTACKER && distance < ARENA_CONFIG.attackRange * 0.4
                ? ACTION_IDS.POWER_STRIKE
                : ACTION_IDS.ATTACK;

            return {
                actionId: distance <= ARENA_CONFIG.attackRange ? actionId : null,
                targetId: target.actorId,
                moveTargetId: target.actorId,
            };
        },

        moveBotTowards(k, bot, targetObj, dtScale = 1, walls = []) {
            if (!targetObj) return;
            const direction = targetObj.pos.sub(bot.pos).unit();
            if (!Number.isFinite(direction.x) || !Number.isFinite(direction.y)) return;
            const radius = 14;
            const stepX = direction.x * bot.speed * dtScale;
            const stepY = direction.y * bot.speed * dtScale;

            let nextX = bot.pos.x + stepX;
            let nextY = bot.pos.y + stepY;

            nextX = Math.max(24, Math.min(k.width() - 24, nextX));
            nextY = Math.max(24, Math.min(k.height() - 24, nextY));

            // Try full move first.
            if (!collidesWithWall(nextX, nextY, walls, radius)) {
                bot.pos.x = nextX;
                bot.pos.y = nextY;
            } else {
                // Slide along one axis if diagonal is blocked.
                const tryX = Math.max(24, Math.min(k.width() - 24, bot.pos.x + stepX));
                const tryY = Math.max(24, Math.min(k.height() - 24, bot.pos.y + stepY));
                const canX = !collidesWithWall(tryX, bot.pos.y, walls, radius);
                const canY = !collidesWithWall(bot.pos.x, tryY, walls, radius);

                if (canX) bot.pos.x = tryX;
                if (canY) bot.pos.y = tryY;
            }

            if (Math.abs(direction.x) > 0.1) {
                bot.flipX = direction.x < 0;
            }
            bot.setAnimation("walk");
        },

        simulateQuestionOutcome(questionDifficulty) {
            const accuracy = BOT_ACCURACY_BY_DIFFICULTY[questionDifficulty] ?? 0.6;
            const correct = Math.random() < accuracy;
            const responseTimeMs = 900 + Math.random() * 1900;
            return { correct, responseTimeMs };
        },
    };
}
