# Deploy EdGame on Railway

One-click deploy of the 5 EdGame games as a static site. Telemetry runs in offline mode (writes to localStorage only) — no database, no API server, no environment variables to configure.

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

1. Push your latest commit to GitHub:
    ```bash
    git push origin master
    ```

2. Open <https://railway.app> and sign in (GitHub auth).

3. Click **New Project** → **Deploy from GitHub repo**. Authorize Railway for the EdGame repo and pick it.

4. Railway auto-detects `nixpacks.toml` + `railway.json` and builds. You should see the build log run:
    - **Setup:** install Node 20
    - **Install:** `npm install --no-audit --no-fund --no-save serve@14`
    - **Start:** `node node_modules/serve/build/main.js -l tcp://0.0.0.0:$PORT .`

5. Once the build is green, click the service → **Settings** → **Networking** → **Generate Domain**. You'll get a URL like `https://edgame-production.up.railway.app`.

6. Visit the URL. The landing page renders. Click any game card → game loads and is fully playable.

## Local dry-run before deploy

Same command Railway runs:

```bash
cd /path/to/repo
npm install
npm start
# → http://localhost:8080
```

Or with the existing local-dev script:

```bash
npm run serve:games   # serves on port 8899 to match the README
```

You should see:
- `http://localhost:8080/` — landing page with 5 cards
- `http://localhost:8080/apps/games/pulse-realms/index.html` — Pulse Realms (etc. for the other 4)

In the browser DevTools Network tab you'll see telemetry POSTs to `/api/sessions` get **404** — that's expected. The game catches the error and falls back to localStorage.

## What's in `nixpacks.toml`

```toml
providers = ["node"]

[phases.setup]
nixPkgs = ["nodejs_20"]

[phases.install]
cmds = ["npm install --no-audit --no-fund --no-save serve@14"]

[start]
cmd = "node node_modules/serve/build/main.js -l tcp://0.0.0.0:${PORT:-8080} ."
```

`serve` is the [Vercel `serve`](https://www.npmjs.com/package/serve) package — a battle-tested 100-line static-file server. We bind it to `$PORT` (Railway sets this automatically) on `0.0.0.0` (so external traffic can reach it) and serve the repo root.

## Custom domain (optional)

In the Railway service → **Settings** → **Networking** → **Custom Domain**, add e.g. `edgame.example.com` and follow the CNAME instructions. TLS is automatic.

## Cost

On Railway's free trial / hobby tier ($5 / mo), this static deploy uses ~30 MB of disk and near-zero CPU when idle. Should run within free credits indefinitely if traffic is light.

## Troubleshooting

- **Build fails on `npm install`** — make sure `package.json` at repo root lists `"serve": "^14.2.4"` in `dependencies` (already done).
- **Site loads but games don't** — open browser DevTools → Network tab, look for failed loads under `apps/games/<game>/src/...`. If a 404, check that the file is committed to git (`git ls-files apps/games/`).
- **Telemetry errors in console** — expected; the games are offline-only on this deploy. To make telemetry persist, deploy the Next.js + SurrealDB stack (separate guide, not yet written).
