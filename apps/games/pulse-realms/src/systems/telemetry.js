function createSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createTelemetry(storageKey = "pulse_realms_sessions", options = {}) {
    let currentSession = null;
    let pendingEvents = [];
    let flushTimer = null;
    const apiBase = options.apiBase || "/api";
    const subscribers = new Set();

    function notifySubscribers(type, data) {
        for (const cb of subscribers) {
            try { cb(type, data); } catch (err) { console.warn("telemetry subscriber error", err); }
        }
    }

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
            // Re-queue on failure — events stay in localStorage as backup
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

            // Create session in backend
            try {
                const res = await fetch(`${apiBase}/sessions`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        environmentId: meta.environmentId || "pulse-realms",
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
            notifySubscribers("session_start", { session: currentSession });
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

            // Queue for backend flush
            if (currentSession.dbSessionId) {
                pendingEvents.push({ type, ts: evt.ts, payload });
            }

            // Notify in-process subscribers (e.g. debug bridge)
            notifySubscribers("event", { event: evt, sessionId: currentSession.id });
        },

        subscribe(callback) {
            subscribers.add(callback);
            return () => subscribers.delete(callback);
        },

        unsubscribe(callback) {
            subscribers.delete(callback);
        },

        async endSession(summary) {
            if (!currentSession) return null;
            stopFlushInterval();
            currentSession.endedAt = Date.now();
            currentSession.summary = summary;

            // Final flush of remaining events
            await flushEvents();

            // Update session in backend
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

            // Save to localStorage as backup
            const sessions = readSessions();
            sessions.unshift(currentSession);
            writeSessions(sessions.slice(0, 80));

            const finished = currentSession;
            notifySubscribers("session_end", { session: finished });
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
