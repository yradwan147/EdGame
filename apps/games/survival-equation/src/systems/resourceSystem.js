/**
 * Resource System: manages consumption, allocation, sharing, and equity tracking.
 */

export function createResourceSystem() {
    const allocationHistory = [];

    return {
        /**
         * Apply daily consumption to resources.
         */
        dailyConsumption(resources, consumption) {
            return {
                food: Math.max(0, resources.food - (consumption.food || 0)),
                water: Math.max(0, resources.water - (consumption.water || 0)),
                materials: Math.max(0, resources.materials - (consumption.materials || 0)),
            };
        },

        /**
         * Allocate resources from the pool with tracking.
         */
        allocateResources(resources, distribution) {
            const record = {
                before: { ...resources },
                distribution,
                ts: Date.now(),
            };

            const after = {
                food: Math.max(0, resources.food + (distribution.food || 0)),
                water: Math.max(0, resources.water + (distribution.water || 0)),
                materials: Math.max(0, resources.materials + (distribution.materials || 0)),
            };

            record.after = { ...after };
            allocationHistory.push(record);

            return after;
        },

        /**
         * Get current resource status with warnings.
         */
        getResourceStatus(resources, dailyConsumption) {
            const daysOfFood = dailyConsumption.food > 0 ? Math.floor(resources.food / dailyConsumption.food) : 99;
            const daysOfWater = dailyConsumption.water > 0 ? Math.floor(resources.water / dailyConsumption.water) : 99;
            const daysOfMaterials = dailyConsumption.materials > 0 ? Math.floor(resources.materials / dailyConsumption.materials) : 99;

            const warnings = [];
            if (daysOfFood <= 1) warnings.push("CRITICAL: Food supply nearly depleted!");
            else if (daysOfFood <= 2) warnings.push("WARNING: Low food -- 2 days remaining.");

            if (daysOfWater <= 1) warnings.push("CRITICAL: Water supply nearly depleted!");
            else if (daysOfWater <= 2) warnings.push("WARNING: Low water -- 2 days remaining.");

            if (resources.materials <= 5) warnings.push("WARNING: Almost no materials left.");

            return {
                resources,
                daysOfFood,
                daysOfWater,
                daysOfMaterials,
                totalResources: resources.food + resources.water + resources.materials,
                warnings,
                isCritical: daysOfFood <= 1 || daysOfWater <= 1,
            };
        },

        /**
         * Compute resource allocation equity using Gini coefficient.
         * Lower Gini = more equitable (0 = perfect equality, 1 = perfect inequality).
         */
        computeGiniCoefficient(shares) {
            if (shares.length <= 1) return 0;
            const sorted = [...shares].sort((a, b) => a - b);
            const n = sorted.length;
            const mean = sorted.reduce((s, v) => s + v, 0) / n;
            if (mean === 0) return 0;

            let sumAbsDiff = 0;
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    sumAbsDiff += Math.abs(sorted[i] - sorted[j]);
                }
            }
            return sumAbsDiff / (2 * n * n * mean);
        },

        /**
         * Evaluate sharing behavior.
         * Returns a score 0-1 (higher = more generous/equitable).
         */
        evaluateSharingBehavior() {
            if (allocationHistory.length === 0) return 0.5;

            let totalGenerosity = 0;
            for (const record of allocationHistory) {
                const dist = record.distribution;
                const total = Math.abs(dist.food || 0) + Math.abs(dist.water || 0) + Math.abs(dist.materials || 0);
                if (total > 0) {
                    // Positive distributions = sharing
                    const positive = Math.max(0, dist.food || 0) + Math.max(0, dist.water || 0) + Math.max(0, dist.materials || 0);
                    totalGenerosity += positive / total;
                }
            }
            return Math.min(1, totalGenerosity / allocationHistory.length);
        },

        /**
         * Track resource sharing (for the rival camp scenario).
         */
        recordSharing(amount) {
            allocationHistory.push({
                type: "sharing",
                amount,
                ts: Date.now(),
            });
        },

        getHistory() {
            return [...allocationHistory];
        },

        reset() {
            allocationHistory.length = 0;
        },
    };
}
