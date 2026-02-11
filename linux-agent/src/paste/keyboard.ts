import { spawn } from 'child_process';

/**
 * Simulate Ctrl+V keystroke using xdotool (LIN-05, LIN-07)
 * Uses xdotool key command which synthesizes X11 key events
 * --clearmodifiers ensures no residual modifier state
 * @throws Error if xdotool fails
 */
export function simulatePaste(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Use 'key' command with ctrl+v combination
    // --clearmodifiers clears any stuck modifier keys first
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
