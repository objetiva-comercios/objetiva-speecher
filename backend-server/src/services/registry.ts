import type { WebSocket } from 'ws';
import type { AgentConnection } from '../types/messages.js';

// Map: normalized deviceId -> connection
const registry = new Map<string, AgentConnection>();

/**
 * Normalize deviceId for case-insensitive matching.
 * Windows hostnames may differ in case from Linux.
 */
export function normalizeDeviceId(raw: string): string {
  return raw.toLowerCase().trim();
}

/**
 * Register a new agent connection.
 * Returns false if duplicate (per user decision: reject new connection).
 */
export function registerAgent(deviceId: string, socket: WebSocket): boolean {
  const normalized = normalizeDeviceId(deviceId);

  if (registry.has(normalized)) {
    return false; // Reject duplicate per user decision
  }

  registry.set(normalized, {
    socket,
    deviceId: normalized,
    connectedAt: new Date(),
    isAlive: true,
  });

  return true;
}

/**
 * Remove agent from registry (called on disconnect).
 * Per user decision: remove immediately.
 */
export function unregisterAgent(deviceId: string): void {
  const normalized = normalizeDeviceId(deviceId);
  registry.delete(normalized);
}

/**
 * Get agent connection by deviceId.
 */
export function getAgent(deviceId: string): AgentConnection | undefined {
  const normalized = normalizeDeviceId(deviceId);
  return registry.get(normalized);
}

/**
 * Get list of all connected device IDs.
 * Used by GET /devices endpoint.
 */
export function getConnectedDevices(): string[] {
  return Array.from(registry.keys());
}

/**
 * Update isAlive status for heartbeat tracking.
 */
export function setAgentAlive(deviceId: string, isAlive: boolean): void {
  const normalized = normalizeDeviceId(deviceId);
  const agent = registry.get(normalized);
  if (agent) {
    agent.isAlive = isAlive;
  }
}

/**
 * Get all agents for heartbeat iteration.
 */
export function getAllAgents(): Map<string, AgentConnection> {
  return registry;
}
