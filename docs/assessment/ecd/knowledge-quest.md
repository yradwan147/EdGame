# ECD Mapping: Knowledge Quest — Turn-Based RPG

> **Status:** IMPLEMENTED — Game code complete at `apps/games/knowledge-quest/`

## Game Overview

- **Mechanic:** Story-driven RPG with branching dialogue, question-gated spells, turn-based combat with timing minigame, NPC social dilemmas, collectible companions, and mentor hint system
- **Subject:** Math & Science (mixed, story-contextualized)
- **Duration:** 15-25 min per chapter (3 chapters)
- **Primary Analytics Dimension:** D5 (Affective & SEL — empathy choices, emotional regulation, growth mindset, hint-seeking patterns)
- **Engine:** KAPLAY.js, 1280x720 canvas

---

## 1. Competency Model

| Competency | Description | Game Mechanic |
|-----------|-------------|---------------|
| **Content Mastery** | BKT-style tracking across math and science subjects as chapters progress. Per-subject accuracy and speed-accuracy profiles. | 6 spells gate questions by subject and difficulty bias; question difficulty adapts via shared questionEngine (skill rating +/-0.15-0.20 per answer) |
| **Help-Seeking Behavior** | Strategic vs. over-dependent vs. never-asks hint usage patterns. Proactive vs. reactive hint timing. | Mentor system ("Professor Sage") with 3 tokens per chapter; hints give conceptual guidance (never the answer); timing relative to wrong answers classifies proactive vs. reactive |
| **Empathy & Prosocial Decisions** | Branching choices between helping NPCs, keeping resources for self, or making transactional deals. | 6 social dilemmas across 3 chapters with prosocial / self_interest / transactional / neutral categories; trust changes and world effects tracked per choice |
| **Growth Mindset** | Choosing to retry after defeat, selecting harder spells for greater power, using hints then succeeding independently. | Voluntary replays after combat loss; high-difficulty spell selection (difficultyBias +1 to +2); solo success after hint usage tracked |
| **Emotional Regulation** | Maintaining question accuracy when player HP is critically low (<=30%) vs. healthy (>30%). | Combat system tracks `playerHp` on every question event; assessment compares accuracy under pressure vs. normal conditions, classifying resilient / steady / pressure_sensitive |

## 2. Evidence Model

### Telemetry Events

| Event | Payload | Dimension |
|-------|---------|-----------|
| `spell_choice` | spellId, subject, difficulty, targetIndex | D3 |
| `question_answered` | questionId, subject, difficulty, correct, responseTimeMs, xpGained, playerHp, playerMaxHp, chapter | D1, D5 |
| `timing_cast` | spellId, timingQuality (PERFECT/GOOD/OK/MISS), timingMultiplier (2.0/1.5/1.0/0.7) | D3 |
| `dialogue_choice` | dilemmaId, choiceId, choiceCategory (prosocial/self_interest/transactional/neutral), worldEffect, trustChange | D5 |
| `dialogue_started` | dialogueId, npcName, chapter | D4 |
| `dialogue_ended` | dialogueId, choicesMade, totalTrustChange | D4, D5 |
| `hint_requested` | questionId, subject, difficulty, tokensRemaining | D3, D5 |
| `combat_started` | chapter, enemies (id, name, hp) | D2 |
| `combat_ended` | result (victory/defeat), chapter, turnNumber, enemiesDefeated | D2, D5 |
| `enemy_spared` | enemyId, enemyName, chapter | D5 |
| `defend_action` | chapter, turnNumber | D3 |
| `item_used` | itemId, itemType, effect | D3 |
| `companion_collected` | companionId, name, domain | D4 |
| `companion_evolved` | companionId, newLevel, newStage, newName | D2 |
| `companion_buff_applied` | companionId, level, buffSnapshot | D3 |
| `assessment_cognitive` | correctnessRate, avgResponseTimeMs, speedAccuracyProfile, masteryBySubject | D1 |
| `assessment_engagement` | totalPlayTimeMs, chaptersCompleted, voluntaryReplays, explorationThoroughness | D2 |
| `assessment_strategic` | spellDiversity, combatStrategy, difficultySelection, hintEfficiency | D3 |
| `assessment_social` | companionTrustChanges, npcInteractions, uniqueDilemmasEncountered | D4 |
| `assessment_affective` | dialogueEmpathyScore, hintSeekingPattern, persistenceAfterCombatLoss, growthMindset, emotionalRegulation | D5 |
| `assessment_temporal` | chapterPerformanceTrend, learningVelocity, responseTimeImprovement | D6 |

### Evidence Rules

- **Correctness rate** (D1): `questionsCorrect / questionsAnswered` per subject
- **Speed-accuracy profile** (D1): classify from avgResponseTimeMs + correctness — fast_accurate, fast_inaccurate, slow_accurate, slow_inaccurate (threshold: 5000ms, 70% accuracy)
- **Mastery by subject** (D1): per-subject accuracy tracked via question event payloads
- **Spell diversity** (D3): Shannon entropy of spell type distribution [0-1] across all `spell_choice` events
- **Combat strategy** (D3): offense/defense ratio from spellsCast vs. defendActions — aggressive (>=75%), balanced_offensive, balanced_defensive, defensive
- **Difficulty selection** (D3): average requested difficulty from spell choices — risk_taking (>=4), moderate (>=2.5), cautious
- **Hint efficiency** (D3): proportion of hints followed by a correct answer within 30 seconds
- **Dialogue empathy** (D5): `prosocialCount / (prosocialCount + selfInterestCount)` across all dialogue_choice events
- **Hint-seeking pattern** (D5): classify as proactive (hint before wrong answer), reactive (hint after wrong answer within 15s), balanced, or none
- **Persistence after combat loss** (D5): questions answered after last defeat / total questions
- **Growth mindset score** (D5): composite of `(avgDifficulty/5)*0.3 + (min(retries,3)/3)*0.3 + (hintThenSoloSuccess/totalHints)*0.4`
- **Emotional regulation** (D5): accuracy delta when HP<=30% vs. HP>30% — resilient (delta>=+0.05), steady (>=-0.10), pressure_sensitive
- **Learning velocity** (D6): accuracy improvement first half vs. second half of session
- **Response time improvement** (D6): average response time first half minus second half

## 3. Task Model

### Chapter Structure (Branching Maps)

| Chapter | Name | Nodes | Boss | Difficulty Range | Unlock |
|---------|------|-------|------|-----------------|--------|
| 1 | The Withering Forest | 10 nodes (combat, dialogue, shop, mystery, rest, boss) | The Riddler (HP 300) | 1-4 | Always |
| 2 | The Frozen Archives | 10 nodes (combat, dialogue, shop, mystery, rest, boss) | The Riddler (HP 300, scaled) | 2-5 | Chapter 1 complete |
| 3 | The Dragon's Equation | 8 nodes (combat, dialogue, mystery, rest, boss) | The Riddler (HP 300, scaled) | 3-5 | Chapter 2 complete |

Node types: combat, dialogue (social dilemma), shop, mystery (random event), rest (HP/MP recovery + companion leveling), boss.

Players choose branching paths on each chapter map (e.g., c1_start connects to either c1_combat1 or c1_mystery1), enabling different play experiences per session.

### Turn-Based Combat

**Player actions per turn:**
1. **Cast Spell** — answer a question, then execute a timing minigame for damage multiplier
2. **Defend** — halve incoming damage for one turn
3. **Use Item** — consume a potion, scroll, or buff item
4. **Ask Mentor** — request a conceptual hint (costs 1 mentor token)

**6 Spells (unlocked across chapters):**

| Spell | Subject | MP | Base Dmg | Target | Timing Pattern | Unlock | Special |
|-------|---------|-----|---------|--------|---------------|--------|---------|
| Spark | Math | 2 | 18 | Enemy | single_ring | Ch 1 | -- |
| Frost Wave | Science | 3 | 14 | Enemy | double_ring | Ch 1 | Slow 1 turn |
| Healing Light | Math | 3 | -- | Ally | pulse | Ch 1 | Heal 25 HP |
| Vine Bind | Math | 4 | 0 | Enemy | moving_target | Ch 2 | Stun 2 turns |
| Thunder Strike | Science | 5 | 35 | Enemy | rapid_shrink | Ch 2 | -- |
| Knowledge Burst | Mixed | 8 | 50 | All | triple_ring | Ch 3 | AoE |

**Timing Minigame Multipliers:** PERFECT 2.0x, GOOD 1.5x, OK 1.0x, MISS 0.7x

### 5 Enemy Types with Behaviors

| Enemy | HP | ATK | Behavior | Assessment Signal |
|-------|-----|-----|----------|------------------|
| Ignorance Imp | 35 | 8 | `argue` — displays distracting text bubbles on question UI | Tests focus under distraction |
| Confusion Crawler | 55 | 14 | `shuffle` — rearranges spell menu each turn | Tests adaptability when interface changes |
| Doubt Shade | 75 | 18 | `whisper` — reduces question timer by 3 seconds | Tests accuracy under time pressure |
| Apathy Giant | 130 | 24 | `sleep` — falls asleep after 2 idle turns (33% chance per turn); free critical hit opportunity | Tests patience vs. aggression strategy |
| The Riddler (boss) | 300 | 20 | `riddle` — poses riddles each turn; correct answers weaken it, wrong answers heal it | Tests meta-cognitive reasoning under pressure |

### 6 Social Dilemmas (2 per chapter)

Each dilemma presents a multi-stage NPC dialogue with branching choices carrying prosocial, self_interest, transactional, or neutral categorizations:

| Dilemma | Chapter | NPC | Core Choice |
|---------|---------|-----|-------------|
| Lost Merchant | 1 | Barley (hedgehog) | Help fix cart / ignore / trade for potion |
| Struggling Student | 1 | Fern (fox apprentice) | Teach her / ignore / solve for trade |
| Frozen Guardian | 2 | (library guard) | -- |
| Librarian Dilemma | 2 | (archive librarian) | -- |
| Dragon's Emissary | 3 | (dragon's messenger) | -- |
| The Final Choice | 3 | (endgame dilemma) | -- |

Choices affect: trust score, world state flags, inventory rewards, map reveals, and future NPC behavior.

### Mentor Hint System

- 3 tokens per chapter (configurable via `DEFAULT_SETTINGS.mentorTokensPerChapter`)
- Hints are subject-specific (math, science, mixed) and difficulty-tiered (1-5)
- Conceptual guidance only (never reveals the answer)
- Commentary system provides flavor text for correct_fast, correct_slow, wrong, streak_3, low_hp, and companion_evolved events

### 8 Collectible Companions

Up to 3 active at once; evolve through 4 stages (XP thresholds: 0, 50, 150, 350):

| Companion | Domain | Buff |
|-----------|--------|------|
| Algebrix | Math | +5%/level damage multiplier, heal on correct math |
| Reactia | Science | +5-11 HP heal on correct science answers |
| Voltaire | Science | +1-3 MP regen per turn |
| Florae | Science | +1-4 defense bonus |
| Chronox | Math | +3%/level damage multiplier |
| Luminos | Math | Heal on any correct answer (math + science) |
| Gravitas | Science | +2-6 defense bonus |
| Ember | Math | +8%/level damage multiplier |

## 4. Assembly Model

### Mastery Thresholds

| Level | Correctness Rate | Strategy | SEL Profile | Interpretation |
|-------|-----------------|----------|-------------|----------------|
| Not Yet | < 0.40 | Single spell, no hints | Few dilemmas engaged, low empathy | Significant knowledge gaps; limited SEL engagement |
| Developing | 0.40-0.65 | 2-3 spells, occasional hints | Some prosocial choices | Building understanding; emerging social awareness |
| Proficient | 0.65-0.85 | Diverse spells + timing skill | Consistent prosocial pattern, strategic hints | Grade-level competent; healthy SEL indicators |
| Advanced | > 0.85 | Full spell diversity, synergy with companions | High empathy, growth mindset, resilient regulation | Ready for acceleration; strong SEL competencies |

### Adaptive Difficulty

Question difficulty adapts via the shared questionEngine:
- Skill rating adjusts +/-0.15-0.20 per answer
- Streak tracking: 3 correct in a row increases difficulty
- Spell difficulty bias: Spark/Frost Wave/Healing Light (+0), Vine Bind/Thunder Strike (+1), Knowledge Burst (+2)
- Question timer: 12 seconds base (reduced by 3 seconds when Doubt Shade is present)

### D5 Scoring Formula

The primary dimension (D5 Affective) composite score is built from:

```
dialogueEmpathyScore:   prosocial / (prosocial + selfInterest)
hintSeekingPattern:     proactive | reactive | balanced | none
persistenceAfterLoss:   questionsAfterLastDefeat / totalQuestions
growthMindset.score:    (avgDifficulty/5)*0.3 + (retries/3)*0.3 + (soloSuccessAfterHint/totalHints)*0.4
emotionalRegulation:    accuracy(HP<=30%) - accuracy(HP>30%) -> resilient|steady|pressure_sensitive
```

These five sub-scores produce a holistic SEL profile per session, enabling teachers to identify students who may need support with emotional regulation, help-seeking, or prosocial decision-making.
