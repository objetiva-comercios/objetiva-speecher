import { v4 as uuidv4 } from 'uuid';
import type { QueuedTranscription } from '../types';
import { getJSON, setJSON, STORAGE_KEYS } from './storage';

/**
 * Load queue from persistent storage.
 * Returns empty array if no queue exists.
 */
export async function loadQueue(): Promise<QueuedTranscription[]> {
  const queue = await getJSON<QueuedTranscription[]>(STORAGE_KEYS.QUEUE);
  return queue ?? [];
}

/**
 * Save queue to persistent storage.
 * Called after every mutation for immediate persistence.
 */
async function saveQueue(queue: QueuedTranscription[]): Promise<void> {
  await setJSON(STORAGE_KEYS.QUEUE, queue);
}

/**
 * Add transcription to queue.
 * Immediately persists to storage per research pitfall #4.
 * Returns the created queue item.
 */
export async function enqueue(
  deviceId: string,
  text: string
): Promise<QueuedTranscription> {
  const queue = await loadQueue();
  const item: QueuedTranscription = {
    id: uuidv4(),
    deviceId,
    text,
    timestamp: Date.now(),
  };
  queue.push(item);
  await saveQueue(queue);
  return item;
}

/**
 * Remove transcription from queue by ID.
 * Used after successful delivery or swipe-to-delete.
 */
export async function dequeue(id: string): Promise<void> {
  const queue = await loadQueue();
  const filtered = queue.filter(item => item.id !== id);
  await saveQueue(filtered);
}

/**
 * Get queue length without loading full queue.
 */
export async function getQueueLength(): Promise<number> {
  const queue = await loadQueue();
  return queue.length;
}

/**
 * Replay queue: attempt to send each item, remove on success.
 * Stops on first failure to maintain order.
 * Returns number of successfully sent items.
 */
export async function replayQueue(
  sendFn: (item: QueuedTranscription) => Promise<boolean>
): Promise<number> {
  const queue = await loadQueue();
  let sentCount = 0;

  for (const item of queue) {
    const success = await sendFn(item);
    if (success) {
      await dequeue(item.id);
      sentCount++;
    } else {
      // Stop on first failure, will retry later
      break;
    }
  }

  return sentCount;
}

/**
 * Clear entire queue.
 * Use with caution - typically only for testing/debugging.
 */
export async function clearQueue(): Promise<void> {
  await saveQueue([]);
}
