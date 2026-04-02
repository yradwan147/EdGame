# ECD Mapping: Survival Equation — Collaborative Puzzle Survival

> **Status:** IMPLEMENTED — Game code complete at `apps/games/survival-equation/`

## Game Overview

- **Mechanic:** 1 human player + 3 AI partners stranded in a survival scenario. Each team member has a unique specialist role with exclusive information. Problems require combining knowledge across roles. Players communicate via a chat system, allocate shared resources, and solve applied math/science puzzles under escalating time pressure.
- **Subject:** Math & Science (applied survival problems)
- **Duration:** 15-20 min per scenario (5 days per scenario)
- **Primary Analytics Dimension:** D4 (Communication & Collaboration — message quality, information sharing, team contribution equity, leadership patterns)
- **Engine:** KAPLAY.js, 1280x720 canvas

---

## 1. Competency Model

| Competency | Description | Game Mechanic |
|-----------|-------------|---------------|
| **Applied Problem-Solving** | Math/science applied to authentic survival contexts (water purification ratios, structural load calculations, signal frequencies). | Each day presents a scenario-specific puzzle requiring calculations from multiple specialist domains; question accuracy scaled by difficulty |
| **Communication Quality** | On-task vs. off-task messaging; information sharing completeness; appropriate information requests. | Chat system with NLP classification: on-task keywords, info-sharing keywords, info-request keywords, off-task keywords; per-sender stats tracked |
| **Team Contribution Equity** | Even distribution of interaction across all team partners (not just one). | Partner equity computed via interaction count per AI partner; deviation from equal interaction penalized |
| **Leadership** | Proactive information gathering, proposing solutions before being asked, coordinating team input before making decisions. | Info request ratio (requests / total messages); waited-for-partner vs. solved-without-consulting events; leadership score = `min(1, requestRatio * 2.5)` |
| **Information Sharing** | Willingness to share exclusive role knowledge with the team. | Info-share rate tracked per message; messages containing data-sharing keywords scored; `infoFlowScore = (requestRatio*2 + infoShareRate*3) / 2` |
| **Resource Fairness** | Equitable allocation of scarce resources (food, water, materials) rather than hoarding. | Resource allocation history tracked; sharing events vs. total allocations; Gini coefficient computed for distribution equity |

## 2. Evidence Model

### Telemetry Events

| Event | Payload | Dimension |
|-------|---------|-----------|
| `message_sent` | sender, text, type, isInfoShare, isInfoRequest, isOnTask, isOffTask | D4 |
| `information_requested` | sender, targetRole, topic, responseReceived | D4 |
| `information_shared` | sender, infoType (blueprint/lab_report/medical_chart/field_map), recipientRole | D4 |
| `resource_allocation` | before {food,water,materials}, distribution {food,water,materials}, after {food,water,materials} | D3, D4, D5 |
| `resource_sharing` | amount, recipientScenario, context (rival_camp/team_need) | D5 |
| `puzzle_solved` | puzzleId, score, durationMs, stepResults[], day, scenarioId | D1, D2 |
| `question_answered` | questionId, subject (applied_math/applied_science), difficulty, correct, responseTimeMs | D1 |
| `day_started` | day, scenarioId, briefing, resources, teamHealth | D2 |
| `day_completed` | day, scenarioId, puzzleScore, resourcesRemaining, teamHealthAfter, eventOutcome | D2 |
| `event_triggered` | type (storm/sickness/encounter/pressure_loss/solar_flare/creature_attack/volcanic_activity/rescue_window), name, healthDamage, mitigated | D2, D3 |
| `leadership_pattern` | requestsInitiated, solutionsProposed, waitedForPartner, solvedWithoutConsulting | D4 |
| `conflict_event` | type (resource_disagreement/plan_disagreement), aiPartnerId, resolution (accepted/overridden/compromised) | D4, D5 |
| `partner_interaction` | partnerId, partnerName, messageCount, interactionType (chat/request/response) | D4 |
| `scenario_completed` | scenarioId, daysSurvived, totalScore, overallGrade, overallLabel, strengths, growthAreas | D1-D6 |
| `waited_for_partner` | partnerId, waitDurationMs, context | D5 |
| `solved_without_consulting` | puzzleId, context | D5 |

### Evidence Rules

- **Knowledge accuracy** (D1): `correctCount / questionsAnswered`, scaled by average difficulty (`accuracy * (0.7 + avgDifficulty * 0.06)`)
- **Task completion** (D2): `completionRate * 0.5 + avgPuzzleScore * 0.3 + survivalRate * 0.2`
- **Resource efficiency** (D3): `min(1, remainingResources / (startTotal * 0.5))`
- **Resource balance** (D3): deviation of {food, water, materials} from equal thirds of total — lower deviation = higher score
- **Message quality** (D4): `onTaskRatio * 0.5 + min(1, infoShareRate * 3) * 0.5`
- **Information flow** (D4): `min(1, (requestRatio*2 + infoShareRate*3) / 2)`
- **Partner equity** (D4): interaction distribution evenness across all 3 AI partners (1 - normalized deviation)
- **Participation volume** (D4): `min(1, playerMessages / 20)`
- **Leadership score** (D4): `min(1, infoRequestRatio * 2.5)`
- **Sharing behavior** (D5): positive allocations / total allocations
- **Patience** (D5): `waitedForPartner / (waitedForPartner + solvedWithoutConsulting)`
- **Team health maintenance** (D5): average team health / 100
- **Performance trend** (D6): puzzle score improvement first half vs. second half of scenario
- **Adaptation** (D6): recovery count after failures / (total steps * 0.3)

## 3. Task Model

### 3 Scenarios x 5 Days

| Scenario | Difficulty | Setting | Start Resources | Daily Consumption |
|----------|-----------|---------|----------------|-------------------|
| **Desert Island** | 1 | Tropical survival after shipwreck | Food 60, Water 40, Materials 50 | Food 12, Water 16, Materials 0 |
| **Space Station** | 2 | Orbital emergency after micrometeorite impact | Food 50, Water 50, Materials 40 | Food 10, Water 10, Materials 5 |
| **Underwater Base** | 3 | Deep-sea crisis after earthquake | Food 45, Water 55, Materials 35 | Food 11, Water 8, Materials 8 |

### Day Structure (Desert Island example)

| Day | Title | Puzzle | Escalating Event | Resource Bonus |
|-----|-------|--------|-----------------|----------------|
| 1 | Landfall | Water Purification | -- | Food +5, Materials +10 |
| 2 | Storm Warning | Shelter Construction | Tropical Storm (25 HP damage, 80% mitigated by shelter) | Water +10 |
| 3 | Fever Strikes | Medical Diagnosis | Tropical Fever (15 HP damage, 90% mitigated by diagnosis) | Food +8, Water +5, Materials +5 |
| 4 | Rival Camp | Resource Negotiation | Rival Survivors (trade or conflict) | Materials +15 |
| 5 | Rescue Signal | Signal Boost | Rescue Aircraft (signal must reach plane) | -- |

Each scenario follows the same escalation pattern: basic survival (day 1), environmental threat (day 2), health crisis (day 3), social encounter (day 4), final rescue attempt (day 5).

### 4 Specialist Roles with Information Asymmetry

| Role | Name | Expertise | Exclusive Info Style | Assessment Value |
|------|------|-----------|---------------------|-----------------|
| **Structural Engineer** | Raza | Materials & Structures | Blueprint data | Tests whether player requests structural specs before building |
| **Field Scientist** | Juno | Formulas & Chemistry | Lab report data | Tests whether player asks for calculations before guessing |
| **Field Medic** | Kit | Health & Safety | Medical chart data | Tests whether player considers safety constraints |
| **Scout Navigator** | Navi | Terrain & Weather | Field map data | Tests whether player gathers environmental intel |

Each AI partner holds exclusive puzzle-relevant information. Solving puzzles optimally requires requesting and combining information from multiple specialists (information asymmetry design).

### AI Partners with Personalities

Each AI partner has distinct personality traits that affect collaboration dynamics:

| Partner | Confidence | Verbosity | Caution | Humor | Speaking Style |
|---------|-----------|-----------|---------|-------|---------------|
| Raza (Engineer) | 0.85 | 0.5 | 0.3 | 0.4 | Direct and confident, sometimes overestimates |
| Juno (Scientist) | 0.7 | 0.9 | 0.6 | 0.3 | Precise and detailed, gives extra context |
| Kit (Medic) | 0.5 | 0.6 | 0.95 | 0.2 | Nervous but caring, always asks for safety checks |
| Navi (Navigator) | 0.75 | 0.4 | 0.2 | 0.7 | Adventurous and observant, suggests exploration |

Partners have disagreement triggers (e.g., Kit objects to dangerous plans, Juno objects to skipping calculations), reaction animations, and templated responses for greetings, domain expertise, puzzle hints, agreement, disagreement, urgency, and idle chat.

### Varied Mini-Puzzles

Puzzles are scenario-specific and applied:
- **Water Purification** — calculate filtration ratios and boiling times
- **Shelter Construction** — structural load calculations with material properties
- **Signal Boost** — electrical circuit design for signal amplification
- **Medical Diagnosis** — symptom analysis and treatment dosage
- **Resource Negotiation** — game-theory-style trading decisions
- *Space Station*: oxygen recycling, hull repair, solar panel fix, communication relay, escape pod launch
- *Underwater Base*: pressure seal, deep water filtration, specimen containment, vent analysis, surface signal

### Resource Management

- 3 resource types: Food, Water, Materials
- Daily consumption depletes resources automatically
- Puzzle success unlocks resource bonuses
- Events can damage team health (mitigated by successful puzzle completion)
- Resource allocation decisions are tracked for equity analysis
- Day timer: 210 seconds per day (configurable via `DEFAULT_SETTINGS.dayTimerSec`)

## 4. Assembly Model

### D4 Scoring (Primary Dimension)

The primary dimension (D4 Communication & Collaboration) uses a composite of 5 weighted sub-scores:

| Sub-Score | Weight | Computation |
|-----------|--------|-------------|
| Message Quality | 25% | `onTaskRatio * 0.5 + min(1, infoShareRate * 3) * 0.5` |
| Information Flow | 25% | `min(1, (requestRatio*2 + infoShareRate*3) / 2)` |
| Partner Equity | 20% | `1 - normalizedDeviation` of interaction counts across partners |
| Participation | 15% | `min(1, playerMessages / 20)` |
| Leadership | 15% | `min(1, infoRequestRatio * 2.5)` |

### Gini Coefficient for Resource Equity

Resource allocation fairness is measured using the Gini coefficient:

```
sorted = sort(shares)
n = length(shares)
mean = sum(shares) / n
gini = sum(|shares[i] - shares[j]|) / (2 * n^2 * mean)
```

Lower Gini = more equitable distribution (0 = perfect equality, 1 = perfect inequality). Students who hoard resources while partners go without receive lower D5 (Empathy) scores.

### Communication Quality Metrics

Messages are classified in real-time using keyword matching:

| Classification | Keywords | Scoring Impact |
|---------------|----------|---------------|
| **Info Share** | "found", "discovered", "my data says", "according to", "the report shows", "blueprint", "chart", "map", "lab report" | Positive — increases D4 score |
| **Info Request** | "what", "how", "can you", "do you know", "anyone know", "need help", "tell me", "explain", "check" | Positive — indicates collaborative leadership |
| **Off-Task** | "lol", "haha", "bored", "whatever", "who cares", "meh" | Negative — reduces on-task ratio |
| **On-Task** | Not off-task, or is info-share/request | Positive — baseline quality |

Communication quality score: `onTask * 0.3 + infoShare * 0.3 + requests * 0.2 + volume * 0.2`

### Leadership Classification

Based on communication patterns, the system classifies leadership style:
- **Proactive Leader**: high info-request ratio, frequently waits for partner input before decisions
- **Collaborative**: balanced info requests and shares, moderate wait-for-partner rate
- **Lone Wolf**: low info-request ratio, frequently solves without consulting
- **Passive**: low overall message volume, few requests or shares

### Overall Assessment Weights

| Dimension | Weight | Description |
|-----------|--------|-------------|
| D1 (Knowledge) | 10% | Question accuracy, difficulty-scaled |
| D2 (Completion) | 15% | Puzzles completed, puzzle quality, days survived |
| D3 (Strategy) | 15% | Resource efficiency, balance, first-attempt accuracy |
| D4 (Collaboration) | **30%** | Message quality, info flow, partner equity, participation, leadership |
| D5 (Empathy) | 15% | Sharing behavior, patience, team health maintenance |
| D6 (Growth) | 15% | Performance trend, adaptation after failures |

### Grade Labels

| Score Range | Grade | Label |
|------------|-------|-------|
| >= 0.90 | A+ | Exceptional Survivor |
| >= 0.80 | A | Team Leader |
| >= 0.70 | B+ | Strong Collaborator |
| >= 0.60 | B | Reliable Teammate |
| >= 0.50 | C+ | Learning Survivor |
| >= 0.40 | C | Growing Together |
| < 0.40 | D | Keep Practicing |
