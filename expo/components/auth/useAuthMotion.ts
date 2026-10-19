import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Respects the iOS "Reduce Motion" accessibility setting. When enabled, the
 * auth screens skip transforms (slide/lift/scale) and fall back to simple
 * opacity fades so motion-sensitive users get a calm, non-disorienting entrance.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Respect the web-side prefers-reduced-motion media query.
      const mql = window.matchMedia?.('(prefers-reduced-motion: reduce)');
      if (mql) {
        setReduced(mql.matches);
        const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
        mql.addEventListener?.('change', handler);
        return () => mql.removeEventListener?.('change', handler);
      }
      return;
    }
    let active = true;
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => {
      if (active) setReduced(v);
    });
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => active && setReduced(v))
      .catch(() => {});
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  return reduced;
}
