import { DEFAULT_SETTINGS, SUBJECT_IDS } from "../config/constants.js";

class JSONQuestionProvider {
    constructor(basePath = "./src/data/questions") {
        this.basePath = basePath;
        this.cache = new Map();
    }

    async loadSubject(subjectId) {
        if (this.cache.has(subjectId)) {
            return this.cache.get(subjectId);
        }
        const response = await fetch(`${this.basePath}/${subjectId}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load question file for subject: ${subjectId}`);
        }
        const data = await response.json();
        this.cache.set(subjectId, data.questions ?? []);
        return this.cache.get(subjectId);
    }

    async getQuestions(subjectId) {
        return this.loadSubject(subjectId);
    }
}

class APIQuestionProvider {
    async getQuestions(_subjectId) {
        // Placeholder for future API integration.
        return [];
    }
}

export function createQuestionEngine(options = {}) {
    const provider = options.provider ?? new JSONQuestionProvider();
    const adaptiveState = {};

    function ensurePlayer(playerId) {
        if (!adaptiveState[playerId]) {
            adaptiveState[playerId] = {
                skillRating: 3,
                correctStreak: 0,
                wrongStreak: 0,
                totalAnswered: 0,
                totalCorrect: 0,
            };
        }
        return adaptiveState[playerId];
    }

    function computeDesiredDifficulty(playerRecord, requestedDifficulty) {
        let difficulty = requestedDifficulty ?? playerRecord.skillRating;
        if (playerRecord.correctStreak >= 3) difficulty += 1;
        if (playerRecord.wrongStreak >= 2) difficulty -= 1;
        return Math.max(1, Math.min(5, Math.round(difficulty)));
    }

    function pickQuestion(questions, difficulty, seenIds) {
        const filtered = questions.filter((q) => q.difficulty === difficulty && !seenIds.has(q.id));
        if (filtered.length > 0) {
            return filtered[Math.floor(Math.random() * filtered.length)];
        }
        const fallback = questions.filter((q) => !seenIds.has(q.id));
        if (fallback.length === 0) {
            return questions[Math.floor(Math.random() * questions.length)];
        }
        return fallback[Math.floor(Math.random() * fallback.length)];
    }

    return {
        jsonProvider: JSONQuestionProvider,
        apiProvider: APIQuestionProvider,
        async getQuestion({
            playerId,
            subjectId = SUBJECT_IDS.GENERAL,
            requestedDifficulty = null,
            seenQuestionIds = new Set(),
        }) {
            const playerRecord = ensurePlayer(playerId);
            const targetDifficulty = computeDesiredDifficulty(playerRecord, requestedDifficulty);
            const questions = await provider.getQuestions(subjectId);
            if (!questions.length) {
                throw new Error(`No questions available for subject "${subjectId}".`);
            }
            const question = pickQuestion(questions, targetDifficulty, seenQuestionIds);
            return {
                ...question,
                targetDifficulty,
                timeLimitSec: DEFAULT_SETTINGS.questionTimeLimitSec,
            };
        },
        recordResult({ playerId, correct }) {
            const playerRecord = ensurePlayer(playerId);
            playerRecord.totalAnswered += 1;
            if (correct) {
                playerRecord.totalCorrect += 1;
                playerRecord.correctStreak += 1;
                playerRecord.wrongStreak = 0;
            } else {
                playerRecord.wrongStreak += 1;
                playerRecord.correctStreak = 0;
            }

            const accuracy = playerRecord.totalCorrect / Math.max(playerRecord.totalAnswered, 1);
            const trend = correct ? 0.15 : -0.2;
            playerRecord.skillRating = Math.max(
                1,
                Math.min(5, playerRecord.skillRating + trend + (accuracy - 0.5) * 0.1),
            );

            return { ...playerRecord };
        },
        getPlayerMetrics(playerId) {
            return { ...ensurePlayer(playerId) };
        },
        createSeenSet() {
            return new Set();
        },
    };
}
