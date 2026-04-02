# ECD Mapping: Concept Cascade — Tower Defense

> **Status:** IMPLEMENTED — Game code complete at `apps/games/concept-cascade/`

## Game Overview

- **Mechanic:** Tower defense with question-gated tower building/upgrading, tower synergy discovery, and risk/reward mechanics
- **Subject:** Mathematics (number sense, operations, fractions, geometry)
- **Duration:** 10-15 min per session (8 waves + boss wave)
- **Primary Analytics Dimension:** D3 (Strategic Behavior — resource allocation, tower placement, synergy discovery, risk-taking)
- **Engine:** KAPLAY.js, 1280x720 canvas

---

## 1. Competency Model

| Competency | Description | Game Mechanic |
|-----------|-------------|---------------|
| **Concept-Specific Mastery** | Each enemy type maps to a KC. Breakthroughs reveal gaps. | 4 enemy types: Number Sprite (number sense), Operation Ogre (operations), Fraction Phantom (fractions), Geometry Golem (geometry) |
| **Resource Allocation** | Strategic investment in tower types reveals planning skill. | 4 tower types with different costs (40-100 KC), 3-tier upgrades with branching at level 3 |
| **Productive Persistence** | Strategy adaptation after wave failures vs. rigid repetition. | Strategy shift detection between waves, tower composition changes |
| **Risk Assessment** | Willingness to take calculated risks for greater rewards. | Early Call (+30% gold bonus), Risky Upgrade (free upgrade vs. level demotion) |
| **Systems Thinking** | Discovering emergent synergies between tower types. | 5 synergy combos (Chain Calculation, Shatter Shot, Knowledge Nexus, Frost Cannon, Fortified Line) |

## 2. Evidence Model

### Telemetry Events

| Event | Payload | Dimension |
|-------|---------|-----------|
| `question_answered` | questionId, subject, difficulty, correct, responseTimeMs, context (build/upgrade/risky/study) | D1 |
| `tower_placed` | towerType, tileCol, tileRow, goldSpent, questionCorrect, responseTimeMs | D3 |
| `tower_upgraded` | towerType, towerId, oldLevel, newLevel, goldSpent | D3 |
| `risky_upgrade_attempted` | towerType, success, difficultyJump | D3, D5 |
| `early_call_used` | waveNumber, bonusKC | D3 |
| `wave_completed` | waveNumber, enemiesKilled, enemiesLeaked, durationMs | D2, D3 |
| `synergy_discovered` | synergyId, synergyName, towerIds | D3 |
| `strategy_shift_detected` | fromPattern, toPattern, waveNumber | D3 |
| `resource_allocation` | goldEarned, goldSpent, goldSaved, savingsRate | D3 |
| `concept_gap_detected` | knowledgeComponent, enemiesLeaked | D1 |
| `chain_kill` | count, bonusKC | D2 |

### Evidence Rules

- **Correctness rate** (D1): `questionsCorrect / questionsAnswered` per subject
- **Speed-accuracy profile** (D1): classify from responseTimeMs + correctness
- **Tower diversity** (D3): Shannon entropy of tower type distribution [0-1]
- **Strategy shifts** (D3): significant change in tower type distribution between waves
- **Resource efficiency** (D3): `goldSpent / totalGoldEarned`
- **Early call usage** (D3): proportion of waves with early call — risk-taking indicator
- **Synergy discovery** (D3): count of unique synergies found — systems thinking indicator
- **Persistence after leak** (D5): continued engagement after losing lives
- **Learning velocity** (D6): accuracy improvement first half vs second half

## 3. Task Model

### Wave Structure (Difficulty Progression)

| Wave | Enemies | Math KC Focus | Question Difficulty |
|------|---------|---------------|-------------------|
| 1 | 8 Number Sprites | Number Sense | 1-2 |
| 2 | 12 Number Sprites | Number Sense | 1-2 |
| 3 | 6 Sprites + 4 Ogres | + Operations | 2-3 |
| 4 | 6 Phantoms + 5 Sprites | + Fractions | 2-3 |
| 5 | Mixed (all three types) | Mixed | 3 |
| 6 | 3 Golems + Sprites + Ogres | + Geometry | 3-4 |
| 7 | Full assault (all types) | Mixed | 4 |
| 8 | Concept Dragon boss + minions | Mixed | 4-5 |

### Tower Types (Strategic Options)

| Tower | Cost | Role | Subject |
|-------|------|------|---------|
| Number Bastion | 40 KC | Reliable DPS | Number Sense |
| Operation Cannon | 70 KC | Splash damage | Operations |
| Fraction Freezer | 55 KC | Crowd control (slow) | Fractions |
| Geometry Guard | 100 KC | Long-range sniper | Geometry |

Each tower has 3 upgrade tiers with branching specializations at tier 3.

### Enemy Behaviors (Assessment Value)

| Enemy | Behavior | Assessment Signal |
|-------|----------|------------------|
| Number Sprite | Swarm, scatter on death | Tests broad coverage strategy |
| Operation Ogre | Lockstep march, periodic flex | Tests sustained DPS |
| Fraction Phantom | Flickers (reduced hit chance) | Tests slow/crowd-control strategy |
| Geometry Golem | Cracks at 50% HP, splits into fragments | Tests burst damage strategy |
| Concept Dragon | 3 phases, spawns minions | Tests adaptive strategy under pressure |

## 4. Assembly Model

### Mastery Thresholds

| Level | Correctness Rate | Strategy | Interpretation |
|-------|-----------------|----------|----------------|
| Not Yet | < 0.40 | Single tower type | Significant knowledge gaps, rigid strategy |
| Developing | 0.40-0.65 | 2 tower types | Building understanding, limited adaptation |
| Proficient | 0.65-0.85 | 3+ types, some synergies | Grade-level competent, strategic thinking |
| Advanced | > 0.85 | Diverse + synergies + risk-taking | Ready for acceleration, systems thinking |

### Adaptive Difficulty

Question difficulty adapts via the shared questionEngine:
- Skill rating starts at 3, adjusts ±0.15-0.20 per answer
- Streak tracking: 3 correct → difficulty +1, 2 wrong → difficulty -1
- Tower upgrades request +1 difficulty; risky upgrades request +2

### Concept Gap Identification

When enemies of a specific KC type breach defenses, it signals a concept gap:
- Fraction Phantoms leaking → student may struggle with fractions (also: may need slow towers)
- Geometry Golems leaking → student may struggle with geometry (also: may need burst damage)
- The distinction between "wrong tower strategy" vs "wrong answers" is made by correlating leak events with question accuracy per subject
