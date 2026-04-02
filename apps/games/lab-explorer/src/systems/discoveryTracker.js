/**
 * Tracks hidden discoveries and spectacular failures during experiments.
 * Discoveries are triggered by specific variable/result conditions.
 * Failures are triggered by extreme or dangerous combinations.
 */

export function createDiscoveryTracker() {
    const foundDiscoveries = new Map();   // discoveryId -> { ...discovery, foundAt }
    const triggeredFailures = new Map();  // failureId -> { ...failure, triggeredAt }

    /**
     * Check all discoveries for the current experiment against the variable settings and result.
     * Returns array of *newly* triggered discoveries.
     */
    function checkForDiscoveries(experimentConfig, variableSettings, result, runHistory) {
        const newDiscoveries = [];

        for (const disc of experimentConfig.discoveries || []) {
            if (foundDiscoveries.has(disc.id)) continue;

            let triggered = false;
            try {
                triggered = disc.trigger(variableSettings, result, runHistory);
            } catch {
                // Trigger function error — skip
            }

            if (triggered) {
                const record = {
                    id: disc.id,
                    name: disc.name,
                    description: disc.description,
                    experimentId: experimentConfig.id,
                    foundAt: Date.now(),
                };
                foundDiscoveries.set(disc.id, record);
                newDiscoveries.push(record);
            }
        }

        return newDiscoveries;
    }

    /**
     * Check all failure states for the current experiment.
     * Returns array of *newly* triggered failures.
     */
    function checkForFailures(experimentConfig, variableSettings, result) {
        const newFailures = [];

        for (const fail of experimentConfig.failureStates || []) {
            if (triggeredFailures.has(fail.id)) continue;

            let triggered = false;
            try {
                triggered = fail.trigger(variableSettings, result);
            } catch {
                // Trigger function error — skip
            }

            if (triggered) {
                const record = {
                    id: fail.id,
                    animation: fail.animation,
                    description: fail.description,
                    experimentId: experimentConfig.id,
                    triggeredAt: Date.now(),
                };
                triggeredFailures.set(fail.id, record);
                newFailures.push(record);
            }
        }

        return newFailures;
    }

    /**
     * Get all discovered items.
     */
    function getDiscoveries() {
        return [...foundDiscoveries.values()];
    }

    /**
     * Get all triggered failures (the "Disaster Gallery").
     */
    function getDisasterGallery() {
        return [...triggeredFailures.values()];
    }

    /**
     * Total unique discoveries found.
     */
    function getDiscoveryCount() {
        return foundDiscoveries.size;
    }

    /**
     * Total unique disasters triggered.
     */
    function getDisasterCount() {
        return triggeredFailures.size;
    }

    /**
     * Load previously found discoveries/failures from profile.
     */
    function loadFromProfile(discoveriesFound, failuresTriggered) {
        for (const id of discoveriesFound || []) {
            if (!foundDiscoveries.has(id)) {
                foundDiscoveries.set(id, {
                    id,
                    name: id,
                    description: "(Previously discovered)",
                    foundAt: 0,
                });
            }
        }
        for (const id of failuresTriggered || []) {
            if (!triggeredFailures.has(id)) {
                triggeredFailures.set(id, {
                    id,
                    description: "(Previously triggered)",
                    triggeredAt: 0,
                });
            }
        }
    }

    /**
     * Reset for new session (keeps profile-loaded ones).
     */
    function resetSession() {
        // Keep profile-loaded, clear session-specific additions
    }

    return {
        checkForDiscoveries,
        checkForFailures,
        getDiscoveries,
        getDisasterGallery,
        getDiscoveryCount,
        getDisasterCount,
        loadFromProfile,
        resetSession,
    };
}
