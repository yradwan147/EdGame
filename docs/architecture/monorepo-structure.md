# Monorepo Structure

pnpm workspaces + Turborepo. See ADR-001 for rationale.

```
edgame/
├── apps/
│   ├── web/                          # Next.js 14 App Router — teacher/student dashboard
│   │   ├── app/
│   │   │   ├── (auth)/               # Auth routes (login, signup, callback)
│   │   │   ├── (dashboard)/          # Teacher dashboard (requires auth)
│   │   │   │   ├── classes/          # Class management pages
│   │   │   │   ├── assignments/      # Assignment CRUD pages
│   │   │   │   ├── analytics/        # Analytics views (class-level, student-level)
│   │   │   │   └── layout.tsx        # Dashboard shell (sidebar, nav)
│   │   │   ├── (student)/            # Student-facing pages
│   │   │   │   ├── play/             # Game launcher / assignment list
│   │   │   │   └── progress/         # Student self-view of progress
│   │   │   ├── api/                  # Route Handlers (see api-routes.md)
│   │   │   │   ├── auth/
│   │   │   │   ├── assignments/
│   │   │   │   ├── sessions/
│   │   │   │   ├── environments/
│   │   │   │   └── analytics/
│   │   │   ├── layout.tsx            # Root layout
│   │   │   └── page.tsx              # Landing page
│   │   ├── components/               # App-specific components
│   │   ├── lib/                      # App-specific utilities (SurrealDB client, auth, etc.)
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── games/                        # KAPLAY game environments
│       ├── pulse-realms/             # Game 1: Team Arena (existing code → migrated)
│       │   ├── src/
│       │   │   ├── scenes/           # menu, roleSelect, arenaBriefing, arena, postGame
│       │   │   ├── systems/          # telemetry, combatSystem, questionEngine, progression, gameState
│       │   │   ├── config/           # constants, roles
│       │   │   ├── components/       # UI overlays, HUD
│       │   │   └── data/             # Question JSON files
│       │   ├── main.js               # KAPLAY entry point
│       │   ├── index.html
│       │   └── package.json
│       ├── concept-cascade/          # Game 2: Tower Defense (future)
│       ├── lab-explorer/             # Game 3: Virtual Science Lab (future)
│       ├── knowledge-quest/          # Game 4: Turn-Based RPG (future)
│       └── survival-equation/        # Game 5: Collaborative Puzzle (future)
│
├── packages/
│   ├── shared/                       # Shared types, constants, utilities
│   │   ├── src/
│   │   │   ├── types/                # TypeScript types (User, Session, Event, Metric schemas)
│   │   │   ├── constants/            # Shared constants (dimensions, roles, subjects)
│   │   │   ├── validators/           # Zod schemas for API request/response validation
│   │   │   ├── db/                   # SurrealDB client factory
│   │   │   └── utils/                # Pure utility functions
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── ui/                           # Shared UI component library (shadcn/ui based)
│       ├── src/
│       │   ├── components/           # Button, Card, Dialog, Chart, DataTable, etc.
│       │   ├── styles/               # Tailwind theme, CSS variables
│       │   └── index.ts              # Barrel exports
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       └── package.json
│
├── docs/                             # Architecture docs, ADRs, assessment specs
│   ├── adr/
│   ├── architecture/
│   └── assessment/
│
├── turbo.json                        # Turborepo pipeline config
├── pnpm-workspace.yaml               # Workspace definition
├── package.json                      # Root scripts
├── .eslintrc.js
├── .prettierrc
└── tsconfig.base.json                # Shared TS config
```

## Workspace Config

**`pnpm-workspace.yaml`:**
```yaml
packages:
  - "apps/*"
  - "apps/games/*"
  - "packages/*"
```

**`turbo.json`:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

## Package Dependencies

```
apps/web
  ├── @edgame/shared        (types, validators, constants)
  ├── @edgame/ui             (UI components)
  ├── next, react
  ├── surrealdb
  └── tailwindcss, shadcn/ui primitives

apps/games/pulse-realms
  ├── @edgame/shared        (types, constants)
  └── kaplay

packages/shared
  ├── zod                    (schema validation)
  └── typescript

packages/ui
  ├── @edgame/shared        (types)
  ├── react
  ├── tailwindcss
  └── @radix-ui/* (shadcn/ui primitives)
```
