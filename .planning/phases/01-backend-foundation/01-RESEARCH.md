# Phase 1: Backend Foundation - Research

**Researched:** 2026-02-07
**Domain:** HTTP/WebSocket server with Node.js, Fastify, and connection management
**Confidence:** HIGH

## Summary

This phase implements the communication backbone for the Objetiva Speecher system: an HTTP/WebSocket server that routes transcriptions from mobile devices to desktop agents. The stack is well-defined by project constraints (Node.js + Fastify) and user decisions from the discussion phase.

The standard approach uses `@fastify/websocket` (built on `ws@8`) for WebSocket support, with Fastify's native Pino integration for structured JSON logging. The architecture follows Fastify's plugin-based structure with clear separation between HTTP routes, WebSocket handlers, and connection registry management.

**Primary recommendation:** Use Fastify with `@fastify/websocket` plugin, implement a Map-based connection registry with hostname keys, use protocol-level ping/pong for heartbeat, and simple in-memory arrays for message queuing.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**API design & responses:**
- Request/Response format: JSON only for both requests and responses
- Offline agent handling: Accept & queue message (HTTP 200) - backend holds messages and delivers when agent reconnects
- Status codes: Simple 200/500 only - 200 for all successful accepts, 500 for server errors, details in response body
- Queue limits: Max 50 messages per device OR 24-hour TTL - older/excess messages dropped

**Connection management:**
- Agent identification: Hostname as deviceId - agents use machine hostname (e.g., 'DESKTOP-ABC123') as unique identifier
- Heartbeat interval: 30 seconds - ping every 30s, disconnect after 2 missed pongs
- Disconnect handling: Remove immediately from registry - agent disappears from /devices list instantly on disconnect
- Duplicate connections: Reject new connection - only one connection per hostname allowed at a time

**Routing logic:**
- Message delivery confirmation: Wait for ACK from desktop agent before responding to POST /transcription request
- Queued message delivery: Immediate burst - send all queued messages as fast as possible on reconnection
- Message ordering: Strict ordering - messages delivered in exact order received, even if it means blocking

**Error handling & resilience:**
- Error detail level: Detailed errors - specific error codes/messages (e.g., 'QUEUE_FULL', 'INVALID_DEVICE_ID') for client handling
- Logging: Structured JSON logs - machine-readable logs with timestamps, severity, deviceId, error codes
- Persistence: In-memory only - connection registry and queued messages lost on backend restart (agents reconnect and rebuild state)
- Rate limiting: No rate limiting - trust clients, keep it simple for MVP

### Claude's Discretion

- deviceId matching strategy (exact vs fuzzy hostname matching)
- Exact error code taxonomy and naming
- WebSocket message protocol details
- HTTP endpoint path structure

### Deferred Ideas (OUT OF SCOPE)

None - discussion stayed within phase scope
</user_constraints>

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| fastify | ^5.x | HTTP server framework | Specified in PROJECT.md, high-performance, TypeScript-first |
| @fastify/websocket | ^11.x | WebSocket plugin for Fastify | Official Fastify plugin, uses same server instance |
| ws | ^8.x | Underlying WebSocket library | Dependency of @fastify/websocket, protocol-level ping/pong |
| pino | (bundled) | Structured JSON logging | Built into Fastify, high-performance, zero config needed |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/ws | ^8.x | TypeScript types for ws | Development dependency for type safety |
| pino-pretty | ^13.x | Human-readable logs | Development only, never production |
| typescript | ^5.x | TypeScript compiler | Already standard in modern Node.js projects |
| tsx | ^4.x | TypeScript execution | Fast dev server with hot reload |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @fastify/websocket | Socket.IO | Socket.IO adds overhead and fallbacks not needed on local network |
| pino | winston | Winston is slower; Pino is Fastify's native logger |
| Map for registry | Object | Map handles frequent add/delete better, any key type |

**Installation:**
```bash
npm install fastify @fastify/websocket
npm install -D typescript @types/node @types/ws pino-pretty tsx
```

## Architecture Patterns

### Recommended Project Structure
```
backend-server/
├── src/
│   ├── index.ts           # Entry point, Fastify setup
│   ├── routes/
│   │   ├── transcription.ts   # POST /transcription
│   │   └── devices.ts         # GET /devices
│   ├── websocket/
│   │   ├── handler.ts         # WebSocket connection handler
│   │   └── heartbeat.ts       # Ping/pong interval management
│   ├── services/
│   │   ├── registry.ts        # Connection registry (Map-based)
│   │   └── queue.ts           # Message queue per device
│   └── types/
│       └── messages.ts        # WebSocket message type definitions
├── package.json
└── tsconfig.json
```

### Pattern 1: Connection Registry with Map

**What:** Use a Map to track deviceId -> WebSocket connections
**When to use:** Always for this type of connection management

```typescript
// Source: Standard pattern from @fastify/websocket tutorials
interface AgentConnection {
  socket: WebSocket;
  connectedAt: Date;
  isAlive: boolean;
}

const registry = new Map<string, AgentConnection>();

// Register on connection
function registerAgent(deviceId: string, socket: WebSocket): boolean {
  if (registry.has(deviceId)) {
    return false; // Reject duplicate (per user decision)
  }
  registry.set(deviceId, { socket, connectedAt: new Date(), isAlive: true });
  return true;
}

// Remove on disconnect
function unregisterAgent(deviceId: string): void {
  registry.delete(deviceId);
}

// Get connected devices
function getConnectedDevices(): string[] {
  return Array.from(registry.keys());
}
```

### Pattern 2: Protocol-Level Heartbeat (ws library)

**What:** Use ws library's native ping/pong for connection health
**When to use:** For detecting dead connections (30s interval per user decision)

```typescript
// Source: Official ws library documentation
const HEARTBEAT_INTERVAL = 30000; // 30 seconds per user decision
const MAX_MISSED_PONGS = 2;

function startHeartbeat(wss: WebSocket.Server): NodeJS.Timeout {
  return setInterval(() => {
    registry.forEach((agent, deviceId) => {
      if (!agent.isAlive) {
        // Missed pong - terminate
        agent.socket.terminate();
        registry.delete(deviceId);
        return;
      }
      agent.isAlive = false;
      agent.socket.ping();
    });
  }, HEARTBEAT_INTERVAL);
}

// In connection handler:
socket.on('pong', () => {
  const agent = registry.get(deviceId);
  if (agent) agent.isAlive = true;
});
```

### Pattern 3: Message ACK Protocol

**What:** Wait for agent ACK before responding to HTTP POST
**When to use:** For reliable message delivery confirmation

```typescript
// WebSocket message types
type WsMessage =
  | { type: 'transcription'; id: string; text: string; timestamp: number }
  | { type: 'ack'; id: string }
  | { type: 'error'; id: string; code: string };

// Track pending messages awaiting ACK
const pendingAcks = new Map<string, {
  resolve: (success: boolean) => void;
  timeout: NodeJS.Timeout;
}>();

async function sendAndWaitForAck(
  socket: WebSocket,
  message: WsMessage,
  timeoutMs: number = 5000
): Promise<boolean> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      pendingAcks.delete(message.id);
      resolve(false);
    }, timeoutMs);

    pendingAcks.set(message.id, { resolve, timeout });
    socket.send(JSON.stringify(message));
  });
}

// In message handler:
socket.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.type === 'ack') {
    const pending = pendingAcks.get(msg.id);
    if (pending) {
      clearTimeout(pending.timeout);
      pending.resolve(true);
      pendingAcks.delete(msg.id);
    }
  }
});
```

### Pattern 4: In-Memory Message Queue

**What:** Queue messages for offline agents with limits
**When to use:** When agent is disconnected but will reconnect

```typescript
// Source: Standard queue pattern with user-specified limits
const MAX_QUEUE_SIZE = 50;
const MAX_QUEUE_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

interface QueuedMessage {
  id: string;
  text: string;
  timestamp: number;
}

const messageQueues = new Map<string, QueuedMessage[]>();

function enqueue(deviceId: string, message: QueuedMessage):
  { success: true } | { success: false; code: 'QUEUE_FULL' } {

  let queue = messageQueues.get(deviceId) || [];

  // Prune expired messages
  const now = Date.now();
  queue = queue.filter(m => now - m.timestamp < MAX_QUEUE_AGE_MS);

  if (queue.length >= MAX_QUEUE_SIZE) {
    return { success: false, code: 'QUEUE_FULL' };
  }

  queue.push(message);
  messageQueues.set(deviceId, queue);
  return { success: true };
}

function drainQueue(deviceId: string): QueuedMessage[] {
  const queue = messageQueues.get(deviceId) || [];
  messageQueues.delete(deviceId);
  return queue; // Already in order (strict ordering per user decision)
}
```

### Anti-Patterns to Avoid

- **Async before event handlers:** Attaching WebSocket event handlers after async operations drops messages. Always attach handlers synchronously in the connection handler.
- **Using socket.close() for dead connections:** Use `socket.terminate()` for unresponsive connections - it doesn't wait for handshake.
- **Storing WebSocket in plain Object:** Maps handle frequent add/delete better and allow proper cleanup.
- **Enabling permessage-deflate:** Compression adds significant overhead and memory fragmentation on Node.js. Disabled by default in ws, keep it that way.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WebSocket server | Raw HTTP upgrade handling | @fastify/websocket | Handles upgrade, integrates with Fastify lifecycle |
| Heartbeat/ping-pong | Custom message-based ping | ws library ping/pong | Protocol-level, browser auto-responds, more reliable |
| JSON logging | Custom log formatting | Pino (via Fastify) | Already integrated, high performance, structured output |
| UUID generation | Math.random strings | crypto.randomUUID() | Built into Node.js, cryptographically random |

**Key insight:** The ws library and Fastify's Pino integration handle the hardest parts (protocol-level WebSocket, high-performance logging). Focus implementation effort on the business logic: registry management, message routing, and queue handling.

## Common Pitfalls

### Pitfall 1: Dropping Messages During Async Setup

**What goes wrong:** Messages arrive before event handlers are attached
**Why it happens:** Async operations (database lookup, auth check) delay handler attachment
**How to avoid:** Attach all socket event handlers synchronously in connection handler, then do async work
**Warning signs:** "First message sometimes lost" bugs

```typescript
// WRONG
fastify.get('/ws', { websocket: true }, async (socket, req) => {
  await validateConnection(req); // Messages can arrive during await!
  socket.on('message', handleMessage);
});

// RIGHT
fastify.get('/ws', { websocket: true }, (socket, req) => {
  socket.on('message', handleMessage); // Attach immediately
  validateConnection(req).then(/* ... */);
});
```

### Pitfall 2: Memory Leaks from Uncleared Timeouts

**What goes wrong:** Server memory grows over time
**Why it happens:** Pending ACK timeouts or heartbeat intervals not cleared on disconnect
**How to avoid:** Clear all timeouts when connection closes
**Warning signs:** Gradually increasing memory usage

```typescript
socket.on('close', () => {
  // Clear all pending ACK timeouts for this connection
  pendingAcks.forEach((pending, id) => {
    clearTimeout(pending.timeout);
  });
  // Heartbeat interval cleared elsewhere
});
```

### Pitfall 3: Silent Connection Death

**What goes wrong:** Connection appears active but is actually dead (network drop, client crash)
**Why it happens:** TCP doesn't detect broken connections quickly
**How to avoid:** Implement ping/pong heartbeat (already planned per user decision)
**Warning signs:** Messages sent but never received, no errors

### Pitfall 4: Race Condition on Duplicate Connection Rejection

**What goes wrong:** Two connections for same hostname briefly exist
**Why it happens:** Check-then-set not atomic
**How to avoid:** Terminate existing before registering new, or reject during registration atomically
**Warning signs:** Inconsistent duplicate rejection

## Code Examples

Verified patterns from official sources:

### Fastify WebSocket Setup

```typescript
// Source: @fastify/websocket GitHub README
import Fastify from 'fastify';
import websocket from '@fastify/websocket';

const fastify = Fastify({
  logger: {
    level: 'info',
    // Structured JSON logging is Fastify's default
  }
});

await fastify.register(websocket, {
  options: {
    maxPayload: 1048576, // 1MB max message size
  }
});

// WebSocket route
fastify.get('/ws', { websocket: true }, (socket, req) => {
  const deviceId = req.query.deviceId as string;

  // Attach handlers synchronously
  socket.on('message', (data) => { /* ... */ });
  socket.on('close', () => { /* ... */ });
  socket.on('pong', () => { /* ... */ });
  socket.on('error', (err) => { /* ... */ });

  // Then do async registration
  // ...
});
```

### HTTP Route with JSON Response

```typescript
// Source: Fastify documentation patterns
fastify.post('/transcription', async (request, reply) => {
  const { deviceId, text } = request.body as { deviceId: string; text: string };

  // Always return 200 or 500 per user decision
  try {
    const result = await routeTranscription(deviceId, text);
    return reply.code(200).send({
      success: true,
      ...result
    });
  } catch (error) {
    request.log.error({ error, deviceId }, 'Transcription routing failed');
    return reply.code(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to process transcription'
      }
    });
  }
});
```

### Getting Machine Hostname (Client Agent)

```typescript
// Source: Node.js os module documentation
import os from 'node:os';

const deviceId = os.hostname();
// Returns: 'DESKTOP-ABC123' on Windows, 'my-laptop' on Linux/Mac
```

## Claude's Discretion Recommendations

Based on research, here are recommendations for areas left to Claude's discretion:

### deviceId Matching Strategy

**Recommendation:** Exact string match (case-insensitive)

Hostnames are already unique identifiers set by the OS. Fuzzy matching adds complexity without benefit for a single-user local network system. Case-insensitive handles Windows vs Linux hostname case differences.

```typescript
function normalizeDeviceId(raw: string): string {
  return raw.toLowerCase().trim();
}
```

### Error Code Taxonomy

**Recommendation:** Simple, action-oriented codes

| Code | When Used | HTTP Status |
|------|-----------|-------------|
| `AGENT_OFFLINE` | Target device not connected | 200 (queued) |
| `QUEUE_FULL` | 50 message limit reached | 200 (rejected) |
| `INVALID_DEVICE_ID` | Missing or malformed deviceId | 500 |
| `INTERNAL_ERROR` | Unexpected server error | 500 |
| `ACK_TIMEOUT` | Agent didn't acknowledge | 200 (queued for retry) |
| `DUPLICATE_CONNECTION` | Hostname already connected | N/A (WebSocket) |

### WebSocket Message Protocol

**Recommendation:** Simple JSON envelope with type discrimination

```typescript
// Server -> Agent
type ServerMessage =
  | { type: 'transcription'; id: string; text: string; timestamp: number }
  | { type: 'ping' };  // Application-level fallback if needed

// Agent -> Server
type AgentMessage =
  | { type: 'ack'; id: string }
  | { type: 'register'; deviceId: string }  // On connect
  | { type: 'pong' };  // Application-level fallback if needed
```

### HTTP Endpoint Paths

**Recommendation:** RESTful, version-free for MVP

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/transcription` | Submit transcription to route |
| GET | `/devices` | List connected agent hostnames |
| GET | `/health` | Server health check (optional) |

No `/api/v1/` prefix needed for single-user local tool.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Socket.IO for all | Native WebSocket for simple cases | 2023+ | Socket.IO only needed for browser fallbacks, adds overhead |
| Winston for logging | Pino for performance | 2020+ | Pino is 5x faster, Fastify default |
| Callback-based async | async/await | 2017+ | Cleaner code, better error handling |
| CommonJS | ESM | 2023+ | Native modules, better tree shaking |

**Deprecated/outdated:**
- `fastify-websocket` (old name): Now `@fastify/websocket`
- Node.js < 18: Use 20+ for stable WebSocket support and crypto.randomUUID()

## Open Questions

Things that couldn't be fully resolved:

1. **ACK timeout duration**
   - What we know: Need to wait for agent ACK before HTTP response
   - What's unclear: Optimal timeout (5s? 10s?) for local network
   - Recommendation: Start with 5 seconds, make configurable

2. **Reconnection burst rate**
   - What we know: "Immediate burst" delivery per user decision
   - What's unclear: Whether to add small delay between messages to avoid overwhelming slow agents
   - Recommendation: Send all immediately; if issues arise, add 10ms delay between

## Sources

### Primary (HIGH confidence)
- @fastify/websocket GitHub README - Plugin registration, handler signature, options
- Fastify official docs (fastify.dev/docs/latest/Reference/Logging) - Pino integration, logging config
- ws library (websockets/ws GitHub) - Ping/pong implementation, terminate vs close
- Node.js os module docs - os.hostname() usage

### Secondary (MEDIUM confidence)
- [Better Stack Fastify WebSockets Guide](https://betterstack.com/community/guides/scaling-nodejs/fastify-websockets/) - Connection management patterns
- [OneUptime WebSocket Heartbeat Guide](https://oneuptime.com/blog/post/2026-01-27-websocket-heartbeat/view) - Heartbeat implementation patterns
- [VideoSDK Fastify WebSocket Guide 2025](https://www.videosdk.live/developer-hub/websocket/fastify-websocket) - Current best practices

### Tertiary (LOW confidence)
- WebSearch results on common pitfalls - Need validation during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Fastify plugin, well-documented
- Architecture: HIGH - Standard patterns from official docs
- Pitfalls: MEDIUM - Aggregated from multiple sources, some unverified

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (30 days - stable ecosystem)
