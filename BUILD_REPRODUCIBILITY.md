# Build Reproducibility & CI Configuration

Last Updated: 2025-08-07

## Declared Package Manager

```json
{
  "packageManager": "bun@1.3.14"
}
```

All development, testing, and CI builds must use **Bun 1.3.14** exactly.

## Reproducible Install

```bash
bun install --frozen-lockfile
```

The `--frozen-lockfile` flag ensures:
- **No version upgrades:** Uses exact versions from `bun.lock`
- **No lockfile modifications:** Build fails if any dependency needs updating
- **Deterministic:** Same versions across all machines and CI runs
- **Faster:** No npm registry queries for version resolution

## CI Workflow

### Environment

- **OS:** Ubuntu Latest
- **Bun:** 1.3.14 (pinned in setup)
- **Node:** Latest (available via Bun)
- **Timeout:** 45 minutes per job
- **Concurrency:** One run per branch (cancels previous)
- **On:** Pull requests, pushes to main/master, manual dispatch

### Build Steps (Sequential)

1. **Checkout** (1 min)
   - Shallow clone (fetch-depth: 1)
   - Speed optimization

2. **Setup Bun 1.3.14** (1 min)
   - Pinned version ensures reproducibility
   - Downloaded from official source

3. **Install Dependencies** (7-10 min)
   - `bun install --frozen-lockfile`
   - Reproducible, deterministic
   - Fails if lockfile/package.json mismatch

4. **TypeScript Check** (3-5 min)
   - App: `bun run typecheck`
   - Backend: `bun run backend:typecheck`
   - No errors, no emit

5. **Lint Check** (3-5 min)
   - `bun run lint`
   - ESLint via Expo config

6. **Expo Doctor** (3-5 min)
   - Configuration validation
   - Dependency verification
   - Environment check

7. **Validation Scripts** (3 min total)
   - `validate:handoff`
   - `validate:health`
   - `validate:production`
   - `validate:final`

8. **Configuration Check** (1-2 min)
   - `bun run prebuild:config` — generates public config
   - Verifies Expo configuration structure

9. **Export Web** (5-10 min)
   - `bun run export:web`
   - Metro bundler compilation
   - Static web bundle generation

10. **Export Android** (5-10 min)
    - `bun run export:android`
    - Metro bundler compilation
    - Android-specific config generation

11. **Artifact Upload** (1 min)
    - Web export stored for 3 days
    - Available for download/inspection

12. **Build Reproducibility Report** (1 min)
    - Bun version
    - Node version
    - TypeScript version
    - Lockfile integrity check

## Package Scripts

All CI commands use Bun runner for consistency:

| Command | Purpose | Timeout |
|---------|---------|---------|
| `bun run typecheck` | TypeScript compile check | 5m |
| `bun run backend:typecheck` | Backend TypeScript check | 5m |
| `bun run lint` | ESLint check | 5m |
| `bun run doctor` | Expo Doctor | 5m |
| `bun run export:web` | Web export | 10m |
| `bun run export:android` | Android export | 10m |
| `bun run prebuild:config` | Expo config verification | 3m |
| `bun run ci:local` | All checks (local) | 20m |

## Lockfile Management

### `bun.lock`

- **Purpose:** Records exact dependency versions
- **Generated:** `bun install` without frozen flag
- **Updated:** When dependencies legitimately change
- **Committed:** Always in git
- **Reviewed:** In PRs when changed

### When to Update

```bash
# 1. Add new dependency
bun add package-name

# 2. Update dependency
bun update package-name

# 3. Update all
bun upgrade

# 4. Commit changes
git add bun.lock package.json
git commit -m "deps: update package-name to X.Y.Z"
```

### CI Enforcement

If `bun.lock` is out of sync with `package.json`:
- CI fails immediately at install step
- Forces explicit review of dependency changes
- Prevents accidental version drift

## Build Artifacts

### Web Export

```
expo/dist/
├── index.html
├── bundle.js
├── style.css
├── assets/
└── ...
```

**Artifact:** Stored in GitHub Actions (3 days)
**Download:** From Actions tab
**Use:** Verify bundle contents, inspect build

### Android Export

```
android-alchemize/
├── app/
├── gradle/
├── build.gradle
└── ...
```

**Generated:** From Expo export step
**Not exported as artifact:** Too large
**For signing:** Use EAS Build or local Gradle

## TypeScript Configuration

### App Config

- **Target:** ES2020
- **Lib:** ES2020, DOM, React Native
- **Strict mode:** true
- **Module:** ESNext
- **Resolution:** Node (with aliases)

### Backend Config

- **Target:** ES2020
- **Lib:** ES2020
- **Strict mode:** true
- **Module:** CommonJS
- **Resolution:** Node

### Separate Checks

- App typecheck: `bun run typecheck`
- Backend typecheck: `bun run backend:typecheck`
- Both run in CI, failures block merge

## Non-Reproducible Aspects

### What Cannot Be Reproduced Identically

1. **Native builds:** iOS/Android native code compilation
   - Requires XCode/Android Studio
   - Machine-specific compiler versions
   - Signing keys

2. **Supabase auth:** Cloud service dependencies
   - Runtime API versions
   - Database state
   - Configuration state

3. **RevenueCat:** External service state
   - Sandbox configuration
   - Entitlements database

4. **HealthKit:** Device-specific (iOS)
   - Runtime permissions
   - User health data

### Mitigation

- **Web/Android exports:** Reproducible in CI
- **Typing/validation:** Reproducible locally
- **Configuration:** Validated but not compiled natively
- **Credentials:** External secrets (not in repo)

## Verification Checklist

### Local Development

- [ ] `bun install --frozen-lockfile` succeeds
- [ ] `bun run ci:local` passes (all checks)
- [ ] No warnings about lockfile changes
- [ ] `bun.lock` unchanged after install

### CI Workflow

- [ ] All jobs complete within timeout
- [ ] No dependencies resolved outside lockfile
- [ ] TypeScript and lint checks pass
- [ ] Web and Android exports succeed
- [ ] Artifacts available for inspection

### Before Release

- [ ] CI workflow passes on main branch
- [ ] All validation checks green
- [ ] No uncommitted dependency changes
- [ ] `bun.lock` reflects current package.json

## Dependency Management

### Adding Dependencies

```bash
# Install new package
bun add package-name

# Install with version constraint
bun add package-name@^1.0.0

# Install as dev dependency
bun add --save-dev package-name
```

### Removing Dependencies

```bash
# Remove package
bun remove package-name

# Verify removal
bun run typecheck
bun run lint
```

### Updating Dependencies

```bash
# Update one package
bun update package-name

# Update all packages (within constraints)
bun upgrade

# Review changes
git diff bun.lock

# Test changes
bun run ci:local
```

## Known Issues & Workarounds

### Issue: Lockfile conflicts after merge

**Cause:** Both branches modified dependencies
**Fix:** Regenerate lockfile
```bash
bun install
git add bun.lock
git commit -m "merge: resolve lockfile conflicts"
```

### Issue: CI passes locally but fails in CI

**Cause:** Usually Bun version or environment difference
**Fix:** Pin Bun version in CI (already done: 1.3.14)
**Verify:** `bun --version` returns `1.3.14`

### Issue: Export hangs or times out

**Cause:** Large dependencies, slow network
**Fix:** Increase timeout, check for circular deps
**Verify:** Run locally first

## Future Improvements

1. Add cache for dependencies (bun cache)
2. Add native build verification (EAS Build integration)
3. Add test suite integration
4. Add deployment verification
5. Add smoke tests for critical paths

## Summary

| Aspect | Status | Confidence |
|--------|--------|------------|
| **Deterministic Install** | ✅ Frozen lockfile | 100% |
| **Reproducible TypeScript** | ✅ CI + local check | 100% |
| **Reproducible Web Export** | ✅ Metro + static output | 100% |
| **Reproducible Android Export** | ✅ Android config only | 100% |
| **Reproducible iOS Build** | ❌ Requires XCode | N/A |
| **Reproducible Native Build** | ⚠️ EAS Build required | Partial |

**Conclusion:** Build reproducibility is **9/10** for web/export layer, with native signing/compilation requiring external services.
