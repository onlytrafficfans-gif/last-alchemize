import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Cross-platform secure key/value storage.
 * - Native (iOS/Android): expo-secure-store (Keychain / EncryptedSharedPreferences).
 * - Web: falls back to AsyncStorage (SecureStore is unavailable in browsers).
 *
 * Note: SecureStore keys may only contain alphanumerics, ".", "-", and "_".
 */
const SECURE_STORE_TIMEOUT_MS = 5000;

// Keychain access has been observed to hang (not throw) on certain iOS states
// rather than fail fast. Every native call is time-boxed so a caller — most
// critically auth-context's boot-time read — can never wait on this forever.
function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`SecureStore ${label} timed out after ${SECURE_STORE_TIMEOUT_MS}ms`)), SECURE_STORE_TIMEOUT_MS)
    ),
  ]);
}

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(key).catch(() => null);
    }
    try {
      return await withTimeout(SecureStore.getItemAsync(key), 'getItem');
    } catch (error) {
      console.error('[SecureStorage] getItem failed:', error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(key, value).catch((error) => {
        console.error('[SecureStorage] setItem (web) failed:', error);
      });
      return;
    }
    try {
      await withTimeout(SecureStore.setItemAsync(key, value), 'setItem');
    } catch (error) {
      console.error('[SecureStorage] setItem failed:', error);
    }
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(key).catch(() => {});
      return;
    }
    try {
      await withTimeout(SecureStore.deleteItemAsync(key), 'removeItem');
    } catch (error) {
      console.error('[SecureStorage] removeItem failed:', error);
    }
  },
};
