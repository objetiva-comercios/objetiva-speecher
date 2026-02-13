import type { WebSocket } from 'ws';
import type { FastifyRequest, FastifyBaseLogger } from 'fastify';
import type { AgentMessage } from '../types/messages.js';
import {
  registerAgent,
  unregisterAgent,
  getAgent,
  setAgentAlive,
  normalizeDeviceId,
} from '../services/registry.js';
import { drainQueue, hasQueuedMessages } from '../services/queue.js';
import { handleAck, clearPendingAcks, sendAndWaitForAck } from './ack.js';

/**
 * Create the WebSocket connection handler for Fastify.
 *
 * IMPORTANT: Per research pitfall #1, attach all event handlers synchronously
 * before any async operations to avoid dropping messages.
 */
export function createWebSocketHandler(logger: FastifyBaseLogger) {
  return function handleConnection(socket: WebSocket, request: FastifyRequest): void {
    let deviceId: string | null = null;

    // Attach all handlers SYNCHRONOUSLY (per research pitfall #1)

    socket.on('message', (data) => {
      try {
        const message: AgentMessage = JSON.parse(data.toString());

        if (message.type === 'register') {
          handleRegister(socket, message.deviceId, logger);
          deviceId = normalizeDeviceId(message.deviceId);
        } else if (message.type === 'ack') {
          handleAck(message.id);
          logger.debug({ messageId: message.id, deviceId }, 'ACK received');
        }
      } catch (error) {
        logger.error({ error, deviceId }, 'Failed to parse WebSocket message');
      }
    });

    socket.on('pong', () => {
      // Heartbeat response - mark as alive
      if (deviceId) {
        setAgentAlive(deviceId, true);
        logger.debug({ deviceId }, 'Pong received');
      }
    });

    socket.on('close', () => {
      if (deviceId) {
        logger.info({ deviceId }, 'Agent disconnected');
        unregisterAgent(deviceId);
        clearPendingAcks(deviceId);
      }
    });

    socket.on('error', (error) => {
      logger.error({ error, deviceId }, 'WebSocket error');
      // Don't unregister here - 'close' event will handle it
    });

    logger.debug({ ip: request.ip }, 'WebSocket connection opened, awaiting registration');
  };
}

/**
 * Handle agent registration message.
 */
function handleRegister(
  socket: WebSocket,
  rawDeviceId: string,
  logger: FastifyBaseLogger
): void {
  const deviceId = normalizeDeviceId(rawDeviceId);

  // Check for duplicate connection (per user decision: reject new)
  const existing = getAgent(deviceId);
  if (existing) {
    logger.warn({ deviceId }, 'Duplicate connection rejected');
    socket.close(4000, 'DUPLICATE_CONNECTION');
    return;
  }

  // Register the agent
  const registered = registerAgent(deviceId, socket);
  if (!registered) {
    // Shouldn't happen after the check above, but handle gracefully
    socket.close(4000, 'REGISTRATION_FAILED');
    return;
  }

  logger.info({ deviceId }, 'Agent registered');

  // Deliver any queued messages (per user decision: immediate burst)
  if (hasQueuedMessages(deviceId)) {
    deliverQueuedMessages(socket, deviceId, logger);
  }
}

/**
 * Deliver queued messages to newly connected agent.
 * Per user decision: immediate burst delivery.
 */
async function deliverQueuedMessages(
  socket: WebSocket,
  deviceId: string,
  logger: FastifyBaseLogger
): Promise<void> {
  const messages = drainQueue(deviceId);

  if (messages.length === 0) {
    return;
  }

  logger.info({ deviceId, count: messages.length }, 'Delivering queued messages');

  // Send all messages immediately (burst delivery per user decision)
  for (const msg of messages) {
    const serverMessage = {
      type: 'transcription' as const,
      id: msg.id,
      text: msg.text,     // Legacy: for backwards compatibility
      payload: msg.payload,  // New: Segment[] for key actions
      timestamp: msg.timestamp,
    };

    // Note: We don't wait for ACK on queued messages - they're already accepted
    // The mobile app already got 200 OK when they were queued
    socket.send(JSON.stringify(serverMessage));
  }

  logger.info({ deviceId, count: messages.length }, 'Queued messages delivered');
}
