# ECD Mapping: Pulse Realms — Team Arena

## Game Overview

- **Mechanic:** 3v3 team combat where every attack/heal/shield is gated behind an MCQ
- **Engine:** KAPLAY.js
- **Subject:** Math & Science (configurable via `SUBJECT_IDS`)
- **Duration:** 5 min per match (`matchDurationSec: 300`)
- **Roles:** Attacker, Healer, Builder (each with unique abilities)

---

## 1. Competency Model

*What skills and knowledge does this game assess?*

### Content Knowledge (D1)
| Competency | Description | Curriculum Alignment |
|-----------|-------------|---------------------|
| **Mathematical Fluency** | Speed and accuracy solving math problems under time pressure | CCSS.Math operations, number sense |
| **Scientific Reasoning** | Applying science concepts to answer questions correctly | NGSS disciplinary core ideas |
| **Adaptive Knowledge** | Maintaining accuracy as difficulty increases (adaptive engine raises difficulty after 3 correct in a row) | Cross-curricular metacognition |

### 21st-Century Skills (D3–D5)
| Competency | Description |
|-----------|-------------|
| **Strategic Thinking** | Selecting appropriate roles and actions based on game state |
| **Teamwork & Prosocial Behavior** | Choosing to heal/shield allies vs. focusing on damage |
| **Emotional Regulation** | Maintaining performance under combat pressure (low HP, time pressure) |
| **Persistence** | Continuing to engage after incorrect answers |
| **Risk Assessment** | Choosing between safe actions (shield) and high-risk/high-reward actions (power strike) |

---

## 2. Evidence Model

*What observable in-game behaviors indicate competency?*

### Content Knowledge Evidence

| Observable Behavior | Telemetry Event | Payload Fields | Evidence Rule |
|---------------------|-----------------|----------------|---------------|
| Answers question correctly | `question_answered` | `correct: true` | Direct evidence of content mastery for the question's `subject` and `difficulty` |
| Answers quickly and correctly | `question_answered` | `correct: true, responseTimeMs < 3000` | Evidence of fluent, confident knowledge (not guessing) |
| Answers quickly but incorrectly | `question_answered` | `correct: false, responseTimeMs < 2000` | Evidence of guessing behavior — no mastery |
| Answers slowly but correctly | `question_answered` | `correct: true, responseTimeMs > 5000` | Evidence of effortful recall — knowledge present but not fluent |
| Maintains accuracy at higher difficulty | `question_answered` | `difficulty: 4-5, correct: true` | Evidence of deep understanding beyond surface recall |
| Accuracy improves within session | sequence of `question_answered` | `correct` trend over `ts` | Evidence of learning during gameplay |

### Strategic Behavior Evidence

| Observable Behavior | Telemetry Event | Payload Fields | Evidence Rule |
|---------------------|-----------------|----------------|---------------|
| Chooses healer role | session `meta` | `role: 'healer'` | Preference for support/prosocial play style |
| Uses diverse action types | `action_performed` | varying `actionType` | Higher Shannon entropy = strategic flexibility |
| Targets low-HP enemies | `action_performed` | `targetId` cross-ref with game state | Evidence of tactical awareness |
| Switches from attack to heal when ally is low | `action_performed` sequence | `actionType` change pattern | Evidence of situational awareness and teamwork |

### SEL / Affective Evidence

| Observable Behavior | Telemetry Event | Payload Fields | Evidence Rule |
|---------------------|-----------------|----------------|---------------|
| Continues playing after 2+ wrong answers | `question_answered` sequence | `correct: false` followed by further actions | Persistence after failure — growth mindset indicator |
| Accuracy drops when HP is low | `question_answered` + `damage_taken` | `correct` rate when cumulative `damage_taken.amount` > 72 (60% of 120 HP) | Low emotional regulation under stress |
| Response time increases after failure | `question_answered` sequence | `responseTimeMs` after `correct: false` | Possible frustration or increased deliberation (context-dependent) |
| Heals teammates before self-interest actions | `action_performed` | `actionType: 'heal'` targeting allies when attacker role could deal damage | Empathy / prosocial prioritization |

---

## 3. Task Model

*What game tasks elicit the evidence above?*

### Core Task Loop

```
1. Player selects target → chooses action (attack/heal/shield/build)
2. Question engine selects MCQ at adaptive difficulty
   - Difficulty = base (3 + action's difficultyBias) adjusted by player streak
   - After 3 correct → difficulty +1; after 2 wrong → difficulty -1
   - Questions drawn from subject-specific JSON pools, avoiding recently seen
3. Player answers within 8-second time limit (questionTimeLimitSec)
4. If correct: action fires with speed-based power multiplier
   - multiplier = max(1, min(2, 2.2 - responseTimeMs/5000))
   - Fast + correct = up to 2× power; slow + correct = 1× power
5. If incorrect: action misses (effectType: 'miss')
6. Combat effects applied (damage/heal/shield)
7. Match runs for 300 seconds or until objective captured
```

### Task Design Constraints

| Design Feature | Purpose | Config Reference |
|---------------|---------|-----------------|
| 8-second time limit | Prevents unlimited deliberation; creates authentic pressure | `constants.js:4 — questionTimeLimitSec: 8` |
| Adaptive difficulty (1-5 scale) | Keeps questions in Zone of Proximal Development | `questionEngine.js:51-56 — computeDesiredDifficulty()` |
| Speed-based power multiplier | Incentivizes confident, fluent knowledge (fast + correct = more damage) | `combatSystem.js:4-6 — speedMultiplier()` |
| Role selection (3 roles) | Forces strategic choice; reveals preferred play style | `constants.js:33-37 — ROLE_IDS` |
| 6 action types per role | Ensures diverse evidence collection across action categories | `constants.js:39-46 — ACTION_IDS` |
| No respawn (`respawnEnabled: false`) | Raises stakes — mistakes have consequences, elicits emotional regulation | `constants.js:22` |
| 3v3 team format | Creates social context for prosocial behavior measurement | AI teammates in Phase 1 |

---

## 4. Assembly Model

*How does evidence combine into competency scores?*

### Per-Session Aggregation

```
For each game session:
  1. Collect all question_answered events
  2. Compute:
     - correctness_rate = correct / total
     - avg_response_time = mean(responseTimeMs)
     - speed_accuracy_profile = classify(dominant response pattern)
     - action_variation_index = shannon_entropy(actionType distribution)
     - persistence = actions_after_failure / total_failures
     - frustration_score = accuracy_when_low_hp vs accuracy_when_healthy
     - learning_velocity = accuracy_second_half - accuracy_first_half
  3. Store in computed_metrics table
```

### Cross-Session Aggregation (Daily Rollup)

```
For each student per day:
  1. Average computed_metrics across all sessions
  2. Track trends:
     - accuracy_trend = linear regression slope over last 7 days
     - engagement_trend = session_count change week-over-week
     - mastery_by_subject = per-subject correctness_rate
  3. Store in student_metrics_daily table
```

### Mastery Thresholds

| Level | Correctness Rate | Response Profile | Interpretation |
|-------|-----------------|-----------------|----------------|
| **Not Yet** | < 0.40 | Any | Significant knowledge gaps; needs targeted support |
| **Developing** | 0.40–0.65 | Mostly deliberate or struggling | Knowledge present but not fluent; benefits from practice |
| **Proficient** | 0.65–0.85 | Mix of fluent and deliberate | Solid understanding; can handle grade-level content |
| **Advanced** | > 0.85 | Mostly fluent | Confident mastery; ready for acceleration |

### Adaptive Difficulty Response

The question engine (in `questionEngine.js:51-56`) uses a built-in assembly model:
- `skillRating` starts at 3 (mid-range)
- After each answer: `skillRating += correct ? 0.15 : -0.2` plus accuracy adjustment
- `correctStreak >= 3` → requested difficulty +1
- `wrongStreak >= 2` → requested difficulty -1
- This creates a real-time competency estimate that adapts task difficulty accordingly

---

## References

| File | Relevant Content |
|------|-----------------|
| `PulseRealms/src/systems/combatSystem.js` | Telemetry events emitted (lines 71-113) |
| `PulseRealms/src/systems/questionEngine.js` | Adaptive difficulty algorithm (lines 51-56, 92-111) |
| `PulseRealms/src/systems/telemetry.js` | Event storage format (lines 35-42) |
| `PulseRealms/src/config/constants.js` | Game configuration values |
| `EdGame Analytics Blueprint.md` | 6-dimension taxonomy and ECD framework |
