# EdGame Worklog

## 2026-04-02

### Concept Cascade (Tower Defense) — Issue #14

**Status: In Progress — Setup & Config Complete**

#### Completed
- Created directory structure: `apps/games/concept-cascade/`
- Wrote `index.html`, `main.js`, `package.json` (bootstrap)
- Copied shared systems from Pulse Realms: `telemetry.js`, `questionEngine.js`
- Wrote adapted `progression.js` with tower defense badges (cascade_defender, tower_architect, synergy_seeker, combo_master, tower_specialist, etc.) and tower mastery tracking
- Wrote `gameState.js` with TD-specific state (gold, lives, waves, towers, synergies, early calls)
- Wrote all config files:
  - `constants.js` — game settings, tile sizes, economy, colors
  - `towers.js` — 4 tower types with 3-tier branching upgrades + `getTowerStats()` utility
  - `enemies.js` — 5 enemy types (Number Sprite, Operation Ogre, Fraction Phantom, Geometry Golem, Concept Dragon boss) with unique behaviors
  - `waves.js` — 8 waves + boss wave
  - `synergies.js` — 5 tower synergies (Chain Calculation, Shatter Shot, Knowledge Nexus, Frost Cannon, Fortified Line)
- Wrote 2 map definitions (`map1.js` Serpentine Valley, `map2.js` Crossroads)
- Wrote 60 math questions across 4 subject files (number_sense, operations, fractions, geometry) — 15 each, difficulties 1-5, tower-defense themed

#### Next Steps
- Build components: towerComp, enemyComp, projectileComp, questionOverlay, hudRenderer, actionEffects
- Build systems: waveManager, towerSystem, synergySystem, assessmentEngine
- Build scenes: menu, battlefield, waveResults, postGame
- Integrate full game loop and test

#### Design Decisions
- Tower synergies are discoverable (not documented) — rewards experimentation
- Enemy behaviors: swarm scatter, lockstep march, flickering, cracking/splitting, boss phases
- Restricted build spots (Kingdom Rush style) for strategic placement
- Early call risk/reward mechanic for "do I dare?" tension
- Meta-progression: tower XP, mastery badges, unlockable maps
