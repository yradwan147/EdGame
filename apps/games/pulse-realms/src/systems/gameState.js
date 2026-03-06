import { TEAM_IDS } from "../config/constants.js";

function createEmptyMatchState() {
    return {
        sessionId: "",
        status: "idle",
        startedAt: 0,
        endedAt: 0,
        elapsedMs: 0,
        selectedRoleId: "",
        selectedSubject: "general",
        actors: {},
        teams: {
            [TEAM_IDS.ALLY]: [],
            [TEAM_IDS.ENEMY]: [],
        },
        actionQueue: [],
        objective: {
            allyPoints: 0,
            enemyPoints: 0,
            captureOwner: null,
        },
        pulseHistory: [],
        events: [],
        winnerTeamId: null,
        finalSummary: null,
    };
}

export function createGameStateStore() {
    let state = createEmptyMatchState();

    function set(partial) {
        state = { ...state, ...partial };
    }

    return {
        reset() {
            state = createEmptyMatchState();
            return state;
        },
        startMatch({ sessionId, selectedRoleId, selectedSubject }) {
            state = createEmptyMatchState();
            state.sessionId = sessionId;
            state.status = "running";
            state.startedAt = Date.now();
            state.selectedRoleId = selectedRoleId;
            state.selectedSubject = selectedSubject;
            return state;
        },
        getState() {
            return state;
        },
        updateElapsed() {
            if (state.status !== "running") return;
            state.elapsedMs = Date.now() - state.startedAt;
        },
        registerActor(actorState) {
            state.actors[actorState.id] = actorState;
            if (state.teams[actorState.teamId]) {
                state.teams[actorState.teamId].push(actorState.id);
            }
        },
        queueAction(actionIntent) {
            state.actionQueue.push({
                id: `intent_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                ...actionIntent,
                queuedAt: Date.now(),
            });
        },
        shiftAction() {
            return state.actionQueue.shift() ?? null;
        },
        getActor(actorId) {
            return state.actors[actorId];
        },
        updateActor(actorId, updater) {
            const actor = state.actors[actorId];
            if (!actor) return null;
            const next = updater({ ...actor });
            state.actors[actorId] = next;
            return next;
        },
        pushPulseRecord(record) {
            state.pulseHistory.push(record);
            if (state.pulseHistory.length > 25) {
                state.pulseHistory.shift();
            }
        },
        pushEvent(event) {
            state.events.push(event);
            if (state.events.length > 80) {
                state.events.shift();
            }
        },
        setObjective(partial) {
            state.objective = { ...state.objective, ...partial };
        },
        endMatch(summary) {
            state.status = "ended";
            state.endedAt = Date.now();
            state.winnerTeamId = summary.winnerTeamId;
            state.finalSummary = summary;
            return state;
        },
        set,
    };
}
