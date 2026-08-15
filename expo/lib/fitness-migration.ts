import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizedMetricsDb, workoutSessionsDb } from '@/lib/db/fitness';
import { getLocalDateKey } from '@/lib/healthkit';

const LEGACY_METRIC_MIGRATION_KEY = '@alchemize_normalized_metrics_local_date_v1';

type ManualTotals = { activeMinutes: number; caloriesActive: number };

function utcDateKey(timestamp: number) {
  return new Date(timestamp).toISOString().split('T')[0];
}

/**
 * Removes pre-local-date manual contributions from legacy normalized metrics.
 * Workout sessions remain the source of truth for manual activity, so the
 * dashboard rebuilds those totals from each session without duplicating them.
 * Wearable totals are retained by subtracting only the manual contribution
 * reconstructed from sessions; values are never moved or added to another day.
 */
export async function migrateLegacyNormalizedMetrics(userId: string): Promise<{ migratedDays: number }> {
  const migrationKey = `${LEGACY_METRIC_MIGRATION_KEY}_${userId}`;
  const completed = await AsyncStorage.getItem(migrationKey);
  if (completed === 'complete') return { migratedDays: 0 };

  const sessions = await workoutSessionsDb.getAll();
  const affected = new Map<string, ManualTotals>();

  for (const session of sessions) {
    if (!session.completed || session.source === 'wearable' || session.id.startsWith('healthkit_')) continue;
    const legacyDate = utcDateKey(session.startedAt);
    const localDate = getLocalDateKey(new Date(session.startedAt));
    if (legacyDate === localDate) continue;
    const totals = affected.get(legacyDate) ?? { activeMinutes: 0, caloriesActive: 0 };
    totals.activeMinutes += Math.max(0, Number(session.durationMinutes) || 0);
    totals.caloriesActive += Math.max(0, Number(session.caloriesEstimate) || 0);
    affected.set(legacyDate, totals);
  }

  for (const [legacyDate, manualTotals] of affected) {
    const metric = await normalizedMetricsDb.getByDate(legacyDate);
    if (!metric) continue;
    if (metric.source === 'workout') {
      await normalizedMetricsDb.deleteByDate(legacyDate);
    } else {
      await normalizedMetricsDb.update({
        ...metric,
        activeMinutes: Math.max(0, metric.activeMinutes - manualTotals.activeMinutes),
        caloriesActive: Math.max(0, metric.caloriesActive - manualTotals.caloriesActive),
      });
    }
  }

  await AsyncStorage.setItem(migrationKey, 'complete');
  return { migratedDays: affected.size };
}
