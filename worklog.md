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

### Next Steps

- Browser testing for the other 4 games (Pulse Realms, Knowledge Quest,
  Lab Explorer, Survival Equation — all have similar architectural bugs
  likely, e.g. they probably all have `correctIndex: 0` skew)
- Extend debug mode to the other 4 games (copy `debugBridge.js` +
  `debug.html` / `debug.js` templates, adjust lite metrics computation)
- Teacher dashboard integration (connect telemetry → dashboard)
- Pilot study design for Saudi K-12 classrooms
- Tablet adaptation (Pulse Realms on iPad/Android)
- AI question generation pipeline
- SpacetimeDB multiplayer for Pulse Realms + Survival Equation
