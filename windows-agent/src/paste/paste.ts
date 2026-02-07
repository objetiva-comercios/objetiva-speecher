import { writeClipboard } from './clipboard.js';
import { simulatePaste } from './keyboard.js';
import { config } from '../config.js';
import type { PasteResult } from '../types.js';

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Full paste flow: clipboard write -> verify -> delay -> Ctrl+V
 * Falls back to clipboard-only if paste simulation fails (DEL-04)
 *
 * @param text - Text to paste
 * @returns PasteResult with success status and method used
 */
export async function pasteText(text: string): Promise<PasteResult> {
  // Step 1: Write to clipboard with verification (WIN-04, WIN-07, WIN-08)
  const verified = await writeClipboard(text);

  if (!verified) {
    // Clipboard write or verification failed
    // Text may or may not be in clipboard - fallback mode
    return {
      success: false,
      method: 'clipboard-only',
      error: 'Clipboard verification failed after retries',
    };
  }

  // Step 2: Delay before paste (WIN-06)
  await delay(config.PASTE_DELAY_MS);

  // Step 3: Simulate Ctrl+V (WIN-05)
  try {
    simulatePaste();
    return {
      success: true,
      method: 'paste',
    };
  } catch (error) {
    // DEL-04: Paste simulation failed, text remains in clipboard
    return {
      success: false,
      method: 'clipboard-only',
      error: error instanceof Error ? error.message : 'Paste simulation failed',
    };
  }
}
