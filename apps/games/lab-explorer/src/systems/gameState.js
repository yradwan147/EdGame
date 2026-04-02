import { PHASES } from "../config/constants.js";

function createEmptyLabState() {
    return {
        sessionId: "",
        status: "idle",
        startedAt: 0,
        endedAt: 0,
        currentExperimentId: null,
        phase: PHASES.HYPOTHESIS,
        equipmentSelected: [],
        variableSettings: {},
        runResults: [],
        runCount: 0,
        score: {
            hypothesis: 0,
            equipment: 0,
            exploration: 0,
            accuracy: 0,
            conclusion: 0,
        },
        discoveries: [],
        failures: [],
        safetyChecks: {
            gogglesWorn: false,
            wrongToolAttempts: 0,
            extremeValueAttempts: 0,
        },
        hypothesisSelected: null,
        observationsSelected: [],
        conclusionSelected: null,
        questionsAnswered: 0,
        questionsCorrect: 0,
        stepSequence: [],
    };
}

export function createGameStateStore() {
    let state = createEmptyLabState();

    return {
        reset() {
            state = createEmptyLabState();
            return state;
        },

        startExperiment({ sessionId, experimentId }) {
            state = createEmptyLabState();
            state.sessionId = sessionId;
            state.status = "running";
            state.startedAt = Date.now();
            state.currentExperimentId = experimentId;
            return state;
        },

        getState() {
            return state;
        },

        setPhase(phase) {
            state.phase = phase;
            state.stepSequence.push({ phase, ts: Date.now() });
        },

        selectHypothesis(hypothesisId) {
            state.hypothesisSelected = hypothesisId;
        },

        setEquipment(equipmentIds) {
            state.equipmentSelected = [...equipmentIds];
        },

        addEquipment(equipmentId) {
            if (!state.equipmentSelected.includes(equipmentId)) {
                state.equipmentSelected.push(equipmentId);
            }
        },

        removeEquipment(equipmentId) {
            state.equipmentSelected = state.equipmentSelected.filter((e) => e !== equipmentId);
        },

        setVariable(name, value) {
            state.variableSettings[name] = value;
        },

        recordRun(result) {
            state.runCount += 1;
            state.runResults.push({
                runNumber: state.runCount,
                vars: { ...state.variableSettings },
                result,
                ts: Date.now(),
            });
        },

        addDiscovery(discoveryId) {
            if (!state.discoveries.includes(discoveryId)) {
                state.discoveries.push(discoveryId);
            }
        },

        addFailure(failureId) {
            if (!state.failures.includes(failureId)) {
                state.failures.push(failureId);
            }
        },

        setScore(category, value) {
            state.score[category] = value;
        },

        addScore(category, value) {
            state.score[category] = (state.score[category] || 0) + value;
        },

        recordSafetyCheck(key, value) {
            state.safetyChecks[key] = value;
        },

        incrementSafetyCounter(key) {
            state.safetyChecks[key] = (state.safetyChecks[key] || 0) + 1;
        },

        selectObservation(observationId) {
            if (!state.observationsSelected.includes(observationId)) {
                state.observationsSelected.push(observationId);
            }
        },

        selectConclusion(conclusionId) {
            state.conclusionSelected = conclusionId;
        },

        recordQuestion(correct) {
            state.questionsAnswered += 1;
            if (correct) state.questionsCorrect += 1;
        },

        endExperiment() {
            state.status = "ended";
            state.endedAt = Date.now();
            return state;
        },

        getTotalScore() {
            const s = state.score;
            return s.hypothesis + s.equipment + s.exploration + s.accuracy + s.conclusion;
        },

        getStars() {
            const total = this.getTotalScore();
            if (total >= 90) return 5;
            if (total >= 75) return 4;
            if (total >= 55) return 3;
            if (total >= 35) return 2;
            if (total >= 15) return 1;
            return 0;
        },
    };
}
