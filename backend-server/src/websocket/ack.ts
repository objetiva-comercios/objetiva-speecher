import type { WebSocket } from 'ws';
import type { ServerMessage } from '../types/messages.js';

// Default timeout: 5 seconds (per research recommendation, local network)
const DEFAULT_ACK_TIMEOUT_MS = 5000;

interface PendingAck {
  resolve: (success: boolean) => void;
  timeout: NodeJS.Timeout;
  deviceId: string;
}

// Map: message id -> pending ack info
const pendingAcks = new Map<string, PendingAck>();

/**
 * Send a message to agent and wait for ACK.
 * Returns true if ACK received, false if timeout.
 */
export async function sendAndWaitForAck(
  socket: WebSocket,
  message: ServerMessage,
  deviceId: string,
  timeoutMs: number = DEFAULT_ACK_TIMEOUT_MS
): Promise<boolean> {
  if (message.type !== 'transcription') {
    // Only transcription messages need ACK
    socket.send(JSON.stringify(message));
    return true;
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      pendingAcks.delete(message.id);
      resolve(false);
    }, timeoutMs);

    pendingAcks.set(message.id, { resolve, timeout, deviceId });
    socket.send(JSON.stringify(message));
  });
}

/**
 * Handle incoming ACK message from agent.
 * Called from WebSocket message handler.
 */
export function handleAck(messageId: string): boolean {
  const pending = pendingAcks.get(messageId);
  if (!pending) {
    return false; // No pending ACK for this message
  }

  clearTimeout(pending.timeout);
  pending.resolve(true);
  pendingAcks.delete(messageId);
  return true;
}

/**
 * Clear all pending ACKs for a device (called on disconnect).
 * Prevents memory leaks from timeouts.
 */
export function clearPendingAcks(deviceId: string): void {
  for (const [messageId, pending] of pendingAcks.entries()) {
    if (pending.deviceId === deviceId) {
      clearTimeout(pending.timeout);
      pending.resolve(false); // Resolve as failed
      pendingAcks.delete(messageId);
    }
  }
}

/**
 * Check if there are pending ACKs for a device.
 */
export function hasPendingAcks(deviceId: string): boolean {
  for (const pending of pendingAcks.values()) {
    if (pending.deviceId === deviceId) {
      return true;
    }
  }
  return false;
}
