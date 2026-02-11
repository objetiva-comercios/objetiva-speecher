import { writeClipboard, readClipboard } from './clipboard.js';
import { simulatePaste } from './keyboard.js';
import { config } from '../config.js';
import type { PasteResult } from '../types.js';
import clipboard from 'clipboardy';

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Full paste flow: save clipboard -> write -> verify -> delay -> Ctrl+V -> restore
 * Preserves user's original clipboard content after pasting
 * Falls back to clipboard-only if paste simulation fails
 *
 * @param text - Text to paste
 * @returns PasteResult with success status and method used
 */
export async function pasteText(text: string): Promise<PasteResult> {
  // Step 0: Save original clipboard content
  let originalClipboard: string | null = null;
  try {
    originalClipboard = await readClipboard();
  } catch {
    // Clipboard might be empty or contain non-text data - that's ok
    originalClipboard = null;
  }

  // Step 1: Write to clipboard with verification (LIN-04)
  const verified = await writeClipboard(text);

  if (!verified) {
    // Clipboard write or verification failed
    await restoreClipboard(originalClipboard);
    return {
      success: false,
      method: 'clipboard-only',
      error: 'Clipboard verification failed after retries',
    };
  }

  // Step 2: Delay before paste
  await delay(config.PASTE_DELAY_MS);

  // Step 3: Simulate Ctrl+V (LIN-05)
  try {
    await simulatePaste(); // Note: async on Linux, unlike Windows

    // Step 4: Small delay to ensure paste completes before restoring clipboard
    await delay(100);

    // Step 5: Restore original clipboard content
    await restoreClipboard(originalClipboard);

    return {
      success: true,
      method: 'paste',
    };
  } catch (error) {
    // Paste simulation failed, try to restore clipboard
    await restoreClipboard(originalClipboard);
    return {
      success: false,
      method: 'clipboard-only',
      error: error instanceof Error ? error.message : 'Paste simulation failed',
    };
  }
}

/**
 * Restore clipboard to original content
 */
async function restoreClipboard(content: string | null): Promise<void> {
  if (content !== null) {
    try {
      await clipboard.write(content);
    } catch {
      // Failed to restore - not critical
    }
  }
}
