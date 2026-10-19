# Changelog

All notable changes to Alchemize are documented here.

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
