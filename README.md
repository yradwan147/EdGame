# EdGame — Analytical Learning Games Platform

A game-based learning analytics platform for K-12 classrooms. Five KAPLAY.js browser games embed stealth assessment through Evidence-Centered Design (ECD), silently measuring student competencies across six analytics dimensions while students play genuinely fun games.

**Author:** Yousef Radwan | **Course:** TIE 251 — Capstone Computing Studies | **Institution:** KAUST

---

## The Five Games

| Game | Genre | Subject | Primary Dimension |
|------|-------|---------|-------------------|
| **Pulse Realms** | 3v3 Team Arena | Math & Science | D4 Social |
| **Concept Cascade** | Tower Defense | Mathematics | D3 Strategic |
| **Knowledge Quest** | Turn-Based RPG | Math & Science | D5 Affective/SEL |
| **Lab Explorer** | Virtual Science Lab | Chemistry & Physics | D3 Strategic |
| **Survival Equation** | Cooperative Puzzle | Applied Math & Science | D4 Social |

Total: **164 source files · ~32,100 lines · 410 questions** across 10 JSON banks.

See [`docs/assessment/ecd/`](docs/assessment/ecd/) for the full Evidence-Centered Design mapping of each game.

---

## Quick Start — Play the Games

All five games run in any modern browser. They're plain HTML + ES modules + KAPLAY.js (loaded from CDN), so no bundler or build step is required — you only need a local HTTP server because ES module imports can't be served from `file://`.

### Option 1: Python's built-in server (simplest)

From the repo root:

```bash
python3 -m http.server 8899
```

Then open any of these URLs in your browser:

- **Pulse Realms:** http://localhost:8899/apps/games/pulse-realms/index.html
- **Concept Cascade:** http://localhost:8899/apps/games/concept-cascade/index.html
- **Knowledge Quest:** http://localhost:8899/apps/games/knowledge-quest/index.html
- **Lab Explorer:** http://localhost:8899/apps/games/lab-explorer/index.html
- **Survival Equation:** http://localhost:8899/apps/games/survival-equation/index.html

Stop the server with `Ctrl+C`.

### Option 2: Any other static server

Any of these work equally well, as long as they serve the repo root and allow ES module imports:

```bash
# Node.js
npx serve .

# PHP
php -S localhost:8899

# Ruby
ruby -run -ehttpd . -p8899
```

### Option 3: Per-game dev script (if you use pnpm)

Each game has a `dev` script:

```bash
cd apps/games/concept-cascade
pnpm dev          # runs `npx serve .` inside the game folder
```

Note that serving from within a single game folder still works because each game's `main.js` only imports from its own `src/` directory and the KAPLAY CDN.

---

## Debug Mode — Live ECD Profile Viewer

**Concept Cascade** includes a live stealth-assessment debug viewer that opens in a second browser window and streams every telemetry event, dimension score change, and per-subject knowledge-component mastery update as you play. Useful for demos and for understanding how game actions map to learning insights.

Start the server, then open:

```
http://localhost:8899/apps/games/concept-cascade/index.html?debug=1
```

The `?debug=1` query param tells the game to open a second window (`debug.html`) via `window.open()`. **Allow popups** when your browser prompts. If popups are blocked, manually open `http://localhost:8899/apps/games/concept-cascade/debug.html` in a second tab and the two windows will auto-connect via `BroadcastChannel`.

The debug window shows:
- **Student Profile** — live D1–D6 dimension bars with descriptive labels
- **Knowledge Components** — per-subject mastery bars (number sense, operations, fractions, geometry)
- **Evidence Trace** — every telemetry event in reverse-chronological order, color-coded by type, with a human-readable explanation of how each event moved the profile (e.g. *"✓ Correct at difficulty 3 in 2.1s (fast) → Evidence: fluent response — strong mastery signal → D1 Cognitive: 0.71 ↑ 0.72"*)
- **Session Snapshot** — current phase, wave, gold, lives, tower count

---

## Controls Reference

### Concept Cascade (Tower Defense)

- **1 / 2 / 3 / 4** — select tower type from the bottom bar
- **Click a tile** — place the selected tower (triggers an MCQ)
- **Click an existing tower** — open upgrade panel
- **Hover a tower button** — tooltip with stats and synergy hints
- **Space** — early-call the next wave during prep phase (+30% gold bonus)
- **Q** — study a question during prep for bonus gold
- **P / Esc** — pause

### Pulse Realms (3v3 Team Arena)

- **WASD / Arrows** — move
- **1 / 2** — trigger role abilities (each opens an MCQ)
- **Esc** — pause

### Knowledge Quest (Turn-Based RPG)

- **Click nodes** on the chapter map to travel
- **Click spells / actions** in combat (each opens an MCQ, then a timed-cast ring)
- **Space** — advance dialogue
- **H** — request a mentor hint (costs a token)

### Lab Explorer (Virtual Science Lab)

- **Click equipment** to move it between shelf and workbench
- **Drag sliders** to set experiment variables
- **Click "Run Experiment"** to see results

### Survival Equation (Cooperative Puzzle)

- **Click a role card** to pick your specialist
- **Click chat prompts** or type messages to communicate with AI teammates
- **Click puzzle pieces** to interact with the shared puzzle workspace

---

## Architecture Overview

```
edgame/
├── apps/
│   ├── games/
│   │   ├── pulse-realms/         (3v3 Team Arena, 25 files)
│   │   ├── concept-cascade/      (Tower Defense, 32 files)
│   │   ├── knowledge-quest/      (Turn-Based RPG, 38 files)
│   │   ├── lab-explorer/         (Virtual Science Lab, 31 files)
│   │   └── survival-equation/    (Cooperative Puzzle, 38 files)
│   └── web/                      (Next.js dashboard + API)
├── packages/
│   ├── shared/                   (TypeScript types, validators, DB client)
│   └── ui/                       (Shared React components)
├── docs/
│   ├── adr/                      (Architecture Decision Records)
│   ├── architecture/             (Data model, API routes, monorepo structure)
│   ├── assessment/               (ECD mappings, coverage matrix, metrics)
│   └── plans/                    (Implementation plans)
├── reports/
│   └── progress-report/          (Illustrated MD + PDF progress report)
├── EdGame Analytics Blueprint.md (46 KB research study)
└── EdGame_Living_Document.docx   (2.2 MB consolidated technical doc)
```

Each game follows an identical internal structure:

```
apps/games/<game>/
├── index.html       (loads main.js as a module)
├── main.js          (kaplay init, deps, scene registration)
├── src/
│   ├── config/      (game constants, entity definitions)
│   ├── data/        (question JSON, story scripts, map layouts)
│   ├── systems/     (state, telemetry, question engine, assessment, game-specific systems)
│   ├── components/  (KAPLAY custom components: enemies, towers, UI panels, effects)
│   └── scenes/      (menu, gameplay, results, post-game)
```

### Shared Infrastructure

Three systems are copied (not imported) into each game for runtime decoupling:

- **`telemetry.js`** — event capture, localStorage backup, REST API batch flush every 10 s, subscribe/unsubscribe API for cross-window streaming
- **`questionEngine.js`** — adaptive difficulty (skill rating 1-5, streak tracking), JSON question loading, Fisher-Yates option shuffling so correct answers are distributed across all slots
- **`progression.js`** — XP, levels, per-game badges, persistence to localStorage

### Evidence-Centered Design Framework

Every game emits structured telemetry events that feed a per-session metrics computation across six dimensions:

| Dimension | Name | Measured by |
|-----------|------|-------------|
| **D1** | Cognitive Knowledge | Question accuracy, response time, speed-accuracy profile |
| **D2** | Behavioral Engagement | Play time, actions/minute, completion rate, voluntary replay |
| **D3** | Strategic Behavior | Tower diversity, experimentation systematicity, risk-taking |
| **D4** | Social & Collaborative | Team contribution equity (Gini), communication quality, leadership |
| **D5** | Affective & SEL | Empathy choices, help-seeking pattern, growth mindset, persistence |
| **D6** | Temporal & Longitudinal | Learning velocity, response time improvement over session |

See [`docs/assessment/coverage-matrix.json`](docs/assessment/coverage-matrix.json) for which dimensions each game targets as primary.

---

## Sample Telemetry Datasets

Pre-generated CSVs of real telemetry events from automated bot playthroughs live in [`reports/sample-telemetry/`](reports/sample-telemetry/). Useful for AI / analytics work without needing to run the games yourself.

| Game | File | Rows | Sessions | Bot driver |
|------|------|------|----------|------------|
| Concept Cascade | [`telemetry_events.csv`](reports/sample-telemetry/telemetry_events.csv) | 50,432 | 543 | `tools/play-and-capture.js` |
| Pulse Realms | [`pulse_realms_events.csv`](reports/sample-telemetry/pulse_realms_events.csv) | 10,018 | 604 | `tools/play-and-capture-pulse-realms.js` |
| Knowledge Quest | [`knowledge_quest_events.csv`](reports/sample-telemetry/knowledge_quest_events.csv) | 10,044 | 287 | `tools/play-and-capture-knowledge-quest.js` |
| Lab Explorer | [`lab_explorer_events.csv`](reports/sample-telemetry/lab_explorer_events.csv) | 10,019 | 490 | `tools/play-and-capture-lab-explorer.js` |
| Survival Equation | [`survival_equation_events.csv`](reports/sample-telemetry/survival_equation_events.csv) | 10,075 | 146 | `tools/play-and-capture-survival-equation.js` |
| **Total** | | **90,588** | **2,070** | |

KQ and LE additionally ship `*_real_scenedriven.csv` companion files (~500-1,200 events each) captured by an earlier scene-driven version of the bots — useful for analytics that want to compare programmatic-payload events to UI-driven ones.

All five datasets share a common 37-column flat schema (see [`tools/lib/bot-common.js`](tools/lib/bot-common.js)) so analytics code can pivot across games. Each driver uses six personas (strong_student, average_student, struggling_student, risk_taker, methodical, guesser) with different accuracy distributions and response-time profiles. **All events come from the actual game's `telemetry.event(...)` calls — none are synthesized.**

Each row is one telemetry event with 37 columns covering all event payload fields across all five games:

| Column | Description |
|--------|-------------|
| `session_id`, `student_id`, `persona` | Identity & player profile |
| `event_id`, `event_type`, `ts_iso`, `ts_ms`, `session_offset_ms` | Event metadata |
| `wave_number`, `question_id`, `subject`, `difficulty`, `correct`, `response_time_ms`, `context` | Question / context fields |
| `tower_type`, `tile_col`, `tile_row`, `gold_spent`, `old_level`, `new_level`, `success`, `difficulty_jump` | Tower / placement events |
| `total_enemies`, `enemies_killed`, `enemies_leaked`, `interest`, `bonus_gold` | Wave events |
| `synergy_id`, `synergy_name`, `enemy_type`, `knowledge_component`, `reward`, `live_cost`, `lives_remaining`, `amount`, `remaining_prep_time` | Misc payload fields |

To regenerate any dataset (overwrites the file):

```bash
# Make sure the dev server is running first:
python3 -m http.server 8899

# Then in another shell, run the bot driver for the game you want:
node tools/play-and-capture.js                      [rows] [parallelPages]   # Concept Cascade
node tools/play-and-capture-pulse-realms.js         [rows] [browsers]
node tools/play-and-capture-knowledge-quest.js      [rows] [browsers]
node tools/play-and-capture-lab-explorer.js         [rows] [browsers]
node tools/play-and-capture-survival-equation.js    [rows] [browsers]

# Sanity check Concept Cascade output:
python3 tools/validate-csv.py

# Or summarize all five datasets at once:
python3 tools/validate-csv-multi.py
```

The drivers depend on `puppeteer-core` and Google Chrome (the system app). Install puppeteer-core with `npm i puppeteer-core` in a temp directory and set `NODE_PATH` if needed. The four newer drivers share `tools/lib/bot-common.js` (CSV writer, persona library, browser launcher, time-scale patching, main-loop orchestration) so each driver only owns its game-specific session-play function.

**Two bot strategies are in use:**

- **Scene-driven** (Concept Cascade, Pulse Realms): drives the actual UI through `page.mouse.click` and `page.keyboard.press`, generating events from real button presses and answer selections — these match exactly what a human player would emit.
- **Programmatic** (Knowledge Quest, Lab Explorer, Survival Equation): drives `window.__edgameBot.telemetry` directly with realistic persona-derived payloads. The events still flow through the real telemetry pipeline (subscribers, persistence, localStorage), only their *origin* differs from a UI-driven session. This is much faster (10k events in 30-45 s vs 6+ hours for scene-driven KQ/LE) and was needed because all three games had between-session scene-state issues that scene-driven drivers couldn't reliably overcome.

---

## Documentation

- **[`EdGame Analytics Blueprint.md`](EdGame%20Analytics%20Blueprint.md)** — 46 KB research study: ECD theory, BKT, 50+ metrics taxonomy, game design principles, dashboard specs, competitive landscape, ethics
- **[`EdGame_Living_Document.docx`](EdGame_Living_Document.docx)** — 2.2 MB consolidated technical document (all ADRs, architecture, ECD mappings, blueprint)
- **[`reports/progress-report/`](reports/progress-report/)** — Illustrated progress report with live gameplay screenshots and analytics pipeline diagrams (MD + 878 KB PDF)
- **[`docs/adr/`](docs/adr/)** — Architecture Decision Records
- **[`docs/assessment/ecd/`](docs/assessment/ecd/)** — Per-game ECD mapping documents
- **[`docs/plans/game-implementation-plan.md`](docs/plans/game-implementation-plan.md)** — Original fun-first implementation plan
- **[`worklog.md`](worklog.md)** — Session-by-session engineering journal

---

## Development Tooling

The repo is a **pnpm + Turborepo monorepo** (`pnpm-workspace.yaml`, `turbo.json`), but the games themselves don't require any build step — KAPLAY.js is loaded from the unpkg CDN at runtime. The monorepo tooling is used for the Next.js dashboard (`apps/web/`) and shared TypeScript packages (`packages/shared/`, `packages/ui/`).

To work on the dashboard or shared packages:

```bash
pnpm install
pnpm dev           # runs all workspace dev scripts via Turborepo
pnpm build         # production builds
pnpm typecheck     # TypeScript across all workspaces
```

---

## License

Educational project — KAUST TIE 251 Capstone Computing Studies 2026.
