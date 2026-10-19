# Alchemize — Release Readiness

**Date:** 2026-10-19  
**Branch:** `fix-main-a953201e2716`  
**App Version:** 1.4.7  
**EAS Project:** `8482b587-bf4b-4f73-96da-e7ff086683a3`  
**App Store Connect ID:** `6762407627`  

---

## TestFlight Readiness Assessment

> **This app is NOT production-ready.** No critical feature has been tested on a physical iPhone. The items below are code-complete and pass automated checks, but native runtime verification (Camera, HealthKit, RevenueCat, splash cold-launch) has not occurred.

### ✅ Code-Complete & Automated-Verified
- **Source code:** all features implemented, no broken routes, no dead-end screens
- **TypeScript:** 0 errors (`bunx tsc --noEmit`)
- **ESLint:** 0 errors (`bunx expo lint`)
- **Validation scripts:** all 5 pass (routes, health, handoff, production, final)
- **Splash screen:** branded React splash with animated glow + wordmark; native splash config correct; multi-layered fallback prevents cold-launch hangs
- **Auth flow:** login, signup, Apple Sign In (native), terms acceptance, session persistence — renders in web preview
- **RevenueCat code:** package + lockfile consistent, dynamic import pattern safe, entitlement ID `pro`
- **HealthKit code:** read-only, permission flow, 7-day sync with deduplication, graceful denial handling
- **Barcode scanner:** Open Food Facts API integration with graceful unknown-product fallback — API verified, code compiles
- **Food AI scanner code:** genuine `generateObject()` integration with Zod schema, correction prompts
- **Local database:** all features backed by SQLite, data persists across restarts
- **Pro gating:** first 3 features free, rest gated behind paywall

### ❌ Critical Blockers (Must Fix Before Building)

1. **RevenueCat API Key** — `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` is NOT set as an EAS secret
   - **Impact:** All purchases fail in production; paywall shows but buying does nothing. `getApiKey()` throws; `initPurchases` catches and returns `false`; `isPro` stays `false` (safe — does not bypass paywall).
   - **Fix:** `eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_API_KEY_IOS --value <key>`
   - **Source:** RevenueCat dashboard → Project Settings → Public API Keys → Apple
   - **Status:** Confirmed missing — not in `/run/base44/app.env`, not in EAS secrets, not in `.base44/environment.json`

2. **iPad Support** — `app.json` has `supportsTablet: false`
   - **Impact:** App will not run properly on iPad
   - **Fix:** Change to `supportsTablet: true` in `app.json` if iPad testing is required
   - **Note:** This changes layout behavior — must be tested on iPad before submission

### ⛔ Cannot Verify in This Environment (Requires EAS + Device)

- Native iOS cold launch and splash dismissal
- RevenueCat purchase flow (sandbox)
- Apple Sign In
- HealthKit permission request, data reads, workout sync
- HealthKit entitlement in built `.ipa` (config plugin generates it at build time)
- Camera-based barcode scanning (Open Food Facts lookup API is verified, but camera capture is not)
- AI food recognition
- Push notifications

### ⚠️ Known Issues (Non-Blocking)

- **Security audit:** 98 vulnerabilities in transitive dependencies (image-size, browserslist via Expo/React Native). These are framework-level, not app code. Fixing requires a major Expo SDK upgrade — defer to a post-TestFlight maintenance cycle.
- **Google Sign In:** not implemented. Only Apple Sign In and email/password exist.
- **3 ESLint warnings** in `auth.tsx` (unused `SCREEN_WIDTH`, exhaustive-deps) — pre-existing from the auth redesign, non-blocking.

---

## Build Instructions

### Step 1: Set RevenueCat API Key (CRITICAL)
```bash
cd expo
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_API_KEY_IOS --value <your_ios_key>
```

### Step 2: (Optional) Enable iPad Support
Change `app.json`:
```json
"ios": {
  "supportsTablet": true,
  ...
}
```

### Step 3: Build for TestFlight
```bash
eas build --profile production --platform ios
```

### Step 4: Submit to TestFlight
```bash
eas submit --platform ios --profile production
```

### Step 5: Test on Physical iPhone
1. Install via TestFlight
2. Watch for `[Startup]` log markers:
   `JS_STARTED` → `ROOT_MOUNTED` → `NATIVE_SPLASH_HIDDEN` → `AUTH_STARTED` → `AUTH_INITIALIZED` → `FIRST_SCREEN_RENDERED`
3. Test: cold launch → login → home → feature navigation → paywall → purchase (sandbox) → Pro features unlock
4. Test: barcode scanner → scan a real product barcode → verify Open Food Facts lookup auto-fills nutrition → save → calorie totals update
5. Test: AI food scanner → photo → analysis → save
6. Test: HealthKit permission request → workout sync
7. If splash doesn't disappear within ~3s, capture device logs and check which marker is missing

### Step 6: App Store Submission
**Do not submit without explicit user approval.**

---

## Startup Diagnostics

The app logs `[Startup]` markers to the console during boot. Capture via Console.app or Xcode (connect device via USB, filter for "Alchemize" or "Startup").

Expected sequence:
```
[Startup] JS_STARTED
[Startup] ROOT_MOUNTED
[Startup] NATIVE_SPLASH_HIDDEN root-mount
[Startup] AUTH_STARTED
[Startup] AUTH_INITIALIZED
[Startup] FIRST_SCREEN_RENDERED
```

If any marker is missing or delayed, that identifies the boot stage that is hanging.

---

## What's Left To Do

| Priority | Task | Who | Reason |
|----------|------|-----|--------|
| P0 | Set `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` EAS secret | **You** | Purchases non-functional without it |
| P0 | Run `eas build --profile production --platform ios` | **You** | Cannot build native iOS in this environment |
| P0 | Run `eas submit --platform ios` | **You** | Cannot submit to TestFlight from this environment |
| P1 | Test cold launch on physical iPhone | **You** | Verify splash dismissal and startup markers |
| P1 | Test purchase flow in sandbox | **You** | Verify RevenueCat integration end-to-end |
| P1 | Test barcode scanner on device | **You** | Verify camera capture + Open Food Facts lookup |
| P1 | Test HealthKit on device | **You** | Verify permission flow and data sync |
| P1 | Verify HealthKit entitlement in built `.ipa` | **You** | Confirm config plugin generated the capability |
| P2 | Consider enabling `supportsTablet: true` | **You** | If iPad support is needed |
| P3 | Implement Google Sign In | Developer | Not currently implemented |
| P3 | Upgrade Expo SDK to resolve audit vulnerabilities | Developer | 98 transitive vulns; major breaking change |
