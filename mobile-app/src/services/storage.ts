import { Preferences } from '@capacitor/preferences';

/**
 * Get item from persistent storage.
 * Returns null if key doesn't exist.
 */
export async function getItem(key: string): Promise<string | null> {
  const { value } = await Preferences.get({ key });
  return value;
}

/**
 * Set item in persistent storage.
 * Value must be a string (serialize JSON objects before storing).
 */
export async function setItem(key: string, value: string): Promise<void> {
  await Preferences.set({ key, value });
}

/**
 * Remove item from persistent storage.
 */
export async function removeItem(key: string): Promise<void> {
  await Preferences.remove({ key });
}

/**
 * Get JSON item from storage with type safety.
 * Returns null if key doesn't exist or parse fails.
 */
export async function getJSON<T>(key: string): Promise<T | null> {
  const value = await getItem(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/**
 * Set JSON item in storage.
 */
export async function setJSON<T>(key: string, value: T): Promise<void> {
  await setItem(key, JSON.stringify(value));
}

// Storage keys used in the app
export const STORAGE_KEYS = {
  QUEUE: 'transcription_queue',
  LAST_DEVICE: 'last_selected_device',
  BACKEND_URL: 'backend_url',
} as const;
