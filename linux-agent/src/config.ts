// Default backend URL - can be overridden via SPEECHER_SERVER_URL env var
// For local development: ws://localhost:3000/ws
const DEFAULT_BACKEND_URL = 'wss://speecher.objetiva.com.ar/ws';

export const config = {
  // Backend connection
  BACKEND_URL: process.env.SPEECHER_SERVER_URL || DEFAULT_BACKEND_URL,

  // Reconnection (RES-04)
  RECONNECT_MIN_DELAY: 1000,      // 1s initial
  RECONNECT_MAX_DELAY: 30000,     // 30s max
  RECONNECT_FACTOR: 2,            // Exponential factor
  RECONNECT_JITTER: 0.15,         // 10-20% jitter

  // Heartbeat (RES-05, RES-06)
  HEARTBEAT_TIMEOUT: 35000,       // 35s - allow some slack on 30s server ping

  // Paste timing (WIN-06)
  PASTE_DELAY_MS: 75,             // 75ms per research recommendation

  // Clipboard verification (WIN-07, WIN-08)
  CLIPBOARD_VERIFY_RETRIES: 1,    // Retry once on verification failure
} as const;

export type Config = typeof config;
