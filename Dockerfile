# Single-service static deploy of the EdGame games for Railway / any
# Docker host. Serves the repo root via the `serve` package on $PORT
# (Railway sets this automatically). No backend, no DB — telemetry
# POSTs to /api/* return 404 and the games' offline-mode fallback
# writes sessions to localStorage.
#
# Why a Dockerfile and not nixpacks: Railway auto-detects pnpm-workspace
# and tries to spin up 6 services (5 games + apps/web). Shipping a
# Dockerfile forces a single service serving the entire repo.

FROM node:20-alpine

WORKDIR /app

# Install only what we need to serve static files. `serve` is a
# 100-line static-file server from the Vercel team.
RUN npm install --no-audit --no-fund --no-save -g serve@14

# Copy the entire repo (the .dockerignore strips node_modules,
# heavy raw assets, the Next.js app source, etc.).
COPY . .

EXPOSE 8080

# Railway sets PORT; default to 8080 locally. The serve.json at the
# repo root disables `cleanUrls` so relative imports like `./main.js`
# inside each game still resolve correctly.
CMD ["sh", "-c", "serve -l tcp://0.0.0.0:${PORT:-8080} ."]
