# EdGame — Project Plan
## Game-Based Educational Assessment Platform
**Version:** 1.0
**Date:** February 2026
**Team:** EdGame Team
**Course:** TIE 204: MVP Studio | Prof. Dr. Amr T. Abdel-Hamid | KAUST
**Timeline:** February 2026 — September 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Game Portfolio](#3-game-portfolio)
4. [Technical Architecture (Phase 1)](#4-technical-architecture-phase-1)
5. [Master Timeline](#5-master-timeline)
6. [Research Roadmap](#6-research-roadmap)
7. [Risk Register](#7-risk-register)
8. [Success Metrics](#8-success-metrics)
9. [Technology & Tools](#9-technology--tools)
10. [Team & Responsibilities](#10-team--responsibilities)

---

## 1. Executive Summary

EdGame transforms how teachers understand student learning. Traditional homework tells teachers *that* a student scored 60% — EdGame tells them *why*. Through 5 purpose-built game environments, the platform captures 15+ behavioral analytics metrics using stealth assessment grounded in Evidence-Centered Design (ECD), then surfaces the "Top 3 Insights" per student so teachers can take immediate instructional action.

**The core value for teachers:** "Assign a 15-minute game instead of a worksheet. Get 10x the insight."

**What makes this different from Kahoot!, IXL, or Prodigy:**
- **Kahoot!** shows you scores — EdGame shows you *why students scored that way*
- **IXL** tracks correctness — EdGame tracks guessing patterns, frustration, persistence, and strategy
- **Prodigy** adapts difficulty — EdGame also diagnoses specific misconceptions and behavioral patterns

The platform is powered by four core algorithms — Adaptive Difficulty, Question-Gated Combat Resolution, Behavioral Metric Computation, and Top-3 Insight Generation — that together form a complete stealth assessment pipeline: keeping students engaged, invisibly assessing them, transforming raw events into metrics, and surfacing actionable teacher insights.

---

## 2. Problem Statement

Math & Science teachers (K-12, grades 4-12) assign homework, receive grades, and must plan instruction for 30+ students with different needs — but a grade provides zero diagnostic insight. Was the student confused about the concept? Guessing under time pressure? Disengaged? Frustrated? The gap between "score" and "diagnosis" wastes class time.

Teachers reteach content some students already know while missing the specific misconceptions of those who are struggling. A gradebook column of numbers tells you nothing about the process behind each answer.

**Success looks like:** A teacher assigns a 15-minute game, and the next morning sees:
- *"Sarah struggles with fractions (42% accuracy, guessing under time pressure — fast answers, low accuracy)."*
- *"Ahmed's persistence is declining — he quits after the first wrong answer."*
- *"Marcus has mastered algebra and is ready for pre-calculus."*

These insights are computed automatically from gameplay data — insights a teacher can act on in 30 seconds to make a real instructional difference the very next morning.

---

## 3. Game Portfolio

EdGame's 5 games are designed to collectively cover all 6 dimensions of the EdGame Analytics Blueprint's behavioral metrics taxonomy. Each game is a different "diagnostic lens" on the same student — together they paint a complete behavioral portrait.

### Game 1: Pulse Realms — Team Arena
**Status:** Functional prototype (built with KAPLAY.js)

| Attribute | Detail |
|-----------|--------|
| **Mechanic** | 3v3 team combat where every attack/heal/shield requires answering an MCQ |
| **Primary Analytics** | Speed-accuracy profiling under pressure (D1), persistence after combat failure (D5) |
| **Current Features** | Adaptive difficulty engine, question-gated combat, telemetry system, progression system, 4 character classes |
| **Teacher Value** | "See which students guess under pressure vs. think carefully" |

### Game 2: Concept Cascade — Tower Defense

| Attribute | Detail |
|-----------|--------|
| **Mechanic** | Build/upgrade towers by answering questions; waves of "misconception enemies" (Fraction Phantom, Decimal Dragon) attack; resource allocation choices |
| **Primary Analytics** | Strategic behavior and resource allocation (D3), concept-specific error mapping (D1) |
| **Teacher Value** | "See exactly which math concepts each student is weakest at, and whether they plan ahead or react impulsively" |

### Game 3: Lab Explorer — Virtual Science Lab

| Attribute | Detail |
|-----------|--------|
| **Mechanic** | Open-ended experiment simulation; students choose equipment, set variables, run experiments, record observations |
| **Primary Analytics** | Scientific process tracking via process mining (D3), experimentation rate, skill transfer (D6) |
| **Teacher Value** | "See the scientific process, not just whether students got the right answer. Know which students explore curiously vs. follow rote procedures" |

### Game 4: Knowledge Quest — Turn-Based RPG

| Attribute | Detail |
|-----------|--------|
| **Mechanic** | Story-driven adventure with branching dialogue and embedded social dilemmas; hint system via mentor NPC |
| **Primary Analytics** | SEL assessment through story choices (D5), help-seeking patterns (D1), empathy and impulse control |
| **Teacher Value** | "See how students make decisions when there's no 'right answer' — do they help others or hoard resources?" |

### Game 5: Survival Equation — Collaborative Puzzle Survival

| Attribute | Detail |
|-----------|--------|
| **Mechanic** | 2-4 players stranded in environment (desert island/space station); each has unique role with exclusive info/tools; problems require combining information across roles |
| **Primary Analytics** | Communication and collaboration patterns (D4), team contribution equity, help-giving/seeking |
| **Teacher Value** | "See how students actually collaborate — who leads, who follows, who free-rides, who helps others" |

### Analytics Coverage Matrix

| Blueprint Dimension | Game 1 | Game 2 | Game 3 | Game 4 | Game 5 |
|---------------------|:------:|:------:|:------:|:------:|:------:|
| D1: Cognitive Knowledge | ●● | ●● | ●● | ●● | ●● |
| D2: Behavioral Engagement | ●● | ●● | ● | ●● | ●● |
| D3: Strategic Behavior | ● | ★ | ★ | ●● | ●● |
| D4: Social & Collaborative | ● | ○ | ● | ● | ★ |
| D5: Affective & SEL | ● | ● | ● | ★ | ●● |
| D6: Temporal & Longitudinal | ● | ●● | ●● | ●● | ●● |

**Legend:** ★ = Primary focus | ●● = Strong | ● = Medium | ○ = Weak

---

## 4. Technical Architecture (Phase 1)

### 4.1 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14+ (App Router) + React | Teacher dashboard, game shell |
| Game Engine | KAPLAY.js (existing) / Phaser 3 (new games) | Game rendering, physics, input |
| Styling | Tailwind CSS + shadcn/ui | Rapid UI, consistent design |
| Backend | Supabase (BaaS) | PostgreSQL, Auth, Realtime, Storage |
| Hosting | Vercel | Edge deployment, CI/CD |
| Analytics | Custom (15 core metrics) + PostHog | Behavioral + product analytics |

### 4.2 Architecture Overview

The architecture follows a **split-processing model**:

- **Client-side (Algorithms 1 & 2):** Adaptive Difficulty and Question-Gated Combat Resolution run in the browser for zero-latency gameplay and invisible assessment. If a student had to wait for a server response before their sword swing landed, the stealth assessment illusion would break.
- **Server-side (Algorithms 3 & 4):** Behavioral Metric Computation and Top-3 Insight Generation run on the server for data integrity, cross-student analysis, and privacy.

This split maps directly to the two user personas: **students need speed and immersion**; **teachers need accuracy and breadth**.

### 4.3 Data Flow

```
1. Student plays game → KAPLAY.js runs Algorithms 1 & 2 locally → telemetry events buffered
2. Events batched → Event Collector POSTs to /api/events every 10 seconds → stored in session_events
3. Session ends → POST /api/sessions/[id]/end triggers Algorithm 3 → computed_metrics written
4. Daily cron → Aggregates session metrics into student_metrics_daily table
5. Teacher opens dashboard → Algorithm 4 runs → queries metrics + baselines → returns Top-3 Insights
6. Realtime updates → Supabase Realtime pushes live session progress via WebSocket
```

### 4.4 Core 15 Metrics (Phase 1)

| Category | Metric | What It Reveals |
|----------|--------|-----------------|
| **Engagement** | time_on_task | How long students actively engage |
| **Engagement** | session_frequency | Habit formation and consistency |
| **Engagement** | completion_rate | Homework compliance |
| **Engagement** | voluntary_replay | Intrinsic motivation |
| **Engagement** | drop_off_point | Where students disengage |
| **Performance** | accuracy_by_concept | Per-concept mastery |
| **Performance** | speed_accuracy_tradeoff | Guessing vs. deliberation |
| **Performance** | error_pattern | Specific misconceptions |
| **Performance** | improvement_trajectory | Learning rate over time |
| **Performance** | mastery_threshold | Concepts ready to advance |
| **Behavioral** | help_seeking | Self-regulation and strategy |
| **Behavioral** | persistence | Response to failure |
| **Behavioral** | strategy_variation | Exploratory vs. rigid thinking |
| **Behavioral** | response_to_feedback | Feedback utilization |
| **Behavioral** | collaboration_style | Team dynamics (Phase 2 multiplayer) |

---

## 5. Master Timeline

### Phase 1: Foundation & Design (Feb 26 – Mar 14, 2026)
**Aligned with:** TIE 204 Sprint 1 (Weeks 1-3) — 10% of grade

| Week | Focus | Deliverable | Status |
|------|-------|------------|--------|
| 1 (Feb 26) | Problem framing | Problem statement, system sketch | Complete |
| 2 (Mar 5) | System thinking | Architecture sketch, Algorithm Intent Tables (Lab 2) | In progress |
| 3 (Mar 12) | Design readiness | Interface design (Lab 3), Architecture Freeze v1, Spec Draft | Planned |

**Sprint 1 Deliverables for Professor:**

- [ ] Problem statement (5-6 lines, answering 4W framework: Who, What, Where, Why)
- [ ] Algorithm Intent Table (4 algorithms with FSM/dataflow models)
- [ ] System Architecture Diagram with algorithm mapping
- [ ] Interface list, contracts, and error analysis
- [ ] Architecture Freeze v1 document
- [ ] EdGame Assessment Framework (mapping games to Blueprint's 6 dimensions)

**Research milestone:** Begin literature review on Evidence-Centered Design, stealth assessment, and game-based learning analytics.

---

### Phase 2: Architecture & Alpha (Mar 15 – Apr 4, 2026)
**Aligned with:** TIE 204 Sprint 2 (Weeks 4-6) — 10% of grade

| Week | Focus | Deliverable |
|------|-------|------------|
| 4 (Mar 19) | System architecture to SW structure | System Blueprint, Next.js + Supabase scaffold |
| 5 (Mar 26) | Constraints & tradeoffs | UI Wireframes (Teacher Dashboard), API logic design |
| 6 (Apr 2) | Integration mindset | MVP Alpha Snapshot: Pulse Realms running on platform |

**Sprint 2 Deliverables for Professor:**

- [ ] System Blueprint (Next.js + Supabase project deployed to Vercel)
- [ ] Supabase data model implemented (users, sessions, metrics, assignments, classes)
- [ ] UI Wireframes for Teacher Dashboard (Tailwind + shadcn/ui)
- [ ] MVP Alpha: Pulse Realms integrated into Next.js, connected to Supabase backend
- [ ] Phase 1 API routes implemented (sessions, assignments, environments, analytics)

---

### Phase 3: Implementation & Testing (Apr 5 – Apr 25, 2026)
**Aligned with:** TIE 204 Sprint 3 (Weeks 7-9) — 10% of grade

| Week | Focus | Deliverable |
|------|-------|------------|
| 7 (Apr 9) | Security by design | Security Plan: Supabase Auth + Google OAuth + RLS policies |
| 8 (Apr 16) | Testing in systems | Test Checklist: Unit tests for metric computation, question engine, combat system |
| 9 (Apr 23) | Local optimization | Functional MVP: 2 games playable (Pulse Realms + Concept Cascade) + dashboard with metrics |

**Sprint 3 Deliverables for Professor:**

- [ ] Security Plan (authentication flows, RLS enforcement, CORS, data handling)
- [ ] Test Checklist with passing unit tests
- [ ] Game 2: Concept Cascade (Tower Defense) — playable with analytics
- [ ] Metric Computation Engine: 15 core metrics computed from raw events
- [ ] Teacher Dashboard v1: class overview + Top-3 Insights per student

---

### Phase 4: Validation & Demo (Apr 26 – May 30, 2026)
**Aligned with:** TIE 204 Sprint 4 (Weeks 10-14) — Combined with Final MVP = 40% of grade

| Week | Focus | Deliverable |
|------|-------|------------|
| 10 (Apr 30) | CI/CD & iteration | CI/CD pipeline: GitHub Actions -> lint -> test -> build -> deploy to Vercel |
| 11 (May 7) | System validation | Integration tests: student plays -> events -> metrics -> dashboard insights |
| 12 (May 14) | Benchmarking | Performance summary: API response times, game frame rate, load testing |
| 13 (May 21) | Product polish | UX refinement, responsive design, onboarding flow |
| 14 (May 28) | Reflection & demo | **Final MVP Demo**, Technical Documentation, Poster |

**Sprint 4 + Final Deliverables for Professor:**

- [ ] CI/CD pipeline with evidence (GitHub Actions logs)
- [ ] Validation Plan with integration test results
- [ ] Performance Summary (API latency, frame rates, concurrent user capacity)
- [ ] Game 3: Lab Explorer (Virtual Science Lab) — playable with analytics
- [ ] Google Classroom LTI 1.3 integration (assignment launch + grade passback)
- [ ] Teacher Dashboard with full analytics pipeline
- [ ] Final Build Package: Documentation, code, deployment guide
- [ ] Demo Poster (physical + digital)
- [ ] 3 games fully playable with end-to-end analytics

---

### Phase 5: Research & Expansion (Jun 1 – Jul 31, 2026)
**Post-semester** — Independent work toward graduation

| Month | Focus | Deliverable |
|-------|-------|------------|
| June | Games 4-5 development | Knowledge Quest (RPG) + Survival Equation (Collaborative) |
| June | Analytics v2 | ML-powered insights: at-risk prediction, pattern detection |
| July | Pilot study | Study protocol design, survey instruments, outreach to 1-2 pilot schools/classes |
| July | Literature review | Complete literature review chapter for thesis |

**Phase 5 Deliverables:**

- [ ] Game 4: Knowledge Quest (Turn-Based RPG with SEL assessment)
- [ ] Game 5: Survival Equation (Collaborative Puzzle Survival with D4 social metrics)
- [ ] Pilot study protocol (IRB-equivalent, pre/post tests, data collection plan)
- [ ] Analytics v2 with ML-powered insights
- [ ] Literature review chapter draft

---

### Phase 6: Thesis & Demo-Ready (Aug 1 – Sep 30, 2026)
**Pre-graduation** — Final documentation and presentation

| Month | Focus | Deliverable |
|-------|-------|------------|
| August | Thesis writing | Full research write-up: framework, implementation, results |
| August | Data collection | Pilot data from 1-2 classes (if accessible) |
| September | Final polish | Thesis defense preparation, poster, public demo |

**Phase 6 Deliverables:**

- [ ] Thesis/capstone document (full research write-up)
- [ ] Preliminary pilot data and analysis
- [ ] Final demo presentation
- [ ] Graduation poster

---

### Timeline Summary

```
Feb 2026 ─────── Mar ─────── Apr ─────── May ─────── Jun ─────── Jul ─────── Aug ─────── Sep 2026
│                 │           │           │           │           │           │           │
│  Sprint 1       │ Sprint 2  │ Sprint 3  │  Sprint 4 + Final MVP │           │           │
│  Foundation     │ Alpha     │ Testing   │  Validation & Demo    │           │           │
│  (10%)          │ (10%)     │ (10%)     │  (40%)                │           │           │
│                 │           │           │                       │           │           │
│  1 game         │ Platform  │ 2 games   │  3 games + dashboard  │           │           │
│  (prototype)    │ scaffold  │ playable  │  + LTI + CI/CD        │           │           │
│                 │           │           │                       │           │           │
│─────────────── TIE 204 Semester ──────────────────────────────│           │           │
│                                                                │           │           │
│                                                                │ Games 4-5 │ Thesis    │
│                                                                │ ML insights│ Pilot     │
│                                                                │ Pilot prep │ Defense   │
│                                                                │           │           │
│                                                                │── Post-Semester ──────│
│                                                                                        │
└────────────────────────────────────────────────────────────── GRADUATION ──────────────┘
```

---

## 6. Research Roadmap

EdGame is not just a product — it is a research contribution to game-based learning analytics. The research thread runs parallel to development.

| Phase | Period | Research Focus | Output |
|-------|--------|---------------|--------|
| Literature Review | Feb-Mar 2026 | Evidence-Centered Design, stealth assessment (Shute), Bayesian Knowledge Tracing, game learning analytics (4 principles), Hall of Heroes (SEL), multiplayer communication research | Literature review chapter |
| Framework Design | Mar-Apr 2026 | Design the EdGame Assessment Framework: mapping game mechanics to 6 Blueprint dimensions to 15 core metrics to teacher insights. Define ECD models (competency, evidence, task, assembly) for each game | Framework paper/chapter |
| Implementation | Apr-Jul 2026 | Build the 5 games + analytics pipeline + teacher dashboard. Each game implements specific ECD models | Working platform + technical documentation |
| Pilot Study Design | Jun-Jul 2026 | Design IRB-equivalent protocol: informed consent, pre/post knowledge tests, engagement surveys, teacher feedback interviews, data collection plan | Study protocol document |
| Data Collection | Aug-Sep 2026 | Small-scale pilot with 1-2 classes (if school access secured). Collect gameplay data, teacher feedback, student pre/post scores | Raw data + preliminary analysis |
| Analysis & Writing | Aug-Sep 2026 | Analyze pilot data (if available). Write full thesis: problem, literature, framework, implementation, results, future work | Thesis document |

### Key Research References

The EdGame Analytics Blueprint draws on the following foundational research:

- **Evidence-Centered Design (ECD)** — The gold-standard framework for linking observable gameplay behaviors to claims about student competencies (Shute, 2011; Mislevy et al.)
- **Stealth Assessment** — Embedding assessments seamlessly into gameplay using Bayesian Networks for real-time proficiency estimation (Shute & Ventura, 2013)
- **Bayesian Knowledge Tracing (BKT)** — Probabilistic framework for modeling student mastery as a hidden Markov model, requiring 10-15 questions per knowledge component for reliable estimation
- **Four Principles of Game Learning Analytics** — Agency, Engagement, Growth, and Social Connection as the organizing framework for GLA (Reardon, 2022)
- **Hall of Heroes / Zoo U** — Validated game-based SEL assessment across six competencies: impulse control, cooperation, communication, social initiation, empathy, emotion regulation (Pathak et al.)
- **Communication Patterns in Multiplayer Games** — Team communication *structure* (distributed participation) predicts team performance better than communication *volume* (Bisberg et al., USC)

---

## 7. Risk Register

| # | Risk | Probability | Impact | Mitigation Strategy |
|---|------|------------|--------|---------------------|
| R1 | **Scope creep (5 games is ambitious)** | High | High | Prioritize Games 1-3 for course grade; Games 4-5 are post-semester stretch goals. Game 1 already has a functional prototype. |
| R2 | **No pilot school access** | Medium | Medium | Design framework and platform to be demonstrable without pilot data; use simulated student data for dashboard demos; teacher interviews can substitute for classroom pilots. |
| R3 | **Supabase free tier limits** | Low | Medium | Monitor usage; upgrade to Pro ($25/mo) if needed; architecture supports migration to self-hosted PostgreSQL. |
| R4 | **Single-developer bottleneck** | Medium | High | Use AI tools aggressively (Claude, Cursor); focus on highest-impact features first; maintain strict scope boundaries per sprint. |
| R5 | **Course deliverables vs. product quality tension** | Medium | Medium | Align sprint deliverables with genuine product milestones; do not build "demo-only" features that would need to be rebuilt later. |
| R6 | **Game engine fragmentation (KAPLAY.js vs. Phaser)** | Low | Medium | Game 1 stays on KAPLAY.js; evaluate Phaser for Games 2-5 during Sprint 2; standardize on one engine if feasible. |
| R7 | **Metric computation accuracy** | Medium | High | Validate metrics against manual calculations; unit test every metric computation function; compare outputs to known-good datasets. |
| R8 | **LTI 1.3 integration complexity** | Medium | Medium | Begin Google Classroom integration in Sprint 3; allocate full week in Sprint 4 for edge cases; use ltijs npm package. |

---

## 8. Success Metrics

### For the Course (TIE 204)

| Criterion | Target |
|-----------|--------|
| Sprint 1-3 deliverables | Submitted on time with high engineering quality |
| Final MVP | Demonstrates 3 playable games with end-to-end analytics pipeline |
| Technical documentation | Explains all design decisions with justification |
| Demo poster | Communicates value proposition clearly to non-technical audience |
| Code quality | Passes CI/CD pipeline (lint + type check + unit tests + build) |

### For the Product (EdGame)

| Criterion | Target |
|-----------|--------|
| Teacher dashboard | Shows meaningful, actionable insights (not just raw data) |
| Analytics pipeline | Correctly computes 15 metrics from raw gameplay events |
| Game environments | At least 3 with distinct mechanics, all producing standardized analytics |
| Deployment | Platform deployed on Vercel, accessible via browser, responsive on Chromebooks/tablets |
| Performance | Dashboard loads in <2s, game starts in <3s, API response <200ms (p95) |
| Integration | Google Classroom LTI 1.3: assignment launch + grade passback |

### For the Thesis/Graduation

| Criterion | Target |
|-----------|--------|
| EdGame Assessment Framework | Published as structured research contribution |
| Literature review | Covers ECD, stealth assessment, BKT, and GLA comprehensively |
| Platform implementation | Demonstrates the framework's practical implementation across 5 game genres |
| Pilot data | Preliminary validation of the approach (if school access is secured) |

---

## 9. Technology & Tools

| Category | Tool | Purpose |
|----------|------|---------|
| **Development** | Next.js 14+, React, TypeScript | Web application framework |
| **Game Engine** | KAPLAY.js / Phaser 3 | Game rendering and logic |
| **Backend** | Supabase (PostgreSQL + Auth + Realtime) | Database, authentication, real-time subscriptions |
| **Hosting** | Vercel | Edge deployment, CI/CD, preview environments |
| **Design** | Tailwind CSS + shadcn/ui | UI component library |
| **Version Control** | GitHub | Code repository + issue tracking |
| **CI/CD** | GitHub Actions | Automated testing + deployment pipeline |
| **AI Development** | Claude Pro, Cursor Pro | Accelerated development and code generation |
| **Product Analytics** | PostHog | Usage tracking, funnels, feature flags |
| **Error Tracking** | Sentry | Exception monitoring, performance profiling |
| **Email** | Resend | Transactional email (assignments, reports) |
| **CDN** | Vercel + Cloudflare | Asset delivery, DDoS protection |
| **Documentation** | Markdown (in-repo) | Technical specifications, API docs |

### Development Setup

```
Prerequisites: Node.js 20+, pnpm
Stack: Next.js 14+ (App Router) + Supabase + KAPLAY.js/Phaser 3
Local dev: pnpm dev (Next.js) + Supabase CLI (local database)
Deployment: Push to main -> GitHub Actions -> Vercel (automatic)
```

---

## 10. Team & Responsibilities

| Role | Scope | Key Interfaces |
|------|-------|----------------|
| **Game Developer** | 5 game environments, game client architecture, adaptive difficulty engine, question engine, combat system, game telemetry | Must respect event batch format (IF-02), session API (IF-07), auth tokens (IF-12) |
| **Backend + Dashboard Developer** | Supabase schema, API routes, metric computation engine, insight generation, teacher dashboard, LTI integration | Must serve event batch endpoint, session API, insights API, implement LTI contracts |

### Shared Responsibilities

- Architecture decisions and design reviews
- Sprint planning and deliverable preparation
- Course submissions and professor presentations
- Research and literature review contributions
- Testing and quality assurance

### Interface Contracts Between Roles

| Interface | Format | Direction | Protocol |
|-----------|--------|-----------|----------|
| Event Batch | `GameEvent[]` (JSON array) | Game Client -> API | `POST /api/events` every 10 seconds |
| Session Lifecycle | Start/End payloads | Game Client -> API | `POST /api/sessions`, `POST /api/sessions/[id]/end` |
| Computed Metrics | `computed_metrics` JSONB | API -> Dashboard | `GET /api/analytics/student/[id]` |
| Top-3 Insights | `StudentInsight[]` array | API -> Dashboard | `GET /api/analytics/class/[id]/insights` |
| Question Pool | Question JSON | API -> Game Client | `GET /api/questions?subject=math&difficulty=3` |
| Auth Tokens | Supabase JWT | Supabase Auth -> All | Bearer token in Authorization header |

---

## Appendix A: Course Assessment Structure

| Component | Weight | Timing |
|-----------|--------|--------|
| Sprint 1: Foundation & Specification | 10% | Weeks 1-3 |
| Sprint 2: Architecture & Prototyping | 10% | Weeks 4-6 |
| Sprint 3: Implementation & Optimization | 10% | Weeks 7-9 |
| Sprint 4 + Final MVP: Validation, Scaling & Readiness | 40% | Weeks 10-14 |
| Quizzes | 15% | Throughout |
| Final Exam | 10% | End of semester |
| Peer Assessment | 5% | End of semester |

---

## Appendix B: Sprint-to-Product Alignment

This table shows how each TIE 204 sprint topic maps to a genuine EdGame product milestone, ensuring that course work directly advances the product rather than creating throwaway deliverables.

| Sprint | Course Topic | EdGame Product Milestone |
|--------|-------------|--------------------------|
| Sprint 1, Week 1 | Problem framing | Problem statement validated against teacher interviews |
| Sprint 1, Week 2 | System thinking | 4 core algorithms modeled (FSM + Dataflow) |
| Sprint 1, Week 3 | Interface design | 44 Phase 1 API endpoints specified with error handling |
| Sprint 2, Week 4 | System to SW structure | Next.js + Supabase scaffold deployed to Vercel |
| Sprint 2, Week 5 | Constraints & tradeoffs | Teacher Dashboard wireframes; data model implemented |
| Sprint 2, Week 6 | Integration | Pulse Realms running on platform with Supabase telemetry |
| Sprint 3, Week 7 | Security by design | Supabase Auth + RLS + Google OAuth implemented |
| Sprint 3, Week 8 | Testing | Unit tests for metric computation + question engine |
| Sprint 3, Week 9 | Local optimization | 2 games playable + dashboard showing computed metrics |
| Sprint 4, Week 10 | CI/CD | GitHub Actions pipeline: lint -> test -> build -> deploy |
| Sprint 4, Week 11 | Validation | End-to-end integration tests (play -> events -> insights) |
| Sprint 4, Week 12 | Benchmarking | Performance report: latency, frame rates, load capacity |
| Sprint 4, Week 13 | Polish | UX refinement, responsive design, onboarding |
| Sprint 4, Week 14 | Demo | Final MVP presentation + poster |

---

## Appendix C: Key Definitions

| Term | Definition |
|------|-----------|
| **Stealth Assessment** | Embedding formative assessments seamlessly into gameplay so students are assessed without test anxiety or behavioral distortion |
| **Evidence-Centered Design (ECD)** | Assessment framework with four models (Competency, Evidence, Task, Assembly) linking observable gameplay behaviors to claims about student competencies |
| **Bayesian Knowledge Tracing (BKT)** | Probabilistic model that estimates student mastery of knowledge components as a hidden Markov model, updated with each student interaction |
| **Top-3 Insights** | The three most actionable observations per student per week, ranked by priority (struggling > needs_attention > improving > excelling) |
| **Blueprint Dimensions** | The 6 analytical dimensions of the EdGame Analytics Blueprint: Cognitive Knowledge, Behavioral Engagement, Strategic Behavior, Social/Collaborative, Affective/SEL, Temporal/Longitudinal |
| **LTI 1.3** | Learning Tools Interoperability standard enabling EdGame to integrate with Google Classroom, Canvas, and other LMS platforms for assignment launch and grade passback |
| **RLS** | Row-Level Security in PostgreSQL — ensures students see only their own data and teachers see only their class data |
| **Split-Processing Model** | Architecture pattern where latency-sensitive game logic (Algorithms 1-2) runs client-side while analytics logic (Algorithms 3-4) runs server-side |

---

*This project plan is a living document. It will be updated at each sprint boundary to reflect progress, scope adjustments, and lessons learned.*
