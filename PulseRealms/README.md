# Pulse Realms: The Omniverse Trials

An educational arena game built with [Kaplay.js](https://kaplayjs.com/). Answer subject-specific MCQs to power your abilities, coordinate with AI teammates, and compete in 3v3 matches.

## First-Time Setup

1. **Clone or download** the project to your machine.

2. **Install Node.js** (if you don't have it):
   - Download from [nodejs.org](https://nodejs.org/) (LTS recommended)
   - Or use a version manager like `nvm` or `fnm`

3. **No additional dependencies.** The game loads Kaplay from a CDN and uses `npx serve` for local hosting. No `npm install` required.

## Running the Game

From the project root:

```bash
npm run dev
```

Or:

```bash
npx serve -p 5175
```

Then open your browser to:

```
http://localhost:5175
```

## Controls

- **WASD** or **Arrow keys** — Move
- **1** — Use ability 1 (role-specific)
- **2** — Use ability 2 (role-specific)
- **H** — Tactical tips
- **Escape** — Pause / return to menu

## Project Structure

```
PulseRealms/
├── index.html
├── main.js
├── package.json
├── public/
│   └── characters/     # Sprite assets
└── src/
    ├── config/         # Constants, roles
    ├── scenes/         # Menu, role select, arena, post-game
    ├── systems/        # Combat, questions, telemetry, bot AI
    ├── components/     # Player, HUD, effects, MCQ overlay
    └── data/           # Question banks, arena maps
```

## License

MIT
