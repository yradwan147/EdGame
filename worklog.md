# EdGame Worklog

## 2026-04-02 — All 4 Games Implemented

### Summary

All 4 remaining EdGame games have been implemented as KAPLAY.js singleplayer games with full stealth assessment telemetry. Combined with the existing Pulse Realms, the platform now has all 5 games.

| Game | Issue | Files | Lines | Primary Dim | Status |
|------|-------|-------|-------|-------------|--------|
| Pulse Realms | #10 | ~25 | ~2,500 | D4 Social | Previously complete |
| Concept Cascade | #14 | 32 | ~5,600 | D3 Strategic | CODE COMPLETE |
| Knowledge Quest | #27 | 38 | ~10,200 | D5 Affective | CODE COMPLETE |
| Lab Explorer | #20 | 31 | ~5,700 | D3 Strategic | CODE COMPLETE |
| Survival Equation | #28 | 38 | ~6,700 | D4 Social | CODE COMPLETE |
| **Total new** | | **139** | **~28,200** | | |

### Concept Cascade (Tower Defense) — Issue #14

**Status: COMPLETE — 32 files, ~5,600 lines**

Fun-first mechanics: Tower synergy discovery (5 combos), juicy kill feedback (particles, chain kills), early call risk/reward, risky upgrades, enemy personalities (swarm scatter, lockstep flex, flickering, crack/split, boss phases), meta-progression (tower mastery, badges).

Assessment: D3 via tower diversity (Shannon entropy), strategy shifts, resource efficiency, synergy discovery count, risk-taking behavior.

### Knowledge Quest (Turn-Based RPG) — Issue #27

**Status: COMPLETE — 38 files, ~10,200 lines**

Fun-first mechanics: Paper Mario timed casts (6 patterns), Pokemon-style companion collection (8 creatures, 4 rarity tiers, 3 evolutions), Slay the Spire branching chapter maps (3 chapters, 28 nodes), Undertale enemy personalities (arguing imps, shuffling crawlers, sleeping giants, non-violent defeat options), meaningful dialogue consequences (6 social dilemmas), Professor Sage mentor with witty commentary.

Assessment: D5 via empathy score (prosocial/self-interest ratio), hint-seeking patterns, growth mindset indicators, emotional regulation (accuracy under pressure), persistence after combat loss.

### Lab Explorer (Virtual Science Lab) — Issue #20

**Status: COMPLETE — 31 files, ~5,700 lines**

Fun-first mechanics: KSP-style spectacular failures (foam eruptions, sparks, string breaks — collectible!), real-time visual physics sandbox (color gradients, swinging pendulums, circuit glow), Discovery Journal with 15 hidden findings, Disaster Gallery achievements, Professor Challenge mode for replay, multiple valid solutions.

Assessment: D3 via systematic experimentation detection, equipment selection quality, exploration breadth, process mining (full action sequences), self-correction rate, measurement accuracy.

### Survival Equation (Collaborative Puzzle) — Issue #28

**Status: COMPLETE — 38 files, ~6,700 lines**

Fun-first mechanics: Keep Talking-style information asymmetry (each role sees different data), Overcooked-style escalating chaos (storms, sickness, rival camps), AI partners with distinct witty personalities (confident Raza, precise Juno, nervous Kit, adventurous Navi), varied mini-puzzles (drag-drop, circuit wiring, beam placement, sliders), dramatic day countdown, "Choose Your Doom" resource allocation.

Assessment: D4 via communication quality scoring, team contribution equity (Gini coefficient), leadership patterns, information sharing behavior, resource allocation fairness, role adoption classification.

### Documentation Updates

- All 4 ECD docs updated from DRAFT to IMPLEMENTED (full telemetry event catalogs, evidence rules, task models, assembly models)
- Coverage matrix confirmed accurate
- Game implementation plan saved to `docs/plans/game-implementation-plan.md`
- Memory files updated for future session continuity

### Question Banks

| Game | Files | Questions | Subjects |
|------|-------|-----------|----------|
| Concept Cascade | 4 | 60 | number_sense, operations, fractions, geometry |
| Knowledge Quest | 2 | 150 | math (75), science (75) |
| Lab Explorer | 2 | 100 | chemistry (50), physics (50) |
| Survival Equation | 2 | 100 | applied_math (50), applied_science (50) |
| **Total** | **10** | **410** | |

### Completed Post-Implementation (2026-04-06)

- Closed GitHub issues #14, #20, #27, #28 with detailed comments
- Pushed all commits to remote (master branch)
- Regenerated EdGame_Living_Document.docx (2.2 MB with embedded diagram screenshots)
- Updated all 4 ECD docs from DRAFT to IMPLEMENTED
- Coverage matrix verified accurate

### Progress Report (2026-04-06)

Created `reports/progress-report/` with illustrated progress report:
- 6 live gameplay screenshots captured via headless Chrome (arena combat, TD battlefield, RPG chapter map, lab experiment select, survival scenarios + roles)
- 3 analytics pipeline diagrams generated via Python/Pillow:
  - Telemetry pipeline: Game Action → Event → Metric → Model → Insight
  - Sample session metrics dashboard with D1-D6 bars
  - ECD framework visual (4 models with game-specific examples)
- Markdown source + styled 878 KB PDF (14 pages)
- Report focuses on how game actions convert to learning insights with "What It Measures (Invisibly)" tables per game

### Git History (this session)

| Commit | Description |
|--------|-------------|
| f4a418a | Scaffold Concept Cascade (#14) |
| 469e67b | Concept Cascade components + systems |
| be77763 | Concept Cascade scenes — complete game |
| 1e2d3c4 | Save game implementation plan |
| 926cd52 | Update worklog + ECD doc for CC |
| a42d755 | Knowledge Quest — complete game (#27) |
| 89939d2 | Lab Explorer — complete game (#20) |
| ef546a3 | Survival Equation — complete game (#28) |
| 0789140 | Update all ECD docs + worklog |
| dc8f9d6 | Progress report v1 |
| 6e115ad | Progress report v2 (gameplay + analytics) |

## 2026-04-14 — Concept Cascade Debug Mode + Playtest Fixes

Built a live ECD profile viewer for Concept Cascade and fixed a long chain of bugs
discovered during the first real playthrough. This is the game that will be
demoed with the debug mode showing the stealth-assessment pipeline in action.

### Debug mode (new feature)

- **`src/systems/telemetry.js`** — added `subscribe(callback)` / `unsubscribe()`
  API so observers receive events as they fire (not only at session end).
- **`src/systems/debugBridge.js`** (new, 130 lines) — forwards telemetry events,
  session_start, session_end, and 500 ms state snapshots to a second window
  via `BroadcastChannel('edgame-debug')`. Also handles popup-window opening
  and backfill replay when the debug window connects after the game has already
  started.
- **`debug.html` + `debug.js`** (new, ~650 lines total) — standalone viewer
  with dark-themed panels: Student Profile (D1-D6 bars with animated pulse on
  update), Knowledge Components (per-subject mastery via weighted difficulty),
  Evidence Trace (event log with human-readable explanations per event),
  Session Snapshot (phase, wave, gold, lives, towers). Runs its own lite
  metrics computation so it stays decoupled from the game's assessment engine.
- **`main.js`** — reads `?debug=1` URL param, initializes the bridge.
- **Battlefield scene** — added `enemy_killed` and `enemy_leaked` telemetry
  events (they were previously only KAPLAY component events, invisible to
  the assessment engine).

### Playtest bug fixes (in order discovered)

1. **Tower placement silently hung forever.** `towerSystem.askQuestion()`
   passed a callback to `questionOverlay.show(question, callback)`, but the
   overlay signature is `show(question)` and returns a Promise. The callback
   was silently ignored, the inner promise never resolved, and `buildTower`
   awaited it forever. Pre-existing bug, not introduced by debug mode.
   **Fix:** rewrote `askQuestion` as a clean `async/await` that awaits
   `overlay.show()` and reads `result.correct` directly. One fix unblocks
   all four question-gated actions (build, upgrade, risky upgrade, study).

2. **Game crashed on first projectile hit** with *"component 'lifespan'
   requires component 'opacity'"*. `projectileComp.js` impact flash added
   `k.lifespan(0.15, { fade: 0.1 })` without `k.opacity()`, and the flash's
   `onDraw` even referenced `flash.opacity`. **Fix:** added `k.opacity(1)`.
   Scanned all other `k.add` blocks with a regex — 0 other sites affected.

3. **Stuck on wave 1 forever.** Old code called `k.go("waveResults", ...)`
   between waves; on `k.go("battlefield")` return the scene re-ran
   `gameStateStore.startGame()` which wiped gold, lives, towers, and
   `currentWaveIndex = -1`, so wave 1 always restarted. Also the old
   `actionEffects.waveClear()` animation rendered "blue blob" overlapping
   the separate scene's text. **Fix:** ripped out the separate
   `waveResults` scene, replaced with an in-battlefield modal overlay
   that preserves all state. Added `waveResultsShowing` guard to stop
   `handleWaveComplete` from firing repeatedly every frame.

4. **Bottom HUD button clicks triggered ghost tower builds.** Tile-build
   handler was a global `k.onClick(() => {...})` that fired on every
   canvas click and only checked if coords fell inside the map grid.
   The HUD bottom bar at y=660-720 mapped to tile row 10, and the map
   grid row 10 `"XXXPBBBBBBBBBBBXBBBB"` was full of buildable tiles, so
   clicking any HUD tower button placed a tower on row 10. **Fix:**
   reserved y-ranges `[0, 40)` (top HUD) and `[660, 720)` (bottom HUD)
   as HUD-only zones; tile-click handler ignores clicks in those strips.

5. **Waves ended before all enemies died.** `waveManager.isWaveComplete()`
   tracked event counters (`spawnedCount`, `killedCount`, `leakedCount`)
   which didn't account for Geometry Golem splits or boss minions spawned
   mid-wave. **Fix:** moved wave-complete check into the battlefield's
   update loop: `allSpawned && k.get("enemy").length === 0`. Also added
   a safety sweep at the start of each `startCombatPhase` that destroys
   any stray `"enemy"` or `"projectile"` objects lingering from the
   previous wave.

6. **Wave 6 frozen hell, 300k gold.** Geometry Golem fragments spawned
   via `spawnEnemy("geometryGolem", ...)` inherited the full golem
   config including `behavior: "crack"`, so fragments split recursively
   forever — 2 → 4 → 8 → 16 → ... — and each one awarded the full 25 KC
   golem bounty. **Fix:** added `isFragment: true` override to
   `spawnEnemy`; when set, `runtimeConfig.behavior = "none"` suppresses
   the crack check, `reward = max(4, round(parentReward/3))` (25→8 KC),
   `liveCost = max(1, floor(parentLiveCost/2))` (3→1). Wave 6 golem
   total is now 2×25 + 4×8 = 82 KC.

7. **Correct answer was always in slot A.** All 60 question JSON files
   had `correctIndex: 0`. Rather than rewriting the data (which would
   regress again on future AI-generated question banks), added a
   `shuffleOptions()` Fisher-Yates shuffle in `questionEngine.js` that
   runs on every `getQuestion()` call. Verified across 200 samples:
   A=46, B=55, C=57, D=42 — uniformly distributed.

8. **Tooltip text overlapping itself.** Added tower tooltips on hover
   (show description, stats, synergy hints — undiscovered synergies
   show as intriguing question marks like *"Combo with Operation Cannon
   nearby?"*, discovered ones upgrade to gold-highlighted full reveals).
   Initial implementation reserved fixed `size + 4px` per line, but
   KAPLAY wraps long lines inside `width:` causing overlap. **Fix:**
   rendered text off-screen first to measure actual `.height`, then
   stacked with dynamic line heights and repositioned into the final
   tooltip. Also widened to 320 px and clamped to left edge.

### New / modified files

| File | Change |
|------|--------|
| `apps/games/concept-cascade/src/systems/telemetry.js` | Added subscribe API |
| `apps/games/concept-cascade/src/systems/debugBridge.js` | **New** — BroadcastChannel forwarder |
| `apps/games/concept-cascade/debug.html` | **New** — debug viewer layout |
| `apps/games/concept-cascade/debug.js` | **New** — debug viewer logic + lite metrics |
| `apps/games/concept-cascade/main.js` | `?debug=1` wiring, removed unused waveResults registration |
| `apps/games/concept-cascade/src/scenes/battlefield.js` | In-scene wave results overlay, wave completion via live enemy count, tile click HUD guards, fragment overrides |
| `apps/games/concept-cascade/src/systems/towerSystem.js` | `askQuestion` promise fix |
| `apps/games/concept-cascade/src/systems/questionEngine.js` | Fisher-Yates option shuffle |
| `apps/games/concept-cascade/src/components/projectileComp.js` | `k.opacity(1)` on impact flash |
| `apps/games/concept-cascade/src/components/hudRenderer.js` | Tower hover tooltips with synergy hints |
| `apps/games/concept-cascade/src/config/waves.js` | Rebalanced waves 6-8 to account for fragments |

### README (new)

Added a **`README.md`** at the repo root with:
- Game roster, file counts, and primary dimensions
- Three quick-start options for running the games (Python http.server,
  npx serve, per-game `pnpm dev`)
- Debug mode instructions (`?debug=1`)
- Per-game controls reference
- Architecture overview + shared infrastructure explanation
- ECD dimension table + pointers to all documentation

## 2026-04-15 — Sample telemetry dataset via real game playthroughs

The user wanted a ≥50k-row CSV of telemetry events to use as a sample
dataset for AI work. Critically, the events had to be **generated by
actually playing the game**, not synthesized — so I built a Puppeteer
bot that drives Concept Cascade through real sessions and dumps the
events the game itself emits to localStorage.

### Bot architecture

- **Minimal hooks added to the game** (only ~15 LOC, all behind `?bot=1`):
  - `questionEngine.js`: when `?bot=1`, publishes each shuffled
    question to `window.__edgameBot.currentQuestion` so the bot can
    look up the correct answer (otherwise it would have to OCR the
    canvas).
  - `main.js`: when `?bot=1`, exposes the KAPLAY context, gameStateStore,
    telemetry, and progression on `window.__edgameBot` so the puppeteer
    driver can read game state without scraping the canvas.
  - These hooks have **no effect during normal play**.

- **`tools/play-and-capture.js`** — Node.js Puppeteer driver that:
  - Launches headless Chrome via `puppeteer-core` (already installed in
    `/tmp/smoketest/node_modules` from the earlier debug-mode work)
  - Patches `requestAnimationFrame`, `performance.now()`, and `Date.now()`
    in each page via `evaluateOnNewDocument` to inflate elapsed time
    by `TIME_SCALE=10`. KAPLAY computes its `dt()` from the
    `requestAnimationFrame(t => ...)` callback's `t` parameter, so this
    effectively makes the entire game run 10× faster (animations,
    movement, fire rates, enemy spawns) without modifying KAPLAY itself.
  - Spawns 6 parallel pages, each running back-to-back sessions
    (no page reloads — between sessions the bot calls `k.go("menu")`
    then clicks PLAY, saving 5+ seconds per session).
  - For each session, picks a random persona from 6 archetypes:
    `strong_student`, `average_student`, `struggling_student`,
    `risk_taker`, `methodical`, `guesser`. Each persona has its own
    accuracy, response-time distribution, tower count per wave,
    early-call propensity, and upgrade chance.
  - Drives the UI through real `page.mouse.click` and
    `page.keyboard.press` calls so events flow through the same code
    paths as a human player.
  - For each tower placement, presses 1/2/3/4 to select the type,
    clicks a buildable tile, waits for the question overlay to spawn
    (polling `window.__edgameBot.questionsServed`), thinks for the
    persona's `thinkMs` (in wall clock divided by `TIME_SCALE` so the
    eventual `responseTimeMs` in the event is realistic in game-time),
    reads the correct index from `window.__edgameBot.currentQuestion`,
    and answers correctly with `persona.accuracy` probability. Also
    waits for `k.get("question-overlay").length === 0` before clicking
    the next tile (otherwise the still-visible overlay buttons
    intercept the click).
  - Detects wave-results overlay by polling `phase === "combat" &&
    enemies === 0`. The overlay's 6-game-second auto-advance fires
    very quickly at TIME_SCALE=10 so the bot mostly doesn't need to
    press Enter manually.
  - On session end (game over OR all waves cleared OR force-end),
    reads `localStorage.getItem("concept_cascade_sessions")` and
    streams every event to a CSV with a flat schema (37 columns
    covering all event payload fields).

### Bugs fixed during bot development

1. **`k.timeScale` doesn't exist in KAPLAY.** I assumed it did and
   set it after each scene transition. Removed those lines and patched
   `requestAnimationFrame` instead.

2. **`performance.now()` patching alone doesn't speed KAPLAY up.**
   KAPLAY uses the `t` parameter passed to `requestAnimationFrame`
   callbacks (which comes directly from the browser's high-resolution
   clock), not `performance.now()`. Switched to wrapping rAF itself.

3. **Subsequent tile clicks landed on still-visible answer buttons.**
   The questionOverlay's 0.5s feedback flash before cleanup meant
   that a 150ms wall-clock sleep after the answer wasn't enough — the
   overlay was still on screen when the next tile click fired, so the
   click hit the overlay's interactive buttons instead of the grid
   underneath. Replaced the fixed sleep with
   `page.waitForFunction(() => k.get("question-overlay").length === 0)`.

4. **Wave overlay detection via `k.get("*")` returned nothing.** That
   selector doesn't work in KAPLAY. Replaced with a "combat phase +
   0 enemies for 2 polls" heuristic and rely on the overlay's auto-
   advance timer at high time scale.

### CSV schema (37 columns)

`session_id, student_id, persona, event_id, event_type, ts_iso, ts_ms,
session_offset_ms, wave_number, question_id, subject, difficulty,
correct, response_time_ms, context, tower_type, tile_col, tile_row,
gold_spent, old_level, new_level, success, difficulty_jump,
total_enemies, enemies_killed, enemies_leaked, interest, bonus_gold,
synergy_id, synergy_name, enemy_type, knowledge_component, reward,
live_cost, lives_remaining, amount, remaining_prep_time`

Plus `tools/validate-csv.py` which dumps event-type / persona /
correctness / wave-reach / response-time stats to verify the dataset
looks reasonable.

### Output

- **`reports/sample-telemetry/telemetry_events.csv`** — 50,432 events,
  9.40 MB, 543 sessions, 543 distinct students. Generated in **115 min**
  of real wall clock across 3 independent headless Chrome instances at
  `TIME_SCALE=15x`.
- `tools/play-and-capture.js` — the Puppeteer driver
- `tools/validate-csv.py` — sanity check / stats

### Dataset stats (validated)

- **50,432 data rows** (37 columns, flat schema)
- **16 event types** covered with natural distribution:
  enemy_killed (17956), enemy_leaked (9203), question_answered (6643),
  tower_placed (6121), wave_started (2281), wave_completed (1839),
  interest_earned (1749), synergy_discovered (596), tower_upgraded (522),
  early_call (270), plus per-dimension `assessment_*` summaries emitted
  at session end (542 each for cognitive/engagement/strategic/affective/
  temporal/complete).
- **6 personas** with accuracies matching targets within ~2%:
  | Persona | Measured | Target |
  |---|---|---|
  | strong_student | 92.0% | 92% |
  | methodical | 86.9% | 85% |
  | risk_taker | 70.3% | 70% |
  | average_student | 63.7% | 65% |
  | struggling_student | 42.1% | 42% |
  | guesser | 27.7% | 30% |
- **All 8 waves represented**, with natural drop-off toward the boss
  (543 → 543 → 383 → 215 → 169 → 147 → 141 → 140 sessions reaching each).
- **All 4 subjects** present: number_sense (3755), fractions (1277),
  operations (972), geometry (639).
- **All 5 difficulty levels**: 846/966/2148/1120/1563 questions.
- **Response times** 537-8378 ms, median 2240 ms, mean 2934 ms — exactly
  the realistic spread expected from the mix of fast/methodical/slow
  personas.
- **~93 events/session average** (range 30-220+).

### Next Steps

- Browser testing for the other 4 games (Pulse Realms, Knowledge Quest,
  Lab Explorer, Survival Equation — all have similar architectural bugs
  likely, e.g. they probably all have `correctIndex: 0` skew)
- Extend debug mode + bot driver to the other 4 games (copy `debugBridge.js`
  + `debug.html` / `debug.js` templates, adjust lite metrics computation)
- Generate sample telemetry datasets for the other 4 games using the
  same bot pattern once they have `?bot=1` hooks
- Teacher dashboard integration (connect telemetry → dashboard)
- Pilot study design for Saudi K-12 classrooms
- Tablet adaptation (Pulse Realms on iPad/Android)
- AI question generation pipeline
- SpacetimeDB multiplayer for Pulse Realms + Survival Equation
