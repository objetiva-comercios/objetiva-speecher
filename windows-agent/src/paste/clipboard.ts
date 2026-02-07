import clipboard from 'clipboardy';
import { config } from '../config.js';

/**
 * Write text to clipboard with verification (WIN-04, WIN-07, WIN-08)
 * Retries once if verification fails
 * @returns true if verified, false if clipboard-only fallback needed
 */
export async function writeClipboard(text: string): Promise<boolean> {
  for (let attempt = 0; attempt <= config.CLIPBOARD_VERIFY_RETRIES; attempt++) {
    await clipboard.write(text);

    // Verify clipboard content
    const content = await clipboard.read();
    if (content === text) {
      return true; // Verified successfully
    }
    // Will retry on next iteration
  }

  // All retries exhausted - text is in clipboard but not verified
  return false;
}

/**
 * Read current clipboard content (for debugging/logging)
 */
export async function readClipboard(): Promise<string> {
  return clipboard.read();
}
