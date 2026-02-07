import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { getConnectedDevices } from '../services/registry.js';

interface DevicesResponse {
  success: boolean;
  devices: string[];
}

/**
 * GET /devices route plugin.
 *
 * Returns list of currently connected desktop agent hostnames.
 * Mobile app uses this to populate device selection list.
 */
export async function devicesRoute(fastify: FastifyInstance): Promise<void> {
  fastify.get('/devices', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const devices = getConnectedDevices();

      const response: DevicesResponse = {
        success: true,
        devices,
      };

      return reply.code(200).send(response);
    } catch (error) {
      fastify.log.error({ error }, 'Failed to get connected devices');
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get connected devices',
        },
      });
    }
  });
}
