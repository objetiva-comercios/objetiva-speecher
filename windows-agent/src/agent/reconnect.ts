import { config } from '../config.js';

/**
 * Manages exponential backoff for reconnection (RES-04)
 * Delay grows: 1s -> 2s -> 4s -> 8s -> 16s -> 30s (max)
 * Adds 10-20% jitter to prevent thundering herd
 */
export class ReconnectionManager {
  private attempt = 0;

  /**
   * Calculate next reconnection delay with jitter
   * @returns Delay in milliseconds
   */
  getNextDelay(): number {
    const baseDelay = Math.min(
      config.RECONNECT_MIN_DELAY * Math.pow(config.RECONNECT_FACTOR, this.attempt),
      config.RECONNECT_MAX_DELAY
    );

    // Add jitter: config.RECONNECT_JITTER centered (e.g., 0.15 = 10-20% variance)
    const jitterRange = config.RECONNECT_JITTER * 2; // e.g., 0.3
    const jitterOffset = config.RECONNECT_JITTER / 2; // e.g., 0.075
    const jitter = (Math.random() * jitterRange - jitterOffset) * baseDelay;

    this.attempt++;
    return Math.round(baseDelay + jitter);
  }

  /**
   * Get current attempt number (for logging)
   */
  getAttempt(): number {
    return this.attempt;
  }

  /**
   * Reset attempt counter on successful connection
   */
  reset(): void {
    this.attempt = 0;
  }
}
