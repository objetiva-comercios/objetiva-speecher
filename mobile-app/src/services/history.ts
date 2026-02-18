import { getJSON, setJSON } from './storage';
import type { HistoryItem } from '../types';

const HISTORY_KEY = 'speecher_history';
const MAX_HISTORY_ITEMS = 5;

/**
 * Get all history items from storage
 */
export async function getHistory(): Promise<HistoryItem[]> {
  const items = await getJSON<HistoryItem[]>(HISTORY_KEY);
  return items || [];
}

/**
 * Save history items to storage
 */
export async function saveHistory(items: HistoryItem[]): Promise<void> {
  // Keep only the most recent items
  const trimmed = items.slice(0, MAX_HISTORY_ITEMS);
  await setJSON(HISTORY_KEY, trimmed);
}

/**
 * Add a new item to history
 */
export async function addHistoryItem(
  deviceId: string,
  text: string,
  sent: boolean
): Promise<HistoryItem> {
  const items = await getHistory();

  const newItem: HistoryItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    deviceId,
    text,
    timestamp: Date.now(),
    sent,
  };

  // Add to beginning (most recent first)
  const updated = [newItem, ...items];
  await saveHistory(updated);

  return newItem;
}

/**
 * Update an existing history item
 */
export async function updateHistoryItem(
  id: string,
  updates: Partial<Pick<HistoryItem, 'text' | 'sent'>>
): Promise<void> {
  const items = await getHistory();
  const index = items.findIndex(item => item.id === id);

  if (index !== -1) {
    items[index] = { ...items[index], ...updates };
    await saveHistory(items);
  }
}

/**
 * Delete a history item
 */
export async function deleteHistoryItem(id: string): Promise<void> {
  const items = await getHistory();
  const filtered = items.filter(item => item.id !== id);
  await saveHistory(filtered);
}

/**
 * Clear all history
 */
export async function clearHistory(): Promise<void> {
  await setJSON(HISTORY_KEY, []);
}
