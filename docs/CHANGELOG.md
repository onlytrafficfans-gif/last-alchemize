# Changelog

All notable changes to Alchemize are documented here.

## [Unreleased] — Signup, Login & Splash Screen Rebuild (2026-10-19)

### Rebuilt
- **Cinematic animated intro** (`expo/components/BrandedSplash.tsx`): completely rebuilt with the original crystal-ball background, an expanding atmospheric violet glow, a breathing splash icon, the Alchemize wordmark, and a fading tagline. Plays once per cold launch for unauthenticated users and transitions smoothly into authentication. Tap-to-skip; returning users get an abbreviated sequence so startup is never delayed. Respects iOS Reduce Motion (opacity-only fades, no transforms). Also serves as the persistent loading view while auth/subscription boots.
- **Login screen** (`expo/app/auth.tsx`): rebuilt from the ground up with a full-screen crystal-ball background, frosted-glass card (`expo-blur`), staggered entrance, welcome headline, email + password fields with visibility toggle, remember-me, forgot-password recovery, terms & privacy link, premium gradient Sign In button with press-scale + haptic, Apple Sign In (native + web fallback), and a footer link to signup. Real-time validation with shake + red error states.
- **Signup screen** (`expo/app/signup.tsx`): new dedicated route with full name, email, password + live 4-bar strength meter, confirm-password with real-time match validation, terms checkbox, premium Create Account button, Apple Sign In (signup variant), and a back button + footer link to login.

### Added
- **Reusable auth components** (`expo/components/auth/`): `AuthShell` (shared crystal-ball background + overlays + safe area), `AuthField` (frosted input with icon, visibility toggle, error state), `AuthButton` (premium gradient button with press-scale + haptic), `TermsModal` (shared frosted terms & privacy modal), `useAuthMotion` (Reduce Motion hook), and `shared.ts` (translations EN/ES, validators, constants).
- **Seamless transitions**: the `AuthGate` now plays the cinematic intro once per session for unauthenticated users, then renders the auth route. Returning authenticated users proceed directly to the app with no intro. The signup route is registered in the Stack with slide transitions. No flickering, duplicate splash, or navigation loops.
- Native splash config (`app.json`) retained: `splash-icon.png` with `resizeMode: contain` on the `#0c0520` brand background — no white flash, no stretched artwork — with the crystal ball appearing immediately in the React intro for visual continuity.

### Preserved
- All existing authentication backend logic (`contexts/auth-context.tsx`) unchanged: login, signup, Apple Sign In, password reset, bcrypt hashing, SecureStore session persistence, remember-me. No user accounts, subscriptions, or data affected.

### Verified (Web Preview)
- TypeScript: 0 errors; ESLint: 0 errors/warnings
- Cinematic intro renders and is skippable; transitions to login
- Login screen renders with all fields, terms modal opens, validation errors show (red message + field borders), fields accept input
- Signup screen renders with strength meter, confirm-password match validation, terms checkbox, Apple Sign In
- Login ↔ signup navigation (push/back) works
- No console errors; no horizontal overflow at tablet width

### Requires Physical iPhone Verification
- Native splash scaling across iPhone screen sizes (SE → Pro Max)
- Apple Sign In with real Apple credentials
- Reduce Motion accessibility behavior on iOS
- Keyboard handling and safe-area insets on device
- 60 FPS animation performance on cold launch

## [1.4.7] — 2026-10-19

### Added
- **Branded splash screen** (`expo/components/BrandedSplash.tsx`): premium animated splash with app wordmark "Alchemize", tagline, soft glow ring with pulsing animation, gentle breathing scale on the splash icon. Preserves the original `#0c0520` background. Wired into `AuthGate` and `PaywallGate` loading states in `_layout.tsx`.
- **Barcode scanner — Open Food Facts integration** (`expo/app/calorie/scan.tsx`): genuine barcode recognition and nutrition lookup via the Open Food Facts public API (`world.openfoodfacts.org`). Scanned barcodes (EAN-13, EAN-8, UPC-A, UPC-E, Code128) are looked up automatically; found products auto-fill nutrition fields (name, calories, protein, carbs, fat, fiber) with per-serving values preferred over per-100g. Unknown products show a graceful "We could not find this product" message with editable manual entry fallback.
- **Audit documentation**: `docs/APP_AUDIT_REPORT.md`, `docs/FEATURE_VERIFICATION_MATRIX.md`, `docs/RELEASE_READINESS.md`
- **Startup instrumentation**: `[Startup]` log markers at each boot stage (JS_STARTED, ROOT_MOUNTED, NATIVE_SPLASH_HIDDEN, AUTH_STARTED, AUTH_INITIALIZED, FIRST_SCREEN_RENDERED, NAV_READY)
- **Auth screen redesign**: Premium staggered entrance animations (brand → card → fields → button → social), password strength indicator with 4-bar visual feedback, email validation with regex, shake animation on validation errors, brand sparkle glow icon, gradient tab backgrounds, mode-transition field re-animation

### Fixed
- **RevenueCat restoration**: Reverted accidental removal of `react-native-purchases` that broke the entire JS bundle (commit `0ba07d1` → `f19a0ef`)
- **Splash screen hang**: Multi-layered fallback — immediate `hideAsync()` on root mount, 3s fallback timer, 8s auth boot timeout, 8s subscription init timeout
- **CORS rejection**: `app.config.js` conditionally adds preview origin to Expo's CORS allowlist when `BASE44_PREVIEW_MODE === "1"`
- **Stale export containers**: Cleaned up orphaned `compose run` containers with irrelevant healthchecks
- **Auth input interaction**: Fixed rendering and input logic on auth screen

### Verified This Session (Automated)
- TypeScript: 0 errors (`bunx tsc --noEmit`)
- ESLint: 0 errors (`bunx expo lint`)
- Route manifest, repo health, handoff, production preflight, final validation: all pass
- Open Food Facts API: verified with real barcodes (Nutella → full nutrition; unknown → graceful fallback)
- Web preview: auth screen renders with no console errors; branded splash compiles and renders

### Known Issues
- `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` not set as EAS secret — purchases non-functional until configured (confirmed missing)
- `supportsTablet: false` in `app.json` — iPad testing may require enabling
- Google Sign In not implemented
- 98 vulnerabilities in transitive framework dependencies (image-size, browserslist) — requires major Expo SDK upgrade to resolve
- Native iOS testing not yet performed (requires EAS build + physical device)
- No feature has been verified on a physical iPhone
