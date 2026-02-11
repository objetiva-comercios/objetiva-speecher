# Phase 4: Linux Desktop Agent - Research

**Researched:** 2026-02-11
**Domain:** Linux X11 Desktop Automation (clipboard + keyboard simulation)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Display server support:** X11 only, no Wayland support in this phase. Broad distro compatibility (Ubuntu, Fedora, etc.)
- **Clipboard & paste method:** Use xclip for clipboard operations. Use xdotool for keyboard simulation. Paste via Ctrl+V (standard shortcut). If paste fails, text remains in clipboard for manual paste.
- **Code reuse strategy:** Separate linux-agent/ package parallel to windows-agent/. Copy shared patterns but maintain independent codebase. Identical WebSocket protocol and message format as Windows agent.
- **Distribution format:** Run from source with Node.js (npm start). Manual process (user starts/stops), no systemd service. Server URL via environment variable (SPEECHER_SERVER_URL). Console output for logging (stdout/stderr).

### Claude's Discretion
- X11 detection behavior (fail vs headless mode)
- Startup dependency validation approach
- Reconnection timing (likely same as Windows: 1s-30s backoff)
- Type definition strategy (duplicate vs import)

### Deferred Ideas (OUT OF SCOPE)
None - discussion stayed within phase scope
</user_constraints>

## Summary

This research covers implementing a Linux desktop agent that mirrors the Windows agent's functionality: receiving transcribed text via WebSocket and auto-pasting it at the cursor position. The locked decisions specify using xclip for clipboard operations and xdotool for keyboard simulation (Ctrl+V), targeting X11 only.

The standard approach is straightforward: spawn xclip and xdotool as child processes from Node.js. Both tools are mature, well-documented, and available in all major Linux distributions' package repositories. The critical insight is that clipboard must use `-selection clipboard` (not PRIMARY) for Ctrl+V compatibility, and the DISPLAY environment variable must be set for X11 tools to function.

For Claude's discretion areas, the recommendation is: (1) fail-fast on missing X11/tools rather than headless mode, (2) validate dependencies at startup using `which` or the `command-exists` package, (3) use identical reconnection timing as Windows (1s-30s backoff), and (4) duplicate type definitions for simplicity and independence.

**Primary recommendation:** Mirror the Windows agent architecture exactly, replacing robotjs with xdotool spawned via child_process, and using clipboardy (which handles xclip internally) for clipboard operations.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ws | ^8.0.0 | WebSocket client | Same as Windows agent, well-tested |
| clipboardy | ^5.2.1 | Clipboard operations | Cross-platform, bundles xsel, auto-detects X11 |
| pino | ^9.0.0 | Logging | Same as Windows agent, JSON structured logging |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| command-exists | ^1.2.9 | Check if xdotool installed | Startup validation |
| tsx | ^4.0.0 | Development runner | Development only |
| pino-pretty | ^13.0.0 | Log formatting | Development only |

### System Dependencies (must be installed by user)
| Tool | Package | Purpose | Why Required |
|------|---------|---------|--------------|
| xdotool | xdotool | Keyboard simulation | Simulates Ctrl+V via XTEST extension |
| xclip | xclip | Clipboard backup | Used by clipboardy internally (xsel bundled) |
| X11 | xorg | Display server | Required for both xdotool and clipboard |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| clipboardy | direct xclip spawn | clipboardy handles edge cases, bundles xsel binary |
| xdotool | @jitsi/robotjs | robotjs requires native compilation on Linux, xdotool is simpler shell spawn |
| command-exists | execSync('which X') | command-exists handles edge cases, cross-platform |

**Installation:**
```bash
# Node.js dependencies
npm install ws clipboardy pino command-exists

# System dependencies (user must install)
# Ubuntu/Debian:
sudo apt-get install xdotool xclip

# Fedora:
sudo dnf install xdotool xclip

# Arch:
sudo pacman -S xdotool xclip
```

## Architecture Patterns

### Recommended Project Structure
```
linux-agent/
├── src/
│   ├── index.ts           # Entry point, graceful shutdown
│   ├── config.ts          # Configuration constants (env vars)
│   ├── types.ts           # TypeScript types (duplicated from windows-agent)
│   ├── agent/
│   │   ├── connection.ts  # WebSocket connection handler
│   │   └── reconnect.ts   # Exponential backoff manager
│   └── paste/
│       ├── paste.ts       # Orchestrates clipboard + keyboard
│       ├── clipboard.ts   # clipboardy wrapper with verification
│       └── keyboard.ts    # xdotool spawn wrapper
├── package.json
└── tsconfig.json
```

### Pattern 1: Child Process Spawn for xdotool
**What:** Use Node.js child_process.spawn() to invoke xdotool for keyboard simulation
**When to use:** Always for xdotool calls - provides async execution and proper error handling
**Example:**
```typescript
// Source: Node.js child_process documentation + xdotool man page
import { spawn } from 'child_process';

export function simulatePaste(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Use key command with ctrl+v combination
    // --clearmodifiers ensures no residual modifier state
    const xdotool = spawn('xdotool', ['key', '--clearmodifiers', 'ctrl+v']);

    xdotool.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`xdotool exited with code ${code}`));
      }
    });

    xdotool.on('error', (err) => {
      reject(new Error(`Failed to spawn xdotool: ${err.message}`));
    });
  });
}
```

### Pattern 2: Startup Dependency Validation
**What:** Verify X11 display and required tools exist before starting agent
**When to use:** At application startup, fail fast if requirements not met
**Example:**
```typescript
// Source: command-exists npm package + X11 DISPLAY convention
import commandExists from 'command-exists';

export async function validateDependencies(): Promise<void> {
  // Check DISPLAY environment variable
  if (!process.env.DISPLAY) {
    throw new Error('DISPLAY environment variable not set. X11 required.');
  }

  // Check xdotool is installed
  try {
    await commandExists('xdotool');
  } catch {
    throw new Error('xdotool not found. Install: sudo apt-get install xdotool');
  }

  // clipboardy bundles xsel, but verify X11 clipboard works
  // by attempting a read (will fail if no X11)
}
```

### Pattern 3: Clipboard Selection Type
**What:** Always use CLIPBOARD selection (not PRIMARY) for Ctrl+V compatibility
**When to use:** All clipboard operations
**Example:**
```typescript
// Source: X11 selection documentation
// clipboardy automatically uses CLIPBOARD selection, which is correct.
// If using xclip directly:
// xclip -selection clipboard  (for Ctrl+V paste)
// xclip -selection primary    (for middle-click paste - DON'T USE)
```

### Anti-Patterns to Avoid
- **Using PRIMARY selection:** PRIMARY is for middle-click paste, not Ctrl+V. Always use CLIPBOARD selection.
- **Forgetting --clearmodifiers:** xdotool may capture residual modifier keys. Always use --clearmodifiers flag.
- **Blocking main loop with execSync:** Use async spawn for xdotool to avoid blocking WebSocket handling.
- **Targeting specific windows with --window:** XSendEvent is less reliable than XTEST. Let xdotool target active window.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Clipboard access | Raw xclip spawn | clipboardy | Handles X11/Wayland detection, bundles xsel, error handling |
| Command existence check | execSync('which X') | command-exists | Cross-platform, handles edge cases |
| WebSocket with reconnect | Custom ws wrapper | Existing reconnect pattern | Copy from windows-agent, proven |
| JSON logging | console.log | pino | Structured, performant, same as Windows |

**Key insight:** The Windows agent already solved WebSocket connection, reconnection, heartbeat, and paste orchestration patterns. Copy these patterns directly; only the paste/keyboard.ts implementation changes (robotjs -> xdotool spawn).

## Common Pitfalls

### Pitfall 1: Missing DISPLAY Environment Variable
**What goes wrong:** xdotool and clipboard tools silently fail or error with "Cannot open display"
**Why it happens:** X11 tools require DISPLAY to know which X server to connect to
**How to avoid:** Check process.env.DISPLAY at startup, fail with clear error message
**Warning signs:** "Error: Can't open display" or operations returning success but having no effect

### Pitfall 2: Wrong Clipboard Selection
**What goes wrong:** Text is copied but Ctrl+V doesn't paste it
**Why it happens:** Using PRIMARY selection instead of CLIPBOARD selection
**How to avoid:** Always use `-selection clipboard` with xclip, or use clipboardy (defaults correctly)
**Warning signs:** Middle-click pastes the text but Ctrl+V doesn't

### Pitfall 3: Race Condition in Paste Flow
**What goes wrong:** Original clipboard restored before paste completes
**Why it happens:** Clipboard restore fires too quickly after keystroke simulation
**How to avoid:** Add delay (100ms+) between keystroke and clipboard restore, same as Windows agent
**Warning signs:** Target field briefly shows text then reverts

### Pitfall 4: xdotool Synthetic Events Rejected
**What goes wrong:** Some applications ignore the simulated keystrokes
**Why it happens:** X11 marks synthetic events with a flag; some apps reject these for security
**How to avoid:** Let xdotool use XTEST (don't use --window flag). Most apps accept XTEST events.
**Warning signs:** Paste works in most apps but fails in specific ones (Alacritty terminal known issue)

### Pitfall 5: Missing xdotool Package
**What goes wrong:** Agent crashes on first paste attempt
**Why it happens:** xdotool is not installed by default on most distros
**How to avoid:** Validate at startup with command-exists, provide clear installation instructions
**Warning signs:** "spawn xdotool ENOENT" error

### Pitfall 6: Modifier Key State
**What goes wrong:** Paste sends wrong key combination or extra modifiers
**Why it happens:** User may be holding a modifier key during paste
**How to avoid:** Use `--clearmodifiers` flag with xdotool key command
**Warning signs:** Inconsistent paste behavior, sometimes works sometimes doesn't

## Code Examples

Verified patterns from official sources:

### xdotool Keyboard Simulation
```typescript
// Source: xdotool man page (https://man.archlinux.org/man/xdotool.1.en)
import { spawn } from 'child_process';

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
```

### Clipboard Operations with clipboardy
```typescript
// Source: clipboardy npm package (https://github.com/sindresorhus/clipboardy)
import clipboard from 'clipboardy';

// Write to clipboard (uses CLIPBOARD selection on X11)
export async function writeClipboard(text: string): Promise<boolean> {
  await clipboard.write(text);

  // Verify clipboard content
  const content = await clipboard.read();
  return content === text;
}

// Read clipboard
export async function readClipboard(): Promise<string> {
  return clipboard.read();
}
```

### Dependency Validation
```typescript
// Source: command-exists npm package
import commandExists from 'command-exists';

export async function validateEnvironment(): Promise<void> {
  // Check X11 display
  const display = process.env.DISPLAY;
  if (!display) {
    throw new Error(
      'No X11 display detected. Set DISPLAY environment variable.\n' +
      'Example: DISPLAY=:0 npm start'
    );
  }

  // Check xdotool
  try {
    await commandExists('xdotool');
  } catch {
    throw new Error(
      'xdotool not found. Install it first:\n' +
      '  Ubuntu/Debian: sudo apt-get install xdotool\n' +
      '  Fedora: sudo dnf install xdotool\n' +
      '  Arch: sudo pacman -S xdotool'
    );
  }

  // Verify clipboard access (will throw if X11 not working)
  try {
    await clipboard.read();
  } catch (err) {
    throw new Error(
      `Clipboard access failed. Ensure X11 is running.\n` +
      `Error: ${err instanceof Error ? err.message : 'Unknown'}`
    );
  }
}
```

### Full Paste Flow (mirrors Windows agent)
```typescript
// Source: Adapted from windows-agent/src/paste/paste.ts
import { writeClipboard, readClipboard } from './clipboard.js';
import { simulatePaste } from './keyboard.js';
import { config } from '../config.js';
import type { PasteResult } from '../types.js';

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function pasteText(text: string): Promise<PasteResult> {
  // Step 0: Save original clipboard
  let originalClipboard: string | null = null;
  try {
    originalClipboard = await readClipboard();
  } catch {
    originalClipboard = null;
  }

  // Step 1: Write to clipboard with verification
  const verified = await writeClipboard(text);
  if (!verified) {
    await restoreClipboard(originalClipboard);
    return {
      success: false,
      method: 'clipboard-only',
      error: 'Clipboard verification failed',
    };
  }

  // Step 2: Delay before paste
  await delay(config.PASTE_DELAY_MS);

  // Step 3: Simulate Ctrl+V
  try {
    await simulatePaste();

    // Step 4: Delay for paste to complete
    await delay(100);

    // Step 5: Restore clipboard
    await restoreClipboard(originalClipboard);

    return { success: true, method: 'paste' };
  } catch (error) {
    await restoreClipboard(originalClipboard);
    return {
      success: false,
      method: 'clipboard-only',
      error: error instanceof Error ? error.message : 'Paste simulation failed',
    };
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| xsel only | clipboardy (bundles xsel) | 2023+ | No external xsel dependency needed |
| Manual X11 detection | clipboardy auto-detects | Current | Handles Wayland fallback automatically |
| robotjs for all platforms | xdotool on Linux | N/A | Simpler, no native compilation |

**Deprecated/outdated:**
- xdotool `type` command for pasting: Use `key ctrl+v` instead for proper clipboard paste behavior
- Wayland xdotool usage: xdotool only works on X11, fails silently on Wayland

## Claude's Discretion Recommendations

### X11 Detection Behavior
**Recommendation:** Fail fast with clear error message
**Rationale:** Headless mode is pointless for a desktop paste agent. If X11 isn't available, the agent cannot function. A clear error message helps users diagnose the issue.

### Startup Dependency Validation
**Recommendation:** Validate all dependencies at startup before WebSocket connection
**Order:**
1. Check DISPLAY environment variable
2. Check xdotool exists (command-exists)
3. Test clipboard read (validates X11 connection)
**Rationale:** Fail fast with actionable error messages rather than failing on first paste.

### Reconnection Timing
**Recommendation:** Use identical timing as Windows agent
- Initial delay: 1s
- Max delay: 30s
- Factor: 2x (exponential)
- Jitter: 10-20%
**Rationale:** Protocol is identical, server expectations are identical. No reason to differ.

### Type Definition Strategy
**Recommendation:** Duplicate types in linux-agent/src/types.ts
**Rationale:**
- Types are small (~25 lines)
- Maintains complete independence between agents
- Avoids cross-package imports and build complexity
- Easier to modify if agents diverge in future

## Open Questions

Things that couldn't be fully resolved:

1. **xdotool timing sensitivity**
   - What we know: 75ms delay works on Windows with robotjs
   - What's unclear: If xdotool needs different timing
   - Recommendation: Start with same 75ms, adjust if issues arise during testing

2. **Alacritty terminal compatibility**
   - What we know: Alacritty explicitly rejects synthetic events
   - What's unclear: How widespread this issue is
   - Recommendation: Document known incompatible applications, not a blocker

## Sources

### Primary (HIGH confidence)
- [xdotool man page](https://man.archlinux.org/man/xdotool.1.en) - key command, --clearmodifiers, XTEST vs XSendEvent
- [xclip GitHub](https://github.com/astrand/xclip) - selection types (PRIMARY vs CLIPBOARD)
- [clipboardy GitHub](https://github.com/sindresorhus/clipboardy) - API, Linux support, xsel bundling
- [Node.js child_process docs](https://nodejs.org/api/child_process.html) - spawn() usage
- Windows agent source code - Architecture patterns to mirror

### Secondary (MEDIUM confidence)
- [command-exists npm](https://www.npmjs.com/package/command-exists) - API for checking command existence
- [X11 DISPLAY documentation](https://www.baeldung.com/linux/no-x11-display-error) - Environment variable format
- [xdotool GitHub](https://github.com/jordansissel/xdotool) - Wayland limitations

### Tertiary (LOW confidence)
- [OpenWhispr issue #240](https://github.com/OpenWhispr/openwhispr/issues/240) - Race condition timing (200ms too fast)
- [Linux.org xdotool forums](https://www.linux.org/threads/xdotool-keyboard.10528/) - User experiences

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Uses well-known, documented tools (xdotool, clipboardy)
- Architecture: HIGH - Direct mirror of proven Windows agent pattern
- Pitfalls: MEDIUM - Some based on documented issues, some on community reports

**Research date:** 2026-02-11
**Valid until:** 90 days (stable tools, X11 is mature technology)
