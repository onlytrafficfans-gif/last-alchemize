import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from '@/lib/secure-storage';
import { featureFlags } from '@/config/featureFlags';
import { isHealthKitSupported, checkHealthKitPermissions, revokeHealthKitPermissions } from '@/lib/healthkit';

const AUTH_SECURE_KEY = 'alchemize_auth_session';
const LEGACY_AUTH_KEY = '@alchemize_auth';
const USERS_STORAGE_KEY = '@alchemize_users';

/** AsyncStorage/SecureStore keys expected to hold JSON — corruption here breaks sign-in. */
const JSON_KEYS_TO_CHECK: { key: string; secure: boolean }[] = [
  { key: AUTH_SECURE_KEY, secure: true },
  { key: LEGACY_AUTH_KEY, secure: false },
  { key: USERS_STORAGE_KEY, secure: false },
];

export interface DiagnosticsSnapshot {
  platform: string;
  appVersion: string | null;
  buildIdentifier: string | null;
  featureFlags: Record<string, boolean>;
  healthKit: { supported: boolean; reason: string; permissionStatus: string };
  corruptedStorageKeys: string[];
}

async function readKey(key: string, secure: boolean): Promise<string | null> {
  return secure ? secureStorage.getItem(key) : AsyncStorage.getItem(key);
}

async function findCorruptedJsonKeys(): Promise<string[]> {
  const corrupted: string[] = [];
  for (const { key, secure } of JSON_KEYS_TO_CHECK) {
    try {
      const raw = await readKey(key, secure);
      if (raw) JSON.parse(raw);
    } catch {
      corrupted.push(key);
    }
  }
  return corrupted;
}

/** Read-only snapshot of app/runtime state — safe to call anytime, mutates nothing. */
export async function getAppDiagnostics(): Promise<DiagnosticsSnapshot> {
  const [healthPermissions, corruptedStorageKeys] = await Promise.all([
    checkHealthKitPermissions(),
    findCorruptedJsonKeys(),
  ]);
  const healthSupport = isHealthKitSupported();

  return {
    platform: Platform.OS,
    appVersion: Constants.expoConfig?.version ?? null,
    buildIdentifier:
      Platform.OS === 'ios'
        ? (Constants.expoConfig?.ios?.buildNumber ?? null)
        : (Constants.expoConfig?.android?.versionCode?.toString() ?? null),
    featureFlags: { ...featureFlags },
    healthKit: {
      supported: healthSupport.supported,
      reason: healthSupport.reason,
      permissionStatus: healthPermissions.overallStatus,
    },
    corruptedStorageKeys,
  };
}

/** Removes any of the known auth-related storage keys that fail to parse as JSON. Safe: only touches keys already confirmed corrupt, forcing a clean re-login rather than leaving the app stuck. */
export async function clearCorruptedAuthCache(): Promise<{ cleared: string[] }> {
  const cleared: string[] = [];
  for (const { key, secure } of JSON_KEYS_TO_CHECK) {
    try {
      const raw = await readKey(key, secure);
      if (raw) JSON.parse(raw);
    } catch {
      if (secure) {
        await secureStorage.removeItem(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
      cleared.push(key);
    }
  }
  return { cleared };
}

/** Clears the locally cached HealthKit permission state so the user can reconnect from a clean slate. Does not (and cannot) touch the OS-level grant — that always lives in iOS Settings. */
export async function resetHealthKitConnection(): Promise<{ success: boolean }> {
  await revokeHealthKitPermissions();
  return { success: true };
}
