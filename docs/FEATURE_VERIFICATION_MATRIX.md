# Alchemize — Feature Verification Matrix

**Date:** 2026-10-19  
**Branch:** `fix-main-a953201e2716`  
**App Version:** 1.4.7  

---

## Legend

| Symbol | Meaning |
|--------|---------|
| 🤖 AUTO | Verified by an automated check (tsc, lint, validation scripts, bundle export) |
| 🌐 WEB | Verified in the **web preview only** — React Native Web, not native iOS. Layout/logic may differ on device. |
| 📋 SOURCE | Verified by **source inspection only** — code reviewed, not executed. Not a runtime pass. |
| 📱 DEVICE | Verified on a **physical iPhone** via TestFlight. *(none yet)* |
| ⛔ BLOCKED | Cannot verify in this environment — requires EAS build / device / credentials |
| ❌ FAIL | Tested and failed |

> **No feature has been verified on a physical iPhone.** Every 🌐 WEB or 📋 SOURCE item must be re-verified on device before claiming production readiness. Web preview confirms rendering and logic wiring only; it does NOT exercise native APIs (Camera, HealthKit, RevenueCat, SecureStore, Apple Sign In).

---

## Automated Checks (this session)

| Check | Command | Result |
|-------|---------|--------|
| TypeScript | `bunx tsc --noEmit` | 🤖 AUTO ✅ 0 errors |
| ESLint | `bunx expo lint` | 🤖 AUTO ✅ 0 errors (3 pre-existing warnings in auth.tsx) |
| Route manifest | `bun run validate:routes` | 🤖 AUTO ✅ pass |
| Repo health | `bun run validate:health` | 🤖 AUTO ✅ pass (reports style warnings, exit 0) |
| Handoff validation | `bun run validate:handoff` | 🤖 AUTO ✅ pass |
| Production preflight | `bun run validate:production` | 🤖 AUTO ✅ pass |
| Final validation | `bun run validate:final` | 🤖 AUTO ✅ pass |
| Security audit | `bun audit --audit-level=moderate` | ⚠️ 98 vulns (2 critical, 58 high, 38 moderate) — all in transitive framework deps (image-size, browserslist via Expo/RN). Not fixable without major SDK upgrade. |
| Web bundle export | `expo export --platform web` | ⛔ Timed out in sandbox (dev server competes for resources). Passed in prior session (3239 modules). TSC + lint confirm module graph resolves. |

---

## Authentication

| Feature | Status | Notes |
|---------|--------|-------|
| Email/Password Login | 🌐 WEB | Form renders, validation works in web preview |
| Email/Password Signup | 🌐 WEB | Signup form renders; AsyncStorage write not exercised end-to-end on web |
| Password Visibility Toggle | 🌐 WEB | Eye icon toggles secureTextEntry |
| Password Strength Indicator | 🌐 WEB | 4-bar indicator shows during signup |
| Email Validation | 🌐 WEB | Regex validation with error feedback |
| Remember Me | 🌐 WEB | Checkbox toggles; persistence uses SecureStore (native-only) |
| Forgot Password | ⛔ BLOCKED | Uses `Alert.prompt` (iOS only) |
| Apple Sign In | ⛔ BLOCKED | Requires physical iOS device + Apple Developer cert |
| Google Sign In | ❌ NOT IMPLEMENTED | No Google auth configuration exists |
| Terms & Privacy Modal | 🌐 WEB | Modal renders, scrollable, accept/decline works |
| Language Toggle (EN/ES) | 🌐 WEB | Toggles between English and Spanish |
| Session Persistence | 📋 SOURCE | Code uses SecureStore + AsyncStorage; not verified on native |
| Navigation After Login | 🌐 WEB | `router.replace('/')` redirects to home |
| Entrance Animations | 🌐 WEB | Staggered fade+slide renders in web preview |
| Error Shake Animation | 🌐 WEB | Card shakes on validation error |

## Splash Screen

| Feature | Status | Notes |
|---------|--------|-------|
| Native splash config (app.json) | 📋 SOURCE | `resizeMode: "contain"`, `backgroundColor: "#0c0520"` — background preserved |
| Branded React splash (new) | 🌐 WEB | `BrandedSplash` component: wordmark, glow ring, breathing animation, `#0c0520` background. Renders in web preview; compiles clean. |
| preventAutoHideAsync | 📋 SOURCE | Called at module load in `_layout.tsx` |
| hideAsync on Root Mount | 📋 SOURCE | Called immediately in RootLayout useEffect |
| 3s Fallback Timer | 📋 SOURCE | Safety net releases splash if hideAsync fails |
| Auth Boot Timeout (8s) | 📋 SOURCE | Proceeds unauthenticated if SecureStore hangs |
| Subscription Boot Timeout (8s) | 📋 SOURCE | Does not grant Pro on timeout |
| No White Flash | 📋 SOURCE | Splash background matches app theme |
| iOS Cold Launch | ⛔ BLOCKED | Requires EAS build + physical device |

## Home Screen

| Feature | Status | Notes |
|---------|--------|-------|
| Feature Card Carousel | 🌐 WEB | Horizontal scroll, page indicators render |
| Orbital (Cosmic) Theme | 🌐 WEB | Parallax background, floating planets render |
| Lock Indicators (Pro) | 🌐 WEB | Lock badge on gated feature cards |
| Settings Button | 🌐 WEB | Floating button, navigates to /settings |
| Feature Visibility | 🌐 WEB | AsyncStorage-backed config |
| PWA Install Prompt | 🌐 WEB | Web-only component |

## Calorie Tracker (Pro)

| Feature | Status | Notes |
|---------|--------|-------|
| Daily Calorie Ring | 🌐 WEB | SVG progress ring renders |
| Macro Tracking | 🌐 WEB | Protein/Carbs/Fat/Fiber bars render |
| Water Tracking | 🌐 WEB | Add 250ml/500ml, progress bar |
| Meal Grouping | 🌐 WEB | Breakfast/Lunch/Dinner/Snack sections |
| Date Navigation | 🌐 WEB | Prev/next day, "Today" display |
| Food Log Entry (Manual) | 🌐 WEB | Add food via /calorie/add |
| Edit Food Entry | 🌐 WEB | Edit via /calorie/add?id= |
| Delete Food Entry | 📋 SOURCE | Delete with confirmation; not exercised on device |
| Persistence | 📋 SOURCE | SQLite-backed; not verified on native |
| **Barcode Scanner — Lookup** | 🤖 AUTO | Open Food Facts API integration: `lookupBarcodeProduct()` calls `world.openfoodfacts.org/api/v2`. Verified API responds correctly (Nutella → full nutrition; unknown code → `status:0`). Code compiles, lint passes. **Not tested on device camera.** |
| **Barcode Scanner — Unknown Handling** | 📋 SOURCE | Graceful fallback: "We could not find this product" + manual entry form. Pre-fills fields when found. |
| AI Food Scanner | ⛔ BLOCKED | Requires camera + `@rork-ai/toolkit-sdk` API key on device |
| Nutrition Profile | 🌐 WEB | /calorie/profile renders |
| Meal Prep Planning | 🌐 WEB | /calorie/meal-prep renders |

## Fitness (Pro)

| Feature | Status | Notes |
|---------|--------|-------|
| Fitness Dashboard | 🌐 WEB | Renders workout sessions |
| Add Workout | 🌐 WEB | Create new workout (modal) |
| Browse Workouts | 🌐 WEB | Browse workout library |
| Workout Session | 🌐 WEB | Active workout tracking renders |
| HealthKit Sync | ⛔ BLOCKED | `syncHealthKitData()` requires iOS device + Health data |
| HealthKit Permissions | ⛔ BLOCKED | `requestAuthorization()` requires iOS device |

## Other Features (Pro)

| Feature | Status | Notes |
|---------|--------|-------|
| Manifestation Board | 🌐 WEB | List, detail, add, slideshow render |
| Affirmations | 🌐 WEB | List, edit, add, play mode render |
| Goals | 🌐 WEB | List, detail, add render |
| Habit Tracker | 🌐 WEB | List, add render |
| Financial Tracker | 🌐 WEB | Dashboard, notes render |
| To-Do List | 🌐 WEB | List, add render |
| Gratitude Journal | 🌐 WEB | List, add render |
| Appointments | 🌐 WEB | List, add, calendar render |
| Settings | 🌐 WEB | Screen renders correctly |

## Payments & Subscriptions (RevenueCat)

| Feature | Status | Notes |
|---------|--------|-------|
| Package in package.json + lockfile | 🤖 AUTO | `react-native-purchases@^10.4.1` confirmed in package.json and bun.lock |
| Dynamic import pattern | 📋 SOURCE | `await import('react-native-purchases')` — Metro resolves at bundle time |
| Paywall Screen | 🌐 WEB | Renders packages, restore button, legal links |
| **API key configured** | ❌ FAIL | `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` is NOT set. Confirmed missing from `/run/base44/app.env` and EAS secrets. In production build, `getApiKey()` throws. |
| Purchase Flow | ⛔ BLOCKED | Requires API key + sandbox testing on device |
| Restore Purchases | ⛔ BLOCKED | Requires RevenueCat configuration |
| Pro Entitlement Check | ⛔ BLOCKED | Requires RevenueCat + sandbox testing |
| Customer Center | ⛔ BLOCKED | Requires RevenueCat |

## Apple HealthKit

| Feature | Status | Notes |
|---------|--------|-------|
| Package installed | 🤖 AUTO | `@kingstinct/react-native-healthkit@^14.0.2` in package.json + bun.lock |
| Config plugin in app.json | 📋 SOURCE | Plugin adds `NSHealthShareUsageDescription` + `NSHealthUpdateUsageDescription` |
| HealthKit entitlement | ⛔ BLOCKED | No `.entitlements` file in repo — the config plugin generates `com.apple.developer.healthkit` at EAS build time. Must verify entitlement appears in built `.ipa`. |
| Permission Request | ⛔ BLOCKED | `requestAuthorization()` requires iOS device |
| Active Energy Read | ⛔ BLOCKED | Requires iOS device + Health data |
| Exercise Minutes Read | ⛔ BLOCKED | Requires iOS device + Health data |
| Workout Read | ⛔ BLOCKED | Requires iOS device + Health data |
| Workout Sync (7-day pull) | ⛔ BLOCKED | `syncHealthKitData()` requires iOS device |
| Permission Denial Handling | 📋 SOURCE | Code handles denied/unavailable status gracefully |
| Read-only (no write) | 📋 SOURCE | No write config; `NSHealthUpdateUsageDescription` present but no write calls in code |
| Duplicate Prevention | 📋 SOURCE | `healthkit_` ID prefix deduplication in `syncHealthKitData` |
| Calorie Calculation | 📋 SOURCE | Uses `workout.totalEnergyBurned.quantity` (kcal from HealthKit) |
| Duration Calculation | 📋 SOURCE | Uses `workout.duration.quantity` (minutes from HealthKit) |

## Build & Configuration

| Feature | Status | Notes |
|---------|--------|-------|
| EAS Build Config | 📋 SOURCE | `eas.json` with production/preview/development profiles |
| App Store Connect ID | 📋 SOURCE | `ascAppId: 6762407627` |
| Bundle Identifier | 📋 SOURCE | `app.repo.alchemize-level-up` |
| TypeScript | 🤖 AUTO | `bunx tsc --noEmit` — 0 errors |
| ESLint | 🤖 AUTO | `bunx expo lint` — 0 errors, 3 warnings |
| Native iOS Build | ⛔ BLOCKED | Requires EAS cloud build |
| iPad Support | ⚠️ WARNING | `supportsTablet: false` — iPad testing requires changing to `true` |
