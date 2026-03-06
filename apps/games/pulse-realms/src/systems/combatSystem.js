import { ACTION_IDS } from "../config/constants.js";
import { getRole } from "../config/roles.js";

function speedMultiplier(responseTimeMs) {
    return Math.max(1, Math.min(2, 2.2 - responseTimeMs / 5000));
}

export function createCombatSystem({
    questionEngine,
    overlay,
    telemetry,
    progression,
    gameStateStore,
    onEffect = null,
}) {
    const seenQuestionIds = questionEngine.createSeenSet();

    function applyActionEffect({ actionId, actorObj, targetObj, power }) {
        if (!targetObj || !targetObj.isAlive) return { success: false, value: 0, effectType: "none" };
        if (actionId === ACTION_IDS.ATTACK || actionId === ACTION_IDS.POWER_STRIKE || actionId === ACTION_IDS.DEPLOY_TURRET) {
            targetObj.receiveEffect({ type: "damage", amount: power, shieldReduction: 0.35 });
            return { success: true, value: power, effectType: "damage" };
        }
        if (actionId === ACTION_IDS.HEAL) {
            targetObj.receiveEffect({ type: "heal", amount: power });
            return { success: true, value: power, effectType: "heal" };
        }
        if (actionId === ACTION_IDS.SHIELD) {
            targetObj.receiveEffect({ type: "shield", durationMs: 3200 });
            return { success: true, value: 0.35, effectType: "shield" };
        }
        if (actionId === ACTION_IDS.BUILD_BARRIER) {
            actorObj.receiveEffect({ type: "shield", durationMs: 1800 });
            return { success: true, value: 0.2, effectType: "barrier" };
        }
        return { success: false, value: 0, effectType: "none" };
    }

    async function resolveWithQuestion({
        actorObj,
        targetObj,
        actionId,
        subjectId,
        botOutcome = null,
    }) {
        const role = getRole(actorObj.roleId);
        const actionMeta = role.actions.find((a) => a.id === actionId);
        if (!actionMeta) return null;

        const question = await questionEngine.getQuestion({
            playerId: actorObj.actorId,
            subjectId,
            requestedDifficulty: 3 + actionMeta.difficultyBias,
            seenQuestionIds,
        });
        seenQuestionIds.add(question.id);

        const answerResult = botOutcome ?? await overlay.show(question);
        const correct = Boolean(answerResult.correct);
        const responseTimeMs = answerResult.responseTimeMs ?? 5000;
        const multiplier = correct ? speedMultiplier(responseTimeMs) : 0;
        const power = Math.round(actionMeta.basePower * multiplier);

        questionEngine.recordResult({ playerId: actorObj.actorId, correct });
        const progressionResult = progression.grantQuestionXp({
            difficulty: question.difficulty,
            responseTimeMs,
            correct,
        });

        telemetry.event("question_answered", {
            questionId: question.id,
            subject: question.subject,
            difficulty: question.difficulty,
            correct,
            responseTimeMs,
            actionType: actionId,
            powerMultiplier: multiplier,
        });

        const effect = correct
            ? applyActionEffect({ actionId, actorObj, targetObj, power })
            : { success: false, value: 0, effectType: "miss" };

        if (onEffect) {
            onEffect({
                effectType: effect.effectType,
                actionId,
                actorObj,
                targetObj,
                value: effect.value,
                power,
                correct,
            });
        }

        telemetry.event("action_performed", {
            actionType: actionId,
            role: actorObj.roleId,
            targetId: targetObj?.actorId ?? null,
            success: effect.success,
            value: effect.value,
            effectType: effect.effectType,
        });

        if (effect.effectType === "damage" && targetObj) {
            telemetry.event("damage_taken", {
                amount: effect.value,
                sourceId: actorObj.actorId,
                sourceRole: actorObj.roleId,
                targetId: targetObj.actorId,
            });
        }

        if (actorObj.applyQuestionResult) {
            actorObj.applyQuestionResult(correct);
        }

        gameStateStore.pushPulseRecord({
            ts: Date.now(),
            actorId: actorObj.actorId,
            correct,
            responseTimeMs,
        });
        gameStateStore.pushEvent({
            ts: Date.now(),
            msg: `${actorObj.displayName} ${correct ? "succeeded" : "failed"} with ${actionId}`,
        });

        return {
            question,
            answerResult,
            correct,
            multiplier,
            power,
            effect,
            progressionResult,
        };
    }

    return {
        resolveWithQuestion,
    };
}
