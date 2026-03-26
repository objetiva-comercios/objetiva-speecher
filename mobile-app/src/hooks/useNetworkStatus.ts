import { useState, useEffect } from 'react';
import type { ConnectionStatus } from '../types';
import {
  checkNetworkStatus,
  subscribeToNetworkStatus,
  startNetworkMonitoring,
  stopNetworkMonitoring,
  setReconnecting,
} from '../services/network';

interface UseNetworkStatusResult {
  status: ConnectionStatus;
  isOnline: boolean;
  isReconnecting: boolean;
}

/**
 * Hook for monitoring network connectivity status.
 * Per user decision: show offline banner and "Reconnecting..." state.
 */
export function useNetworkStatus(
  onOnline?: () => void,
  onOffline?: () => void
): UseNetworkStatusResult {
  const [status, setStatus] = useState<ConnectionStatus>('online');

  useEffect(() => {
    // Check initial status
    checkNetworkStatus().then(online => {
      setStatus(online ? 'online' : 'offline');
    });

    // Subscribe to status changes
    const unsubscribe = subscribeToNetworkStatus(setStatus);

    // Start monitoring with callbacks
    startNetworkMonitoring(
      () => {
        // Mark as reconnecting briefly, then clear once callback completes
        setReconnecting(true);
        if (onOnline) {
          Promise.resolve(onOnline()).finally(() => setReconnecting(false));
        } else {
          // No callback — clear reconnecting after a brief delay
          setTimeout(() => setReconnecting(false), 2000);
        }
      },
      () => {
        onOffline?.();
      }
    );

    return () => {
      unsubscribe();
      stopNetworkMonitoring();
    };
  }, [onOnline, onOffline]);

  return {
    status,
    isOnline: status === 'online',
    isReconnecting: status === 'reconnecting',
  };
}
