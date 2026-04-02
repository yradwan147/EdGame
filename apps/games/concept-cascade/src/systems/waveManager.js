/**
 * waveManager.js — Manages enemy spawning during combat phase.
 *
 * Processes a waveConfig (from WAVES) and calls onEnemySpawn() for
 * each enemy at the correct time. The scene owns KAPLAY objects;
 * this module only drives timing and bookkeeping.
 */

export function createWaveManager({ k, gameStateStore, telemetry, onEnemySpawn }) {
    let active = false;
    let totalEnemies = 0;
    let spawnedCount = 0;
    let killedCount = 0;
    let leakedCount = 0;

    // Each group gets its own spawn state
    // { type, count, interval, delay, spawned, elapsed, delayElapsed, started }
    let groups = [];

    // KAPLAY update event handle — cancelled on destroy
    let updateHandle = null;

    /* ------------------------------------------------------------------ */
    /*  Public API                                                         */
    /* ------------------------------------------------------------------ */

    function startWave(waveConfig) {
        // Reset counters
        active = true;
        spawnedCount = 0;
        killedCount = 0;
        leakedCount = 0;

        // Calculate total enemies across all groups
        totalEnemies = waveConfig.enemies.reduce((sum, g) => sum + g.count, 0);

        // Build per-group tracking state
        groups = waveConfig.enemies.map((entry) => ({
            type: entry.type,
            count: entry.count,
            interval: entry.interval,
            delay: entry.delay ?? 0,
            spawned: 0,
            elapsed: 0,         // time since last spawn (or since delay ended)
            delayElapsed: 0,    // accumulated time waiting for initial delay
            started: false,     // true once delay has passed
        }));

        // Resolve spawn point — pick first available from the map
        const state = gameStateStore.getState();
        const spawnPoint = { col: 0, row: 2 }; // default fallback; scene should override via map data

        // Emit telemetry
        telemetry.event("wave_started", {
            waveNumber: waveConfig.number ?? state.wave,
            totalEnemies,
        });

        // Start the per-frame update loop
        if (updateHandle) updateHandle.cancel();
        updateHandle = k.onUpdate(() => tick(k.dt()));
    }

    /* ------------------------------------------------------------------ */
    /*  Per-frame tick — advances timers and spawns enemies                */
    /* ------------------------------------------------------------------ */

    function tick(dt) {
        if (!active) return;

        for (const g of groups) {
            if (g.spawned >= g.count) continue; // group done

            // Handle initial delay
            if (!g.started) {
                g.delayElapsed += dt;
                if (g.delayElapsed < g.delay) continue;
                g.started = true;
                g.elapsed = g.interval; // spawn first enemy immediately once delay ends
            }

            // Accumulate time and spawn when interval elapses
            g.elapsed += dt;
            while (g.elapsed >= g.interval && g.spawned < g.count) {
                g.elapsed -= g.interval;
                g.spawned += 1;
                spawnedCount += 1;
                onEnemySpawn(g.type);
            }
        }

        // Stop ticking once everything has been spawned
        if (spawnedCount >= totalEnemies) {
            if (updateHandle) {
                updateHandle.cancel();
                updateHandle = null;
            }
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Scene callbacks                                                    */
    /* ------------------------------------------------------------------ */

    function onEnemyKilled() {
        killedCount += 1;
    }

    function onEnemyLeaked() {
        leakedCount += 1;
    }

    /* ------------------------------------------------------------------ */
    /*  Queries                                                            */
    /* ------------------------------------------------------------------ */

    function isWaveComplete() {
        return spawnedCount >= totalEnemies && (killedCount + leakedCount) >= totalEnemies;
    }

    function getWaveProgress() {
        return {
            total: totalEnemies,
            spawned: spawnedCount,
            killed: killedCount,
            leaked: leakedCount,
            remaining: totalEnemies - killedCount - leakedCount,
        };
    }

    /* ------------------------------------------------------------------ */
    /*  Cleanup                                                            */
    /* ------------------------------------------------------------------ */

    function destroy() {
        active = false;
        if (updateHandle) {
            updateHandle.cancel();
            updateHandle = null;
        }
        groups = [];
    }

    /* ------------------------------------------------------------------ */

    return {
        startWave,
        onEnemyKilled,
        onEnemyLeaked,
        isWaveComplete,
        getWaveProgress,
        destroy,
    };
}
