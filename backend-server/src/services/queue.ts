import type { QueuedMessage } from '../types/messages.js';
import { normalizeDeviceId } from './registry.js';

const MAX_QUEUE_SIZE = 50;
const MAX_QUEUE_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

// Map: normalized deviceId -> array of queued messages
const messageQueues = new Map<string, QueuedMessage[]>();

/**
 * Add message to queue for offline agent.
 * Returns success status and error code if queue is full.
 */
export function enqueue(
  deviceId: string,
  message: QueuedMessage
): { success: true } | { success: false; code: 'QUEUE_FULL' } {
  const normalized = normalizeDeviceId(deviceId);
  let queue = messageQueues.get(normalized) || [];

  // Prune expired messages first
  const now = Date.now();
  queue = queue.filter(m => now - m.timestamp < MAX_QUEUE_AGE_MS);

  // Check queue size limit
  if (queue.length >= MAX_QUEUE_SIZE) {
    return { success: false, code: 'QUEUE_FULL' };
  }

  // Add message (maintains strict ordering per user decision)
  queue.push(message);
  messageQueues.set(normalized, queue);

  return { success: true };
}

/**
 * Get and remove all queued messages for a device.
 * Called when agent reconnects for "immediate burst" delivery.
 * Returns messages in strict order (FIFO).
 */
export function drainQueue(deviceId: string): QueuedMessage[] {
  const normalized = normalizeDeviceId(deviceId);
  const queue = messageQueues.get(normalized) || [];

  // Clear the queue
  messageQueues.delete(normalized);

  // Filter expired before returning (in case not pruned recently)
  const now = Date.now();
  return queue.filter(m => now - m.timestamp < MAX_QUEUE_AGE_MS);
}

/**
 * Get current queue size for a device (for debugging/monitoring).
 */
export function getQueueSize(deviceId: string): number {
  const normalized = normalizeDeviceId(deviceId);
  const queue = messageQueues.get(normalized) || [];
  return queue.length;
}

/**
 * Check if device has queued messages.
 */
export function hasQueuedMessages(deviceId: string): boolean {
  const normalized = normalizeDeviceId(deviceId);
  const queue = messageQueues.get(normalized);
  return queue !== undefined && queue.length > 0;
}
