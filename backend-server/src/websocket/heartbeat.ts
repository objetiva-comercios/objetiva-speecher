import { getAllAgents, unregisterAgent, setAgentAlive } from '../services/registry.js';
import { clearPendingAcks } from './ack.js';
import type { FastifyBaseLogger } from 'fastify';

const HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds per user decision

let heartbeatInterval: NodeJS.Timeout | null = null;

/**
 * Start the heartbeat interval.
 * Pings all connected agents and terminates those that missed pongs.
 *
 * Per user decision: disconnect after 2 missed pongs.
 * Implementation: First miss sets isAlive=false, second miss terminates.
 */
export function startHeartbeat(logger: FastifyBaseLogger): void {
  if (heartbeatInterval) {
    return; // Already running
  }

  heartbeatInterval = setInterval(() => {
    const agents = getAllAgents();

    agents.forEach((agent, deviceId) => {
      if (!agent.isAlive) {
        // Missed previous pong - terminate connection
        logger.info({ deviceId }, 'Agent missed heartbeat pong, terminating');
        agent.socket.terminate();
        unregisterAgent(deviceId);
        clearPendingAcks(deviceId);
        return;
      }

      // Mark as not alive until pong received
      setAgentAlive(deviceId, false);

      // Send ping (protocol-level)
      agent.socket.ping();
    });
  }, HEARTBEAT_INTERVAL_MS);

  logger.info('Heartbeat started (30s interval)');
}

/**
 * Stop the heartbeat interval.
 * Called on server shutdown.
 */
export function stopHeartbeat(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}
