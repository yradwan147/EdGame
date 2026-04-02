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
        experimentsCompleted: [],
        discoveriesFound: [],
        failuresTriggered: [],
        safetyScore: 100,
        experimentStars: {},
        badges: [],
    };
}

export function createProgressionSystem(storageKey = "lab_explorer_profile") {
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

        // safety_first: never triggered a failure across all experiments (min 3 done)
        if (
            profile.experimentsCompleted.length >= 3 &&
            profile.failuresTriggered.length === 0
        ) {
            next.add("safety_first");
        }

        // curious_mind: found 5 or more unique discoveries
        if (profile.discoveriesFound.length >= 5) {
            next.add("curious_mind");
        }

        // precision_master: 3 experiments with star rating >= 4
        const highStarCount = Object.values(profile.experimentStars).filter((s) => s >= 4).length;
        if (highStarCount >= 3) {
            next.add("precision_master");
        }

        // lab_veteran: completed all 5 experiments
        const uniqueCompleted = new Set(profile.experimentsCompleted);
        if (uniqueCompleted.size >= 5) {
            next.add("lab_veteran");
        }

        // disaster_collector: triggered 5 or more unique failures
        if (profile.failuresTriggered.length >= 5) {
            next.add("disaster_collector");
        }

        // knowledge levels
        if (profile.level >= 3) next.add("lab_apprentice");
        if (profile.level >= 5) next.add("lab_scientist");

        const accuracy = profile.totalQuestionsCorrect / Math.max(1, profile.totalQuestionsAnswered);
        if (accuracy >= 0.8 && profile.totalQuestionsAnswered >= 20) {
            next.add("sharp_mind");
        }

        profile.badges = [...next];
    }

    return {
        getProfile() {
            return { ...profile };
        },

        grantQuestionXp({ difficulty, responseTimeMs, correct }) {
            const difficultyMultiplier = 0.8 + difficulty * 0.25;
            const speedBonus = Math.max(0.6, 2.0 - responseTimeMs / 8000);
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

        grantExperimentXp({ experimentId, totalScore, stars }) {
            const xpGained = Math.floor(totalScore * 1.2);
            profile.xp += xpGained;

            if (!profile.experimentsCompleted.includes(experimentId)) {
                profile.experimentsCompleted.push(experimentId);
            }

            const prev = profile.experimentStars[experimentId] || 0;
            profile.experimentStars[experimentId] = Math.max(prev, stars);

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

        recordDiscovery(discoveryId) {
            if (!profile.discoveriesFound.includes(discoveryId)) {
                profile.discoveriesFound.push(discoveryId);
                awardBadges();
                save();
            }
        },

        recordFailure(failureId) {
            if (!profile.failuresTriggered.includes(failureId)) {
                profile.failuresTriggered.push(failureId);
                awardBadges();
                save();
            }
        },

        updateSafetyScore(delta) {
            profile.safetyScore = Math.max(0, Math.min(100, profile.safetyScore + delta));
            save();
        },

        isExperimentUnlocked(experimentIndex) {
            if (experimentIndex === 0) return true;
            return profile.experimentsCompleted.length >= experimentIndex;
        },

        reset() {
            profile = defaultProfile();
            save();
        },

        requiredXpForLevel,
    };
}
