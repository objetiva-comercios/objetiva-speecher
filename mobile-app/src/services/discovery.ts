import type { BackendService } from '../types';
import { getItem, setItem, STORAGE_KEYS } from './storage';

// Production backend URL
const PRODUCTION_BACKEND_URL = 'https://speecher.objetiva.com.ar';

// For development, can override via stored URL
let backendUrl: string = PRODUCTION_BACKEND_URL;

/**
 * Try to reach a backend at given URL.
 * Returns true if backend responds with valid JSON.
 */
async function tryBackendUrl(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${url}/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Initialize discovery service.
 * With VPS backend, this just verifies the production URL is reachable.
 * Falls back to stored URL if production URL fails (for development).
 */
export async function initializeDiscovery(): Promise<string | null> {
  console.log('[Discovery] Initializing with VPS backend...');

  // Check if there's a stored override URL (for development)
  const storedUrl = await getItem(STORAGE_KEYS.BACKEND_URL);

  // Try production URL first
  console.log('[Discovery] Checking production URL:', PRODUCTION_BACKEND_URL);
  const productionWorks = await tryBackendUrl(PRODUCTION_BACKEND_URL);

  if (productionWorks) {
    console.log('[Discovery] Production backend reachable');
    backendUrl = PRODUCTION_BACKEND_URL;
    return PRODUCTION_BACKEND_URL;
  }

  // Production failed, try stored URL if exists (development fallback)
  if (storedUrl) {
    console.log('[Discovery] Production failed, trying stored URL:', storedUrl);
    const storedWorks = await tryBackendUrl(storedUrl);
    if (storedWorks) {
      console.log('[Discovery] Stored URL works:', storedUrl);
      backendUrl = storedUrl;
      return storedUrl;
    }
  }

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
 * With VPS mode, returns a simplified object.
 */
export function getDiscoveredBackend(): BackendService | null {
  return {
    hostname: 'VPS',
    ip: backendUrl,
    port: 443,
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
  // No-op for VPS mode
}
