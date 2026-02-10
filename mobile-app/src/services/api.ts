import type { ApiResponse, DevicesResponse, QueuedTranscription } from '../types';

/**
 * API client for backend communication.
 * Requires baseUrl to be set before use.
 */
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Update base URL (when backend discovered via mDNS or manual config).
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Get current base URL.
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Send transcription to backend for routing to device.
   * Returns success response or error response per backend contract.
   */
  async sendTranscription(deviceId: string, text: string): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}/transcription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, text }),
    });

    return response.json() as Promise<ApiResponse>;
  }

  /**
   * Send queued transcription item.
   * Convenience wrapper that extracts deviceId and text from queue item.
   * Returns true if successful (success: true in response).
   */
  async sendQueuedItem(item: QueuedTranscription): Promise<boolean> {
    try {
      const response = await this.sendTranscription(item.deviceId, item.text);
      return response.success;
    } catch {
      // Network error or timeout
      return false;
    }
  }

  /**
   * Fetch list of connected devices from backend.
   * Returns array of hostnames.
   * Throws on network error or server error.
   */
  async getDevices(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/devices`);
    const data = await response.json() as DevicesResponse;

    if (data.success) {
      return data.devices;
    }

    throw new Error('Failed to fetch devices');
  }

  /**
   * Check if backend is reachable.
   * Uses /health endpoint.
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Create AbortController with manual timeout for Android WebView compatibility
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Singleton instance - baseUrl set when backend discovered
let apiInstance: ApiClient | null = null;

/**
 * Get or create API client instance.
 * Must call initApiClient first with valid URL.
 */
export function getApiClient(): ApiClient {
  if (!apiInstance) {
    throw new Error('API client not initialized. Call initApiClient first.');
  }
  return apiInstance;
}

/**
 * Initialize API client with backend URL.
 * Called when backend discovered via mDNS or manual config.
 */
export function initApiClient(baseUrl: string): ApiClient {
  apiInstance = new ApiClient(baseUrl);
  return apiInstance;
}

/**
 * Check if API client is initialized.
 */
export function isApiClientInitialized(): boolean {
  return apiInstance !== null;
}
