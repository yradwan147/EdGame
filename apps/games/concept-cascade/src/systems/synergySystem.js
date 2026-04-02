/**
 * synergySystem.js — Detects and applies tower synergies.
 *
 * Each tick (or whenever towers change) the scene calls evaluate()
 * with the current tower list. This module checks SYNERGIES config
 * entries, finds matching pairs/triplets, and returns active effects
 * for the scene to apply to tower game objects.
 */

import { SYNERGIES } from "../config/synergies.js";

export function createSynergySystem({ gameStateStore, telemetry, progression }) {
    let activeSynergies = [];      // current frame's active synergies
    const discoveredIds = new Set(); // synergies seen at least once this session

    /* ------------------------------------------------------------------ */
    /*  Helpers                                                            */
    /* ------------------------------------------------------------------ */

    function distance(a, b) {
        return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    }

    /**
     * Build a position-enriched tower list.
     * Expects towers with { id, type, tileCol, tileRow } (from gameState)
     * and converts tile coords to pixel positions for distance checks.
     */
    function normalizeTowers(towers) {
        return towers.map((t) => ({
            id: t.id,
            type: t.type,
            pos: t.pos ?? { x: t.tileCol * 64 + 32, y: t.tileRow * 64 + 32 },
        }));
    }

    /* ------------------------------------------------------------------ */
    /*  Pair synergy detection                                             */
    /* ------------------------------------------------------------------ */

    /**
     * For synergies with requires: [typeA, typeB] (including same-type pairs
     * like ["numberBastion", "numberBastion"]).
     */
    function findPairSynergies(synergy, towers) {
        const [reqA, reqB] = synergy.requires;
        const results = [];

        const samePair = reqA === reqB;

        for (let i = 0; i < towers.length; i++) {
            for (let j = i + 1; j < towers.length; j++) {
                const a = towers[i];
                const b = towers[j];

                const matchForward = a.type === reqA && b.type === reqB;
                const matchReverse = a.type === reqB && b.type === reqA;
                const matchSame = samePair && a.type === reqA && b.type === reqA;

                if (!(matchForward || matchReverse || matchSame)) continue;
                if (distance(a.pos, b.pos) > synergy.maxDistance) continue;

                results.push({
                    synergyId: synergy.id,
                    synergyName: synergy.name,
                    towerIds: [a.id, b.id],
                    effect: synergy.effect,
                    color: synergy.color,
                });
            }
        }

        return results;
    }

    /* ------------------------------------------------------------------ */
    /*  "any3" triangle synergy detection                                  */
    /* ------------------------------------------------------------------ */

    function findTripleSynergies(synergy, towers) {
        const results = [];
        const minTowers = synergy.minTowers ?? 3;

        if (towers.length < minTowers) return results;

        // Check all unique triplets
        for (let i = 0; i < towers.length; i++) {
            for (let j = i + 1; j < towers.length; j++) {
                for (let m = j + 1; m < towers.length; m++) {
                    const a = towers[i];
                    const b = towers[j];
                    const c = towers[m];

                    // All three must be within maxDistance of each other
                    if (
                        distance(a.pos, b.pos) <= synergy.maxDistance &&
                        distance(a.pos, c.pos) <= synergy.maxDistance &&
                        distance(b.pos, c.pos) <= synergy.maxDistance
                    ) {
                        results.push({
                            synergyId: synergy.id,
                            synergyName: synergy.name,
                            towerIds: [a.id, b.id, c.id],
                            effect: synergy.effect,
                            color: synergy.color,
                        });
                    }
                }
            }
        }

        return results;
    }

    /* ------------------------------------------------------------------ */
    /*  Main evaluation                                                    */
    /* ------------------------------------------------------------------ */

    /**
     * Evaluate all synergies against the current tower set.
     *
     * @param {Array} towers — array of towers from gameState
     *   Each tower: { id, type, tileCol, tileRow } (or with pos: {x,y})
     * @returns {Array} active synergy entries with effect data
     */
    function evaluate(towers) {
        const normalized = normalizeTowers(towers);
        const found = [];

        for (const synergy of SYNERGIES) {
            if (synergy.requires === "any3") {
                found.push(...findTripleSynergies(synergy, normalized));
            } else if (Array.isArray(synergy.requires)) {
                found.push(...findPairSynergies(synergy, normalized));
            }
        }

        // Detect newly discovered synergies
        for (const entry of found) {
            if (!discoveredIds.has(entry.synergyId)) {
                discoveredIds.add(entry.synergyId);

                // Persist in gameState
                gameStateStore.discoverSynergy(entry.synergyId);

                // Persist in progression profile
                progression.recordSynergyDiscovery(entry.synergyId);

                // Telemetry
                telemetry.event("synergy_discovered", {
                    synergyId: entry.synergyId,
                    synergyName: entry.synergyName,
                    towerIds: entry.towerIds,
                });
            }
        }

        // Update active synergies in gameState
        activeSynergies = found;
        gameStateStore.setSynergies(
            found.map((s) => ({ synergyId: s.synergyId, towerIds: s.towerIds })),
        );

        return found;
    }

    /* ------------------------------------------------------------------ */
    /*  Queries                                                            */
    /* ------------------------------------------------------------------ */

    function getActiveSynergies() {
        return [...activeSynergies];
    }

    function getDiscoveredSynergyIds() {
        return [...discoveredIds];
    }

    /* ------------------------------------------------------------------ */

    return {
        evaluate,
        getActiveSynergies,
        getDiscoveredSynergyIds,
    };
}
