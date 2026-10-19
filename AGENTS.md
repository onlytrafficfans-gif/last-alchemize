# AGENTS.md — Alchemize (Expo / React Native)

## Repo layout
- The Expo app lives in `expo/` (repo root is the parent). All app commands run from `expo/`.
- Package manager is **bun** (`bun@1.3.14`); lockfile is `expo/bun.lock`. Use `bun install` (non-frozen first time, then `--frozen-lockfile` once the lockfile matches `package.json`).
- A Hono + tRPC backend lives in `expo/backend/` and depends on SurrealDB (`RORK_DB_ENDPOINT/NAMESPACE/TOKEN`). The web preview renders without the backend because auth is local (AsyncStorage + SecureStore + bcrypt); the backend is only needed for live tRPC data.

## Base44 sandbox setup
- `docker-compose.base44.yml` runs the Expo **web** dev server from the cloned source via `bunx expo start --web --port 3000 --host lan`. Deps install into a named volume (`expo_node_modules`) on container start.
- Expo's `--host` flag only accepts `lan|tunnel|localhost` — **not** `0.0.0.0` (it throws an AssertionError). `lan` binds the interfaces the preview proxy needs.
- The user-supplied backend URL (`EXPO_PUBLIC_RORK_API_BASE_URL`) is optional for the preview and is delivered via `/run/base44/app.env` (env_file), never hardcoded in `environment:`.
- `expo/app.config.js` adds only the preview origin to Expo's CORS allowlist when `BASE44_PREVIEW_MODE === "1"`; Compose must pass `BASE44_PUBLIC_HOST_SUFFIX` as well. With the flag unset, the original config is returned unchanged.
- Run temporary exports with `docker compose -f docker-compose.base44.yml exec -T web ...` rather than leaving `compose run` containers alive: Expo exports can finish writing but keep watchers running, and one-off containers inherit irrelevant web healthchecks.
- These Base44/Docker changes are intentionally separate from application code.

## Critical: react-native-purchases / RevenueCat
- The entire subscription + payment system is built on `react-native-purchases` (RevenueCat):
  `expo/lib/purchases.ts` (the SDK wrapper) ← `expo/contexts/subscription-context.tsx` (Pro gating) ← `expo/app/paywall.tsx`, `expo/components/CustomerCenter.tsx`, `expo/lib/diagnostics.ts` ← `expo/app/bug-fixer.tsx`.
- `lib/purchases.ts` loads the module via a **dynamic `await import('react-native-purchases')`**. Metro resolves dynamic imports at **bundle time**, and `bug-fixer.tsx` is a route pulled in by Expo Router's `require.context`, so a missing `react-native-purchases` **fails the whole JS bundle** — no screen can render. It is NOT a runtime init failure that the `initPurchases` try/catch can swallow.
- iOS startup order: `RootLayout` → `AuthProvider` → `SubscriptionProvider` → `AuthGate` → `PaywallGate` → routes. `SubscriptionProvider` calls `initPurchases` only on native (`isPurchasesSupported()` = ios/android); on web it short-circuits and grants Pro. The native splash has a 3s fallback release.
- **Do not remove `react-native-purchases` without also removing/rewriting all of the above.** Removing only the dependency (as commit `0ba07d1` did) breaks the build and all subscription/payment functionality.

## Apple build / version
- `app.json` version is `1.4.7`. `eas.json` uses `autoIncrement: true` + `appVersionSource: remote`, so build numbers (e.g. "Build 29") live on EAS's servers — **not** in the repo. The repo has no record mapping a build number to a source revision.
- At the `1.4.7` version bump (`71259cc`) and its parent, `react-native-purchases` was still present. Only `0ba07d1` (HEAD of this branch) removed it — an unbuilt change that came after the submitted 1.4.7 build.

## Verification
- Production-equivalent bundle: `bunx expo export --platform web --output-dir /tmp/expo-dist` (run inside the web container; output to /tmp so the repo isn't polluted). Succeeds only when the module graph resolves.
- Dev preview: `docker compose -f docker-compose.base44.yml up -d`, then curl `http://localhost:3000/`. The app redirects unauthenticated users to `/auth`.
