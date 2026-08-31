/**
 * Feature IDs / route prefixes that require an active Pro subscription.
 * The first 3 features in app/index.tsx's ALL_FEATURE_CARDS order
 * (manifestation-board, affirmations, goals) stay free; everything else
 * is gated. Enforcement lives in app/_layout.tsx's PaywallGate, at the
 * route-segment level — this list is also used by the home screen to show
 * a lock indicator on gated cards before the user taps them. Keep both
 * usages pointed at this one array so they can't drift out of sync.
 */
export const GATED_FEATURE_IDS = [
  'habits',
  'financial',
  'calorie',
  'todos',
  'gratitude',
  'fitness',
  'appointments',
] as const;

export function isGatedFeature(id: string): boolean {
  return (GATED_FEATURE_IDS as readonly string[]).includes(id);
}
