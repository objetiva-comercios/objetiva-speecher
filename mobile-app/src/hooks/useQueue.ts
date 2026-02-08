import { useState, useEffect, useCallback } from 'react';
import type { QueuedTranscription } from '../types';
import { loadQueue, enqueue, dequeue, replayQueue } from '../services/queue';
import { getApiClient, isApiClientInitialized } from '../services/api';

interface UseQueueResult {
  items: QueuedTranscription[];
  isReplaying: boolean;
  addToQueue: (deviceId: string, text: string) => Promise<QueuedTranscription>;
  removeFromQueue: (id: string) => Promise<void>;
  replayAll: () => Promise<number>;
  refresh: () => Promise<void>;
  queueLength: number;
}

/**
 * Hook for managing the transcription queue.
 * Per user decision:
 * - Queue transcriptions when target device is offline
 * - Show visible pending list of queued items
 * - Swipe to delete queued transcriptions
 */
export function useQueue(): UseQueueResult {
  const [items, setItems] = useState<QueuedTranscription[]>([]);
  const [isReplaying, setIsReplaying] = useState(false);

  // Load queue on mount
  const refresh = useCallback(async () => {
    const queue = await loadQueue();
    setItems(queue);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Add item to queue
  const addToQueue = useCallback(async (deviceId: string, text: string): Promise<QueuedTranscription> => {
    const item = await enqueue(deviceId, text);
    await refresh();
    return item;
  }, [refresh]);

  // Remove item from queue (swipe to delete)
  const removeFromQueue = useCallback(async (id: string): Promise<void> => {
    await dequeue(id);
    await refresh();
  }, [refresh]);

  // Replay all queued items
  const replayAll = useCallback(async (): Promise<number> => {
    if (!isApiClientInitialized()) {
      return 0;
    }

    setIsReplaying(true);
    try {
      const api = getApiClient();
      const sentCount = await replayQueue(async (item) => {
        return api.sendQueuedItem(item);
      });
      await refresh();
      return sentCount;
    } finally {
      setIsReplaying(false);
    }
  }, [refresh]);

  return {
    items,
    isReplaying,
    addToQueue,
    removeFromQueue,
    replayAll,
    refresh,
    queueLength: items.length,
  };
}
