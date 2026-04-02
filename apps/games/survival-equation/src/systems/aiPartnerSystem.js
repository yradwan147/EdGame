import { AI_PERSONALITIES, getResponse } from "../config/aiPersonalities.js";
import { ROLE_IDS } from "../config/constants.js";

/**
 * AI Partner System: generates contextual responses from AI teammates.
 * Partners respond based on their personality, the current puzzle, and the player's messages.
 */

const KEYWORD_TOPIC_MAP = {
    materials: ["material", "build", "construct", "bamboo", "metal", "wood", "pole", "beam", "wire", "cable", "epoxy", "sealant"],
    structures: ["shelter", "wall", "roof", "foundation", "support", "brace", "triangle", "structure", "frame"],
    formulas: ["formula", "calculate", "equation", "math", "force", "pressure", "voltage", "power", "energy", "physics"],
    chemistry: ["chemical", "reaction", "filter", "purif", "charcoal", "salt", "boil", "pH", "toxin", "oxygen", "CO2"],
    health: ["health", "safe", "danger", "injury", "fever", "sick", "water need", "calorie", "dehydrat", "hypotherm"],
    safety: ["safe", "risk", "danger", "careful", "protect", "check", "verify", "double"],
    terrain: ["terrain", "weather", "storm", "wind", "direction", "location", "map", "coordinate", "bearing"],
    weather: ["storm", "rain", "wind", "cloud", "temperature", "pressure", "forecast", "flare"],
    puzzleHint: ["hint", "help", "stuck", "what do", "how do", "idea", "suggest", "think", "clue", "answer"],
    agree: ["good idea", "yes", "agree", "correct", "right", "lets do", "sounds good", "nice", "perfect"],
    disagree: ["bad idea", "no", "wrong", "disagree", "unsafe", "wont work", "dangerous"],
    urgent: ["hurry", "fast", "quick", "time", "running out", "emergency", "now", "critical"],
};

function detectTopics(messageText) {
    const lower = messageText.toLowerCase();
    const topics = [];
    for (const [topic, keywords] of Object.entries(KEYWORD_TOPIC_MAP)) {
        if (keywords.some((kw) => lower.includes(kw))) {
            topics.push(topic);
        }
    }
    return topics.length > 0 ? topics : ["idle"];
}

function roleRelevanceForTopics(roleId, topics) {
    const relevanceMap = {
        [ROLE_IDS.ENGINEER]: ["materials", "structures", "puzzleHint"],
        [ROLE_IDS.SCIENTIST]: ["formulas", "chemistry", "puzzleHint"],
        [ROLE_IDS.MEDIC]: ["health", "safety", "puzzleHint"],
        [ROLE_IDS.NAVIGATOR]: ["terrain", "weather", "puzzleHint"],
    };
    const relevant = relevanceMap[roleId] || [];
    return topics.filter((t) => relevant.includes(t)).length;
}

function shouldPartnerRespond(roleId, topics, personality) {
    const relevance = roleRelevanceForTopics(roleId, topics);
    const generalTopics = ["agree", "disagree", "urgent", "idle", "puzzleHint"];
    const isGeneralTopic = topics.some((t) => generalTopics.includes(t));

    if (relevance > 0) return true;
    if (isGeneralTopic && Math.random() < 0.5) return true;
    if (Math.random() < personality.traits.verbosity * 0.3) return true;
    return false;
}

function pickBestTopic(roleId, topics) {
    const relevance = {
        [ROLE_IDS.ENGINEER]: { materials: 3, structures: 3, puzzleHint: 2, agree: 1, disagree: 2, urgent: 2 },
        [ROLE_IDS.SCIENTIST]: { formulas: 3, chemistry: 3, puzzleHint: 2, agree: 1, disagree: 2, urgent: 2 },
        [ROLE_IDS.MEDIC]: { health: 3, safety: 3, puzzleHint: 2, agree: 1, disagree: 2, urgent: 2 },
        [ROLE_IDS.NAVIGATOR]: { terrain: 3, weather: 3, puzzleHint: 2, agree: 1, disagree: 2, urgent: 2 },
    };
    const scores = relevance[roleId] || {};
    let best = topics[0] || "idle";
    let bestScore = 0;
    for (const topic of topics) {
        const s = scores[topic] || 0;
        if (s > bestScore) {
            bestScore = s;
            best = topic;
        }
    }
    return best;
}

function generateReplacements(puzzleData, roleId) {
    const reps = {};
    const randomValues = {
        value: String(Math.floor(Math.random() * 100) + 10),
        result: String(Math.floor(Math.random() * 500) + 50),
        count: String(Math.floor(Math.random() * 5) + 2),
        material: ["bamboo", "palm wood", "aluminum", "acrylic", "copper"][Math.floor(Math.random() * 5)],
        direction: ["north", "south", "east", "west", "northeast", "southwest"][Math.floor(Math.random() * 6)],
        hazard: ["dehydration", "structural collapse", "electrical shock", "pressure loss", "hypothermia"][Math.floor(Math.random() * 5)],
        factor: ["wind speed", "temperature", "structural load", "water purity", "signal decay"][Math.floor(Math.random() * 5)],
        type: ["sandy", "rocky", "clay", "volcanic"][Math.floor(Math.random() * 4)],
        use: ["drainage", "foundations", "farming"][Math.floor(Math.random() * 3)],
        problem: ["erosion", "flooding", "instability"][Math.floor(Math.random() * 3)],
        trend: ["dropping", "rising", "stable"][Math.floor(Math.random() * 3)],
        forecast: ["rain in 6 hours", "clear skies for 12 hours", "worsening conditions"][Math.floor(Math.random() * 3)],
        hours: String(Math.floor(Math.random() * 12) + 2),
        item: ["reflective debris", "old radio parts", "mineral deposits", "freshwater spring"][Math.floor(Math.random() * 4)],
    };

    if (puzzleData && puzzleData.roleInfo && puzzleData.roleInfo[roleId]) {
        const infoLines = puzzleData.roleInfo[roleId].lines;
        if (infoLines && infoLines.length > 0) {
            const numbers = infoLines.join(" ").match(/\d+/g);
            if (numbers && numbers.length > 0) {
                reps.value = numbers[Math.floor(Math.random() * numbers.length)];
            }
        }
    }

    return { ...randomValues, ...reps };
}

export function createAIPartnerSystem() {
    let recentResponses = new Map(); // roleId -> last response timestamp
    const MIN_RESPONSE_INTERVAL = 2000; // ms between responses per partner

    return {
        /**
         * Process a player message and generate partner responses.
         * Returns an array of { roleId, name, text, delay } objects.
         */
        processPlayerMessage(messageText, context = {}) {
            const { puzzleData, aiPartners = [], playerRole = "" } = context;
            const topics = detectTopics(messageText);
            const responses = [];
            const now = Date.now();

            for (const partnerRoleId of aiPartners) {
                if (partnerRoleId === playerRole) continue;
                const personality = AI_PERSONALITIES[partnerRoleId];
                if (!personality) continue;

                const lastResponse = recentResponses.get(partnerRoleId) || 0;
                if (now - lastResponse < MIN_RESPONSE_INTERVAL) continue;

                if (!shouldPartnerRespond(partnerRoleId, topics, personality)) continue;

                const bestTopic = pickBestTopic(partnerRoleId, topics);
                const replacements = generateReplacements(puzzleData, partnerRoleId);
                const text = getResponse(partnerRoleId, bestTopic, replacements);

                if (text && text !== "...") {
                    const delay = 800 + Math.random() * 2000 * (1 - personality.traits.confidence);
                    responses.push({
                        roleId: partnerRoleId,
                        name: personality.name,
                        text,
                        delay: Math.floor(delay),
                        topic: bestTopic,
                    });
                    recentResponses.set(partnerRoleId, now);
                }
            }

            // Sort by delay so fastest responders go first
            responses.sort((a, b) => a.delay - b.delay);
            return responses;
        },

        /**
         * Generate contextual greeting messages when entering a puzzle.
         */
        generateGreetings(aiPartners, playerRole) {
            const greetings = [];
            for (const roleId of aiPartners) {
                if (roleId === playerRole) continue;
                const personality = AI_PERSONALITIES[roleId];
                if (!personality) continue;
                const text = getResponse(roleId, "greeting");
                greetings.push({
                    roleId,
                    name: personality.name,
                    text,
                    delay: 500 + Math.random() * 1500,
                });
            }
            return greetings.sort((a, b) => a.delay - b.delay);
        },

        /**
         * Generate a response to the puzzle being loaded (each partner shares relevant info).
         */
        generatePuzzleIntroResponses(puzzleData, aiPartners, playerRole) {
            const responses = [];
            for (const roleId of aiPartners) {
                if (roleId === playerRole) continue;
                const personality = AI_PERSONALITIES[roleId];
                if (!personality) continue;
                const replacements = generateReplacements(puzzleData, roleId);
                const text = getResponse(roleId, "puzzleHint", replacements);
                responses.push({
                    roleId,
                    name: personality.name,
                    text,
                    delay: 2000 + Math.random() * 3000,
                });
            }
            return responses.sort((a, b) => a.delay - b.delay);
        },

        /**
         * Generate a reaction to puzzle step completion.
         */
        generateReaction(correct, aiPartners, playerRole) {
            const reactions = [];
            const topic = correct ? "agree" : "disagree";
            for (const roleId of aiPartners) {
                if (roleId === playerRole) continue;
                if (Math.random() > 0.6) continue; // Not everyone reacts
                const personality = AI_PERSONALITIES[roleId];
                if (!personality) continue;
                const text = getResponse(roleId, topic);
                reactions.push({
                    roleId,
                    name: personality.name,
                    text,
                    delay: 300 + Math.random() * 1000,
                });
            }
            return reactions;
        },

        resetCooldowns() {
            recentResponses.clear();
        },
    };
}
