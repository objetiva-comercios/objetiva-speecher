import commandExists from 'command-exists';
import clipboard from 'clipboardy';

/**
 * Validate that all required dependencies for the Linux agent are available.
 * This should be called at startup before attempting to connect to the backend.
 *
 * Checks:
 * 1. DISPLAY environment variable is set (X11 required)
 * 2. xdotool is installed (for keyboard simulation)
 * 3. X11 clipboard is accessible (via clipboardy)
 *
 * @throws Error with descriptive message if any dependency is missing
 */
export async function validateDependencies(): Promise<void> {
  // Check DISPLAY environment variable (X11 required)
  if (!process.env.DISPLAY) {
    throw new Error(
      'DISPLAY environment variable not set. X11 is required for the Linux agent.\n' +
      'Make sure you are running in a graphical X11 session.'
    );
  }

  // Check xdotool is installed
  try {
    await commandExists('xdotool');
  } catch {
    throw new Error(
      'xdotool not found. Install it using your package manager:\n' +
      '  Ubuntu/Debian: sudo apt-get install xdotool\n' +
      '  Fedora/RHEL:   sudo dnf install xdotool\n' +
      '  Arch Linux:    sudo pacman -S xdotool'
    );
  }

  // Verify X11 clipboard works by attempting a read
  try {
    await clipboard.read();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `X11 clipboard access failed: ${message}\n` +
      'Make sure you are running in a graphical X11 session with clipboard support.'
    );
  }
}
