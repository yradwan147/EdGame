/**
 * Communication System: tracks message quality, on-task ratio,
 * information sharing patterns, and collaboration quality scoring.
 */

const INFO_KEYWORDS = ["found", "discovered", "my data says", "according to", "i see", "the report shows", "blueprint", "chart", "map", "lab report"];
const REQUEST_KEYWORDS = ["what", "how", "can you", "do you know", "anyone know", "need help", "tell me", "explain", "check"];
const OFF_TASK_KEYWORDS = ["lol", "haha", "bored", "whatever", "who cares", "meh"];

function classifyMessage(text) {
    const lower = text.toLowerCase();
    const isInfoShare = INFO_KEYWORDS.some((kw) => lower.includes(kw));
    const isInfoRequest = REQUEST_KEYWORDS.some((kw) => lower.includes(kw));
    const isOffTask = OFF_TASK_KEYWORDS.some((kw) => lower.includes(kw));

    return {
        isInfoShare,
        isInfoRequest,
        isOnTask: !isOffTask || isInfoShare || isInfoRequest,
        isOffTask: isOffTask && !isInfoShare && !isInfoRequest,
    };
}

export function createCommunicationSystem() {
    const messages = [];
    let puzzleMessageCounts = {};

    return {
        /**
         * Log a message and classify it.
         */
        logMessage(sender, text, type = "chat") {
            const classification = classifyMessage(text);
            const msg = {
                id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
                sender,
                text,
                type,
                ts: Date.now(),
                ...classification,
            };
            messages.push(msg);
            if (messages.length > 500) messages.shift();

            // Track per-puzzle stats
            if (!puzzleMessageCounts[sender]) {
                puzzleMessageCounts[sender] = { total: 0, onTask: 0, infoShares: 0, infoRequests: 0 };
            }
            const stats = puzzleMessageCounts[sender];
            stats.total += 1;
            if (classification.isOnTask) stats.onTask += 1;
            if (classification.isInfoShare) stats.infoShares += 1;
            if (classification.isInfoRequest) stats.infoRequests += 1;

            return msg;
        },

        /**
         * Get overall message statistics.
         */
        getMessageStats() {
            const total = messages.length;
            const onTask = messages.filter((m) => m.isOnTask).length;
            const infoShares = messages.filter((m) => m.isInfoShare).length;
            const infoRequests = messages.filter((m) => m.isInfoRequest).length;
            const playerMessages = messages.filter((m) => m.sender === "player");
            const aiMessages = messages.filter((m) => m.sender !== "player");

            return {
                totalMessages: total,
                onTaskCount: onTask,
                onTaskRatio: total > 0 ? onTask / total : 0,
                infoShareCount: infoShares,
                infoShareRate: total > 0 ? infoShares / total : 0,
                infoRequestCount: infoRequests,
                playerMessageCount: playerMessages.length,
                aiMessageCount: aiMessages.length,
                averageResponseTime: this.computeAverageResponseTime(),
            };
        },

        /**
         * Compute how quickly AI responded to player messages (average delay).
         */
        computeAverageResponseTime() {
            const playerMsgs = messages.filter((m) => m.sender === "player");
            const aiMsgs = messages.filter((m) => m.sender !== "player");
            if (playerMsgs.length === 0 || aiMsgs.length === 0) return 0;

            let totalDelay = 0;
            let count = 0;
            for (const pm of playerMsgs) {
                const nextAi = aiMsgs.find((am) => am.ts > pm.ts);
                if (nextAi) {
                    totalDelay += nextAi.ts - pm.ts;
                    count += 1;
                }
            }
            return count > 0 ? totalDelay / count : 0;
        },

        /**
         * Get per-sender message stats.
         */
        getPerSenderStats() {
            return { ...puzzleMessageCounts };
        },

        /**
         * Compute communication quality score (0-1).
         */
        getCommunicationQuality() {
            const stats = this.getMessageStats();
            if (stats.totalMessages < 3) return 0.5; // Not enough data

            // Score components
            const onTaskScore = Math.min(1, stats.onTaskRatio * 1.2); // bonus for high on-task
            const infoShareScore = Math.min(1, stats.infoShareRate * 4); // encourage info sharing
            const requestScore = Math.min(1, stats.infoRequestCount / Math.max(stats.playerMessageCount, 1) * 3);
            const volumeScore = Math.min(1, stats.playerMessageCount / 15); // encourage participation

            return (
                onTaskScore * 0.3 +
                infoShareScore * 0.3 +
                requestScore * 0.2 +
                volumeScore * 0.2
            );
        },

        /**
         * Get recent messages for display (last N).
         */
        getRecentMessages(count = 20) {
            return messages.slice(-count);
        },

        /**
         * Reset for new puzzle.
         */
        resetPuzzleStats() {
            puzzleMessageCounts = {};
        },

        /**
         * Full reset.
         */
        reset() {
            messages.length = 0;
            puzzleMessageCounts = {};
        },
    };
}
