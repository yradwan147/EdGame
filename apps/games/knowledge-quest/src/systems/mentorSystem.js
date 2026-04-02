/**
 * mentorSystem.js -- Professor Sage, the witty owl mentor.
 *
 * Provides conceptual hints (never the answer), tracks token usage,
 * and returns flavour commentary for in-game events.
 */

const HINT_BANK = {
    math: {
        1: [
            "Try counting the groups carefully.",
            "What happens when you add one more?",
            "Look at the numbers -- can you spot a pattern?",
        ],
        2: [
            "Try distributing first.",
            "Think about what x means here.",
            "Break the problem into smaller steps.",
        ],
        3: [
            "Have you considered factoring?",
            "Draw a quick sketch -- geometry might help.",
            "What does the equation look like if you isolate the variable?",
        ],
        4: [
            "Think about inverse operations.",
            "This one rewards patience -- work through it step by step.",
            "Can you rewrite it in a simpler equivalent form?",
        ],
        5: [
            "Look for symmetry in the expression.",
            "Sometimes substitution reveals the path.",
            "Consider the boundary conditions.",
        ],
    },
    science: {
        1: [
            "Remember the states of matter.",
            "Think about what living things need.",
            "Which of these is a solid, liquid, or gas?",
        ],
        2: [
            "Think about energy conservation.",
            "What happens when you heat something up?",
            "Consider the food chain here.",
        ],
        3: [
            "Forces always come in pairs.",
            "Which part of the cell does that job?",
            "Think about chemical vs physical change.",
        ],
        4: [
            "Consider the periodic table groupings.",
            "What does Newton's second law say?",
            "Mass is conserved -- balance both sides.",
        ],
        5: [
            "Think about wave-particle duality.",
            "Consider how catalysts affect activation energy.",
            "Entropy always increases in an isolated system.",
        ],
    },
    mixed: {
        1: ["Start with what you know for sure."],
        2: ["Eliminate the options that definitely can't be right."],
        3: ["Think about the underlying concept, not just the numbers."],
        4: ["Can you connect this to something you've seen before?"],
        5: ["Trust your training -- you've practiced this."],
    },
};

const COMMENTARY = {
    correct_fast: [
        "Impressive speed! The enemies didn't see that coming.",
        "Lightning reflexes AND brainpower? Remarkable!",
        "I barely had time to blink. Well done.",
    ],
    correct_slow: [
        "Patience pays off -- a wise approach.",
        "Slow and steady wins the battle, as I always say.",
        "You took your time, but the answer was worth the wait.",
    ],
    wrong: [
        "Hmm, that answer was... creative. Let me suggest thinking about it differently.",
        "Not quite, but every wrong answer brings you closer to the right one.",
        "Even the greatest mages misfire occasionally. Shake it off!",
    ],
    streak_3: [
        "Three in a row! You're on fire -- well, mathematically speaking.",
        "A triple streak! The arcane energy is strong with you.",
        "Hat trick! ...Do mages wear hats? Never mind, well done!",
    ],
    low_hp: [
        "Perhaps a healing spell would be wise? Just a suggestion from your concerned mentor.",
        "Your health is looking rather dire. May I recommend not getting hit?",
        "I've seen healthier-looking ghosts. Please heal up!",
    ],
    companion_evolved: [
        "Your companion grows stronger through shared knowledge. Beautiful!",
        "Evolution through learning -- nature's finest achievement.",
        "What a transformation! Your companion is thriving.",
    ],
};

export function createMentorSystem({ gameStateStore, telemetry }) {

    function canUseHint() {
        return gameStateStore.getState().mentorTokens > 0;
    }

    function useHint(questionId, subject, difficulty) {
        if (!canUseHint()) return null;

        const used = gameStateStore.useMentorToken();
        if (!used) return null;

        // Pick a hint from the bank
        const subjectKey = HINT_BANK[subject] ? subject : "mixed";
        const diffKey = Math.max(1, Math.min(5, Math.round(difficulty)));
        const pool = HINT_BANK[subjectKey][diffKey] || HINT_BANK.mixed[3];
        const hint = pool[Math.floor(Math.random() * pool.length)];

        telemetry.event("hint_requested", {
            questionId,
            subject,
            difficulty,
            tokensRemaining: gameStateStore.getState().mentorTokens,
        });

        return hint;
    }

    function getCommentary(event) {
        const pool = COMMENTARY[event];
        if (!pool || pool.length === 0) return "";
        return pool[Math.floor(Math.random() * pool.length)];
    }

    function getRemainingTokens() {
        return gameStateStore.getState().mentorTokens;
    }

    return {
        canUseHint,
        useHint,
        getCommentary,
        getRemainingTokens,
    };
}
