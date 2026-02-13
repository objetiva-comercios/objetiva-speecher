import robot from '@jitsi/robotjs';
import type { KeyAction } from '../types.js';

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

/**
 * Execute a key action (Enter or Tab)
 * Uses robotjs keyTap for atomic key press/release
 * @param key - The key action to execute ('enter' or 'tab')
 */
export function executeKeyAction(key: KeyAction): void {
  // robotjs uses lowercase key names: 'enter', 'tab'
  // These match our KeyAction type directly
  robot.keyTap(key);
}
