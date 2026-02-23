import { DEFAULT_SETTINGS } from "../config/constants.js";

function requiredXpForLevel(level, cfg = DEFAULT_SETTINGS.levelCurve) {
    return Math.floor(cfg.coefficient * Math.pow(level, cfg.power));
}

function defaultProfile() {
    return {
        level: 1,
        xp: 0,
        totalQuestionsAnswered: 0,
        totalQuestionsCorrect: 0,
        badges: [],
    };
}

export function createProgressionSystem(storageKey = "pulse_realms_profile") {
    function readProfile() {
        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) return defaultProfile();
            return { ...defaultProfile(), ...JSON.parse(raw) };
        } catch {
            return defaultProfile();
        }
    }

    let profile = readProfile();

    function save() {
        localStorage.setItem(storageKey, JSON.stringify(profile));
    }

    function awardBadges() {
        const next = new Set(profile.badges);
        const accuracy = profile.totalQuestionsCorrect / Math.max(1, profile.totalQuestionsAnswered);
        if (profile.level >= 3) next.add("cadet_rank_iii");
        if (profile.level >= 5) next.add("realm_specialist");
        if (profile.totalQuestionsAnswered >= 100) next.add("knowledge_marathon");
        if (accuracy >= 0.8 && profile.totalQuestionsAnswered >= 40) next.add("pulse_precision");
        profile.badges = [...next];
    }

    return {
        getProfile() {
            return { ...profile };
        },
        grantQuestionXp({ difficulty, responseTimeMs, correct }) {
            const difficultyMultiplier = 0.8 + difficulty * 0.25;
            const speedBonus = Math.max(0.6, 2.0 - responseTimeMs / 6000);
            const correctnessFactor = correct ? 1.0 : 0.1;
            const xpGained = Math.floor(
                DEFAULT_SETTINGS.baseXpPerQuestion
                * difficultyMultiplier
                * speedBonus
                * correctnessFactor,
            );

            profile.xp += xpGained;
            profile.totalQuestionsAnswered += 1;
            if (correct) profile.totalQuestionsCorrect += 1;

            while (profile.xp >= requiredXpForLevel(profile.level + 1)) {
                profile.level += 1;
            }

            awardBadges();
            save();
            return {
                xpGained,
                level: profile.level,
                xp: profile.xp,
                nextLevelXp: requiredXpForLevel(profile.level + 1),
                badges: [...profile.badges],
            };
        },
        reset() {
            profile = defaultProfile();
            save();
        },
        requiredXpForLevel,
    };
}
