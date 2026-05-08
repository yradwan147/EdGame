# Deploy EdGame on Railway

One-click deploy of the 5 EdGame games as a static site, **as a single service**. Telemetry runs in offline mode (writes to localStorage only) — no database, no API server, no environment variables to configure.

## What gets deployed

- **Landing page** at `/` listing all 5 games
- **All 5 games** at `/apps/games/<game>/index.html`
- **Sample telemetry CSVs** at `/reports/sample-telemetry/`
- **ECD docs**, blueprint PDF, README — all browseable

## What does NOT get deployed (and why)

- The Next.js backend at `apps/web/` — it's a separate service that needs SurrealDB. For a public demo, the games' offline-mode fallback is enough.
- Persisted telemetry — sessions are stored in the visitor's browser localStorage rather than a central DB.

If you want the full stack later (backend + DB), that's a separate deploy: a Next.js service + a SurrealDB service on Railway, with `SURREALDB_URL` etc. wired into the web app's env vars. See `apps/web/.env.example`.

## One-click deploy steps

The repo ships a `Dockerfile` so Railway treats the whole repo as a **single service** instead of auto-splitting the pnpm workspace into one service per game.

1. Push your latest commit to GitHub:
    ```bash
    git push origin master
    ```

2. Open <https://railway.app> and sign in (GitHub auth).

3. Click **New Project** → **Deploy from GitHub repo**. Authorize Railway for the EdGame repo and pick it.

4. Railway sees the `Dockerfile` at the repo root and uses it. **You should see exactly ONE service** — not 6. If Railway tries to offer you a list of workspace packages to deploy, dismiss the picker and pick "Deploy with Dockerfile" / the root option.

5. The build runs:
    - `FROM node:20-alpine`
    - `npm install -g serve@14`
    - `COPY . .` (the `.dockerignore` strips node_modules, .git, KaplayRepo, etc.)
    - `CMD serve -l tcp://0.0.0.0:$PORT .`

6. Once the build is green, click the service → **Settings** → **Networking** → **Generate Domain**. You'll get a URL like `https://edgame-production.up.railway.app`.

7. Visit the URL. The landing page renders. Click any game card → game loads and is fully playable.

## Local dry-run before deploy

Same image Railway runs:

```bash
docker build -t edgame .
docker run --rm -p 8080:8080 edgame
# → http://localhost:8080
```

Or without Docker, just run `serve` directly:

```bash
npx serve -l 8080 .
```

You should see:
- `http://localhost:8080/` — landing page with 5 cards
- `http://localhost:8080/apps/games/pulse-realms/index.html` — Pulse Realms (etc. for the other 4)

In the browser DevTools Network tab you'll see telemetry POSTs to `/api/sessions` get **404** — that's expected. The game catches the error and falls back to localStorage.

## Custom domain (optional)

In the Railway service → **Settings** → **Networking** → **Custom Domain**, add e.g. `edgame.example.com` and follow the CNAME instructions. TLS is automatic.

## Cost

On Railway's free trial / hobby tier ($5 / mo), this static deploy uses ~50 MB of disk and near-zero CPU when idle. Should run within free credits indefinitely if traffic is light.

## Troubleshooting

- **Railway shows 6 services to deploy** — Railway's GitHub picker auto-detected the pnpm workspace and offered to split. Cancel and re-deploy "from root" / "with Dockerfile". Once the project is created with the Dockerfile, it stays a single service.
- **Build fails on `serve` install** — make sure `Dockerfile` exists at the repo root and the line `RUN npm install -g serve@14` is unchanged.
- **Site loads but games don't** — open browser DevTools → Network tab, look for failed loads under `apps/games/<game>/src/...`. If a 404, check that the file is committed to git (`git ls-files apps/games/`).
- **Telemetry errors in console** — expected; the games are offline-only on this deploy. To make telemetry persist, deploy the Next.js + SurrealDB stack (separate guide, not yet written).
