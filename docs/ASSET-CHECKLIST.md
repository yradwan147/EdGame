# EdGame — Asset Shopping Checklist

Per-game inventory of visual assets needed to upgrade the games from procedural KAPLAY shapes to polished sprite-based visuals. **Each row tells you what's currently rendered, where in the code, and what the swap-in spec is.**

## Conventions

- **Drop sprites here:** `apps/games/<game>/assets/sprites/<element>_<state>.png`
- **Animation states:** `_idle`, `_walk`, `_attack`, `_hurt`, `_death` (when applicable). Save as separate PNGs or as a sprite sheet — KAPLAY supports both via `k.loadSprite("name", "path", { sliceX: N, anims: { idle: { from: 0, to: 3 } } })`.
- **Sound:** drop into `apps/games/<game>/assets/audio/<name>.{mp3,ogg}`, register via `k.loadSound("name", "...")`.
- **Music:** same dir, use `k.play("name", { loop: true, volume: 0.4 })`.
- **Format:** PNG for sprites (transparency), MP3 or OGG for audio. WebP is fine too.
- **Scale:** all games render at 1280×720. Sprites listed at "natural" size; scale up 1.5–2× if the source pack is high-res so KAPLAY can downsample cleanly.

After you drop assets, the in-code swap is a one-liner per element — replace the `k.rect(W, H, color)` call with `k.add([k.sprite("name"), k.pos(...), ...])`.

---

## Pulse Realms — `apps/games/pulse-realms/`

**What's already real art:** player character sheets in `public/characters/player1/` through `player5/` (Idle/Walk/Attack/Hurt/Death PNG sheets — frame-sliced via `k.loadSprite` with `anims`).

### Enemies / Boss (highest priority)

| Element | Currently | Recommended |
|---|---|---|
| Enemy body | `src/components/actionEffects.js:13` (`k.circle(5)`) and arena spawn logic — colored circles | **5 enemy types × 64×64**, states: idle / walk / attack / hurt / death (4–6 frames each). E.g. shadow_imp, void_crawler, mind_phantom, apathy_giant, and a chapter mini-boss. |
| Boss (3 phases) | Same pattern (larger circle) | **96×128** boss sprite, 3 phase variants (intact / cracked / final form). |

### UI / HUD

| Element | Currently | Recommended |
|---|---|---|
| Ability card frame (×4 cards) | `src/components/hudRenderer.js:54` (`k.rect(280,34)`) | 320×48 ability-card frame PNG (panel art with slot for the icon below) |
| Player HP / status panel | `hudRenderer.js:24` (`k.rect(500,138)`) | 512×140 framed HUD panel with avatar slot |
| Ability icons (×4: 2 per role × 3 roles → 6 unique icons total) | Currently text-only inside the cards | **64×64** flat icons — fire bolt, ice nova, heal pulse, shield, AoE blast, etc. |
| Range visualizer (cast preview) | `src/scenes/arena.js:314-329` (`k.circle(radius)` outline) | 256×256 range-ring sprite with pulse animation (4–8 frames) |
| Heal / shield FX ring | `actionEffects.js:60-84` (`k.circle(35-55)`) | 128×128 heal-ring + shield-ring sprites (4 frames pulse each) |
| Attack beam | `actionEffects.js:92-101` (`k.rect(length,8)`) | 256×16 beam sprite, tile-able along length |
| Damage particle | `actionEffects.js:13` (`k.circle(5)`) | 16×16 particle (4 frames lifecycle: bright → dim) |

### Background / Tileset

| Element | Currently | Recommended |
|---|---|---|
| Arena background | Solid color | One arena tileset (32×32 tiles) — floor + walls + obstacles. Top-down sci-fi or fantasy theme. |

### Audio (currently silent)

| Element | Recommended |
|---|---|
| Background music | 1 looping arena track, 2–3 min |
| SFX | ability cast (×3 distinct), enemy hit, enemy death, player hurt, victory, defeat, button click |

---

## Concept Cascade — `apps/games/concept-cascade/`

**What's already real art:** none — 100% procedural KAPLAY shapes.

### Towers (highest priority — these are the player's primary visual identity)

| Element | Currently | Recommended |
|---|---|---|
| Tower base | `src/components/towerComp.js:191-198` (`k.drawRect(baseSize, baseSize, rounded)`) | **4 tower types × 3 levels × ~2 branches at level 3 = ~16 sprites at 64×64**. Tower types: Number Bastion, Operation Cannon, Fraction Freezer, Geometry Guard. |
| Tower turret barrel | `towerComp.js:219-225` (`k.drawLine` + endpoint circle) | 64×64 rotateable turret overlay (drawn on top of base, rotated to aim at target) |
| Tower level pips | `towerComp.js:236-243` (`k.drawCircle(2.5)`) | 16×16 level-pip sprite (1, 2, 3 dots) |

### Enemies

| Element | Currently | Recommended |
|---|---|---|
| Enemy body | `src/components/enemyComp.js:243-256` (`k.drawCircle(radius)` + inner highlight) | **5 enemy types × 80×80**, states idle / walk / death (4 frames each). Per-type personalities (`src/config/enemies.js`): Number Sprite (swarming), Operation Ogre (lockstep), Fraction Phantom (flickering), Geometry Golem (cracking — 50% HP variant), Concept Dragon (boss, 3 phases). |
| Enemy fragment | Same component, smaller circle | 40×40 fragment sprite (Geometry Golem splits into these at 50% HP) |

### Projectiles + VFX

| Element | Currently | Recommended |
|---|---|---|
| Projectile body | `src/components/projectileComp.js:222-234` (`k.drawCircle(5)`) | 16×16 projectile sprite × 4 distinct types (bolt, cannonball, frost shard, beam). Optional 256×1 trail sprite (gradient line). |
| Splash ring (impact AoE) | `projectileComp.js:81-96` (`k.drawCircle(ringRadius)` outline) | 256×256 splash-impact-ring (8-frame expand animation) |
| Damage flash on hit | Code-generated white flash | 64×64 hit-spark sprite (4 frames) |
| Chain-kill popup | Text only | UI graphic for "CHAIN x3!" callout (256×64) |

### Map / Tileset

| Element | Currently | Recommended |
|---|---|---|
| Map tiles | `src/scenes/battlefield.js` draws tiles via `k.rect(40, 40, color)` per cell. The map is 16×12 cells × 40px = 640×480 with current placeholder colors. | **32×32 tile set:** path tile, buildable tile, obstacle, decoration. 8–12 tile sprites per map theme. 2 maps planned (`src/data/maps/map1.js`, `map2.js`). |
| Knowledge Core (the thing being defended) | Likely a procedural shape | 96×96 "core" sprite with idle pulse (4 frames) |

### UI

| Element | Currently | Recommended |
|---|---|---|
| Tower-card frames | `src/components/hudRenderer.js` (rectangles) | 96×128 tower-card frame (1 frame, then put tower base sprite on top) |
| Gold / Heart / Wave icons (top HUD) | Text labels | 32×32 each: gold-coin, heart, wave-flag |
| Wave-clear banner | Procedural text | 512×128 "WAVE CLEAR!" banner art |
| Synergy-discovered popup | Procedural | 256×256 "SYNERGY!" graphic + glowing connection beam art (used in towerSystem when 2 towers form a synergy) |

### Audio

| Element | Recommended |
|---|---|
| Music | 1 looping battle track (intensifies with wave number) |
| SFX | tower place, tower upgrade, enemy hit, enemy death, wave start, wave clear, synergy discovered, boss roar |

---

## Knowledge Quest — `apps/games/knowledge-quest/`

**What's already real art:** none.

### Combat scene (highest priority — this is where most playtime happens)

| Element | Currently | Recommended |
|---|---|---|
| Enemy sprite | `src/scenes/combat.js:193-209` (`k.rect(60,80)` + inner `k.rect(40,50)`) | **5 enemy types × 96×128**, states idle / attack / hurt / death (4–6 frames). Types in `src/config/enemies.js`: Ignorance Imp, Confusion Crawler, Doubt Shade, Apathy Giant, Riddler (boss). Personality matters — Imps argue (3 of them in formation), Crawlers shuffle (zigzag idle), Shades flicker (alpha pulse), Giants fall asleep (z's animation), Riddler has 3 phases. |
| Enemy health bar | `combat.js:224-234` (`k.rect(60,8)` + fill) | 80×12 hp-bar-bg + 80×12 hp-bar-fill sprites |
| Player wizard portrait (HUD avatar) | None (currently no portrait shown) | 96×96 player wizard idle portrait (or 96×96 × 3 — strong / hurt / casting) |
| Mentor (Professor Sage) portrait | Procedural | 96×96 floating-owl-with-glasses portrait, 3 emotions: neutral / surprised / smug |
| Battle background | Solid color per chapter | **3 backdrops (1 per chapter):** dungeon / forest / arcane library. 1280×720 each. |

### Spells

| Element | Currently | Recommended |
|---|---|---|
| Spell icons (×6 in `src/config/spells.js`) | Text on rectangles | **6 spell icons × 96×96** flat icons: fire_bolt, ice_lance, heal_pulse, lightning_strike, shadow_bind, earth_shield |
| Spell VFX (cast effects) | `src/components/actionEffects.js` | Per spell: 128×128 sprite with 4–8 frames cast animation (fire bolt fly-and-explode, ice lance pierce, heal sparkles, lightning bolt, shadow tendrils, earth shield bubble) |
| Timing ring | `combat.js:334-365` (`k.circle` + concentric ring) | 128×128 reticle + 256×256 outer expanding ring (8 frames). Color-coded by spell. |

### Companions (Pokemon-style collectibles in `src/config/companions.js`)

| Element | Currently | Recommended |
|---|---|---|
| Companion portrait | `combat.js:257` (`k.rect(70,90)`) and `src/components/companionCard.js` (rectangles) | **8 companions × 3 evolution stages = 24 sprites at 96×120**. From spec: Pythos (triangle creature), Reactia (molecule), Algebrix, Lumina, Calculon, Verdant, plus 2 more from `companions.js`. Each evolves visually (bigger / glowing). |
| Collection-screen frame | Procedural | 320×448 companion-card frame (rare / epic / legendary tints — 3 variants) |

### Chapter map (Slay-the-Spire–style branching map)

| Element | Currently | Recommended |
|---|---|---|
| Node icons | `src/scenes/chapterMap.js` likely uses `k.circle` per node type | **6 node icons × 64×64**: combat (sword), mystery (?), shop (coin bag), dialogue (speech bubble), rest (campfire), boss (skull). |
| Map background | Solid color | 1280×720 parchment-style map backdrop, 1 per chapter |
| Node connection lines | `k.drawLine` | Optional: tiled "rope" or "path" sprite to replace flat lines |

### UI panels

| Element | Currently | Recommended |
|---|---|---|
| Action panel (combat menu) | Rectangles | 320×120 ornate-panel frame (action buttons sit on top) |
| Dialogue box | Rectangles | 800×180 dialogue-box frame with character-name plate |
| Tooltip panel | Rectangles | 256×128 tooltip frame |

### Audio

| Element | Recommended |
|---|---|
| Music | 3 chapter themes (dungeon / forest / library), 1 boss theme, 1 menu theme |
| SFX | spell cast (×6 distinct), spell hit, enemy hit, enemy death, level up, companion collected, perfect-timing chime, item used |

---

## Lab Explorer — `apps/games/lab-explorer/`

**What's already real art:** none.

### Equipment items (the heart of the lab simulation)

The 5 experiments in `src/data/experiments/{acid_base, density, circuits, pendulum, heat_transfer}.js` reference equipment IDs. Equipment is currently rendered as colored rectangles + text labels.

| Element | Currently | Recommended |
|---|---|---|
| Equipment-shelf item frames | `src/components/equipmentPanel.js:75-80` (`k.rect(260,46)` per item) | 288×52 equipment-item-frame (panel art) |
| Equipment-category color dot | `equipmentPanel.js:85-88` (`k.circle(6)`) | 16×16 category-pip per category (chemistry / physics / mechanics) |
| Equipment icons | None currently — text label is the only identifier | **~20 equipment icons × 64×64**, listed in `src/config/equipment.js`: beaker, flask, ph_strip, dropper, indicator, scale, graduated_cylinder, weight_set, ruler, battery, wire, bulb, resistor, switch, ammeter, string, weight, stopwatch, protractor, thermometer, flame, metal_rod, insulator. **A Kenney "Lab Equipment" or "Science" icon pack covers most of these.** |

### Lab environment

| Element | Currently | Recommended |
|---|---|---|
| Lab bench backdrop | Solid color | 1280×720 lab-bench background (workbench surface, shelving, beakers in background) |
| Per-experiment scene backdrops | Solid color | **5 backdrops** (acid_base / density / circuits / pendulum / heat_transfer) — each themed differently (chem station / scale + tank / circuit board / pendulum stand / heat plate) |

### Experiment visuals (the "spectacular failure" + visual physics promise)

| Element | Currently | Recommended |
|---|---|---|
| Liquid in beaker | Procedural rect with color tween | 96×128 beaker-with-liquid sprite (5 fill levels × 5 colors = 25 frames, or use overlays) |
| pH change gradient | Procedural HSL interpolation | Could stay procedural OR use a 256×16 gradient strip texture |
| Pendulum bob + string | `k.drawCircle` + `k.drawLine` | 32×32 pendulum-bob sprite + 1×256 rope sprite |
| Circuit components (battery, bulb, wire) | Procedural shapes on the circuit board | 64×64 each: battery, bulb (off + lit states), wire-segment (h/v/corner variants), resistor, switch (open + closed) |
| Thermometer | Procedural rectangle with fill | 32×128 thermometer sprite (10 fill states or 1 with overlaid mercury column) |

### Failure / VFX (the "Disaster Gallery" feature)

| Element | Currently | Recommended |
|---|---|---|
| Foam overflow | Procedural | 256×256 foam-eruption sprite (8 frames) |
| Sparks / circuit short | Procedural particles | 128×128 spark-burst (6 frames) + 64×64 lightning-bolt (4 frames) |
| Steam / mushroom cloud | Procedural | 256×256 steam-burst (8 frames) |
| Cracking glass | Procedural | 96×128 beaker-cracked sprite (3 stages) |

### UI

| Element | Currently | Recommended |
|---|---|---|
| Discovery Journal page | Procedural | 800×600 hand-drawn-journal-page background (`src/scenes/journal.js`) |
| Disaster Gallery card | Procedural | 256×256 disaster-card frame |
| Phase-transition banner (HYPOTHESIS / EQUIPMENT / etc.) | Text only | 512×128 phase-banner sprite (5 variants, 1 per phase) |

### Audio

| Element | Recommended |
|---|---|
| Music | 1 calm lab ambient track, 1 "experiment intensifies" track |
| SFX | beaker clink, liquid pour, bubbling, electrical zap, spark, thermometer click, alarm (failure), success chime, page flip (journal) |

---

## Survival Equation — `apps/games/survival-equation/`

**What's already real art:** none.

### Role portraits (the player's identity + AI partners)

The 4 roles in `src/config/roles.js` (engineer, scientist, medic, navigator) need character art. AI partners in `src/config/aiPersonalities.js`: Raza, Juno, Kit, Navi.

| Element | Currently | Recommended |
|---|---|---|
| Role portrait | `src/scenes/roleAssignment.js:55-59` (`k.circle(35)`) | **4 portraits × 96×96** + 3 emotion states each (neutral / happy / worried / shocked) = 16 sprites. Match each AI personality: Raza confident, Juno precise, Kit nervous, Navi adventurous. |
| Role card frame | `roleAssignment.js:46-50` (`k.rect(280,420)`) | 320×480 role-card frame (4 variants tinted by role color) |
| AI partner avatar (in-game during puzzles) | `src/components/aiPartnerAvatar.js` (procedural) | Reuse the role portraits at 64×64 with chat-bubble-attach point |

### Scenarios (3 distinct settings)

| Element | Currently | Recommended |
|---|---|---|
| Scenario backdrops | Solid color | **3 full-screen backdrops × 1280×720**: desert island (palm trees, ocean), space station (interior bulkheads, viewports), underwater base (kelp, fish, dome). |
| Scenario-card thumbnails | `src/scenes/scenarioSelect.js` rectangles | 256×144 thumbnail per scenario (used on the picker card) |

### Puzzle board (varies per puzzle in `src/data/puzzles/`)

| Element | Currently | Recommended |
|---|---|---|
| Puzzle board feedback panel | `src/scenes/puzzleRoom.js:232-237` (`k.rect(600,120)`) | 640×140 feedback-panel sprite (correct + incorrect variants) |
| Filter layers (water_purification puzzle) | Procedural rectangles | 4 sprites at 256×64: gravel layer, sand layer, charcoal layer, cloth layer |
| Beams / supports (shelter_construction puzzle) | Procedural lines | Tile-able 32×128 beam sprite + 64×64 support-anchor |
| Circuit nodes (signal_boost puzzle) | Procedural circles | 48×48 node sprite (off + lit states) + tile-able 32×8 wire-segment |
| Ration tokens (food_rationing puzzle) | Procedural | 48×48 each: food, water, materials |
| Map markers (navigation_challenge puzzle) | Procedural | 32×32 each: start, hazard, destination, waypoint |

### UI

| Element | Currently | Recommended |
|---|---|---|
| Chat bubble frame | Procedural | 256×96 chat-bubble (3 variants — player / partner / system) |
| Resource icons (top HUD) | Text labels | 48×48 each: food, water, materials, team_health |
| Day countdown clock | Procedural | 96×96 clock sprite + needle (rotates over the day) |
| BREAKING NEWS banner | Procedural | 1280×96 banner art (used for storm, sickness, rival camp events) |
| Choose Your Doom dialog | Procedural panel | 640×320 dialog frame (used for resource-allocation votes) |

### Audio

| Element | Recommended |
|---|---|
| Music | 1 calm scenario theme, 1 tense "day running out" theme, 1 victory theme |
| SFX | chat send, chat receive, puzzle step correct, puzzle step wrong, day-end alarm, BREAKING NEWS sting, resource collected, team member sick |

---

## Quick-buy summary (what to grab from itch.io)

If you have to prioritize a few packs, these cover the most ground:

1. **One enemy/character pack** with 5+ humanoid creatures, 4-direction or front-facing, idle/walk/attack/hurt/death — covers PR enemies, KQ enemies, SE role portraits.
2. **One UI/HUD pack** with frames, ability icons, pips, banners — covers HUD work across all 5 games.
3. **One science/lab equipment icon pack** — covers most of LE.
4. **One tower-defense pack** with 4+ tower types and 4+ enemy types — covers CC.
5. **One pixel-art tileset pack** with 32×32 tiles for each environment (sci-fi arena, dungeon/forest/library, lab bench, jungle/space/underwater).
6. **One sound effects pack** (game UI + combat SFX) and **one music pack** (loopable background tracks, ~3–5 tracks).

After dropping assets in `apps/games/<game>/assets/sprites/` and `assets/audio/`, the in-code swap per element is:

```js
// before (in main.js or scene init):
// none

// after:
k.loadSprite("enemy_imp_idle", "./assets/sprites/enemy_imp_idle.png", {
    sliceX: 4, anims: { idle: { from: 0, to: 3, loop: true } },
});

// at the file:line listed above:
- k.add([k.rect(60, 80), k.color(red), k.pos(x, y)]);
+ k.add([k.sprite("enemy_imp", { anim: "idle" }), k.pos(x, y), k.anchor("center")]);
```

That's it — one `k.loadSprite` registration in `main.js` and a one-line swap at each call site listed above.
