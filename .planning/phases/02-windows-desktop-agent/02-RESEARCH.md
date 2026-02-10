# Phase 2: Windows Desktop Agent - Research

**Researched:** 2026-02-07
**Domain:** Node.js Desktop Automation (Windows), WebSocket Client, Clipboard Management
**Confidence:** HIGH

## Summary

Phase 2 builds a Windows desktop agent that connects to the backend via WebSocket, receives transcribed text, and auto-pastes it at the current cursor position. The agent must handle connection resilience (exponential backoff reconnection, heartbeat pong responses) and graceful fallback (clipboard-only if paste fails).

The standard approach uses:
- **clipboardy** (v5.2.1) for clipboard read/write - mature, cross-platform, no native compilation required
- **@nut-tree/nut-js** for keyboard automation (Ctrl+V paste simulation) - actively maintained, pre-built binaries, cross-platform
- **ws** library for WebSocket client (same as backend uses) with manual reconnection logic or **reconnecting-websocket** wrapper
- **os.hostname()** for device identification - built into Node.js

The backend (Phase 1) already implements:
- WebSocket server at `/ws` endpoint
- Protocol-level ping every 30s, expects pong response
- Disconnect after 2 missed pongs
- Message format: `{ type: 'transcription', id: string, text: string, timestamp: number }`
- ACK protocol: agent sends `{ type: 'ack', id: string }` after processing
- Server normalizes deviceId to lowercase

**Primary recommendation:** Use clipboardy + nut.js with ws library and custom reconnection logic matching backend's heartbeat expectations. Structure the agent as a clean TypeScript project mirroring backend patterns.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| clipboardy | 5.2.1 | Clipboard read/write | 4.2M weekly downloads, cross-platform, no native deps |
| @nut-tree/nut-js | 4.x | Keyboard automation (Ctrl+V) | Actively maintained, pre-built binaries, cross-platform |
| ws | 8.x | WebSocket client | Same library backend uses, lightweight, no overhead |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| reconnecting-websocket | 4.x | Auto-reconnection wrapper | Optional - can use manual reconnection instead |
| pino | 9.x | Structured logging | Match backend logging patterns |
| pino-pretty | 13.x | Dev-friendly log output | Development only |
| tsx | 4.x | TypeScript execution | Development only |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| clipboardy | copy-paste (npm) | copy-paste spawns processes; clipboardy uses PowerShell cmdlets directly on Windows |
| nut.js | robotjs | robotjs unmaintained since 2018, nut.js actively developed |
| ws | socket.io-client | socket.io adds overhead, backend uses raw WebSocket |
| manual reconnection | reconnecting-websocket | Extra dependency, but provides tested exponential backoff |

**Installation:**
```bash
npm install clipboardy @nut-tree/nut-js ws pino
npm install -D typescript @types/node @types/ws tsx pino-pretty
```

**Windows Prerequisite:**
- Microsoft Visual C++ Redistributable (usually pre-installed on modern Windows)
- Node.js 18 or 20 LTS (matches backend)

## Architecture Patterns

### Recommended Project Structure
```
windows-agent/
  src/
    index.ts            # Entry point, starts agent
    agent/
      connection.ts     # WebSocket connection management
      reconnect.ts      # Exponential backoff logic
    paste/
      clipboard.ts      # Clipboard operations
      keyboard.ts       # Keyboard automation (Ctrl+V)
      paste.ts          # Orchestrates clipboard + paste flow
    config.ts           # Configuration (server URL, delays)
    types.ts            # Shared types (reuse from backend if possible)
  package.json
  tsconfig.json
```

### Pattern 1: WebSocket Connection with Heartbeat Response

**What:** Agent maintains WebSocket connection, responds to protocol-level pings with pongs (automatic in ws library), and detects connection loss.

**When to use:** Always - matches backend heartbeat expectations.

**Example:**
```typescript
// Source: ws library + backend heartbeat.ts analysis
import WebSocket from 'ws';

class AgentConnection {
  private ws: WebSocket | null = null;
  private heartbeatTimeout: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // Match backend
  private readonly HEARTBEAT_TIMEOUT = 35000; // Allow slight delay

  connect(url: string, deviceId: string): void {
    this.ws = new WebSocket(url);

    this.ws.on('open', () => {
      // Register with backend
      this.ws!.send(JSON.stringify({ type: 'register', deviceId }));
      this.resetHeartbeatTimeout();
    });

    // Pong is automatically sent by ws library in response to ping
    this.ws.on('ping', () => {
      // Reset our heartbeat timeout - connection is alive
      this.resetHeartbeatTimeout();
    });

    this.ws.on('message', (data) => {
      this.handleMessage(JSON.parse(data.toString()));
    });

    this.ws.on('close', () => {
      this.scheduleReconnect();
    });
  }

  private resetHeartbeatTimeout(): void {
    if (this.heartbeatTimeout) clearTimeout(this.heartbeatTimeout);
    this.heartbeatTimeout = setTimeout(() => {
      // No ping received - assume connection dead
      this.ws?.terminate();
      this.scheduleReconnect();
    }, this.HEARTBEAT_TIMEOUT);
  }
}
```

### Pattern 2: Exponential Backoff Reconnection

**What:** Reconnection delays grow exponentially (1s, 2s, 4s, 8s, 16s, 30s max) with jitter.

**When to use:** Always - prevents thundering herd, matches requirement RES-04.

**Example:**
```typescript
// Source: reconnecting-websocket API + requirements
class ReconnectionManager {
  private attempt = 0;
  private readonly MIN_DELAY = 1000;    // 1s
  private readonly MAX_DELAY = 30000;   // 30s per requirements
  private readonly FACTOR = 2;

  getNextDelay(): number {
    const delay = Math.min(
      this.MIN_DELAY * Math.pow(this.FACTOR, this.attempt),
      this.MAX_DELAY
    );
    // Add jitter (10-20% random variance)
    const jitter = delay * (0.1 + Math.random() * 0.1);
    this.attempt++;
    return delay + jitter;
  }

  reset(): void {
    this.attempt = 0;
  }
}
```

### Pattern 3: Clipboard-Then-Paste with Verification

**What:** Write to clipboard, verify write succeeded, then simulate Ctrl+V.

**When to use:** Always - matches requirements WIN-04 through WIN-08.

**Example:**
```typescript
// Source: clipboardy npm docs + nut.js API docs
import clipboard from 'clipboardy';
import { keyboard, Key } from '@nut-tree/nut-js';

async function pasteText(text: string): Promise<boolean> {
  // WIN-04: Write to clipboard
  await clipboard.write(text);

  // WIN-07: Verify clipboard content
  const verified = await clipboard.read();
  if (verified !== text) {
    // WIN-08: Retry if verification fails
    await clipboard.write(text);
    const retry = await clipboard.read();
    if (retry !== text) {
      // DEL-04: Fall back to clipboard-only
      console.warn('Clipboard verification failed, text in clipboard for manual paste');
      return false;
    }
  }

  // WIN-06: Add delay between clipboard write and paste (50-100ms)
  await new Promise(resolve => setTimeout(resolve, 75));

  // WIN-05: Simulate Ctrl+V
  try {
    await keyboard.pressKey(Key.LeftControl, Key.V);
    await keyboard.releaseKey(Key.LeftControl, Key.V);
    return true;
  } catch (error) {
    // DEL-04: Paste failed, text remains in clipboard
    console.error('Paste simulation failed:', error);
    return false;
  }
}
```

### Anti-Patterns to Avoid

- **Synchronous clipboard operations in message handler:** Block the event loop. Always use async clipboard.write/read.
- **Not releasing modifier keys:** nut.js can leave Ctrl held if releaseKey not called. Always release explicitly.
- **Reconnecting immediately on close:** Causes server overload. Always use exponential backoff.
- **Ignoring heartbeat timeout:** Silently dead connections. Always implement client-side timeout detection.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Clipboard access | Child process + clip.exe | clipboardy | Handles PowerShell fallback, async API, tested |
| Keyboard automation | SendInput API bindings | nut.js | Pre-built binaries, tested, cross-platform |
| Hostname detection | Environment variable parsing | os.hostname() | Built-in, cross-platform, reliable |
| WebSocket reconnection | setTimeout chains | Structured reconnect manager | Exponential backoff, jitter, state management |

**Key insight:** Desktop automation involves native APIs that are tricky to get right. Libraries handle edge cases (keyboard modifier key state, clipboard format negotiation, encoding) that would take significant effort to implement correctly.

## Common Pitfalls

### Pitfall 1: Modifier Key Sticking

**What goes wrong:** After simulating Ctrl+V, the Ctrl key remains "held" causing subsequent user keyboard input to trigger shortcuts unexpectedly.

**Why it happens:** nut.js pressKey holds keys until releaseKey is called. If an error occurs between press and release, or release is forgotten, the key stays held.

**How to avoid:**
```typescript
// Always wrap in try-finally to ensure release
try {
  await keyboard.pressKey(Key.LeftControl, Key.V);
} finally {
  await keyboard.releaseKey(Key.LeftControl, Key.V);
}
```

**Warning signs:** User reports "Ctrl key stuck", unexpected shortcuts triggered.

### Pitfall 2: Clipboard Race Condition

**What goes wrong:** User copies something just as agent writes to clipboard, or paste happens before clipboard write completes.

**Why it happens:** Clipboard is shared system resource. Async operations can interleave.

**How to avoid:**
1. Use async clipboard.write() and await it
2. Add delay before paste (WIN-06: 50-100ms)
3. Verify clipboard content before pasting (WIN-07)

**Warning signs:** Wrong text pasted, partial text, user's clipboard content overwritten unexpectedly.

### Pitfall 3: Silent WebSocket Disconnection

**What goes wrong:** Connection appears open but is actually dead. Messages never arrive.

**Why it happens:** Network intermediaries (NAT, firewalls, proxies) can kill connections without proper TCP close.

**How to avoid:**
1. Respond to server pings (ws library does this automatically)
2. Implement client-side heartbeat timeout - if no ping received in 35s, assume dead
3. Call ws.terminate() (not close()) for hard reset

**Warning signs:** Agent appears online in backend but messages don't arrive.

### Pitfall 4: Reconnection Thundering Herd

**What goes wrong:** Server restarts, all agents reconnect at once, overwhelming the server.

**Why it happens:** All agents use same reconnection delay without jitter.

**How to avoid:**
1. Add random jitter (10-20%) to backoff delays
2. Use exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s max

**Warning signs:** Server CPU spikes after restart, connection rejections.

### Pitfall 5: Paste Fails in Certain Applications

**What goes wrong:** Ctrl+V doesn't work in some applications (admin apps, games, remote desktop).

**Why it happens:** Some apps don't accept simulated input, or require elevated privileges.

**How to avoid:**
1. This is expected behavior - document limitation
2. DEL-04: Fall back to clipboard-only mode
3. Log paste failures for debugging (DEL-05)

**Warning signs:** User reports paste not working in specific apps.

## Code Examples

Verified patterns from official sources:

### Hostname-based Device Registration

```typescript
// Source: Node.js os module docs
import os from 'os';

function getDeviceId(): string {
  // WIN-02: Register with hostname-based deviceId
  // Backend normalizes to lowercase, but send as-is
  return os.hostname();
}
```

### ACK Response After Processing

```typescript
// Source: Backend messages.ts analysis
interface TranscriptionMessage {
  type: 'transcription';
  id: string;
  text: string;
  timestamp: number;
}

interface AckMessage {
  type: 'ack';
  id: string;
}

async function handleMessage(ws: WebSocket, msg: TranscriptionMessage): Promise<void> {
  // Process the message
  const success = await pasteText(msg.text);

  // DEL-05: Log paste event
  console.log(`Paste ${success ? 'succeeded' : 'failed'}: ${msg.id}`);

  // Send ACK after processing (not before)
  const ack: AckMessage = { type: 'ack', id: msg.id };
  ws.send(JSON.stringify(ack));
}
```

### Complete Paste Flow

```typescript
// Source: Synthesized from requirements + library docs
import clipboard from 'clipboardy';
import { keyboard, Key } from '@nut-tree/nut-js';

const PASTE_DELAY_MS = 75; // WIN-06: 50-100ms
const MAX_RETRIES = 1;     // WIN-08: Retry once

async function pasteText(text: string): Promise<{ success: boolean; method: 'paste' | 'clipboard-only' }> {
  // Step 1: Write to clipboard (WIN-04)
  let verified = false;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    await clipboard.write(text);

    // Step 2: Verify (WIN-07)
    const content = await clipboard.read();
    if (content === text) {
      verified = true;
      break;
    }
    // WIN-08: Retry if verification fails
  }

  if (!verified) {
    // DEL-04: Fall back to clipboard-only
    return { success: false, method: 'clipboard-only' };
  }

  // Step 3: Delay before paste (WIN-06)
  await new Promise(r => setTimeout(r, PASTE_DELAY_MS));

  // Step 4: Simulate Ctrl+V (WIN-05)
  try {
    await keyboard.pressKey(Key.LeftControl, Key.V);
    await keyboard.releaseKey(Key.LeftControl, Key.V);
    return { success: true, method: 'paste' };
  } catch (error) {
    // DEL-04: Paste failed, fall back to clipboard-only
    return { success: false, method: 'clipboard-only' };
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| robotjs for automation | nut.js | 2020+ | robotjs unmaintained, nut.js actively developed |
| node-copy-paste | clipboardy | 2018+ | clipboardy more reliable, better Windows support |
| Socket.IO client | raw ws | N/A | For simple messaging, ws sufficient and lighter |

**Deprecated/outdated:**
- **robotjs:** No releases since 2018, use nut.js instead
- **clipboard (npm):** Browser-focused, use clipboardy for Node.js

## Integration with Phase 1 Backend

The agent must integrate with the existing backend:

### Message Protocol

```typescript
// Messages from server (receive)
type ServerMessage =
  | { type: 'transcription'; id: string; text: string; timestamp: number };

// Messages to server (send)
type AgentMessage =
  | { type: 'register'; deviceId: string }
  | { type: 'ack'; id: string };
```

### Connection Flow

1. Connect to `ws://[server]:3000/ws`
2. Send registration: `{ type: 'register', deviceId: os.hostname() }`
3. Server may reject with code 4000 (DUPLICATE_CONNECTION) - handle gracefully
4. Receive transcription messages
5. For each message: paste text, then send ACK
6. Respond to pings automatically (ws library handles this)
7. If no ping received in ~35s, assume connection dead and reconnect

### Backend Expectations

- Heartbeat ping every 30s
- Agent must respond with pong (automatic in ws)
- 2 missed pongs = server terminates connection
- ACK expected within 5s of transcription message
- deviceId normalized to lowercase

## Open Questions

Things that couldn't be fully resolved:

1. **nut.js registry subscription**
   - What we know: Pre-built binaries require nutjs.dev registry subscription
   - What's unclear: Whether free tier exists or if building from source is required
   - Recommendation: Try `npm i @nut-tree/nut-js@next` for snapshot builds, or use pre-built if subscription available

2. **Paste behavior in elevated apps**
   - What we know: Some apps (admin consoles, games) may reject simulated input
   - What's unclear: Exact list of incompatible apps
   - Recommendation: Document as known limitation, ensure clipboard-only fallback works

3. **Unicode text handling**
   - What we know: nut.js 4.5.0 added Unicode support in core
   - What's unclear: Whether Spanish characters (accents, n-tilde) work reliably
   - Recommendation: Test with Spanish text early; clipboardy handles Unicode well

## Sources

### Primary (HIGH confidence)
- [clipboardy npm](https://www.npmjs.com/package/clipboardy) - API methods, Windows behavior
- [nut.js official docs](https://nutjs.dev/docs/keyboard) - Keyboard API
- [nut.js keyboard API](https://nutjs.dev/api/keyboard) - pressKey/releaseKey usage
- [nut.js GitHub](https://github.com/nut-tree/nut.js) - Installation, Windows requirements
- [reconnecting-websocket GitHub](https://github.com/pladaria/reconnecting-websocket) - Exponential backoff options
- [Node.js os.hostname()](https://nodejs.org/api/os.html) - Built-in hostname

### Secondary (MEDIUM confidence)
- Backend code analysis (Phase 1) - Message protocol, heartbeat timing
- [ws library wiki](https://github.com/websockets/ws) - Ping/pong automatic handling

### Tertiary (LOW confidence)
- WebSearch results on keyboard automation pitfalls - Community experiences with modifier key issues

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Libraries well-documented, widely used
- Architecture: HIGH - Patterns derived from official docs and backend analysis
- Pitfalls: MEDIUM - Some from community sources, core ones verified

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (30 days - stable domain)
