import { spawn } from 'child_process';
import type { KeyAction } from '../types.js';

/**
 * Mapping from abstract KeyAction to xdotool X11 keysym names.
 * xdotool uses X11 keysym names: Return (not Enter), Tab.
 */
const XDOTOOL_KEYS: Record<KeyAction, string> = {
  enter: 'Return',  // X11 keysym for Enter key
  tab: 'Tab',
};

/**
 * Simulate Ctrl+V keystroke using xdotool (LIN-05, LIN-07)
 * Uses xdotool key command which synthesizes X11 key events
 * --clearmodifiers ensures no residual modifier state
 * @throws Error if xdotool fails
 */
export function simulatePaste(): Promise<void> {
  return new Promise((resolve, reject) => {
    const xdotool = spawn('xdotool', ['key', '--clearmodifiers', 'ctrl+v']);

    let stderr = '';
    xdotool.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    xdotool.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`xdotool failed (code ${code}): ${stderr}`));
      }
    });

    xdotool.on('error', (err) => {
      reject(new Error(`Failed to spawn xdotool: ${err.message}`));
    });
  });
}

/**
 * Execute a key action (Enter or Tab) using xdotool.
 * Uses xdotool key command with --clearmodifiers for reliable execution.
 * @param key - The key action to execute ('enter' or 'tab')
 * @returns Promise that resolves when key press completes
 */
export function executeKeyAction(key: KeyAction): Promise<void> {
  return new Promise((resolve, reject) => {
    const xdotoolKey = XDOTOOL_KEYS[key];

    const xdotool = spawn('xdotool', ['key', '--clearmodifiers', xdotoolKey]);

    let stderr = '';
    xdotool.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    xdotool.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`xdotool key ${xdotoolKey} failed (code ${code}): ${stderr}`));
      }
    });

    xdotool.on('error', (err) => {
      reject(new Error(`Failed to spawn xdotool: ${err.message}`));
    });
  });
}
