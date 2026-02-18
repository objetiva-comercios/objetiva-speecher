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
 * Full paste flow: save clipboard -> write -> verify -> delay -> Ctrl+V -> restore clipboard
 * Preserves user's original clipboard content after pasting
 * Falls back to clipboard-only if paste simulation fails (DEL-04)
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

  // Step 1: Write to clipboard with verification (WIN-04, WIN-07, WIN-08)
  const verified = await writeClipboard(text);

  if (!verified) {
    // Clipboard write or verification failed
    // Try to restore original clipboard
    await restoreClipboard(originalClipboard);
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

    // Step 4: Small delay to ensure paste completes before restoring clipboard
    await delay(100);

    // Step 5: Restore original clipboard content
    await restoreClipboard(originalClipboard);

    return {
      success: true,
      method: 'paste',
    };
  } catch (error) {
    // DEL-04: Paste simulation failed, try to restore clipboard
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
 * @param content - Original clipboard content (null if was empty/non-text)
 */
async function restoreClipboard(content: string | null): Promise<void> {
  if (content !== null) {
    try {
      await clipboard.write(content);
    } catch {
      // Failed to restore - not critical, user just loses original clipboard
    }
  }
  // If content was null (empty/non-text), we don't clear the clipboard
  // as that would be more disruptive than leaving the new text there
}
