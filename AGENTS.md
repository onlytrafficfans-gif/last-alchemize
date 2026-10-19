# AGENTS.md — Base44 dev environment

## What this is
An Expo (React Native + web) app, "Alchemize", with an optional Hono/tRPC backend.
The Base44 preview runs the **web** target only (`expo start --web`).

## Running it
```
docker compose -f docker-compose.base44.yml up -d
```
- Base image: `oven/bun:1.3.14-debian` (bun is the package manager; lockfile is `expo/bun.lock`).
- Source is bind-mounted from `./expo` → `/app`; `node_modules` lives in an anonymous volume.
- Deps install on every container start via `bun install --frozen-lockfile`, then
  `bunx expo start --web --port 3000 --host lan`.
- Preview entry point: host port **3000** → container 3000.

## Gotchas
- **`--host` only accepts `lan|tunnel|localhost`** — NOT `0.0.0.0`. Use `--host lan`
  (binds all interfaces). Passing `0.0.0.0` throws an assertion error and the
  container restart-loops.
- First web bundle takes ~60-90s (13 MB bundle). The healthcheck has a 180s
  start_period to tolerate this.
- The backend (Hono/tRPC + SurrealDB) is **not** run in the preview. The web app
  boots without it: tRPC client warns if `EXPO_PUBLIC_RORK_API_BASE_URL` is unset,
  Supabase falls back to local storage, and DB init is gated on
  `Platform.OS !== 'web'`.
- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and
  `EXPO_PUBLIC_RORK_API_BASE_URL` are all **optional** — the app renders without them.

## Verifying the preview
- `curl -sf http://localhost:3000/` → HTTP 200 (HTML shell).
- The JS bundle: `curl http://localhost:3000/node_modules/expo-router/entry.bundle?platform=web&dev=true&...`
  → HTTP 200, ~13 MB. A 200 with no `TransformError`/`Unable to resolve` lines means the build is clean.
- In the live preview the app redirects to `/auth` and renders the sign-up form.
