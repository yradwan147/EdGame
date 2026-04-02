import { PHASE_IDS } from "../config/constants.js";

function createEmptyState() {
    return {
        sessionId: "",
        status: "idle",
        startedAt: 0,
        endedAt: 0,

        // Scenario
        scenarioId: "",
        scenarioData: null,
        currentDay: 0,
        currentPhase: PHASE_IDS.BRIEFING,
        totalDays: 5,

        // Roles
        playerRole: "",
        aiPartners: [],

        // Resources (shared pool)
        resources: { food: 50, water: 50, materials: 50 },

        // Team health (0-100 per member)
        teamHealth: {
            engineer: 100,
            scientist: 100,
            medic: 100,
            navigator: 100,
        },

        // Puzzle state
        currentPuzzleId: "",
        currentPuzzleData: null,
        puzzleStepIndex: 0,
        puzzleStepResults: [],
        puzzleScore: 0,
        puzzlesCompleted: [],

        // Communication
        messageLog: [],
        messageStats: {
            totalSent: 0,
            onTask: 0,
            infoRequests: 0,
            infoShares: 0,
        },

        // Day events
        dayEvents: [],
        eventResults: [],

        // World state
        worldState: {
            shelterBuilt: false,
            waterFilterActive: false,
            signalReady: false,
            allianceFormed: false,
            customFlags: {},
        },

        // Assessment data
        dayTimerStartedAt: 0,
        dayTimerRemaining: 0,
        questionsAnswered: [],
        resourceAllocationHistory: [],
        collaborationEvents: [],

        // Final summary
        finalSummary: null,
    };
}

export function createGameStateStore() {
    let state = createEmptyState();

    return {
        reset() {
            state = createEmptyState();
            return state;
        },

        getState() {
            return state;
        },

        set(partial) {
            state = { ...state, ...partial };
        },

        startScenario({ sessionId, scenarioId, scenarioData, playerRole, aiPartners }) {
            state = createEmptyState();
            state.sessionId = sessionId;
            state.status = "running";
            state.startedAt = Date.now();
            state.scenarioId = scenarioId;
            state.scenarioData = scenarioData;
            state.totalDays = scenarioData.totalDays;
            state.playerRole = playerRole;
            state.aiPartners = aiPartners;
            state.resources = { ...scenarioData.startResources };
            state.currentDay = 1;
            state.currentPhase = PHASE_IDS.BRIEFING;
            return state;
        },

        advanceDay() {
            if (state.currentDay >= state.totalDays) {
                state.status = "completed";
                state.endedAt = Date.now();
                return state;
            }
            state.currentDay += 1;
            state.currentPhase = PHASE_IDS.BRIEFING;
            state.currentPuzzleId = "";
            state.currentPuzzleData = null;
            state.puzzleStepIndex = 0;
            state.puzzleStepResults = [];
            return state;
        },

        setPhase(phase) {
            state.currentPhase = phase;
        },

        loadPuzzle(puzzleId, puzzleData) {
            state.currentPuzzleId = puzzleId;
            state.currentPuzzleData = puzzleData;
            state.puzzleStepIndex = 0;
            state.puzzleStepResults = [];
            state.puzzleScore = 0;
            state.currentPhase = PHASE_IDS.PUZZLE;
        },

        recordPuzzleStepResult(stepId, score, correct) {
            state.puzzleStepResults.push({ stepId, score, correct, ts: Date.now() });
            state.puzzleScore = state.puzzleStepResults.reduce((sum, r) => sum + r.score, 0) / state.puzzleStepResults.length;
        },

        completePuzzle() {
            if (state.currentPuzzleId) {
                state.puzzlesCompleted.push({
                    puzzleId: state.currentPuzzleId,
                    score: state.puzzleScore,
                    stepResults: [...state.puzzleStepResults],
                    day: state.currentDay,
                });
            }
        },

        modifyResources(delta) {
            state.resources.food = Math.max(0, state.resources.food + (delta.food || 0));
            state.resources.water = Math.max(0, state.resources.water + (delta.water || 0));
            state.resources.materials = Math.max(0, state.resources.materials + (delta.materials || 0));
        },

        consumeDailyResources(consumption) {
            state.resources.food = Math.max(0, state.resources.food - (consumption.food || 0));
            state.resources.water = Math.max(0, state.resources.water - (consumption.water || 0));
            state.resources.materials = Math.max(0, state.resources.materials - (consumption.materials || 0));
        },

        damageTeamHealth(amount) {
            for (const role of Object.keys(state.teamHealth)) {
                state.teamHealth[role] = Math.max(0, state.teamHealth[role] - amount);
            }
        },

        healTeamHealth(amount) {
            for (const role of Object.keys(state.teamHealth)) {
                state.teamHealth[role] = Math.min(100, state.teamHealth[role] + amount);
            }
        },

        damageRoleHealth(roleId, amount) {
            if (state.teamHealth[roleId] !== undefined) {
                state.teamHealth[roleId] = Math.max(0, state.teamHealth[roleId] - amount);
            }
        },

        addMessage(message) {
            state.messageLog.push(message);
            if (state.messageLog.length > 200) {
                state.messageLog.shift();
            }
        },

        updateMessageStats(statDelta) {
            for (const [key, val] of Object.entries(statDelta)) {
                if (state.messageStats[key] !== undefined) {
                    state.messageStats[key] += val;
                }
            }
        },

        addDayEvent(event) {
            state.dayEvents.push(event);
        },

        addEventResult(result) {
            state.eventResults.push(result);
        },

        setWorldFlag(key, value) {
            state.worldState.customFlags[key] = value;
        },

        recordResourceAllocation(allocation) {
            state.resourceAllocationHistory.push({
                ...allocation,
                ts: Date.now(),
                day: state.currentDay,
            });
        },

        addCollaborationEvent(event) {
            state.collaborationEvents.push({
                ...event,
                ts: Date.now(),
            });
        },

        endScenario(summary) {
            state.status = "completed";
            state.endedAt = Date.now();
            state.finalSummary = summary;
            return state;
        },
    };
}
