import type { BackendService } from '../types';
import { getItem, setItem, STORAGE_KEYS } from './storage';

// Production backend URL
const PRODUCTION_BACKEND_URL = 'https://speecher.objetiva.com.ar';

// For development, can override via stored URL
let backendUrl: string = PRODUCTION_BACKEND_URL;

/**
 * Try to reach a backend at given URL.
 * Returns true if backend responds with valid Speecher health response.
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

    if (!response.ok) return false;

    // Verify it's actually a Speecher backend by checking response format
    const data = await response.json();
    console.log('[Discovery] Health response from', url, ':', JSON.stringify(data));
    return data && data.status === 'ok';
  } catch (err) {
    console.log('[Discovery] Failed to reach', url, ':', err);
    return false;
  }
}

/**
 * Initialize discovery service.
 * Priority: stored URL (development) > production URL
 * This allows development override to take precedence.
 */
export async function initializeDiscovery(): Promise<string | null> {
  console.log('[Discovery] Initializing...');

  // Check if there's a stored override URL (for development)
  const storedUrl = await getItem(STORAGE_KEYS.BACKEND_URL);

  // Try stored URL first (development takes priority)
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

  // Try production URL
  console.log('[Discovery] Checking production URL:', PRODUCTION_BACKEND_URL);
  const productionWorks = await tryBackendUrl(PRODUCTION_BACKEND_URL);

  if (productionWorks) {
    console.log('[Discovery] Production backend reachable');
    backendUrl = PRODUCTION_BACKEND_URL;
    return PRODUCTION_BACKEND_URL;
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
