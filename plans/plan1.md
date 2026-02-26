# EdGame / Pulse Realms — Master Deliverables Plan

## Context

EdGame is a game-based educational assessment platform for Math & Science teachers. The core insight: traditional assessments tell teachers *that* a student scored 60%, but not *why*. EdGame captures 15+ behavioral analytics metrics through gameplay — detecting guessing patterns, frustration points, persistence, and concept-level gaps — then surfaces "Top 3 Insights" per student so teachers can act Monday morning.

**Current state:** A working 3v3 team arena game shell ("Pulse Realms") exists using KAPLAY.js with adaptive difficulty, MCQ-gated combat, telemetry, and progression systems. The plan is to build 3-5 games with different mechanics, all grounded in the EdGame Analytics Blueprint's Evidence-Centered Design (ECD) framework and 6-dimension metrics taxonomy.

**This plan covers 3 workstreams:**
1. Lab documentation deliverables (Labs 2 and 3 — Lab 4 skipped)
2. Semester + graduation project plan
3. GitHub issues for technical deliverables

**Diagram approach:** All key diagrams will be created as standalone HTML pages (professional, interactive, screenshottable) in addition to inline Mermaid in the markdown. HTML diagram files go in `TIE204Assignments/diagrams/`.

---

## Workstream 1: Lab Documentation

### Deliverable 1A: Lab 2 — System Architecture & Algorithm Mapping
**Output files:**
- `TIE204Assignments/Lab2_System_Architecture_Algorithm_Mapping.md`
- `TIE204Assignments/diagrams/system_architecture.html` — Professional system architecture diagram
- `TIE204Assignments/diagrams/algorithm_fsm_adaptive_difficulty.html` — Adaptive Difficulty FSM
- `TIE204Assignments/diagrams/algorithm_fsm_combat_resolution.html` — Combat Resolution FSM
- `TIE204Assignments/diagrams/algorithm_dataflow_metrics.html` — Metric Computation + Insight Generation dataflow
- `TIE204Assignments/diagrams/algorithm_mapping.html` — Algorithm-to-layer mapping visual

**Sections:**

1. **Header block** — Team name, course (TIE 204), date, project name (EdGame / Pulse Realms)

2. **Part 1: Problem Statement** (5-6 lines):
   - Who: Math & Science teachers (K-12, grades 4-12)
   - What: No visibility into *why* students struggle — only final scores, not behavioral/cognitive process
   - Context: Teacher assigns practice → receives a grade → must allocate limited class time blindly
   - Success: Game-based practice that yields top-3 actionable insights per student, computed from 15 behavioral metrics captured during gameplay via stealth assessment (ECD framework)

3. **Part 2: Algorithm Intent Table** (4 algorithms):

   | Algorithm | Purpose | Key Blueprint Alignment |
   |-----------|---------|------------------------|
   | Adaptive Difficulty | Keep students in ZPD; prevent frustration/boredom | Blueprint Part 3: "outer edges of do-ability" + flow theory; Dimension 5: frustration detection triggers difficulty adjustment |
   | Question-Gated Combat Resolution | Gate every game action behind MCQs — stealth assessment core | Blueprint Part 1: ECD evidence model — observable gameplay behaviors reveal competencies without test anxiety |
   | Behavioral Metric Computation | Transform raw events → 15 metrics across 6 dimensions | Blueprint Part 2: Full taxonomy (Cognitive, Engagement, Strategic, Social, SEL, Temporal) |
   | Top-3 Insight Generation | Distill metrics into 3 actionable teacher insights | Blueprint Part 4: "What Do I Do Monday Morning?" principle |

4. **Part 2b: Algorithm Models** — Both Mermaid in markdown AND professional HTML pages:
   - Adaptive Difficulty FSM (states: Initialize → Evaluate → AdjustUp/Down/Maintain → Select → Present → Record → loop)
   - Combat Resolution FSM (states: Idle → Validate → FetchQuestion → PresentMCQ → Evaluate → ApplyEffect/Miss → EmitTelemetry → GrantXP → loop)
   - Metric Computation Dataflow (Raw Events → Parser → 6 dimension processors → Aggregator → computed_metrics → daily rollup)
   - Insight Generation Dataflow (daily metrics + class baselines + historical trends → Priority Ranker → Top-3 Filter → StudentInsight[])

5. **Part 3: System Architecture Diagram** — Professional HTML page (`system_architecture.html`) showing:
   - Client Device layer (Student's browser / Chromebook)
   - Game Client layer (KAPLAY.js engine with Event Collector, Question Engine, Combat System, Adaptive Difficulty)
   - Cloud Application layer (Vercel Edge: Next.js + API Routes)
   - Backend Services layer (Supabase: PostgreSQL + Auth + Realtime + Storage)
   - Analytics Engine layer (Metric Computation + Insight Generator + Daily Rollup)
   - External Systems (Google Classroom LTI 1.3, Teacher Dashboard, Student/Teacher users)
   - Clear boundaries: Client SW / Cloud SW / External Systems

6. **Part 3b: Algorithm Mapping Table** with justification:

   | Algorithm | Layer | Location | Why |
   |-----------|-------|----------|-----|
   | Adaptive Difficulty | Game Client | Browser (client-side) | Must be <100ms to maintain game flow; per-session state; latency-sensitive |
   | Combat Resolution | Game Client | Browser (client-side) | Synchronous with game loop; overlay blocks game until answered |
   | Metric Computation | Data Processing | Supabase PostgreSQL (server-side) | Tamper-proof; needs full session event history; SQL aggregation |
   | Insight Generation | Business Intelligence | Vercel Edge + PostgreSQL | Cross-student comparison; historical data spanning sessions |

### Deliverable 1B: Lab 3 — Interfaces & Errors
**Output files:**
- `TIE204Assignments/Lab3_Interfaces_and_Errors.md`
- `TIE204Assignments/diagrams/functional_block_diagram.html` — Professional functional decomposition
- `TIE204Assignments/diagrams/interface_dependency_graph.html` — Dependency graph with cycle check

**Sections:**

1. **Task 1: Functional Block Diagram** — 12 blocks (Sense/Communicate/Process/Decide/Act):
   - FB-1 through FB-12 as designed in planning phase
   - Professional HTML diagram showing all blocks with colored categories and directional arrows

2. **Task 2: Interface List** — 16 interfaces with Producer/Consumer/Data/Direction
   - Sourced from `docs_markdown/interface-table.md` API contracts

3. **Task 3: Interface Contracts** — For each: Data, Update Rate, Timing Constraints, Validity Duration, Accuracy/Precision

4. **Task 4: Data Structures** — GameEvent, computed_metrics, StudentInsight, Question, SessionRecord classified as Measurement/Command/State/Event/Configuration/Log

5. **Task 5: Ownership Mapping Table** — Data × Owner × Who Updates × Who Reads × Who Can Modify

6. **Task 6: Blocking vs Non-Blocking** — MCQ overlay is only truly blocking interface (8s timer forces resolution)

7. **Task 7: Failure Modes** — Timeout, Invalid data, Missing data, Overflow for each critical interface

8. **Task 8: Interface Dependency Graph** — Professional HTML diagram; verified as DAG (no cycles)

9. **Task 9: Error Classification** — Deadlock (No), Livelock (theoretical adaptive oscillation, mitigated), Starvation (No)

10. **Task 11: Team Split Table** — Game Dev vs Backend+Dashboard ownership

---

## Workstream 2: Game Portfolio Design & Justification

### Design Philosophy (from Analytics Blueprint)

Each game must be designed using **Evidence-Centered Design (ECD)** where:
- **Competency Model**: Maps to specific curriculum standards + 21st-century skills
- **Evidence Model**: Every trackable action maps to competency variables through explicit evidence rules
- **Task Model**: Game levels calibrated to specific difficulty and skill targets
- **Assembly Model**: Adaptive sequencing based on accumulating competency estimates

Games must collectively cover all **6 Analytics Dimensions** from the Blueprint:
1. Cognitive Knowledge (correctness, response time, speed-accuracy, error types, BKT mastery)
2. Behavioral Engagement (play time, session frequency, completion, voluntary replay, dropout points)
3. Strategic Behavior & Agency (action variation, strategy classification, problem-solving paths, experimentation)
4. Social & Collaborative (communication, role adoption, team contribution, help-giving/seeking)
5. Affective & SEL (frustration, persistence after failure, impulse control, growth mindset)
6. Temporal & Longitudinal (learning rate, knowledge decay, improvement trajectory, skill transfer)

### Game 1: Pulse Realms — Team Arena (EXISTS)
**Mechanic:** 3v3 team combat where every attack/heal/shield is gated behind an MCQ
**Subject Focus:** Math & Science (configurable)
**Duration:** 5-10 min per match

**Blueprint Alignment & Analytics Value:**
| Dimension | What This Game Captures | How |
|-----------|------------------------|-----|
| D1: Cognitive | Correctness rate, response time, speed-accuracy profile, error classification | Every ability requires answering a subject question — correct = ability fires, wrong = miss. Speed of answer determines power multiplier (fast+correct = high damage) |
| D2: Engagement | Session frequency, voluntary replay, completion rate, play time | Match structure encourages "one more game" loops; progression system (XP, levels, badges) drives return visits |
| D3: Strategic | Strategy classification (role choice: Attacker/Healer/Builder), resource allocation (ability cooldowns), action variation | Player chooses role → reveals risk tolerance and preferred approach; must decide when to attack vs. heal vs. build shields |
| D4: Social | Role adoption, team contribution equity, cooperative game score | 3v3 format with AI allies shows how player coordinates; Phase 2 multiplayer adds communication + help-giving metrics |
| D5: SEL | Persistence after failure (retrying after missed questions), frustration indicators (rapid clicking, idle after loss), growth mindset (choosing harder difficulty) | Combat pressure creates authentic stress; how students respond to missing a question mid-fight reveals emotional regulation |
| D6: Temporal | Improvement trajectory (accuracy across sessions), mastery threshold tracking, learning rate | Adaptive difficulty + session history tracks skill growth over time |

**Why teachers care:** "See which students guess under pressure (fast answers, low accuracy) vs. which think carefully. Know if a student's fractions accuracy is improving or declining. Identify kids who give up after one wrong answer vs. those who persist."

### Game 2: Concept Cascade — Tower Defense
**Mechanic:** Students build and upgrade defensive towers by answering questions correctly. Waves of "misconception enemies" approach; each enemy represents a specific concept. Correct answers = tower fires; wrong answers = tower misfires. Students choose which towers to build/upgrade (resource allocation).
**Subject Focus:** Mathematics (number sense, operations, fractions, geometry)
**Duration:** 10-15 min per session

**Blueprint Alignment & Analytics Value:**
| Dimension | What This Game Captures Uniquely | How |
|-----------|----------------------------------|-----|
| D1: Cognitive | **Error type classification by concept** — each enemy type maps to a knowledge component; which enemies get through reveals specific concept gaps | Enemies are labeled by concept (e.g., "Fraction Phantom," "Decimal Dragon"); failing to stop them = that concept needs reteaching |
| D2: Engagement | **Dropout heatmaps** — which wave/level students quit at reveals frustration bottlenecks | Blueprint: "Where in the game students quit reveals frustrating content" |
| D3: Strategic | **Resource allocation decisions** — students must choose which towers to invest in (prioritize weak concepts vs. reinforce strong ones); **problem-solving path analysis** (order of tower upgrades reveals strategic thinking) | Blueprint Dimension 3: "How students allocate limited in-game resources reveals planning, prioritization, and strategic thinking" |
| D5: SEL | **Impulse control** — rushing tower placement vs. planning; **frustration → strategy shift** when enemies break through | Failing waves tests persistence; do students change strategy or repeat the same failing approach? (Blueprint: "productive vs. unproductive persistence") |
| D6: Temporal | **Knowledge decay detection** — revisiting previously mastered concept-towers after time gap reveals retention | Blueprint: "Performance decline on previously mastered content reveals retention strength" |

**Why teachers care:** "See exactly which math concepts each student is weakest at — if the 'Fraction Phantom' keeps getting through, that student needs fractions reteaching. See which students plan ahead (upgrade strategically) vs. react impulsively. Track whether mastered concepts stay mastered over weeks."

**Design principle from Blueprint:** "Multiple valid solution paths" — students can build different tower configurations and still succeed, revealing strategic diversity.

### Game 3: Lab Explorer — Virtual Science Lab
**Mechanic:** Open-ended science experiment simulation. Students receive a research question (e.g., "What affects the rate of a chemical reaction?"), choose equipment, set variables, run experiments, record observations, and draw conclusions. Sandbox exploration with guided challenges.
**Subject Focus:** Science (Chemistry, Physics)
**Duration:** 15-20 min per session

**Blueprint Alignment & Analytics Value:**
| Dimension | What This Game Captures Uniquely | How |
|-----------|----------------------------------|-----|
| D1: Cognitive | **Calculation accuracy** (measurement precision), **hypothesis quality** | Students must set precise values, read instruments correctly; hypothesis formulation reveals conceptual understanding depth |
| D2: Engagement | **Exploration breadth** — how many variables/tools students explore beyond the minimum | Blueprint: "Sandbox-like exploration within structured objectives gives students agency while ensuring evidence collection" |
| D3: Strategic | **Experimentation rate** — trying novel approaches; **Problem-solving path analysis** — sequence of experimental steps (process mining); **Self-correction rate** | Blueprint Dimension 3: "A virtual chemistry lab might allow students to reach the correct result through different experimental procedures—tracking which path reveals conceptual understanding depth" |
| D5: SEL | **Risk-taking behavior** — willingness to try experiments that might fail; **Boredom indicators** — minimal effort, rapid skipping | Open-ended format reveals whether students explore curiously or do the minimum |
| D6: Temporal | **Skill transfer** — can students apply learned principles to new experiments? | Blueprint: "The ultimate test of deep understanding vs. memorization" |

**Why teachers care:** "See the scientific *process*, not just whether students got the right answer. Know which students explore curiously (scientist mindset) vs. which follow rote procedures. Identify if students can *design* an experiment, not just execute one. See if a student who mastered density can apply it to a buoyancy problem (skill transfer)."

**Design principle from Blueprint:** "Scenario authenticity" — virtual labs provide "situated learning contexts where knowledge is applied authentically, producing more valid assessment evidence than decontextualized questions." Also "Freedom with boundaries" — sandbox exploration + structured objectives.

### Game 4: Knowledge Quest — Turn-Based RPG
**Mechanic:** Story-driven adventure where students progress through a narrative by solving subject questions to cast spells, persuade NPCs, and overcome obstacles. Includes branching dialogue with embedded social dilemmas (help an NPC vs. keep resources for yourself). Students can seek hints from a "mentor" character.
**Subject Focus:** Math & Science (mixed, story-contextualized)
**Duration:** 15-25 min per chapter

**Blueprint Alignment & Analytics Value:**
| Dimension | What This Game Captures Uniquely | How |
|-----------|----------------------------------|-----|
| D1: Cognitive | **Hint/help usage patterns** — strategic vs. over-dependent vs. never-asks; **BKT mastery tracking** across story chapters | Mentor hint system directly measures help-seeking behavior; Blueprint: "Overuse may indicate gaming the system; strategic use indicates self-regulated learning" |
| D2: Engagement | **Session duration + voluntary replay** — narrative hook drives longer sessions; replay reveals intrinsic motivation | Story creates "want to know what happens next" engagement that reveals genuine interest vs. compliance |
| D3: Strategic | **Action variation index** — dialogue choices reveal thinking diversity; **Risk-taking** — choosing harder quests for better rewards | Blueprint: "Higher variation suggests exploratory/creative thinking; low variation suggests rigid or rote approaches" |
| D5: SEL | **Empathy indicators** — branching choices between helping NPCs vs. self-interest; **Emotion regulation** — choices under story pressure; **Growth mindset** — choosing to retry failed quests | Blueprint Part 2 Dimension 5: "Assessed through scenario design where students choose between helping and self-advancement." This is the game specifically designed for SEL stealth assessment, modeled after Hall of Heroes research |
| D6: Temporal | **Improvement trajectory across chapters** — story progression naturally tracks learning over time | Each chapter maps to curriculum progression; longitudinal view across the full story arc |

**Why teachers care:** "See how students make decisions when there's no 'right answer' — do they help others or hoard resources? Know which students use hints strategically vs. those who are struggling silently (never ask for help) vs. those gaming the hint system. The story format reveals persistence — who pushes through a hard chapter vs. who abandons the quest?"

**Design principle from Blueprint:** "Embedded social dilemmas" — the RPG format naturally supports SEL assessment through story choices, directly implementing the Hall of Heroes research approach. Also "Calibrated difficulty progression" via adaptive story difficulty.

### Game 5: Survival Equation — Collaborative Puzzle Survival
**Mechanic:** 2-4 students are stranded in an environment (desert island, space station, underwater base) and must survive by solving subject problems collaboratively. Each student is assigned a unique specialist role with exclusive information/tools (e.g., one has the map, one has the calculator, one has the reference manual, one has the tools). Problems *require* combining information across roles — no single player can solve them alone. Students communicate through structured in-game messaging. In Phase 1, 1 human + AI partners (who respond based on student requests); in Phase 2, fully multiplayer.
**Subject Focus:** Math & Science (applied, contextualized survival problems)
**Duration:** 15-20 min per survival scenario

**Blueprint Alignment & Analytics Value:**
| Dimension | What This Game Captures Uniquely | How |
|-----------|----------------------------------|-----|
| D1: Cognitive | **Calculation accuracy in context** — math/science applied to authentic survival scenarios (e.g., calculating water purification ratios, structural load for shelter) | Blueprint: "Scenario authenticity — game environments inspired by real contexts provide situated learning where knowledge is applied authentically" |
| D2: Engagement | **Session duration, completion rate** — survival narrative creates compelling engagement; **Dropout heatmaps** — which scenarios cause disengagement | Survival urgency drives "must finish" engagement loops |
| D3: Strategic | **Resource allocation decisions** — limited supplies force prioritization; **Problem-solving path analysis** — multiple valid approaches to each survival challenge | Blueprint D3: "How students allocate limited resources reveals planning, prioritization, and strategic thinking." Each scenario has 2-3 valid solutions |
| D4: Social | **Communication frequency + quality**, **Role adoption**, **Team contribution equity**, **Help-giving/seeking**, **Conflict resolution** — this is THE social metrics game | Blueprint D4: "Multiplayer modes should be structured to *require* collaboration—not just allow it... assign each student a unique resource that must be shared to succeed." This game directly implements this recommendation |
| D5: SEL | **Empathy** (sharing scarce resources), **Impulse control** (waiting for team consensus vs. acting alone), **Social initiation** (who starts conversations) | Blueprint: "Embedded social dilemmas — multiplayer scenarios should include authentic social challenges requiring cooperation, negotiation, or leadership" |
| D6: Temporal | **Skill transfer** — can students apply concepts learned in one scenario to a new survival challenge? **Improvement trajectory** across scenarios | Blueprint: "Performance on novel problems requiring application of learned concepts — the ultimate test of deep understanding vs. memorization" |



**Why teachers care:** "See how students actually *collaborate* — who leads, who follows, who free-rides, who helps others. Know which students can apply math and science to real problems (not just answer decontextualized questions). Identify students who communicate well vs. those who stay silent. See if a student who understands ratios in class can actually use them to solve a water purification problem in context."


**Design principle from Blueprint:** This game directly implements three critical Blueprint principles: (1) "Embedded social dilemmas" requiring genuine interdependence, (2) "Scenario authenticity" via survival contexts, and (3) "Freedom with boundaries" — open-ended problem solving within structured survival objectives. It also addresses the Blueprint's strongest recommendation for D4: "Common goals, explicit role assignments, collaborative interfaces, and structured guidance for collective action."

**Phase 1 AI Partner Design:** Before multiplayer infrastructure exists, AI partners simulate collaboration by: responding to student requests for information ("What does your map show?"), offering hints when asked, and tracking all communication patterns. The student's communication *with AI partners* still reveals help-seeking behavior, communication quality, and leadership tendencies. This produces D4 data even in single-player mode, which gets significantly richer when real multiplayer launches in Phase 2.

### Analytics Coverage Matrix

| Blueprint Dimension | Game 1: Pulse Realms | Game 2: Concept Cascade | Game 3: Lab Explorer | Game 4: Knowledge Quest | Game 5: Survival Equation |
|---------------------|:---:|:---:|:---:|:---:|:---:|
| D1: Cognitive Knowledge | Strong | Strong | Strong | Strong | Strong |
| D2: Behavioral Engagement | Strong | Strong | Medium | Strong | Strong |
| D3: Strategic Behavior | Medium | **Primary** | **Primary** | Strong | Strong |
| D4: Social & Collaborative | Medium (Phase 2: Primary) | Weak | Medium | Medium | **Primary** |
| D5: Affective & SEL | Medium | Medium | Medium | **Primary** | Strong |
| D6: Temporal & Longitudinal | Medium | Strong | Strong | Strong | Strong |

**Key insight:** Every Blueprint dimension has at least one game where it's the **primary** focus:
- D3 (Strategic) → Concept Cascade + Lab Explorer
- D4 (Social) → Survival Equation (the only game designed from the ground up for collaboration metrics)
- D5 (SEL) → Knowledge Quest (embedded social dilemmas via branching narrative)

All 5 games capture D1 (Cognitive) and D2 (Engagement) as baseline since every game involves answering subject questions and tracking play patterns. The portfolio ensures teachers get a complete behavioral profile across all 6 dimensions — no blind spots.

### Why 5 Games, Not 1?

The Blueprint explicitly states: "The quality of analytics depends entirely on how well game mechanics elicit the behaviors being measured." A single game mechanic cannot authentically elicit all 50+ metrics across 6 dimensions. For example:
- **Speed-accuracy under pressure** requires fast-paced gameplay (Pulse Realms)
- **Resource allocation and strategic planning** requires tower defense / management gameplay (Concept Cascade)
- **Scientific process and experimentation** requires open-ended sandbox (Lab Explorer)
- **Empathy and social-emotional choices** requires narrative branching (Knowledge Quest)
- **Collaboration and communication** requires team interdependence (Survival Equation)

Each game is a different **diagnostic lens** on the same student — together, they paint the multidimensional portrait the Blueprint envisions.

---

## Workstream 3: Semester & Graduation Project Plan

**Output file:** `TIE204Assignments/EdGame_Project_Plan.md`

### Timeline (Feb 2026 → Sep 2026)

| Phase | Period | TIE 204 Alignment | Focus | Key Deliverables |
|-------|--------|-------------------|-------|-----------------|
| 1: Foundation & Design | Feb 26 – Mar 14 | Sprint 1 (Wks 1-3) | Problem validation, architecture freeze, algorithm design, lab deliverables | Lab 2 + Lab 3 docs, Architecture Freeze v1, Spec Draft |
| 2: Architecture & Alpha | Mar 15 – Apr 4 | Sprint 2 (Wks 4-6) | Next.js + Supabase scaffold, Game 1 migration, wireframes, API core | System Blueprint, UI Wireframes, MVP Alpha (Pulse Realms on platform) |
| 3: Implementation & Testing | Apr 5 – Apr 25 | Sprint 3 (Wks 7-9) | Game 2 build, auth/security, testing, metric engine, dashboard v1 | Security Plan, Test Checklist, Functional MVP (2 games + dashboard) |
| 4: Validation & Demo | Apr 26 – May 30 | Sprint 4 (Wks 10-14) | Game 3 build, CI/CD, integration tests, benchmarking, UX polish, final demo | CI/CD Evidence, Validation Plan, Performance Summary, Final MVP + Poster |
| 5: Research & Expansion | Jun 1 – Jul 31 | Post-semester | Games 4-5, efficacy study design, pilot outreach, analytics v2 | Games 4+5, Pilot study protocol, Literature review |
| 6: Thesis & Demo-Ready | Aug 1 – Sep 30 | Pre-graduation | Final documentation, thesis, public demo, poster | Thesis/capstone, Final demo |

### Sprint Deliverables (what professor evaluates)

**Sprint 1 (10%):** Problem statement, Algorithm Intent Tables, Architecture Sketch, Interface Design (Labs 2+3), Spec Draft
**Sprint 2 (10%):** System Blueprint (scaffold), UI Wireframes, MVP Alpha Snapshot (Pulse Realms on platform)
**Sprint 3 (10%):** Security Plan (Auth, RLS), Test Checklist, Functional MVP (2 games + dashboard with metrics)
**Sprint 4 + Final (40%):** CI/CD pipeline, Validation Plan, Performance Summary, 3 games, Teacher Dashboard with Top-3 Insights, Documentation, Poster

### Research Phases

| Phase | Period | Focus | Output |
|-------|--------|-------|--------|
| Literature Review | Feb-Mar | ECD, stealth assessment, game-based learning, BKT | Lit review chapter |
| Framework Design | Mar-Apr | Map game mechanics → Blueprint's 6 dimensions → 15 metrics | Assessment framework paper |
| Implementation | Apr-Jul | Build games + analytics pipeline | Working platform |
| Pilot Study Design | Jun-Jul | IRB-equivalent protocol, pre/post tests, surveys | Study protocol |
| Data Collection | Aug-Sep | Small pilot (1-2 classes if accessible) | Preliminary data |
| Thesis Writing | Aug-Sep | Full write-up | Thesis/capstone |

---

## Workstream 4: GitHub Issues

**Repository:** `yradwan147/TIEVenture` (GitHub name: "EdGame")

### Milestones

| Milestone | Due Date |
|-----------|----------|
| Sprint 1: Foundation & Design | Mar 14, 2026 |
| Sprint 2: Architecture & Alpha | Apr 4, 2026 |
| Sprint 3: Implementation & Testing | Apr 25, 2026 |
| Sprint 4: Validation & Demo | May 30, 2026 |
| Post-Semester: Research & Expansion | Jul 31, 2026 |
| Graduation: Thesis & Demo-Ready | Sep 30, 2026 |

### Issues (~30 total)

**Sprint 1 (6 issues):**
1. `[Tracker] Sprint 1: Foundation & System Design`
2. `Lab 2: System Architecture & Algorithm Mapping documentation`
3. `Lab 3: Interfaces & Errors documentation`
4. `Define EdGame Assessment Framework — map games to Blueprint's 6 dimensions`
5. `Architecture Freeze v1 — finalize Phase 1 architecture`
6. `Literature review: ECD, stealth assessment, game-based learning analytics`

**Sprint 2 (6 issues):**
7. `[Tracker] Sprint 2: Architecture & Prototyping`
8. `Scaffold Next.js + Supabase project (monorepo, deploy to Vercel)`
9. `Implement Supabase data model (tables, RLS, functions)`
10. `Migrate Pulse Realms to Next.js platform (connect to Supabase)`
11. `Build teacher dashboard wireframes & base UI (Tailwind + shadcn/ui)`
12. `Implement Phase 1 API routes (sessions, assignments, environments, analytics)`

**Sprint 3 (6 issues):**
13. `[Tracker] Sprint 3: Implementation & Optimization`
14. `Build Game 2: Concept Cascade (Tower Defense)`
15. `Implement authentication & security (Supabase Auth, Google OAuth, RLS)`
16. `Build Metric Computation Engine (15 core metrics + daily rollup)`
17. `Build Teacher Dashboard v1 (class analytics, Top-3 Insights, concept mastery)`
18. `Write unit tests (question engine, metric computation, combat system)`

**Sprint 4 (7 issues):**
19. `[Tracker] Sprint 4: Validation & Demo`
20. `Build Game 3: Lab Explorer (Virtual Science Lab)`
21. `Set up CI/CD pipeline (GitHub Actions → Vercel)`
22. `Integration testing (student plays → metrics computed → dashboard displays)`
23. `Performance benchmarking (API response times, game frame rate, load testing)`
24. `UX polish & final demo preparation (responsive, onboarding, poster)`
25. `Google Classroom LTI 1.3 integration`

**Post-Semester (5 issues):**
26. `[Tracker] Post-Semester: Research & Expansion`
27. `Build Game 4: Knowledge Quest (Turn-Based RPG with SEL assessment)`
28. `Build Game 5: Survival Equation (Collaborative Puzzle Survival with D4 social metrics)`
29. `Design pilot study protocol (surveys, pre/post tests, data plan)`
30. `Analytics v2: ML-powered insights (at-risk prediction, pattern detection)`

**Graduation (3 issues):**
31. `[Tracker] Graduation: Thesis & Final Deliverables`
32. `Write thesis/capstone document`
33. `Prepare final demo & poster`

Each issue includes: description with acceptance criteria, milestone assignment, labels (`sprint-N`, `game`, `platform`, `analytics`, `docs`, `research`), and due date.

---

## Execution Order

1. Create `TIE204Assignments/diagrams/` directory
2. Write Lab 2 markdown + 5 HTML diagram pages
3. Write Lab 3 markdown + 2 HTML diagram pages
4. Write EdGame Project Plan markdown
5. Create GitHub milestones (6)
6. Create GitHub issues (33) with labels, milestones, descriptions, due dates

---

## Verification

1. Open each markdown file — confirm all lab-required sections present, tables render
2. Open each HTML diagram in browser — confirm they're professional, clear, screenshottable
3. Run `gh issue list` — confirm all 33 issues with correct milestones
4. Cross-reference: lab docs reference actual PulseRealms code + docs_markdown specs
5. Verify game designs cover all 6 Blueprint dimensions with no gaps

---

## Key Source Files

| File | Used In |
|------|---------|
| `PulseRealms/src/systems/questionEngine.js` | Lab 2 (Adaptive Difficulty), Lab 3 (Question interfaces) |
| `PulseRealms/src/systems/combatSystem.js` | Lab 2 (Combat Resolution), Lab 3 (Combat interfaces) |
| `PulseRealms/src/systems/telemetry.js` | Lab 2 & 3 (Event system) |
| `PulseRealms/src/config/constants.js` | Lab 2 & 3 (Game configuration values) |
| `docs_markdown/spec-v1.0.md` | Lab 2 (Architecture), Lab 3 (API contracts), Project Plan |
| `docs_markdown/interface-table.md` | Lab 3 (44 API endpoint contracts with timing + errors) |
| `EdGame Analytics Blueprint.md` | Game design justification, assessment framework, all 6 dimensions |
| `docs_markdown/business-model-canvas.md` | Project Plan (value proposition, market targets) |
