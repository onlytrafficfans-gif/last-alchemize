/**
 * Dynamic Expo config — extends app.json at runtime.
 *
 * Sandbox-only: adds the Base44 preview origin to Expo Router's allowed CORS
 * hosts so the dev server accepts requests from the browser preview proxy.
 * Expo's CorsMiddleware adds `extra.router.headOrigin`'s host to its allowlist;
 * without it, the proxy origin is rejected with "Unauthorized request".
 *
 * Gated on BASE44_PREVIEW_MODE === "1" so production/EAS builds (where the
 * flag is unset) get the unmodified app.json config — no behavior change
 * outside the sandbox.
 */
export default ({ config }) => {
  if (process.env.BASE44_PREVIEW_MODE !== "1") {
    return config;
  }
  const suffix = process.env.BASE44_PUBLIC_HOST_SUFFIX;
  if (suffix) {
    config.extra = {
      ...config.extra,
      router: {
        ...config.extra?.router,
        headOrigin: `https://3000-${suffix}`,
      },
    };
  }
  return config;
};
