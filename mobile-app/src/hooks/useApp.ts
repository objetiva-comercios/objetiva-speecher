import { useState, useEffect, useCallback } from 'react';
import { initializeDiscovery, getBackendUrl, setManualBackendUrl } from '../services/discovery';
import { initApiClient, getApiClient, isApiClientInitialized } from '../services/api';
import { setReconnecting } from '../services/network';

type AppState = 'initializing' | 'configuring' | 'ready' | 'error';

interface UseAppResult {
  state: AppState;
  error: string | null;
  backendUrl: string | null;
  setManualUrl: (url: string) => Promise<void>;
  isReady: boolean;
}

/**
 * App-level orchestration hook.
 * Handles initialization, discovery, and API client setup.
 */
export function useApp(): UseAppResult {
  const [state, setState] = useState<AppState>('initializing');
  const [error, setError] = useState<string | null>(null);
  const [backendUrl, setBackendUrl] = useState<string | null>(null);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      try {
        setState('initializing');

        // Attempt discovery (mDNS or stored URL)
        const url = await initializeDiscovery();

        if (url) {
          initApiClient(url);
          setBackendUrl(url);

          // Verify backend is reachable
          const api = getApiClient();
          const healthy = await api.healthCheck();

          if (healthy) {
            setState('ready');
          } else {
            setState('configuring');
            setError('No se puede conectar al servidor');
          }
        } else {
          // No backend found - need manual config
          setState('configuring');
        }
      } catch (err: any) {
        setError(err.message || 'Error de inicializacion');
        setState('error');
      }
    };

    init();
  }, []);

  // Set manual backend URL
  const setManualUrl = useCallback(async (url: string) => {
    try {
      await setManualBackendUrl(url);
      initApiClient(url);
      setBackendUrl(url);

      // Verify it works
      const api = getApiClient();
      const healthy = await api.healthCheck();

      if (healthy) {
        setState('ready');
        setError(null);
      } else {
        setError('No se puede conectar a esa direccion');
      }
    } catch (err: any) {
      setError(err.message || 'URL invalida');
    }
  }, []);

  return {
    state,
    error,
    backendUrl,
    setManualUrl,
    isReady: state === 'ready',
  };
}

/**
 * Handle reconnection after offline period.
 * Called when network status changes to online.
 */
export async function handleReconnect(replayQueue: () => Promise<number>): Promise<void> {
  if (!isApiClientInitialized()) {
    setReconnecting(false);
    return;
  }

  try {
    const api = getApiClient();
    const healthy = await api.healthCheck();

    if (healthy) {
      // Backend reachable - replay queue
      await replayQueue();
    }
  } finally {
    setReconnecting(false);
  }
}
