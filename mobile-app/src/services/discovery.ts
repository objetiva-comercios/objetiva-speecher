import { Zeroconf, type ZeroConfWatchResult } from 'capacitor-zeroconf';
import type { BackendService } from '../types';
import { getItem, setItem, STORAGE_KEYS } from './storage';

const SERVICE_TYPE = '_speecher._tcp.';
const DOMAIN = 'local.';
const DISCOVERY_TIMEOUT_MS = 10000;  // 10 seconds

let discoveredBackend: BackendService | null = null;
let manualBackendUrl: string | null = null;

/**
 * Attempt to discover backend via mDNS.
 * Times out after 10 seconds and falls back to stored/manual URL.
 * Returns discovered service or null.
 */
export async function discoverBackend(): Promise<BackendService | null> {
  return new Promise((resolve) => {
    let resolved = false;

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        Zeroconf.unwatch({ type: SERVICE_TYPE, domain: DOMAIN }).catch(() => {});
        resolve(null);
      }
    }, DISCOVERY_TIMEOUT_MS);

    Zeroconf.watch(
      { type: SERVICE_TYPE, domain: DOMAIN },
      (result: ZeroConfWatchResult) => {
        if (result.action === 'resolved' && !resolved) {
          resolved = true;
          clearTimeout(timeout);

          const ip = result.service.ipv4Addresses?.[0] || result.service.ipv6Addresses?.[0];
          if (ip) {
            discoveredBackend = {
              hostname: result.service.hostname || 'unknown',
              ip,
              port: result.service.port,
              url: `http://${ip}:${result.service.port}`,
            };
            resolve(discoveredBackend);
          } else {
            resolve(null);
          }

          Zeroconf.unwatch({ type: SERVICE_TYPE, domain: DOMAIN }).catch(() => {});
        }
      }
    ).catch(() => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve(null);
      }
    });
  });
}

/**
 * Stop watching for mDNS services.
 */
export async function stopDiscovery(): Promise<void> {
  try {
    await Zeroconf.unwatch({ type: SERVICE_TYPE, domain: DOMAIN });
  } catch {
    // Ignore errors on cleanup
  }
}

/**
 * Set manual backend URL.
 * Persists to storage for future app launches.
 */
export async function setManualBackendUrl(url: string): Promise<void> {
  manualBackendUrl = url;
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
 * Priority: manual URL > discovered URL > null
 */
export function getBackendUrl(): string | null {
  if (manualBackendUrl) return manualBackendUrl;
  if (discoveredBackend) return discoveredBackend.url;
  return null;
}

/**
 * Initialize discovery service.
 * Loads stored URL and attempts mDNS discovery.
 * Returns the determined backend URL or null if not found.
 */
export async function initializeDiscovery(): Promise<string | null> {
  // First, load any stored manual URL
  const storedUrl = await getStoredBackendUrl();
  if (storedUrl) {
    manualBackendUrl = storedUrl;
  }

  // Attempt mDNS discovery
  const discovered = await discoverBackend();

  // Return best available URL
  if (discovered) {
    return discovered.url;
  }
  return manualBackendUrl;
}

/**
 * Check if backend URL is configured (either discovered or manual).
 */
export function isBackendConfigured(): boolean {
  return getBackendUrl() !== null;
}

/**
 * Get discovered backend info (for display purposes).
 */
export function getDiscoveredBackend(): BackendService | null {
  return discoveredBackend;
}
