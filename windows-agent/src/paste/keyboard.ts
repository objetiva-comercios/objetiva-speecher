import robot from '@jitsi/robotjs';

/**
 * Simulate Ctrl+V keystroke (WIN-05)
 * Uses robotjs keyTap which handles press and release atomically
 * @throws Error if keyboard simulation fails
 */
export function simulatePaste(): void {
  // keyTap handles both press and release atomically
  // Second parameter is modifier keys array
  robot.keyTap('v', 'control');
}
