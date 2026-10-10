/**
 * Dynamic Expo config — extends app.json at runtime.
 *
 * Adds the Base44 preview origin to Expo Router's allowed CORS hosts so the
 * dev server accepts requests from the browser preview proxy. The preview
 * origin changes per sandbox, so it's read from BASE44_PUBLIC_HOST_SUFFIX.
 */
export default ({ config }) => {
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
