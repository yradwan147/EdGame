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
        scenariosCompleted: 0,
        puzzlesSolved: 0,
        messagesSent: 0,
        resourcesShared: 0,
        leadershipScore: 0,
        badges: [],
        completedScenarios: [],
    };
}

export function createProgressionSystem(storageKey = "survival_equation_profile") {
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

        // Collaboration badges
        if (profile.messagesSent >= 20) next.add("communicator");
        if (profile.messagesSent >= 100) next.add("master_communicator");
        if (profile.resourcesShared >= 10) next.add("generous_leader");
        if (profile.resourcesShared >= 50) next.add("philanthropist");

        // Puzzle badges
        if (profile.puzzlesSolved >= 5) next.add("puzzle_novice");
        if (profile.puzzlesSolved >= 15) next.add("puzzle_master");
        if (profile.puzzlesSolved >= 30) next.add("puzzle_legend");

        // Scenario badges
        if (profile.scenariosCompleted >= 1) next.add("first_survival");
        if (profile.scenariosCompleted >= 3) next.add("survival_expert");
        if (profile.completedScenarios.length >= 3) next.add("all_scenarios");

        // Knowledge badges
        if (accuracy >= 0.8 && profile.totalQuestionsAnswered >= 20) next.add("sharp_mind");
        if (accuracy >= 0.9 && profile.totalQuestionsAnswered >= 40) next.add("genius_survivor");
        if (profile.totalQuestionsAnswered >= 100) next.add("knowledge_marathon");

        // Team badges
        if (profile.leadershipScore >= 50) next.add("team_player");
        if (profile.leadershipScore >= 100) next.add("born_leader");

        // Level badges
        if (profile.level >= 3) next.add("rank_iii");
        if (profile.level >= 5) next.add("rank_v");

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

        grantPuzzleXp({ puzzleId, score, difficulty }) {
            const xpGained = Math.floor(DEFAULT_SETTINGS.baseXpPerPuzzle * score * (0.8 + difficulty * 0.2));
            profile.xp += xpGained;
            profile.puzzlesSolved += 1;

            while (profile.xp >= requiredXpForLevel(profile.level + 1)) {
                profile.level += 1;
            }

            awardBadges();
            save();
            return { xpGained, level: profile.level, xp: profile.xp };
        },

        grantDayXp({ day, resourcesRemaining }) {
            const resourceBonus = Math.min(1.5, (resourcesRemaining.food + resourcesRemaining.water + resourcesRemaining.materials) / 100);
            const xpGained = Math.floor(DEFAULT_SETTINGS.baseXpPerDay * day * resourceBonus);
            profile.xp += xpGained;

            while (profile.xp >= requiredXpForLevel(profile.level + 1)) {
                profile.level += 1;
            }

            save();
            return { xpGained, level: profile.level };
        },

        recordScenarioComplete(scenarioId) {
            profile.scenariosCompleted += 1;
            if (!profile.completedScenarios.includes(scenarioId)) {
                profile.completedScenarios.push(scenarioId);
            }
            awardBadges();
            save();
        },

        recordMessageSent() {
            profile.messagesSent += 1;
            awardBadges();
            save();
        },

        recordResourceShared(amount) {
            profile.resourcesShared += amount;
            awardBadges();
            save();
        },

        adjustLeadershipScore(delta) {
            profile.leadershipScore = Math.max(0, profile.leadershipScore + delta);
            awardBadges();
            save();
        },

        reset() {
            profile = defaultProfile();
            save();
        },

        requiredXpForLevel,
    };
}
