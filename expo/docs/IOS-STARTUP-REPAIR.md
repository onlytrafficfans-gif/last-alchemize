# Build 29 startup repair and release gate

## Evidence and confidence

Apple reported an indefinite splash in 1.4.6 (29) on an iPad Air 11-inch M3. The exact device failure has not been reproduced; root-cause confidence is therefore limited.

EAS build `8134b609-55f2-424a-b107-54f2c45ff388` records commit `47370a0873d3c2cbba3418124ffaed6eb2f4f107`, production profile, Store distribution and Expo SDK 54. Build 29 included additional local release changes that were not committed at upload time. They are now captured separately from this startup repair to make the next build reproducible.

The downloaded build 29 IPA confirms version 1.4.6/build 29 and includes JS_STARTED/AUTH_STARTED startup markers. Its Expo.plist has `EXUpdatesEnabled: false`, and build metadata has no channel or runtimeVersion. EAS OTA updates are not a plausible source of different startup JS for this binary. No WebView dependency or WebView startup shell was found.

The app opens through Expo Router, not Base44: root providers load local auth/theme/fonts, then Stack displays the selected screen. Native SQLite and push registration run separately. The optional SurrealDB/Hono backend and Supabase image uploads are not authentication or launch prerequisites. Current EAS production variables for those optional integrations are absent. This does not establish that every network-dependent feature works.

## Confirmed repair mechanisms

- Previously, the first native splash-hide promise was permanently cached. A rejected or successful-but-no-op call could never be retried. Regression tests reproduce this against the old helper. The new helper deduplicates only in-flight calls, times out stalled calls and allows layout/recovery retries. API completion is logged without claiming the view visibly disappeared.
- The app no longer sets its own manual prevent-auto-hide latch. Router's splash lifecycle is retained. Root layout/mount and render-error fallback explicitly request dismissal.
- Stack remains mounted while auth restoration is in progress. The branded React loader covers it until restore/redirect completes; it now has progress feedback. Authentication remains required.
- Session shape and explicit expiry are validated. Failed/corrupt session recovery preserves the saved local account registry instead of deleting it. Existing local tokens have no server expiry/revocation semantics; this repair does not invent them.
- Saved Terms consent is read with a three-second bound and unmount protection; failure displays the agreement, never auto-accepts it.
- Fonts, DB and push have additional diagnostics. DB/push work stays independent of navigation. A branded route-error boundary provides retry.

Timeouts cannot recover a blocked JS thread, and racing a native promise does not cancel its native work. Module evaluation or native initialization can fail before React effects run. Those possibilities require the actual crash/device logs.

## Actual validation and remaining gates

24 local tests, TypeScript, lint, repository validation and iOS Hermes export passed. Two splash regression tests fail against the old helper and pass with the corrected helper. Generated native configuration preserves both HealthKit purpose strings.

The local installed dependency tree has stale nested expo-constants copies and passes 17/18 Expo Doctor checks. Build 29's previous clean cloud install passed 18/18. Check the next clean cloud build rather than treating that local warning as proof of Apple's failure. Dependency audit findings remain; no new dependency upgrades were made for this repair.

Build 29 targets `UIDeviceFamily: [1]`, with portrait orientations and no native iPad-specific orientation list. Apple can run it in iPhone compatibility mode on iPad. Root loading/error views are flexible; feature-screen rotation/resizing remains unverified. No native tablet redesign was made.

The Windows workspace has no iPad simulator, compatible physical iPad, Xcode, or usable iOS launch tooling. An iPhone USB device was present, but neither the corrected iPhone release nor iPad release has been installed or launched. App Store Connect crash/review diagnostics and exact build 29 TestFlight launch remain unverified. Do not claim this rejection is resolved.

## Build, test and submit

Run from `expo/` on this repair branch:

```sh
bun install --frozen-lockfile
bun run typecheck
bun test lib/__tests__ services/__tests__
bun run lint
bun run validate:final
bunx expo export --platform ios
eas build --platform ios --profile production
```

Do not use automatic submission. Record the exact new build ID/version/number; production increments the remote build number while keeping version 1.4.6. Download the new IPA and verify its Info.plist and cloud logs.

For standalone simulator testing on a Mac, the preview profile explicitly uses Release configuration:

```sh
eas build --platform ios --profile preview
eas build:run --platform ios
```

Select the newly created simulator build and a compatible iPad. Record the actual device/runtime; use Apple's review model/runtime when available. A simulator artifact cannot be submitted to the App Store.

After explicit approval to upload, use the exact production build ID:

```sh
eas submit --platform ios --profile production --id NEW_PRODUCTION_BUILD_ID --non-interactive
```

Wait for Apple processing and install that exact build through TestFlight on an iPad. Test fresh install, force-close/relaunch, valid/absent/corrupt sessions, offline/reconnection, slow network, denied notification permissions and failed optional integrations. Record first-screen interactivity and video/screenshots/native logs. Submission upload does not submit the app for App Review. Obtain approval before selecting/submitting it for review or deploying an update.

## Draft Apple reply — do not send as a resolution claim yet

Thank you for reporting the launch failure in version 1.4.6 (29). We identified and repaired startup recovery defects involving splash dismissal, navigation initialization, session restoration and saved-consent loading. The changes pass our automated checks and iOS production bundle validation. We are completing release testing on an iPad before requesting another review.
