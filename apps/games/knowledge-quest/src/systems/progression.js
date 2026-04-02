/**
 * progression.js -- Player progression, XP, leveling, and badge tracking
 * for Knowledge Quest RPG.
 *
 * Adapted from Concept Cascade's progression system with RPG-specific
 * profile fields: companions, enemies defeated/spared, prosocial tracking,
 * and chapter completion.
 */

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
        chaptersCompleted: 0,
        companionsCollected: [],
        companionLevels: {},
        totalEnemiesDefeated: 0,
        totalEnemiesSpared: 0,
        prosocialChoices: 0,
        selfInterestChoices: 0,
        badges: [],
    };
}

export function createProgressionSystem(storageKey = "knowledge_quest_profile") {
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

        // Level-based badges
        if (profile.level >= 3) next.add("apprentice_mage");
        if (profile.level >= 7) next.add("archmage");

        // Knowledge badges
        if (profile.totalQuestionsAnswered >= 100) next.add("knowledge_scholar");

        // Prosocial / empathy badges
        if (profile.prosocialChoices >= 5) next.add("compassionate_hero");

        // Companion collection badges
        if (profile.companionsCollected.length >= 5) next.add("collector");
        if (profile.companionsCollected.length >= 8) next.add("master_collector");

        // Pacifist badge
        if (profile.totalEnemiesSpared >= 10) next.add("pacifist_run");

        // Chapter completion badges
        if (profile.chaptersCompleted >= 1) next.add("chapter_complete_1");
        if (profile.chaptersCompleted >= 2) next.add("chapter_complete_2");
        if (profile.chaptersCompleted >= 3) next.add("chapter_complete_3");

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

        recordCompanionCollected(companionId) {
            if (!profile.companionsCollected.includes(companionId)) {
                profile.companionsCollected.push(companionId);
                profile.companionLevels[companionId] = 1;
                awardBadges();
                save();
            }
        },

        recordCompanionLevelUp(companionId, newLevel) {
            profile.companionLevels[companionId] = newLevel;
            save();
        },

        recordEnemyDefeated() {
            profile.totalEnemiesDefeated += 1;
            save();
        },

        recordEnemySpared() {
            profile.totalEnemiesSpared += 1;
            awardBadges();
            save();
        },

        recordDialogueChoice(category) {
            if (category === "prosocial") {
                profile.prosocialChoices += 1;
            } else if (category === "self_interest") {
                profile.selfInterestChoices += 1;
            }
            awardBadges();
            save();
        },

        recordChapterCompleted() {
            profile.chaptersCompleted += 1;
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
