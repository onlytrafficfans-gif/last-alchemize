# Base44 Dev Environment

## Project Overview
Expo (React Native) app — "Alchemize" — that runs on web via Metro bundler.
Source lives in `expo/`. The app is a self-improvement toolkit (goals, habits,
fitness, calorie tracking, manifestation board, affirmations, etc.).

## Running the App
```bash
docker compose -f docker-compose.base44.yml up -d
```
- Web dev server on **port 3000** (Expo `--web` mode via Metro).
- Healthcheck: `bun -e "fetch('http://localhost:3000')..."` — checks HTTP 200.
- First bundle compile takes ~15–20s (3241 modules); subsequent loads are fast.

## Architecture Notes
- **Frontend only for web preview**: the Hono/tRPC backend in `expo/backend/`
  requires SurrealDB (`RORK_DB_ENDPOINT`, `RORK_DB_NAMESPACE`, `RORK_DB_TOKEN`)
  and is not used by the web client — the tRPC client in `lib/trpc.ts` is created
  but never imported by any app screen or context.
- **Auth is local**: `contexts/auth-context.tsx` stores users in AsyncStorage
  (web fallback = localStorage). No external auth provider needed for web.
- **DB on web**: `lib/database.ts` uses an in-memory `webStore` on web;
  `initDatabase()` is skipped (`Platform.OS !== 'web'` in `_layout.tsx`).
- **Subscriptions auto-unlock on web**: `isPurchasesSupported()` returns false
  on web → `isPro = true` → all features accessible without RevenueCat.
- **Supabase** (`lib/supabase.ts`) is only used for image uploads and throws
  if `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY` are missing —
  but the upload service is not called during normal browsing.

## No External Credentials Required
The web preview boots without any secrets. Optional integrations that need
real credentials to function (but won't block startup):
- `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` — image uploads
- `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` / `_ANDROID` — in-app purchases (native only)
- `RORK_DB_ENDPOINT` / `RORK_DB_NAMESPACE` / `RORK_DB_TOKEN` — backend SurrealDB

## Key Files
- `expo/app/_layout.tsx` — root layout, auth gate, paywall gate
- `expo/app/index.tsx` — home screen with feature card carousel
- `expo/app/auth.tsx` — sign-in / sign-up screen
- `expo/metro.config.js` — Metro config with Rork toolkit + wasm asset extension
- `expo/package.json` — uses Bun (`bun@1.3.14`), Expo SDK 54

## Dev Notes
- Expo CLI `--host` only accepts `lan|tunnel|localhost`; `--host lan` binds
  to all interfaces inside the container.
- **CORS**: Expo's `CorsMiddleware` rejects requests whose `Origin` doesn't
  match the request `Host` or the `extra.router.origin`/`headOrigin` from
  app config. `expo/app.config.js` dynamically sets `extra.router.headOrigin`
  to the preview origin (`https://3000-${BASE44_PUBLIC_HOST_SUFFIX}`) so the
  browser preview proxy is allowed. The `BASE44_PUBLIC_HOST_SUFFIX` env var
  is passed through compose as a bare environment entry.
- Package manager: Bun (`bun.lock`). Install: `bun install --frozen-lockfile`.
- Live reload works via Metro's file watcher on the bind-mounted `expo/` dir.
- Failed HEAD `/` requests in the preview are harmless healthcheck pings —
  Expo's dev server only handles GET.
