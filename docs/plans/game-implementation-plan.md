# Plan: Implement All 4 Remaining EdGame Games (Fun-First Design)

## Context

EdGame has 5 planned games. **Pulse Realms** (3v3 team arena) is complete at `apps/games/pulse-realms/`. The remaining 4 must be built as genuinely fun, replayable KAPLAY.js games where stealth assessment is a natural byproduct of engaging mechanics — not the goal the player feels.

**Design philosophy:** Fun = Agency + Feedback + Low-cost Failure + Escalating Challenge + Surprise. If a kid wouldn't choose to play this over other games, the design fails.

**Open issues:** #14 (Concept Cascade), #20 (Lab Explorer), #27 (Knowledge Quest), #28 (Survival Equation)

**Process:** Commit at milestones referencing issues, maintain `worklog.md`, update ECD docs + memory after each game.

## Build Order

1. **Concept Cascade** (Tower Defense) — #14
2. **Knowledge Quest** (Turn-Based RPG) — #27
3. **Lab Explorer** (Virtual Science Lab) — #20
4. **Survival Equation** (Collaborative Puzzle) — #28

## Shared Infrastructure (reuse from Pulse Realms)

Copy unchanged: `telemetry.js`, `questionEngine.js`, `progression.js` (customize badges per game).
Per-game rewrites: `gameState.js`, `questionOverlay.js` (themed), `hudRenderer.js`.

Bootstrap pattern (every `main.js`):
```
import kaplay from CDN → kaplay({1280×720, letterbox, global:false})
deps = { k, settings, gameStateStore, telemetry, progression }
registerScenes(deps) → k.go("menu")
```

---

## Game 1: Concept Cascade (Tower Defense) — #14

**Fun inspirations:** Bloons TD 6 (synergy combos, upgrade branching), Kingdom Rush (restricted placement, early-call risk), Plants vs Zombies (accessibility, personality)

### What Makes It Fun (Not Just Educational)

**1. Tower Synergy System (the "aha!" moments)**
Towers near each other create combo effects the player discovers through experimentation:
- **Number Bastion + Operation Cannon** (adjacent): "Chain Calculation" — Bastion marks enemies, Cannon deals 2x damage to marked targets
- **Fraction Freezer + Geometry Guard** (in range): "Shatter Shot" — frozen enemies take 3x damage from Guard's sniper shots
- **Any 3 towers in triangle formation**: "Knowledge Nexus" — all three get 15% attack speed boost + a glowing connecting beam visual
- Synergies are NOT told to the player — they discover them by placing towers near each other, triggering a flashy discovery animation + "COMBO DISCOVERED!" popup. This creates genuine "I figured something out!" satisfaction.

**2. Juicy Kill Feedback**
- Every enemy death: particle burst in enemy's color + floating "+8 KC" number that arcs upward
- Chain kills (3+ in 1 second): screen flash + "CHAIN x3!" multiplier popup + bonus KC
- Tower shots: distinct projectile trail per tower type (blue bolt, orange explosion ring, purple frost wave, red beam)
- Boss damage: screen shake on every hit, health bar segments crack visually
- Wave clear: satisfying "WAVE CLEAR!" banner with score breakdown and star rating

**3. Risk/Reward Mechanics**
- **Early Call**: Send next wave early for +30% KC bonus. Creates "do I dare?" tension every wave.
- **Gambling upgrade**: Towers can attempt a "Risky Upgrade" — answer a question 2 difficulties above normal. Correct = free upgrade. Wrong = tower loses 1 level. High-risk dopamine.
- **Overkill bonus**: Dealing more damage than needed to kill grants splash damage to nearby enemies (incentivizes powerful towers, creates satisfying chain reactions).

**4. Meta-Progression (Between Sessions)**
- Each tower type earns XP from kills. Reaching tower milestones unlocks cosmetic effects (golden projectiles, particle trails) and a 4th upgrade tier.
- "Tower Mastery" badges displayed on the menu screen: "Number Bastion Master: 500 kills"
- Unlockable maps (complete map 1 with 3 stars to unlock map 2)

**5. Enemy Personality (Not Just HP Blobs)**
- **Number Sprites**: Swarm in formation, scatter when one dies (like startled birds)
- **Operation Ogres**: March in lockstep, sometimes stop to flex (comedy, brief vulnerability window)
- **Fraction Phantoms**: Flicker in and out of visibility, leave afterimages
- **Geometry Golems**: Slow but visibly crack as they take damage, break into smaller geometric fragments at 50% HP that continue walking
- **Boss (Concept Dragon)**: Flies over the path, spawns minions, has 3 phases with different attack patterns

### Core Mechanics

- **16×12 tile grid**, restricted build spots (like Kingdom Rush) — not every tile is buildable, forcing strategic placement at chokepoints
- **4 tower types** with 3 upgrade levels each + branching at level 3 (choose specialization A or B)
- **4 enemy types mapped to math KCs** + boss
- **8 waves** + boss wave, 30-45 sec each, ~12 min total per map
- **Question gating**: Building/upgrading triggers MCQ. Correct = built. Wrong = half KC refunded (not punitive). Speed bonus: <3s = 25% cost reduction
- **Prep phase**: 15 sec between waves. Optional "Study" button for bonus KC (proactive learning)
- **Economy**: Start 100 KC. Earn per kill (8-25) + wave bonus + early call bonus + 5% interest on savings
- **Lives**: 20 Core Integrity. Leaking enemies costs 1-3 lives based on type. Not instant death.
- **Pause + inspect**: Player can pause anytime, hover towers for full stats, see enemy path preview

### Directory: `apps/games/concept-cascade/`
```
index.html, main.js, package.json
src/
  scenes/     menu.js, battlefield.js, waveResults.js, postGame.js
  systems/    telemetry.js, questionEngine.js, progression.js, gameState.js,
              waveManager.js, towerSystem.js, synergySystem.js, assessmentEngine.js
  components/ questionOverlay.js, hudRenderer.js, towerComp.js, enemyComp.js,
              projectileComp.js, actionEffects.js
  config/     constants.js, towers.js, enemies.js, waves.js, synergies.js
  data/questions/ number_sense.json, operations.json, fractions.json, geometry.json
  data/maps/  map1.js, map2.js
```
~26 files

### Key Telemetry (natural byproduct of fun mechanics)
- `synergy_discovered` {towerA, towerB, synergyName} — from discovery system
- `early_call_used` {waveNumber, bonusKC} — from risk/reward mechanic
- `risky_upgrade_attempted` {towerType, success, difficultyJump} — from gambling mechanic
- `tower_placed` / `tower_upgraded` / `wave_completed` — from core loop
- `chain_kill` {count, bonusKC} — from kill feedback
- `strategy_shift_detected` / `resource_allocation` — computed from tower placement patterns
- `question_answered` {context, correct, responseTimeMs} — from question gating

---

## Game 2: Knowledge Quest (Turn-Based RPG) — #27

**Fun inspirations:** Slay the Spire (roguelike spell deck), Paper Mario (timed hits), Undertale (meaningful choices + enemy personality), Pokemon (creature collection, type matchups)

### What Makes It Fun (Not Just Educational)

**1. Active Combat — "Timed Casts" (Paper Mario style)**
Questions don't just gate spells — they ARE the spells:
- After answering correctly, a timing minigame appears: a shrinking ring around the target. Press SPACE when the ring is smallest for "PERFECT CAST!" (2x damage + sparkle effect)
- "GOOD" timing = 1.5x, "OK" = 1x, miss timing = 0.7x (still hits, just weaker)
- This makes every turn physically engaging, not passive menu clicking
- Different spells have different timing patterns (single ring, double ring, moving target)
- Wrong MCQ answer = spell fizzles with a comedic animation (wand sputters, character looks embarrassed)

**2. Enemy Personality (Undertale-inspired)**
Each enemy type has unique behaviors and quirky personalities:
- **Ignorance Imps**: Argue with each other during battle ("No, 2+2 is 5!" "Is not!"). Killing the leader makes the rest scatter
- **Confusion Crawler**: Literally confused — shuffles YOUR spell menu around. You have to find your spells
- **Doubt Shade**: Whispers discouraging things in text bubbles ("You can't do this..."). Answering correctly makes it shrink
- **Apathy Giant**: Falls asleep mid-battle. If you don't attack for 2 turns, it falls asleep completely and you can sneak past (non-violent option)
- **Chapter Boss — The Riddler**: Asks YOU riddles between attack turns. Answering its riddles weakens it.

**3. "Knowledge Companion" Collection (Pokemon-style)**
- Defeating enemies sometimes drops a "Knowledge Spark" — a tiny creature representing a concept (e.g., "Pythos the Triangle", "Reactia the Molecule")
- Companions sit in your party (up to 3 slots) and provide passive buffs:
  - Pythos: +20% damage on geometry questions
  - Reactia: Correct science answers heal 10 HP
  - Algebrix: Doubles speed bonus on algebra questions
- Companions level up as you answer questions in their domain — they visually evolve (bigger, more detailed, glowing)
- Collection screen shows all discovered companions with fill-in-the-blanks progress (gotta catch 'em all)

**4. Branching Chapter Maps (Slay the Spire style)**
- Each chapter is a branching path with nodes: Combat, Dialogue/Dilemma, Rest/Shop, Mystery Event, Boss
- Player chooses their route — shorter risky path vs longer safer path
- Mystery events are random: might be a free companion, a curse, a bonus question for loot, or a funny NPC encounter
- Map is visible from the start so player can plan their route (full information, like Slay the Spire)

**5. Meaningful Dialogue Consequences (Undertale-inspired)**
Choices don't just track metrics — they visibly change the world:
- Help the merchant? He appears later in the chapter selling rare items
- Ignore the struggling student? Later you encounter them as a mini-boss (they became bitter)
- Share resources? Your companion trust increases, they use better abilities in combat
- NPCs remember and reference your past choices in dialogue

**6. The Mentor is a Character (Not Just a Hint Button)**
- The Mentor is "Professor Sage" — a floating owl with glasses and a dry sense of humor
- He doesn't just give hints — he has dialogue, reacts to your performance, and occasionally gives unsolicited (funny) commentary
- "Hmm, that answer was... creative. Let me suggest thinking about it differently."
- Using hints doesn't feel like "cheating" — it feels like consulting a witty advisor

### Core Mechanics

- **3 chapters**, each with a branching map of ~8-10 nodes
- **Turn-based combat**: Spell Cast (MCQ + timing minigame), Defend (halve damage), Use Item, Ask Mentor (3 tokens/chapter)
- **6 spells** unlocked progressively, each with unique timing pattern
- **5 enemy types** with distinct personalities and non-violent defeat options
- **Knowledge Companions**: collectible creatures providing passive buffs, level up through domain questions
- **Social dilemmas**: 3-4 per chapter with visible world consequences
- **Difficulty paths**: Player chooses route on chapter map (risk/reward)
- **Combat stats**: HP, MP (spell mana — regenerates 1/turn), Speed, companion buffs

### Directory: `apps/games/knowledge-quest/`
```
index.html, main.js, package.json
src/
  scenes/     menu.js, chapterSelect.js, chapterMap.js, combat.js,
              dialogue.js, shop.js, postChapter.js
  systems/    telemetry.js, questionEngine.js, progression.js, gameState.js,
              combatSystem.js, dialogueSystem.js, mentorSystem.js,
              companionSystem.js, assessmentEngine.js
  components/ questionOverlay.js, hudRenderer.js, combatUI.js, timingRing.js,
              dialogueBox.js, mentorPanel.js, companionCard.js,
              enemyComp.js, actionEffects.js
  config/     constants.js, spells.js, enemies.js, chapters.js, companions.js
  data/questions/ math.json, science.json
  data/story/     chapter1.js, chapter2.js, chapter3.js
```
~31 files

### Key Telemetry (natural byproduct of fun mechanics)
- `timing_cast` {spellId, timingQuality: perfect|good|ok|miss} — from timed hit system
- `companion_collected` {companionId, domain} — from collection system
- `companion_evolved` {companionId, newLevel} — from leveling system
- `map_path_chosen` {nodeSequence, riskLevel} — from branching map
- `enemy_spared` {enemyType} — from non-violent options (D5 empathy)
- `dialogue_choice` {dilemmaId, choiceCategory, worldConsequence} — from meaningful choices
- `hint_requested` {timing, tokensRemaining} — from Mentor interactions
- `combat_strategy` {offensiveActions, defensiveActions, itemsUsed} — computed from combat patterns

---

## Game 3: Lab Explorer (Virtual Science Lab) — #20

**Fun inspirations:** Kerbal Space Program (spectacular failure), The Incredible Machine (Rube Goldberg satisfaction), Powdertoy (visual physics sandbox)

### What Makes It Fun (Not Just Educational)

**1. Spectacular Failure States (KSP-inspired)**
Wrong experiments don't just say "incorrect" — they produce hilarious visual results:
- Mix acid + base wrong: solution erupts in foam that fills the screen, beakers topple like dominoes
- Overload a circuit: sparks fly, lights pop in sequence, the ammeter needle spins wildly
- Drop a weight too fast: scale catapults the weight off-screen with a cartoon "boing" sound
- Heat something too much: beaker glows red → orange → white → comedic mushroom cloud of steam
- Each failure is unique, animated, and teaches something ("Whoa! That's what happens when you add too much acid!")
- "Disaster Gallery" in the menu shows all the failures you've triggered (collectible achievements!)

**2. Real-Time Visual Physics Sandbox**
- Solutions change color gradually as you add drops (smooth HSL interpolation: red → orange → green → blue)
- Bubbling intensity scales with reaction rate (particles + animated surface)
- Temperature shown as a liquid thermometer animation that rises/falls smoothly
- Pendulums swing with accurate physics (smooth sine wave motion)
- Circuit diagrams light up as current flows (animated electrons traveling along wires)
- All feedback is immediate — adjust a slider and see the result in real-time, no "submit and wait"

**3. "Discovery Journal" Collection**
- Each experiment has 3-5 hidden "discoveries" — things you can find by experimenting beyond the minimum:
  - Acid-Base: "What happens at pH 1?" (extreme acid dissolves the beaker → failure achievement + discovery)
  - Pendulum: "Does mass affect period?" (no! Discovering this earns "Galileo's Insight" badge)
  - Circuits: "What happens with 0 resistance?" (short circuit → sparks → "Danger Zone" discovery)
- Discoveries are logged in a beautiful lab journal with hand-drawn style illustrations
- Completionists will replay experiments to find all discoveries

**4. "Professor Challenge" Mode**
- After completing an experiment normally, unlock "Professor Challenge": harder version with a twist
  - Acid-Base challenge: "Neutralize the solution using only 5 drops total" (precision challenge)
  - Circuits challenge: "Light all 3 bulbs using only 2 batteries" (creative problem-solving)
  - Pendulum challenge: "Match a target period of exactly 2.0 seconds" (fine-tuning challenge)
- 3-star rating based on accuracy, efficiency, and creativity

**5. No Single Right Answer**
- Density experiment: measure with water displacement OR compare to known materials — both valid
- Circuits: multiple valid configurations light the bulb
- The game says "Great approach!" not "That's the right answer" — validates process, not memorization

### Core Mechanics

- **5 experiments** in sequence, each ~3-4 min: Acid-Base, Density, Circuits, Pendulum, Heat Transfer
- **Experiment loop**: Hypothesis (select from guided options) → Equipment (drag from shelf) → Variables (sliders with real-time visual feedback) → Run (animated result) → Observe (write/select observations) → Conclude (MCQ)
- **Wrong equipment triggers fun MCQ** ("Why wouldn't a thermometer help measure pH?") — not punitive, educational
- **Safety goggles reminder** for chemistry labs (gentle, tracked for awareness)
- **Professor Challenges** for replay value (unlock after first completion)
- **Discovery Journal** with collectible findings + "Disaster Gallery" achievements
- **Scoring**: hypothesis (0-20) + equipment (0-20) + exploration (0-20) + accuracy (0-20) + conclusion (0-20)

### Directory: `apps/games/lab-explorer/`
```
index.html, main.js, package.json
src/
  scenes/     menu.js, labSelect.js, experiment.js, journal.js, postLab.js
  systems/    telemetry.js, questionEngine.js, progression.js, gameState.js,
              experimentEngine.js, discoveryTracker.js, assessmentEngine.js
  components/ questionOverlay.js, hudRenderer.js, equipmentPanel.js,
              variableControls.js, resultDisplay.js, actionEffects.js, journalView.js
  config/     constants.js, equipment.js, experiments.js
  data/questions/ chemistry.json, physics.json
  data/experiments/ acid_base.js, density.js, circuits.js, pendulum.js, heat_transfer.js
```
~26 files

### Key Telemetry (natural byproduct of fun mechanics)
- `failure_triggered` {experimentId, failureType, discoveryUnlocked} — from spectacular failures
- `discovery_found` {experimentId, discoveryId, wasAccidental} — from exploration
- `experiment_run` {runNumber, variableSettings, result, wasSystematic} — from sandbox play
- `professor_challenge_attempted` {experimentId, stars, approach} — from challenge mode
- `variable_adjusted` / `equipment_selected` / `self_correction` — from experiment loop
- `process_sequence` {steps} — full action log for process mining

---

## Game 4: Survival Equation (Collaborative Puzzle) — #28

**Fun inspirations:** Keep Talking and Nobody Explodes (information asymmetry), Overcooked (time pressure + coordination chaos), Among Us (communication-driven gameplay)

### What Makes It Fun (Not Just Educational)

**1. Information Asymmetry IS the Game (Keep Talking style)**
- Each role sees DIFFERENT information panels. The Engineer's screen shows material specs; the Scientist sees formulas; nobody sees everything.
- Puzzles are literally unsolvable alone — you MUST ask teammates for their exclusive data
- The fun comes from the communication: "What's the tensile strength of bamboo?" → "37 megapascals, but it drops to 12 when wet!" → "It's RAINING tomorrow, check the forecast!" → "Oh no, we need a different material!"
- Information is presented as immersive in-world documents (blueprint sketches, lab reports, medical charts, maps) — not just text boxes

**2. Escalating Environmental Chaos (Overcooked-style)**
Each day introduces a new complication that disrupts plans:
- **Day 1**: Calm. Learn the systems. Build basic shelter.
- **Day 2**: Storm warning! Rush to reinforce shelter. Some materials get wet (properties change).
- **Day 3**: A teammate gets "sick" (reduced action points). Must divert resources to medical care.
- **Day 4**: Discovery of another crash survivor's camp — trade opportunity or rival?
- **Day 5**: Rescue signal must be built. All remaining resources go toward one final collaborative build.
- Each complication is announced with dramatic "BREAKING NEWS" style alerts and tense music shifts

**3. "Choose Your Doom" Decisions (With Comedy)**
Resource allocation moments are framed as dramatic group votes with funny consequences:
- "We have 3 ration packs. 4 people. Who gets the short straw?"
  - Share equally (everyone gets 75% nutrition → slight debuff)
  - Feed the sick teammate extra (prosocial → medic gets full strength back)
  - Player takes extra for themselves (tracked as selfish... and the game makes NPCs react with visible disappointment)
- The AI partners have animated reactions: happy, sad, angry, confused faces that change with decisions

**4. AI Partners With Personality (Not Just Data Sources)**
Each AI partner has a distinct personality that creates memorable interactions:
- **Raza (Engineer)**: Confident, sometimes overestimates. "I'm 90% sure this will hold." (It's actually 60%.)
- **Juno (Scientist)**: Precise but wordy. Gives more info than needed. "The boiling point of water at sea level pressure of 101.325 kPa is precisely 100°C, assuming pure H2O..."
- **Kit (Medic)**: Nervous but caring. "Are you sure that's safe? Maybe we should double-check?" Asks player to verify before acting.
- **Navi (Navigator)**: Adventurous, wants to explore. Suggests risky detours. "I saw something shiny on the ridge — should we check it out?"
- Partners sometimes disagree with each other, creating natural "discussion" moments
- Their dialogue is witty and personality-driven, not robotic

**5. Mini-Puzzle Variety (Not Repetitive)**
Each survival puzzle is a different mini-game, not the same MCQ format:
- **Water Purification**: Drag-and-drop filter layers in correct order (gravel → sand → charcoal → cloth). Visual: water gets clearer through each layer.
- **Shelter Engineering**: Place support beams on a 2D structure. Physics simulation shows if it holds or collapses (satisfying destruction on failure).
- **Signal Boost**: Wire a circuit from scavenged parts. Connect nodes on a diagram. Current flows visually when correct.
- **Food Rationing**: Math puzzle — divide calories across team with constraints (allergies, activity levels). Drag sliders to allocate.
- **Navigation Challenge**: Plot a course on a map avoiding hazards, calculating distances with Pythagorean theorem.
- Each puzzle has a physical "do-something" interaction, not just text answers.

**6. Countdown Timer Creates Natural Drama**
- Each day has a real-time countdown (3-4 minutes). Puzzles must be solved before nightfall.
- As time runs low, the sky darkens gradually, music becomes tense, a ticking clock appears.
- Running out of time doesn't end the game — you just lose the day's resources and enter the next day weaker. Recoverable, but stressful.
- Speed bonuses for finishing puzzles quickly (leftover time → bonus resources)

### Core Mechanics

- **3 scenarios**: Desert Island (intro), Space Station (medium), Underwater Base (hard)
- **5 days per scenario**, 2-3 puzzles per day, ~15-20 min total
- **4 specialist roles**: Engineer, Scientist, Medic, Navigator — player picks one, AI fills rest
- **Information asymmetry**: each role has exclusive data panels
- **Chat panel**: type messages or use contextual quick-prompts. AI responds based on personality.
- **Varied mini-puzzles**: drag-and-drop, circuit wiring, physics simulation, math allocation, map plotting
- **Resource management**: food/water/materials shared pool with daily consumption
- **Escalating events**: storm, sickness, rival camp, final signal build
- **Day timer**: 3-4 min real-time countdown per day

### Directory: `apps/games/survival-equation/`
```
index.html, main.js, package.json
src/
  scenes/     menu.js, scenarioSelect.js, roleAssignment.js, survivalHub.js,
              puzzleRoom.js, scenarioResults.js, postGame.js
  systems/    telemetry.js, questionEngine.js, progression.js, gameState.js,
              aiPartnerSystem.js, communicationSystem.js, resourceSystem.js,
              puzzleEngine.js, assessmentEngine.js
  components/ questionOverlay.js, hudRenderer.js, chatPanel.js, resourcePanel.js,
              roleCard.js, puzzleBoard.js, aiPartnerAvatar.js, actionEffects.js
  config/     constants.js, roles.js, scenarios.js, aiPersonalities.js
  data/questions/ applied_math.json, applied_science.json
  data/scenarios/ desert_island.js, space_station.js, underwater_base.js
  data/puzzles/   water_purification.js, shelter_construction.js, signal_boost.js
```
~32 files

### Key Telemetry (natural byproduct of fun mechanics)
- `message_sent` {recipientRole, messageType, relevanceScore} — from chat system
- `puzzle_solved` {puzzleType, timeUsed, teamInfoShared} — from mini-puzzles
- `resource_allocation` {distribution, equityIndex} — from "Choose Your Doom" decisions
- `partner_disagreement_resolved` {resolution} — from personality clashes
- `leadership_pattern` {proposalsMade, questionsAsked} — from communication
- `day_event_response` {eventType, teamAdaptation} — from escalating chaos
- `information_requested` / `information_shared` — from asymmetry mechanic

---

## Question Banks

Each game needs ~50-75 questions per subject file (10-15 per difficulty 1-5). Questions should be fun and contextual:
- Concept Cascade: math word problems themed around "defending the Knowledge Core"
- Knowledge Quest: questions woven into spell lore ("To cast Frost Wave, solve...")
- Lab Explorer: experiment-themed ("If you add 5mL of acid to 10mL of base...")
- Survival Equation: survival-themed ("Your water filter produces 2L/hour. For 4 people over 3 days...")

---

## Documentation & Process

After each game:
1. Commit referencing issue number
2. Update ECD doc (`docs/assessment/ecd/<game>.md`) from DRAFT to reflect implementation
3. Update `worklog.md`
4. Update memory files
5. Close GitHub issue

After all 4: update Blueprint, coverage-matrix.json, regenerate DOCX.

---

## Verification Per Game

1. Open `index.html` — game loads, menu works
2. Play full session — all scenes reachable, no crashes
3. Fun check: "Would I play this again?" — satisfying feedback, engaging loop, variety
4. Telemetry: check localStorage for session data with correct events
5. Progression: XP, levels, badges, unlocks working
6. Replayability: different choices/strategies produce different outcomes
