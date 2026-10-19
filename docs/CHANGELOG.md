# Changelog

All notable changes to Alchemize are documented here.

## [1.4.7] — 2026-10-19

### Added
- **Auth screen redesign**: Premium staggered entrance animations (brand → card → fields → button → social), password strength indicator with 4-bar visual feedback, email validation with regex, shake animation on validation errors, brand sparkle glow icon, gradient tab backgrounds, mode-transition field re-animation
- **Audit documentation**: `docs/APP_AUDIT_REPORT.md`, `docs/FEATURE_VERIFICATION_MATRIX.md`, `docs/RELEASE_READINESS.md`
- **Startup instrumentation**: `[Startup]` log markers at each boot stage (JS_STARTED, ROOT_MOUNTED, NATIVE_SPLASH_HIDDEN, AUTH_STARTED, AUTH_INITIALIZED, FIRST_SCREEN_RENDERED, NAV_READY)

### Fixed
- **RevenueCat restoration**: Reverted accidental removal of `react-native-purchases` that broke the entire JS bundle (commit `0ba07d1` → `f19a0ef`)
- **Splash screen hang**: Multi-layered fallback — immediate `hideAsync()` on root mount, 3s fallback timer, 8s auth boot timeout, 8s subscription init timeout
- **CORS rejection**: `app.config.js` conditionally adds preview origin to Expo's CORS allowlist when `BASE44_PREVIEW_MODE === "1"`
- **Stale export containers**: Cleaned up orphaned `compose run` containers with irrelevant healthchecks
- **Auth input interaction**: Fixed rendering and input logic on auth screen

### Known Issues
- `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` not set as EAS secret — purchases non-functional until configured
- `supportsTablet: false` in `app.json` — iPad testing may require enabling
- Google Sign In not implemented
- Native iOS testing not yet performed (requires EAS build + physical device)
