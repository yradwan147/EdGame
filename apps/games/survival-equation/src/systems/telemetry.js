function createSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createTelemetry(storageKey = "survival_equation_sessions", options = {}) {
    let currentSession = null;
    let pendingEvents = [];
    let flushTimer = null;
    const apiBase = options.apiBase || "/api";

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

    async function flushEvents() {
        if (!currentSession || pendingEvents.length === 0) return;
        const batch = pendingEvents.splice(0);
        try {
            await fetch(`${apiBase}/sessions/${currentSession.dbSessionId}/events`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ events: batch }),
            });
        } catch {
            pendingEvents.unshift(...batch);
        }
    }

    function startFlushInterval() {
        if (flushTimer) return;
        flushTimer = setInterval(flushEvents, 10_000);
    }

    function stopFlushInterval() {
        if (flushTimer) {
            clearInterval(flushTimer);
            flushTimer = null;
        }
    }

    return {
        async beginSession(meta) {
            currentSession = {
                id: createSessionId(),
                dbSessionId: null,
                startedAt: Date.now(),
                endedAt: null,
                meta,
                events: [],
                summary: null,
            };

            try {
                const res = await fetch(`${apiBase}/sessions`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        environmentId: meta.environmentId || "survival-equation",
                        assignmentId: meta.assignmentId || undefined,
                    }),
                });
                if (res.ok) {
                    const data = await res.json();
                    currentSession.dbSessionId = data.sessionId;
                }
            } catch {
                // Offline — continue with local-only session
            }

            startFlushInterval();
            return currentSession.id;
        },

        event(type, payload = {}) {
            if (!currentSession) return;
            const evt = {
                id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
                type,
                ts: Date.now(),
                payload,
            };
            currentSession.events.push(evt);

            if (currentSession.dbSessionId) {
                pendingEvents.push({ type, ts: evt.ts, payload });
            }
        },

        async endSession(summary) {
            if (!currentSession) return null;
            stopFlushInterval();
            currentSession.endedAt = Date.now();
            currentSession.summary = summary;

            await flushEvents();

            if (currentSession.dbSessionId) {
                try {
                    await fetch(`${apiBase}/sessions/${currentSession.dbSessionId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            completed: true,
                            score: summary?.score,
                            durationSeconds: Math.round(
                                (currentSession.endedAt - currentSession.startedAt) / 1000
                            ),
                        }),
                    });
                } catch {
                    // Offline — session end stored locally
                }
            }

            const sessions = readSessions();
            sessions.unshift(currentSession);
            writeSessions(sessions.slice(0, 80));

            const finished = currentSession;
            currentSession = null;
            pendingEvents = [];
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
