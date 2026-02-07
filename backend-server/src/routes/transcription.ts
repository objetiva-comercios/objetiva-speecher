import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getAgent } from '../services/registry.js';
import { enqueue } from '../services/queue.js';
import { sendAndWaitForAck } from '../websocket/ack.js';
import type { ApiResponse, ServerMessage } from '../types/messages.js';

interface TranscriptionBody {
  deviceId: string;
  text: string;
}

/**
 * POST /transcription route plugin.
 *
 * Routes transcription text to the specified desktop agent.
 * Per user decision: 200 for all accepts, 500 for server errors only.
 */
export async function transcriptionRoute(fastify: FastifyInstance): Promise<void> {
  fastify.post<{ Body: TranscriptionBody }>(
    '/transcription',
    {
      schema: {
        body: {
          type: 'object',
          required: ['deviceId', 'text'],
          properties: {
            deviceId: { type: 'string', minLength: 1 },
            text: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: TranscriptionBody }>, reply: FastifyReply) => {
      const { deviceId, text } = request.body;

      // Validate deviceId (redundant with Fastify schema, but explicit for clarity)
      // Note: Fastify schema already validates minLength:1, so this is a safety net
      if (!deviceId || typeof deviceId !== 'string' || deviceId.trim() === '') {
        // Per user decision: 200 for all responses, error details in body for client handling
        // INVALID_DEVICE_ID is a client validation error, NOT a server error
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'INVALID_DEVICE_ID',
            message: 'deviceId is required and must be a non-empty string',
          },
        };
        return reply.code(200).send(response);
      }

      try {
        const result = await routeTranscription(deviceId, text, request.log);
        return reply.code(200).send(result);
      } catch (error) {
        request.log.error({ error, deviceId }, 'Transcription routing failed');
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to process transcription',
          },
        };
        return reply.code(500).send(response);
      }
    }
  );
}

/**
 * Route transcription to agent or queue if offline.
 */
async function routeTranscription(
  deviceId: string,
  text: string,
  logger: FastifyInstance['log']
): Promise<ApiResponse> {
  const messageId = crypto.randomUUID();
  const timestamp = Date.now();

  const agent = getAgent(deviceId);

  if (!agent) {
    // Agent offline - queue the message
    logger.info({ deviceId, messageId }, 'Agent offline, queuing message');
    return queueMessage(deviceId, messageId, text, timestamp);
  }

  // Agent online - send and wait for ACK
  const serverMessage: ServerMessage = {
    type: 'transcription',
    id: messageId,
    text,
    timestamp,
  };

  const ackReceived = await sendAndWaitForAck(agent.socket, serverMessage, deviceId);

  if (ackReceived) {
    logger.info({ deviceId, messageId }, 'Transcription delivered and acknowledged');
    return {
      success: true,
      messageId,
      queued: false,
    };
  } else {
    // ACK timeout - queue for retry
    // Per research: ACK_TIMEOUT means agent might be unresponsive
    logger.warn({ deviceId, messageId }, 'ACK timeout, queuing for retry');
    return queueMessage(deviceId, messageId, text, timestamp);
  }
}

/**
 * Queue a message for offline/unresponsive agent.
 */
function queueMessage(
  deviceId: string,
  messageId: string,
  text: string,
  timestamp: number
): ApiResponse {
  const result = enqueue(deviceId, { id: messageId, text, timestamp });

  if (result.success) {
    return {
      success: true,
      messageId,
      queued: true,
    };
  } else {
    // Queue full
    return {
      success: false,
      error: {
        code: 'QUEUE_FULL',
        message: 'Message queue is full for this device (max 50 messages)',
      },
    };
  }
}
