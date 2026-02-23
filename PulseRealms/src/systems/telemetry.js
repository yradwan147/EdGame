function createSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createTelemetry(storageKey = "pulse_realms_sessions") {
    let currentSession = null;

    function readSessions() {
        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    function writeSessions(sessions) {
        localStorage.setItem(storageKey, JSON.stringify(sessions));
    }

    return {
        beginSession(meta) {
            currentSession = {
                id: createSessionId(),
                startedAt: Date.now(),
                endedAt: null,
                meta,
                events: [],
                summary: null,
            };
            return currentSession.id;
        },
        event(type, payload = {}) {
            if (!currentSession) return;
            currentSession.events.push({
                id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
                type,
                ts: Date.now(),
                payload,
            });
        },
        endSession(summary) {
            if (!currentSession) return null;
            currentSession.endedAt = Date.now();
            currentSession.summary = summary;
            const sessions = readSessions();
            sessions.unshift(currentSession);
            writeSessions(sessions.slice(0, 80));
            const finished = currentSession;
            currentSession = null;
            return finished;
        },
        getCurrentSession() {
            return currentSession;
        },
        getAllSessions() {
            return readSessions();
        },
        exportSessions() {
            return JSON.stringify(readSessions(), null, 2);
        },
        clear() {
            localStorage.removeItem(storageKey);
        },
    };
}
