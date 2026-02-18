import { useState, useEffect, useCallback } from 'react';
import { Clipboard } from '@capacitor/clipboard';
import type { HistoryItem } from '../types';
import {
  getHistory,
  addHistoryItem,
  updateHistoryItem as updateItem,
  deleteHistoryItem as deleteItem,
} from '../services/history';
import { getApiClient, isApiClientInitialized } from '../services/api';
import { parseToSegments } from '../services/commandParser';

interface UseHistoryResult {
  items: HistoryItem[];
  addItem: (deviceId: string, text: string, sent: boolean) => Promise<HistoryItem>;
  resendItem: (item: HistoryItem) => Promise<boolean>;
  copyItem: (item: HistoryItem) => Promise<void>;
  updateItem: (id: string, text: string) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  isSending: string | null; // ID of item currently being sent
}

export function useHistory(): UseHistoryResult {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [isSending, setIsSending] = useState<string | null>(null);

  // Load history on mount
  useEffect(() => {
    getHistory().then(setItems);
  }, []);

  // Add new item
  const addItem = useCallback(async (deviceId: string, text: string, sent: boolean) => {
    const newItem = await addHistoryItem(deviceId, text, sent);
    setItems(prev => [newItem, ...prev]);
    return newItem;
  }, []);

  // Resend an item
  const resendItem = useCallback(async (item: HistoryItem): Promise<boolean> => {
    if (!isApiClientInitialized()) return false;

    setIsSending(item.id);
    try {
      const api = getApiClient();
      const segments = parseToSegments(item.text);
      const response = await api.sendTranscription(item.deviceId, segments, item.text);

      if (response.success) {
        // Mark as sent
        await updateItem(item.id, { sent: true });
        setItems(prev =>
          prev.map(i => (i.id === item.id ? { ...i, sent: true } : i))
        );
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsSending(null);
    }
  }, []);

  // Copy item text to clipboard
  const copyItem = useCallback(async (item: HistoryItem) => {
    await Clipboard.write({ string: item.text });
  }, []);

  // Update item text
  const updateItemText = useCallback(async (id: string, text: string) => {
    await updateItem(id, { text });
    setItems(prev =>
      prev.map(i => (i.id === id ? { ...i, text } : i))
    );
  }, []);

  // Delete item
  const deleteItemById = useCallback(async (id: string) => {
    await deleteItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  return {
    items,
    addItem,
    resendItem,
    copyItem,
    updateItem: updateItemText,
    deleteItem: deleteItemById,
    isSending,
  };
}
