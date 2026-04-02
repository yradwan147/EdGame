/**
 * Core science simulation engine.
 * Evaluates experiment results, equipment selection, hypothesis quality,
 * exploration breadth, accuracy, and systematic experimentation.
 */

export function createExperimentEngine() {
    /**
     * Run the experiment formula with the current variable settings.
     * Returns { numericResult, visualDescription, resultColor }.
     */
    function calculateResult(experimentConfig, variableSettings) {
        const result = experimentConfig.computeResult(variableSettings);
        const description = experimentConfig.describeResult(result);
        const color = experimentConfig.resultColor(result);
        return {
            numericResult: result,
            visualDescription: description,
            resultColor: color,
            label: experimentConfig.resultLabel,
            unit: experimentConfig.resultUnit,
        };
    }

    /**
     * Check equipment selection against required list.
     * Returns { correct[], incorrect[], missing[], score (0-20) }.
     */
    function checkEquipment(selected, required) {
        const requiredSet = new Set(required);
        const selectedSet = new Set(selected);

        const correct = selected.filter((e) => requiredSet.has(e));
        const incorrect = selected.filter((e) => !requiredSet.has(e));
        const missing = required.filter((e) => !selectedSet.has(e));

        // Score: 20 pts max. Lose points for missing required, penalty for wrong picks
        const correctRatio = correct.length / Math.max(1, required.length);
        const wrongPenalty = Math.min(incorrect.length * 3, 10);
        const score = Math.max(0, Math.round(correctRatio * 20 - wrongPenalty));

        return { correct, incorrect, missing, score };
    }

    /**
     * Evaluate hypothesis selection quality.
     * Returns score 0-20.
     */
    function evaluateHypothesis(selectedId, correctId) {
        return selectedId === correctId ? 20 : 5;
    }

    /**
     * Evaluate exploration breadth based on run history.
     * More diverse variable combinations = higher score (0-20).
     */
    function evaluateExploration(runHistory, variables) {
        if (!runHistory || runHistory.length === 0) return 0;
        if (runHistory.length === 1) return 5;

        // Measure how much of the variable space was explored
        let diversityScore = 0;
        for (const variable of variables) {
            const values = new Set(runHistory.map((r) => r.vars[variable.name]));
            const range = variable.max - variable.min;
            const step = variable.step || 1;
            const totalPossible = Math.floor(range / step) + 1;
            const coverageRatio = values.size / totalPossible;
            diversityScore += coverageRatio;
        }
        diversityScore /= Math.max(1, variables.length);

        // Bonus for number of runs (diminishing returns)
        const runBonus = Math.min(runHistory.length / 6, 1);

        const raw = (diversityScore * 0.6 + runBonus * 0.4) * 20;
        return Math.round(Math.min(20, raw));
    }

    /**
     * Evaluate accuracy: how close is the player's best result to the target?
     * Returns score 0-20.
     */
    function evaluateAccuracy(runHistory, targetMin, targetMax) {
        if (!runHistory || runHistory.length === 0) return 0;

        const targetCenter = (targetMin + targetMax) / 2;
        const targetRange = targetMax - targetMin;

        let bestError = Infinity;
        for (const run of runHistory) {
            const result = run.result;
            if (result >= targetMin && result <= targetMax) {
                // Within target: error is 0 to tiny
                const centerError = Math.abs(result - targetCenter) / Math.max(0.01, targetRange);
                bestError = Math.min(bestError, centerError);
            } else {
                const distOutside = result < targetMin
                    ? targetMin - result
                    : result - targetMax;
                bestError = Math.min(bestError, 1 + distOutside / Math.max(0.01, targetRange));
            }
        }

        // Convert error to score: 0 error = 20 pts, error > 2 = 0 pts
        const score = Math.max(0, Math.round(20 * (1 - bestError / 2)));
        return Math.min(20, score);
    }

    /**
     * Check if the player experimented systematically:
     * changed only one variable between consecutive runs.
     */
    function wasSystematic(runHistory) {
        if (!runHistory || runHistory.length < 2) return false;

        let systematicCount = 0;
        for (let i = 1; i < runHistory.length; i++) {
            const prev = runHistory[i - 1].vars;
            const curr = runHistory[i].vars;
            const changedVars = Object.keys(curr).filter(
                (key) => curr[key] !== prev[key]
            );
            if (changedVars.length === 1) {
                systematicCount += 1;
            }
        }

        const ratio = systematicCount / (runHistory.length - 1);
        return ratio >= 0.5;
    }

    /**
     * Count how many times a player self-corrected
     * (moved result closer to target after an off-target run).
     */
    function countSelfCorrections(runHistory, targetMin, targetMax) {
        if (!runHistory || runHistory.length < 2) return 0;

        const targetCenter = (targetMin + targetMax) / 2;
        let corrections = 0;

        for (let i = 1; i < runHistory.length; i++) {
            const prevDist = Math.abs(runHistory[i - 1].result - targetCenter);
            const currDist = Math.abs(runHistory[i].result - targetCenter);
            if (currDist < prevDist && prevDist > 0) {
                corrections += 1;
            }
        }

        return corrections;
    }

    /**
     * Evaluate conclusion selection.
     * Returns 0-20.
     */
    function evaluateConclusion(selectedId, conclusionOptions) {
        const selected = conclusionOptions.find((c) => c.id === selectedId);
        if (!selected) return 0;
        return selected.correct ? 20 : 5;
    }

    return {
        calculateResult,
        checkEquipment,
        evaluateHypothesis,
        evaluateExploration,
        evaluateAccuracy,
        wasSystematic,
        countSelfCorrections,
        evaluateConclusion,
    };
}
