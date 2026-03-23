import { ZeroConf } from 'capacitor-zeroconf';
import type { ZeroConfWatchResult } from 'capacitor-zeroconf';
import type { BackendService } from '../types';
import { getItem, setItem, STORAGE_KEYS } from './storage';

const PRODUCTION_BACKEND_URL = 'https://speecher.objetiva.com.ar';
const MDNS_TIMEOUT_MS = 5000;
const HEALTH_TIMEOUT_MS = 5000;

let backendUrl: string = PRODUCTION_BACKEND_URL;
let discoveredService: BackendService | null = null;

/**
 * Try to reach a backend at given URL.
 * Returns true if backend responds with valid Speecher health response.
 */
async function tryBackendUrl(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

    const response = await fetch(`${url}/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) return false;

    const data = await response.json();
    console.log('[Discovery] Health response from', url, ':', JSON.stringify(data));
    return data && data.status === 'ok';
  } catch (err) {
    console.log('[Discovery] Failed to reach', url, ':', err);
    return false;
  }
}

/**
 * Discover backend via mDNS using capacitor-zeroconf.
 * Returns the URL if found within timeout, null otherwise.
 */
function discoverViaMdns(): Promise<string | null> {
  const type = '_speecher._tcp.';
  const domain = 'local.';
  let resolved = false;

  return new Promise<string | null>((resolve) => {
    const timer = setTimeout(async () => {
      if (!resolved) {
        resolved = true;
        console.log('[Discovery] mDNS timeout after', MDNS_TIMEOUT_MS, 'ms');
        try {
          await ZeroConf.unwatch({ type, domain });
        } catch (err) {
          console.log('[Discovery] mDNS cleanup error:', err);
        }
        resolve(null);
      }
    }, MDNS_TIMEOUT_MS);

    // Use watch callback — the plugin sends results via call.resolve(),
    // not via notifyListeners, so addListener('discover') won't work.
    ZeroConf.watch({ type, domain }, async (result: ZeroConfWatchResult) => {
      if (resolved) return;
      console.log('[Discovery] mDNS event:', result.action, result.service?.name);
      if (result.action !== 'resolved') return;

      const service = result.service;
      const ip = service.ipv4Addresses?.[0];
      const port = service.port;

      if (!ip || !port) {
        console.log('[Discovery] mDNS resolved but missing ip/port:', JSON.stringify(service));
        return;
      }

      const url = `http://${ip}:${port}`;
      console.log('[Discovery] mDNS found service:', service.name, 'at', url);

      const healthy = await tryBackendUrl(url);
      if (healthy && !resolved) {
        resolved = true;
        clearTimeout(timer);

        discoveredService = {
          hostname: service.name || 'unknown',
          ip,
          port,
          url,
        };

        try {
          await ZeroConf.unwatch({ type, domain });
        } catch (err) {
          console.log('[Discovery] mDNS cleanup error:', err);
        }
        resolve(url);
      }
    }).catch((err) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        console.log('[Discovery] mDNS watch failed:', err);
        resolve(null);
      }
    });

    console.log('[Discovery] mDNS search started for', type);
  });
}

/**
 * Initialize discovery service.
 * Priority: stored URL > mDNS > production URL
 */
export async function initializeDiscovery(): Promise<string | null> {
  console.log('[Discovery] Initializing...');

  // 1. Try stored URL first
  const storedUrl = await getItem(STORAGE_KEYS.BACKEND_URL);
  if (storedUrl) {
    console.log('[Discovery] Checking stored URL:', storedUrl);
    const storedWorks = await tryBackendUrl(storedUrl);
    if (storedWorks) {
      console.log('[Discovery] Stored URL works:', storedUrl);
      backendUrl = storedUrl;
      return storedUrl;
    }
    console.log('[Discovery] Stored URL failed');
  }

  // 2. Try mDNS discovery
  console.log('[Discovery] Starting mDNS discovery...');
  const mdnsUrl = await discoverViaMdns();
  if (mdnsUrl) {
    console.log('[Discovery] mDNS discovered backend at:', mdnsUrl);
    backendUrl = mdnsUrl;
    await setItem(STORAGE_KEYS.BACKEND_URL, mdnsUrl);
    return mdnsUrl;
  }

  // 3. Fallback to production URL
  console.log('[Discovery] Checking production URL:', PRODUCTION_BACKEND_URL);
  const productionWorks = await tryBackendUrl(PRODUCTION_BACKEND_URL);
  if (productionWorks) {
    console.log('[Discovery] Production backend reachable');
    backendUrl = PRODUCTION_BACKEND_URL;
    return PRODUCTION_BACKEND_URL;
  }

  // 4. Nothing works
  console.log('[Discovery] No reachable backend found');
  return null;
}

/**
 * Set manual backend URL (for development/testing).
 * Persists to storage for future app launches.
 */
export async function setManualBackendUrl(url: string): Promise<void> {
  backendUrl = url;
  await setItem(STORAGE_KEYS.BACKEND_URL, url);
}

/**
 * Get stored manual backend URL.
 */
export async function getStoredBackendUrl(): Promise<string | null> {
  return getItem(STORAGE_KEYS.BACKEND_URL);
}

/**
 * Get current backend URL.
 */
export function getBackendUrl(): string {
  return backendUrl;
}

/**
 * Check if backend URL is configured.
 */
export function isBackendConfigured(): boolean {
  return backendUrl !== null;
}

/**
 * Get discovered backend info (for display purposes).
 */
export function getDiscoveredBackend(): BackendService | null {
  if (discoveredService) {
    return discoveredService;
  }
  return {
    hostname: backendUrl === PRODUCTION_BACKEND_URL ? 'VPS' : 'Manual',
    ip: backendUrl,
    port: backendUrl.startsWith('https') ? 443 : 80,
    url: backendUrl,
  };
}

// Legacy exports for compatibility
export async function discoverBackend(): Promise<BackendService | null> {
  const url = await initializeDiscovery();
  if (url) {
    return getDiscoveredBackend();
  }
  return null;
}

export async function stopDiscovery(): Promise<void> {
  try {
    await ZeroConf.close();
  } catch (err) {
    console.log('[Discovery] stopDiscovery error:', err);
  }
}
