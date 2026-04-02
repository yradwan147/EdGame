/**
 * Puzzle Engine: loads puzzles, validates solutions, calculates scores.
 * Supports multiple puzzle step types: drag_order, calculation, multiple_choice, node_wiring, slider, beam_placement.
 */

export function createPuzzleEngine() {
    let currentPuzzle = null;
    let currentStepIndex = 0;
    let stepResults = [];

    return {
        loadPuzzle(puzzleData) {
            currentPuzzle = puzzleData;
            currentStepIndex = 0;
            stepResults = [];
            return {
                puzzleId: puzzleData.id,
                name: puzzleData.name,
                totalSteps: puzzleData.steps.length,
                currentStep: puzzleData.steps[0],
            };
        },

        getCurrentStep() {
            if (!currentPuzzle) return null;
            if (currentStepIndex >= currentPuzzle.steps.length) return null;
            return {
                ...currentPuzzle.steps[currentStepIndex],
                stepNumber: currentStepIndex + 1,
                totalSteps: currentPuzzle.steps.length,
            };
        },

        /**
         * Check a solution for the current step.
         * Returns { correct, score, feedback, stepComplete }.
         */
        checkSolution(playerInput) {
            if (!currentPuzzle) return { correct: false, score: 0, feedback: "No puzzle loaded." };
            const step = currentPuzzle.steps[currentStepIndex];
            if (!step) return { correct: false, score: 0, feedback: "No more steps." };

            let result;
            switch (step.type) {
                case "drag_order":
                    result = this._checkDragOrder(step, playerInput);
                    break;
                case "calculation":
                    result = this._checkCalculation(step, playerInput);
                    break;
                case "multiple_choice":
                    result = this._checkMultipleChoice(step, playerInput);
                    break;
                case "node_wiring":
                    result = this._checkNodeWiring(step, playerInput);
                    break;
                case "slider":
                    result = this._checkSlider(step, playerInput);
                    break;
                case "beam_placement":
                    result = this._checkBeamPlacement(step, playerInput);
                    break;
                default:
                    result = { correct: false, score: 0, feedback: "Unknown step type." };
            }

            stepResults.push({
                stepId: step.id,
                ...result,
                ts: Date.now(),
            });

            return {
                ...result,
                stepComplete: true,
            };
        },

        /**
         * Advance to the next step. Returns true if more steps remain.
         */
        advanceStep() {
            currentStepIndex += 1;
            return currentStepIndex < (currentPuzzle?.steps.length || 0);
        },

        /**
         * Check if the puzzle is fully complete.
         */
        isPuzzleComplete() {
            if (!currentPuzzle) return false;
            return currentStepIndex >= currentPuzzle.steps.length;
        },

        /**
         * Get the overall puzzle score (average of all step scores).
         */
        getPuzzleScore() {
            if (stepResults.length === 0) return 0;
            const total = stepResults.reduce((sum, r) => sum + r.score, 0);
            return total / stepResults.length;
        },

        /**
         * Get the results of a completed puzzle.
         */
        getPuzzleResults() {
            if (!currentPuzzle) return null;
            const score = this.getPuzzleScore();
            const passed = score >= 0.5;
            return {
                puzzleId: currentPuzzle.id,
                name: currentPuzzle.name,
                score,
                passed,
                stepResults: [...stepResults],
                resourceReward: passed ? currentPuzzle.resourceReward : currentPuzzle.failurePenalty,
                completionMessage: passed ? currentPuzzle.completionMessage : currentPuzzle.failureMessage,
            };
        },

        /**
         * Get the exclusive role info for a specific role in the current puzzle.
         */
        getRequiredInfo(roleId) {
            if (!currentPuzzle || !currentPuzzle.roleInfo) return null;
            return currentPuzzle.roleInfo[roleId] || null;
        },

        /**
         * Get a puzzle hint from a partner's perspective.
         */
        getPuzzleHints(partnerRoleId) {
            const info = this.getRequiredInfo(partnerRoleId);
            if (!info) return [];
            return info.lines.slice(0, 2); // Reveal first 2 lines as hints
        },

        // --- Private checkers ---

        _checkDragOrder(step, playerOrder) {
            // playerOrder is an array of item ids in the order the player placed them
            if (!Array.isArray(playerOrder)) return { correct: false, score: 0, feedback: step.feedbackWrong };

            let correctCount = 0;
            for (let i = 0; i < step.items.length; i++) {
                const item = step.items.find((it) => it.correctPosition === i);
                if (item && playerOrder[i] === item.id) {
                    correctCount += 1;
                }
            }

            const score = correctCount * (step.partialCreditPerCorrect || (1 / step.items.length));
            const correct = correctCount === step.items.length;
            return {
                correct,
                score: Math.min(1, score),
                feedback: correct ? step.feedbackCorrect : step.feedbackWrong,
                correctCount,
                totalItems: step.items.length,
            };
        },

        _checkCalculation(step, playerAnswer) {
            const numAnswer = parseFloat(playerAnswer);
            if (isNaN(numAnswer)) return { correct: false, score: 0, feedback: "Please enter a number." };

            const diff = Math.abs(numAnswer - step.correctAnswer);
            const correct = diff <= step.tolerance;
            const score = correct ? 1 : Math.max(0, 1 - (diff / Math.max(Math.abs(step.correctAnswer), 1)));
            return {
                correct,
                score: correct ? 1 : Math.max(0, score * 0.3), // partial credit capped at 30%
                feedback: correct ? step.feedbackCorrect : step.feedbackWrong,
                playerAnswer: numAnswer,
                correctAnswer: step.correctAnswer,
            };
        },

        _checkMultipleChoice(step, selectedIndex) {
            const idx = parseInt(selectedIndex, 10);
            const correct = idx === step.correctIndex;
            return {
                correct,
                score: correct ? 1 : 0,
                feedback: correct ? step.feedbackCorrect : step.feedbackWrong,
                selectedIndex: idx,
                correctIndex: step.correctIndex,
            };
        },

        _checkNodeWiring(step, playerConnections) {
            // playerConnections is array of [nodeA, nodeB] pairs
            if (!Array.isArray(playerConnections)) return { correct: false, score: 0, feedback: step.feedbackWrong };

            const correct = step.correctConnections;
            let matchCount = 0;
            for (const [a, b] of correct) {
                const found = playerConnections.some(
                    ([pa, pb]) => (pa === a && pb === b) || (pa === b && pb === a)
                );
                if (found) matchCount += 1;
            }

            const score = matchCount / correct.length;
            const allCorrect = matchCount === correct.length;
            return {
                correct: allCorrect,
                score,
                feedback: allCorrect ? step.feedbackCorrect : step.feedbackWrong,
                connectionsCorrect: matchCount,
                connectionsTotal: correct.length,
            };
        },

        _checkSlider(step, playerValue) {
            const val = parseFloat(playerValue);
            if (isNaN(val)) return { correct: false, score: 0, feedback: "Invalid value." };

            const diff = Math.abs(val - step.correctValue);
            const correct = diff <= step.tolerance;
            const maxRange = (step.max - step.min) / 2;
            const score = correct ? 1 : Math.max(0, 1 - (diff / maxRange));
            return {
                correct,
                score: correct ? 1 : Math.max(0, score * 0.4),
                feedback: correct ? step.feedbackCorrect : step.feedbackWrong,
                playerValue: val,
                correctValue: step.correctValue,
            };
        },

        _checkBeamPlacement(step, playerPlacements) {
            // playerPlacements: { vertical: number, diagonal: number }
            if (!playerPlacements) return { correct: false, score: 0, feedback: step.feedbackWrong };

            const vScore = Math.min(1, (playerPlacements.vertical || 0) / step.requiredVertical);
            const dScore = Math.min(1, (playerPlacements.diagonal || 0) / step.requiredDiagonal);
            const score = (vScore + dScore) / 2;
            const correct = score >= step.minScore;
            return {
                correct,
                score,
                feedback: correct ? step.feedbackCorrect : step.feedbackWrong,
                verticalPlaced: playerPlacements.vertical || 0,
                diagonalPlaced: playerPlacements.diagonal || 0,
            };
        },

        reset() {
            currentPuzzle = null;
            currentStepIndex = 0;
            stepResults = [];
        },
    };
}
