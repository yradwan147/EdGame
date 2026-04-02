# ECD Mapping: Lab Explorer — Virtual Science Lab

> **Status:** IMPLEMENTED — Game code complete at `apps/games/lab-explorer/`

## Game Overview

- **Mechanic:** Open-ended science experiment simulation with guided 6-phase flow. Students choose equipment, form hypotheses, set variables, run experiments, observe results, and draw conclusions. Includes discovery journal and disaster gallery.
- **Subject:** Science (Chemistry, Physics)
- **Duration:** 15-20 min per session (per experiment)
- **Primary Analytics Dimension:** D3 (Scientific Process — equipment selection, variable exploration, systematic experimentation, self-correction, phase completeness)
- **Engine:** KAPLAY.js, 1280x720 canvas

---

## 1. Competency Model

| Competency | Description | Game Mechanic |
|-----------|-------------|---------------|
| **Scientific Process Skills** | Ability to follow the full scientific method: hypothesize, select equipment, manipulate variables, observe, conclude. | 6-phase experiment flow (hypothesis, equipment, variable, run, observe, conclude); process mining evaluates phase completeness and sequence |
| **Measurement Accuracy** | Precision of experimental results relative to the target range. Partial credit for process. | Each experiment defines targetMin/targetMax; accuracy scored as distance from target center (0-20 points) |
| **Hypothesis Quality** | Selecting the correct hypothesis before experimentation and drawing valid conclusions afterward. | Multiple-choice hypothesis and conclusion options per experiment; correct selection scores 20 points, incorrect scores 5 |
| **Equipment Knowledge** | Selecting the right tools for each experiment from a catalog of 20 pieces across 5 categories. | Required vs. available equipment per experiment; score penalizes wrong picks (3 points each, max penalty 10) and rewards correct selections |
| **Systematic Experimentation** | Changing one variable at a time between runs (controlled experiment design). | Run history analyzed: if >=50% of consecutive runs changed only one variable, flagged as systematic; random = 30% score, systematic = 100% |

## 2. Evidence Model

### Telemetry Events

| Event | Payload | Dimension |
|-------|---------|-----------|
| `equipment_selected` | experimentId, selectedEquipment[], requiredEquipment[], correct[], incorrect[], missing[], score (0-20) | D3 |
| `hypothesis_submitted` | experimentId, selectedId, correctId, isCorrect, score (0-20) | D1, D3 |
| `variable_adjusted` | experimentId, variableName, oldValue, newValue, runNumber | D3 |
| `experiment_run` | experimentId, runNumber, variableSettings, numericResult, visualDescription, resultColor, withinTarget | D1, D3 |
| `self_correction` | experimentId, previousResult, newResult, movedCloserToTarget, runNumber | D3 |
| `discovery_found` | discoveryId, name, description, experimentId | D2, D5 |
| `failure_triggered` | failureId, animation, description, experimentId | D2, D5 |
| `observation_selected` | experimentId, observationId, isCorrect | D1 |
| `conclusion_submitted` | experimentId, selectedId, isCorrect, score (0-20) | D1, D3 |
| `experiment_completed` | experimentId, totalScore, durationMs, runCount, wasSystematic, selfCorrectionCount, phaseSequence | D1-D6 |
| `question_answered` | questionId, subject (chemistry/physics), difficulty, correct, responseTimeMs | D1 |
| `goggles_worn` | experimentId, worn (boolean) | D5 |
| `extreme_value_attempted` | experimentId, variableName, value, isExtremeHigh, isExtremeLow | D5 |
| `wrong_tool_attempted` | experimentId, toolId, reason | D5 |
| `journal_entry_added` | experimentId, discoveryId | D2 |

### Evidence Rules

- **Question accuracy** (D1): `questionsCorrect / questionsAnswered` weighted at 40% of D1 score
- **Measurement accuracy** (D1): `max(0, 1 - bestAccuracyError)` weighted at 30% of D1 score
- **Hypothesis + conclusion** (D1): 15% each for correct hypothesis and correct conclusion
- **Equipment quality** (D3): `equipmentScore / 20` weighted at 20% of D3 score
- **Exploration breadth** (D3): variable space coverage (unique values per variable / total possible) weighted at 25% of D3 score
- **Systematic rate** (D3): binary (systematic = 1.0, random = 0.3) weighted at 25% of D3 score
- **Self-correction count** (D3): `min(selfCorrections / 3, 1.0)` weighted at 15% of D3 score
- **Phase completeness** (D3): proportion of 6 expected phases present in step sequence, weighted at 15% of D3 score
- **Safety awareness** (D5): goggles worn (60%) + no excessive wrong tool attempts (40%)
- **Risk-taking** (D5): extreme value attempts normalized to 3 (curiosity indicator, not penalized)
- **Curiosity** (D5): unique discoveries found normalized to 3
- **Skill transfer** (D6): accuracy improvement rate across experiments + first-half vs. second-half score comparison

## 3. Task Model

### 5 Experiments

| Experiment | Subject | Difficulty | Variables | Target | Key Concepts |
|-----------|---------|-----------|-----------|--------|-------------|
| **Acid-Base Neutralization** | Chemistry | 1 | acidDrops (0-20), baseDrops (0-20) | pH 6.5-7.5 | pH scale, neutralization, exothermic reactions |
| **Density Investigation** | Chemistry | 2 | material type, volume, mass | Correct density calculation | Mass, volume, density formula, material properties |
| **Electrical Circuits** | Physics | 2 | voltage, resistance, components | Target current/brightness | Ohm's law, series/parallel circuits, V=IR |
| **Pendulum Motion** | Physics | 3 | string length, mass, release angle | Target period | Period formula, gravity, controlled variables |
| **Heat Transfer** | Physics | 3 | material, thickness, temperature differential | Target transfer rate | Conduction, insulation, thermal conductivity |

Experiments unlock sequentially (complete N to unlock N+1).

### 6-Phase Experiment Flow

| Phase | Activity | Assessment Value |
|-------|----------|-----------------|
| 1. **Hypothesis** | Select from 4 hypothesis options before experimenting | Tests prediction skill and prior knowledge |
| 2. **Equipment** | Choose tools from available catalog (correct + distractor items) | Tests procedural knowledge and lab familiarity |
| 3. **Variable** | Adjust independent variables using slider/input controls | Tests systematic vs. random experimentation |
| 4. **Run** | Execute the experiment and observe the computed result | Tests iterative approach and convergence strategy |
| 5. **Observe** | Select correct observations from multiple options | Tests observation and interpretation skills |
| 6. **Conclude** | Select the correct conclusion from 4 options | Tests ability to synthesize evidence into understanding |

### Equipment Catalog (20 pieces, 5 categories)

| Category | Equipment |
|----------|-----------|
| **Measuring** | Beaker, Graduated Cylinder, pH Meter, Thermometer, Digital Scale, Litmus Paper, Ruler, Stopwatch |
| **Heating** | Bunsen Burner |
| **Electrical** | Ammeter, Voltmeter, Connecting Wires, Battery Pack, Resistor, Switch, Light Bulb |
| **Safety** | Safety Goggles |
| **Materials** | String, Weight Set, Insulation Kit |

### Discovery Journal

Hidden discoveries triggered by specific variable/result conditions (e.g., pH < 1 triggers "Extreme Acid Zone", exact pH 7.00 triggers "Perfect Neutral"). Tracked in a persistent journal that rewards scientific curiosity.

### Disaster Gallery

Spectacular failure states triggered by extreme or dangerous combinations (e.g., acidDrops >= 18 AND baseDrops >= 18 triggers "Foam Eruption"; pH < 2 triggers "Beaker Dissolve"). Collected in a gallery that de-stigmatizes failure and encourages boundary exploration.

### Professor Challenges

Embedded questions (chemistry and physics) appear during experiments, using the shared questionEngine with adaptive difficulty and a 15-second time limit.

## 4. Assembly Model

### Scoring Rubric (5 categories, 20 points each = 100 total)

| Category | Max Points | Scoring Method |
|----------|-----------|---------------|
| **Equipment Selection** | 20 | `correctRatio * 20 - wrongPenalty` (3 pts per wrong pick, max penalty 10) |
| **Hypothesis Quality** | 20 | Correct = 20, Incorrect = 5 |
| **Exploration Breadth** | 20 | Variable space coverage (60%) + run count bonus with diminishing returns (40%) |
| **Measurement Accuracy** | 20 | `20 * (1 - bestError/2)` where error = distance from target range |
| **Conclusion Quality** | 20 | Correct = 20, Incorrect = 5 |

### Process Mining Analysis

The assessment engine evaluates experiment process quality beyond simple correctness:

- **Phase completeness**: What proportion of the 6 expected phases (hypothesis, equipment, variable, run, observe, conclude) were actually performed?
- **Step sequence analysis**: Were phases performed in the expected order, or did the student skip ahead?
- **Self-correction detection**: When a result moved away from target, did the student adjust variables to move back toward it? (`countSelfCorrections` compares consecutive run distances from target center)

### Systematic vs. Random Experimentation Detection

```
For each consecutive pair of runs:
  changedVars = variables where run[i] != run[i-1]
  if changedVars.length === 1: systematicCount += 1

systematicRate = systematicCount / (totalRuns - 1)
wasSystematic = systematicRate >= 0.50
```

Students who change one variable at a time (controlled experiments) receive full process credit. Random experimenters (multiple variables changed simultaneously) receive reduced credit (30% of systematic score).

### Overall Assessment Weights

| Dimension | Weight | Description |
|-----------|--------|-------------|
| D1 (Knowledge) | 15% | Question accuracy, measurement, hypothesis, conclusion |
| D2 (Efficiency) | 10% | Experiments completed, time per experiment, run efficiency |
| D3 (Process) | **40%** | Equipment, exploration, systematic rate, self-correction, phase completeness |
| D5 (Dispositions) | 20% | Safety awareness, risk-taking, curiosity (discoveries) |
| D6 (Transfer) | 15% | Accuracy improvement across experiments, skill transfer |
