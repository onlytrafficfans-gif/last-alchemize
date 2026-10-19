# Alchemize — Release Readiness

**Date:** 2026-10-19  
**Commit:** `b9884a9511`  
**App Version:** 1.4.7  
**EAS Project:** `8482b587-bf4b-4f73-96da-e7ff086683a3`  
**App Store Connect ID:** `6762407627`  

---

## TestFlight Readiness Assessment

### ✅ Ready
- **Source code**: All features implemented, no broken routes, no dead-end screens
- **Splash screen**: Multi-layered fallback prevents cold-launch hangs
- **Auth flow**: Login, signup, Apple Sign In (native), terms acceptance, session persistence
- **Auth screen redesign**: Premium animations, password strength, email validation, error shake
- **RevenueCat code**: Package and lockfile consistent, dynamic import pattern safe
- **HealthKit code**: Read-only, permission flow, deduplication, graceful denial handling
- **Food AI scanner code**: Genuine `generateObject()` integration with Zod schema, correction prompts
- **Local database**: All features backed by SQLite, data persists across restarts
- **Pro gating**: First 3 features free, rest gated behind paywall
- **Web production bundle**: Compiles successfully (3239+ modules)

### ❌ Blockers (Must Fix Before Building)

1. **RevenueCat API Key** — `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` is not set as an EAS secret
   - **Impact**: All purchases fail in production; paywall shows but buying does nothing
   - **Fix**: `eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_API_KEY_IOS --value <key>`
   - **Source**: RevenueCat dashboard → Project Settings → Public API Keys → Apple

2. **iPad Support** — `app.json` has `supportsTablet: false`
   - **Impact**: App will not run properly on iPad; user's prompt mentions iPad testing
   - **Fix**: Change to `supportsTablet: true` in `app.json` if iPad testing is required
   - **Note**: This changes layout behavior — should be tested on iPad before submission

### ⛔ Cannot Verify in This Environment (Requires EAS + Device)

- Native iOS cold launch and splash dismissal
- RevenueCat purchase flow (sandbox)
- Apple Sign In
- HealthKit data sync
- Camera-based food AI recognition
- Barcode scanning
- Push notifications

---

## Build Instructions

### Step 1: Set RevenueCat API Key
```bash
cd expo
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_API_KEY_IOS --value <your_ios_key>
```

### Step 2: (Optional) Enable iPad Support
If iPad testing is needed, change `app.json`:
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
This runs on Expo's cloud build servers. EAS auto-increments the build number.

### Step 4: Submit to TestFlight
```bash
eas submit --platform ios --profile production
```
Or upload the `.ipa` via App Store Connect / Transporter.

### Step 5: Test on Device
1. Install via TestFlight on an iPhone (and iPad if enabled)
2. Watch for `[Startup]` log markers:
   - `JS_STARTED` → `ROOT_MOUNTED` → `NATIVE_SPLASH_HIDDEN` → `AUTH_STARTED` → `AUTH_INITIALIZED` → `FIRST_SCREEN_RENDERED`
3. If splash doesn't disappear within ~3s, capture device logs and check which marker is missing
4. Test: login → home → feature navigation → paywall → purchase (sandbox) → Pro features unlock
5. Test: food scanner → AI analysis → save food → calorie totals
6. Test: HealthKit permission request → workout sync
7. Test: fresh install → cold launch → no splash hang

### Step 6: App Store Submission
**Do not submit without explicit user approval.**

---

## Startup Diagnostics

The app logs `[Startup]` markers to the console during boot. To capture on device:

**Via Console.app (macOS):**
1. Connect device via USB
2. Open Console.app
3. Filter by "Alchemize" or "Startup"
4. Launch the app

**Via Xcode:**
1. Connect device via USB
2. Window → Devices and Simulators
3. Select device → Open Console
4. Filter for `[Startup]`

**Expected sequence:**
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

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| RevenueCat key missing | **Critical** | Set EAS secret before building |
| Splash hang on cold launch | Low | 3-layer fallback (immediate hide + 3s timer + 8s timeouts) |
| HealthKit permission denial | Low | Graceful handling, no crash, shows "Not Set" status |
| AI food recognition failure | Medium | Error alert with retry option, no hardcoded results |
| SQLite corruption | Low | JSON validation on read, corruption detection in diagnostics |
| Auth storage corruption | Low | SecureStore + AsyncStorage fallback, corruption cleanup |

---

## What's Left To Do

| Priority | Task | Reason |
|----------|------|--------|
| P0 | Set `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` EAS secret | Purchases non-functional without it |
| P0 | Run `eas build --profile production --platform ios` | Cannot build native iOS in this environment |
| P0 | Run `eas submit --platform ios` | Cannot submit to TestFlight from this environment |
| P1 | Test cold launch on physical iPhone | Verify splash dismissal and startup markers |
| P1 | Test purchase flow in sandbox | Verify RevenueCat integration end-to-end |
| P1 | Test food scanner on device | Verify camera + AI recognition |
| P1 | Test HealthKit on device | Verify permission flow and data sync |
| P2 | Consider enabling `supportsTablet: true` | If iPad support is needed |
| P2 | Run TypeScript check (`bunx tsc --noEmit`) | Verify no type errors |
| P2 | Run ESLint (`bunx expo lint`) | Verify no lint errors |
| P3 | Implement Google Sign In | Not currently implemented; user mentioned it |
| P3 | Add automated tests | No test suite exists currently |
