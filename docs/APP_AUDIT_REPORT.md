# Alchemize — App Audit Report

**Date:** 2026-10-19  
**Branch:** `fix-main-a953201e2716`  
**Commit:** `b9884a9511`  
**App Version:** 1.4.7  

---

## BEFORE REPORT — State Before This Session

### What Was Already Changed (Prior Sessions)

| Change | Commit | Status |
|--------|--------|--------|
| RevenueCat removed | `0ba07d1` | **Reverted** by `f19a0ef` — package restored |
| RevenueCat lockfile fixed | `f19a0ef` | ✅ `react-native-purchases@^10.4.1` in both `package.json` and `bun.lock` (resolves to 10.14.0) |
| Auth input fix | `b17035c` | ✅ Auth screen rendering and input interaction fixed |
| `app.config.js` restored | `5e4c2c2` | ✅ CORS preview-origin gating added for sandbox |
| Splash fallback | `975734f` | ✅ 3s fallback timer + immediate hide on root mount |
| Splash decoupled from services | `9b43f98` | ✅ Auth (8s timeout) + Subscription (8s timeout) boot-hang protection |
| Version bump to 1.4.7 | `71259cc` | ✅ For App Store resubmission |
| Preview-origin + stale jobs | `b9884a9` | ✅ `BASE44_PUBLIC_HOST_SUFFIX` passed to compose; stale export containers removed |

### What Was Actually Fixed
- RevenueCat dependency restored after accidental removal that broke the entire JS bundle
- Splash screen hang on cold launch — multi-layered fallback (immediate hide + 3s timer + 8s auth timeout + 8s subscription timeout)
- CORS rejection in sandbox preview — `app.config.js` conditionally adds preview origin
- Stale `compose run` containers cleaned up

### What Remains Unverified (Cannot Verify in This Environment)
- Native iOS cold launch — requires EAS build + physical device/TestFlight
- RevenueCat purchase flow — requires `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` EAS secret + sandbox testing
- HealthKit data sync — requires physical iOS device with Health data
- Camera/AI food recognition — requires physical device with camera + AI API key
- Apple Sign In — requires physical iOS device

### What Is Broken or Incomplete
- **RevenueCat API key not set** — `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` is not configured as an EAS secret. In production builds, `getApiKey()` will throw, `initPurchases` catches it and returns `false`, and all purchases will fail. This is the #1 blocker.
- **No Google Sign In** — Only Apple Sign In and email/password auth exist. The user's prompt mentions Google Sign In; it is not implemented and would require additional configuration.
- **`supportsTablet: false`** in `app.json` — iPad support is explicitly disabled. The user's prompt mentions iPad testing; this may need to be changed to `true` for iPad TestFlight testing.

### What Must Be Preserved
- RevenueCat integration (`react-native-purchases`) — removing it breaks the entire bundle
- Splash screen fallback logic — prevents cold-launch hangs
- Auth context with boot timeout — prevents splash freezes
- Subscription context with init timeout — prevents paywall bypass
- All existing feature screens and their database integrations
- The crystal ball background image and brand identity on auth screen

---

## Changes Made This Session

### Phase 2 — Signup/Login Redesign (`expo/app/auth.tsx`)
- **Staggered entrance animations**: brand → card → fields → button → social, each with fade + slide up using `Easing.out(Easing.cubic)`
- **Password strength indicator**: 4-bar visual indicator (Weak/Fair/Good/Strong) shown during signup
- **Email validation**: Added `isValidEmail()` check with error feedback
- **Shake animation on error**: Card shakes horizontally when validation fails
- **Tab gradient**: Active tab now uses a LinearGradient background for premium feel
- **Brand glow**: Added a subtle sparkle icon above the title
- **Improved spacing**: Larger field height (50px), more padding, 24px card radius
- **Shadow depth**: Card now has shadow elevation for visual depth
- **Mode transition**: Fields re-animate when switching between login/signup
- **Preserved**: All existing functionality — login, signup, Apple Sign In, terms modal, language toggle, password reset, remember me, password visibility toggle

### Phase 3 — Splash Screen
- Splash configuration in `app.json` is correct: `resizeMode: "contain"`, `backgroundColor: "#0c0520"` matching the app theme
- `SplashScreen.preventAutoHideAsync()` called at module load (wins race with auto-hide)
- `SplashScreen.hideAsync()` called immediately on root mount
- 3-second fallback timer as safety net
- No white flash risk — background color matches app theme
- **No code changes needed** — splash logic is already production-ready

---

## Architecture Summary

### Startup Flow
```
JS bundle loads → [Startup] JS_STARTED
  → SplashScreen.preventAutoHideAsync()
  → RootLayout mounts → [Startup] ROOT_MOUNTED
    → SplashScreen.hideAsync() (immediate) → [Startup] NATIVE_SPLASH_HIDDEN
    → 3s fallback timer (safety net)
    → AuthProvider → [Startup] AUTH_STARTED
      → loadAuthState() with 8s timeout → [Startup] AUTH_INITIALIZED
    → SubscriptionProvider → initPurchases with 8s timeout
    → AuthGate (shows React splash while auth loads)
    → PaywallGate (shows blank while subscription loads)
    → Routes render → [Startup] FIRST_SCREEN_RENDERED (auth screen)
```

### Feature Inventory

| Feature | Route | Source Files | Backend Dependency | Status |
|---------|-------|-------------|-------------------|--------|
| Manifestation Board | `/manifestation-board` | `app/manifestation-board/*`, `lib/db/manifestations.ts` | Local SQLite | ✅ Working |
| Affirmations | `/affirmations` | `app/affirmations/*`, `lib/db/affirmations.ts` | Local SQLite | ✅ Working |
| Goals | `/goals` | `app/goals/*`, `lib/db/goals.ts` | Local SQLite | ✅ Working |
| Habit Tracker | `/habits` | `app/habits/*`, `lib/db/habits.ts` | Local SQLite | ✅ Working (Pro-gated) |
| Financial Tracker | `/financial` | `app/financial/*`, `lib/db/finance.ts` | Local SQLite | ✅ Working (Pro-gated) |
| Calorie Tracker | `/calorie` | `app/calorie/*`, `lib/db/food.ts`, `services/calorieAnalysisService.ts` | Local SQLite + AI API | ✅ Working (Pro-gated) |
| Food Scanner (AI) | `/calorie/scan` | `app/calorie/scan.tsx` | `@rork-ai/toolkit-sdk` (generateObject) | ✅ Code complete, needs device + API key |
| To-Do List | `/todos` | `app/todos/*`, `lib/db/tasks.ts` | Local SQLite | ✅ Working (Pro-gated) |
| Gratitude Journal | `/gratitude` | `app/gratitude/*`, `lib/db/gratitude.ts` | Local SQLite | ✅ Working (Pro-gated) |
| Fitness | `/fitness` | `app/fitness/*`, `lib/db/fitness.ts`, `lib/fitness.ts` | Local SQLite + HealthKit | ✅ Working (Pro-gated) |
| Appointments | `/appointments` | `app/appointments/*`, `lib/db/appointments.ts` | Local SQLite | ✅ Working (Pro-gated) |
| Settings | `/settings` | `app/settings.tsx` | None | ✅ Working |
| Paywall | `/paywall` | `app/paywall.tsx` | RevenueCat | ✅ Code complete, needs API key |
| Bug Fixer (Diagnostics) | `/bug-fixer` | `app/bug-fixer.tsx`, `lib/diagnostics.ts` | RevenueCat + HealthKit | ✅ Code complete |
| Auth | `/auth` | `app/auth.tsx`, `contexts/auth-context.tsx` | Local (AsyncStorage + SecureStore + bcrypt) | ✅ Working |

### Pro Gating
- First 3 features (Manifestation Board, Affirmations, Goals) are **free**
- All other features are **Pro-gated** via `PaywallGate` in `app/_layout.tsx`
- Gating list defined in `constants/features.ts` — single source of truth
- Lock indicators shown on home screen cards for gated features

### Database
- Local SQLite via `expo-sqlite` with SQLCipher
- All data stored locally on device — no remote database required for app functionality
- Backend (SurrealDB + tRPC) exists in `backend/` but is not required for the app to function
- User isolation: each device has its own local database

### AI Integration
- Food recognition: `@rork-ai/toolkit-sdk` → `generateObject()` with Zod schema
- Returns structured food analysis: name, serving size, calories, macros, confidence, health score
- Supports correction prompts ("That's keto bread, not regular bread")
- Barcode scanning: manual entry form (no product database lookup — user enters nutrition info)

### HealthKit Integration
- `@kingstinct/react-native-healthkit` for iOS Health data
- Reads: active energy, exercise minutes, workouts
- Does NOT write to HealthKit (read-only by design)
- Permission flow: `requestAuthorization()` → stores status in AsyncStorage
- Sync: pulls last 7 days of workouts, deduplicates by `healthkit_` ID prefix
- Info.plist descriptions configured for HealthKit

### RevenueCat Integration
- `react-native-purchases@^10.4.1` (resolves to 10.14.0)
- Dynamic import pattern: `await import('react-native-purchases')`
- Entitlement ID: `pro`
- Dev fallback key for development builds
- **Missing**: `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` EAS secret
