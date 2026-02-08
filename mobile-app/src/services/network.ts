import { Network, type ConnectionStatus } from '@capacitor/network';
import type { ConnectionStatus as AppConnectionStatus } from '../types';

type NetworkCallback = (status: AppConnectionStatus) => void;

let isOnline = true;
let isReconnecting = false;
let listeners: NetworkCallback[] = [];

/**
 * Check current network status.
 * Returns true if connected to network.
 */
export async function checkNetworkStatus(): Promise<boolean> {
  const status = await Network.getStatus();
  isOnline = status.connected;
  return isOnline;
}

/**
 * Get current connection status for UI.
 */
export function getConnectionStatus(): AppConnectionStatus {
  if (isReconnecting) return 'reconnecting';
  return isOnline ? 'online' : 'offline';
}

/**
 * Set reconnecting state.
 * Called when attempting to reconnect to backend after offline period.
 */
export function setReconnecting(reconnecting: boolean): void {
  isReconnecting = reconnecting;
  notifyListeners();
}

/**
 * Start monitoring network status changes.
 * Calls onOnline when connection restores (triggers queue replay).
 * Calls onOffline when connection drops (shows offline banner).
 */
export function startNetworkMonitoring(
  onOnline: () => void,
  onOffline: () => void
): void {
  Network.addListener('networkStatusChange', (status: ConnectionStatus) => {
    const wasOffline = !isOnline;
    isOnline = status.connected;

    if (isOnline && wasOffline) {
      // Connection restored
      isReconnecting = true;
      notifyListeners();
      onOnline();
    } else if (!isOnline) {
      // Connection lost
      isReconnecting = false;
      notifyListeners();
      onOffline();
    }
  });
}

/**
 * Stop monitoring network status.
 * Call when component unmounts or app goes to background.
 */
export function stopNetworkMonitoring(): void {
  Network.removeAllListeners();
  listeners = [];
}

/**
 * Subscribe to connection status changes.
 * Returns unsubscribe function.
 */
export function subscribeToNetworkStatus(callback: NetworkCallback): () => void {
  listeners.push(callback);
  // Immediately call with current status
  callback(getConnectionStatus());
  return () => {
    listeners = listeners.filter(l => l !== callback);
  };
}

/**
 * Notify all listeners of status change.
 */
function notifyListeners(): void {
  const status = getConnectionStatus();
  listeners.forEach(l => l(status));
}

/**
 * Check if currently online.
 */
export function isCurrentlyOnline(): boolean {
  return isOnline;
}
