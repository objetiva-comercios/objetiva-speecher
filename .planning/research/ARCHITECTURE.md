# Architecture Research

**Domain:** Voice-to-Text + Real-Time Communication System
**Researched:** 2026-02-06
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
                              LOCAL NETWORK
 ---------------------------------------------------------------------------------
|                                                                                 |
|  MOBILE DEVICE                       BACKEND SERVER                             |
|  +-----------------+                 +---------------------------+              |
|  | Capacitor App   |                 | Node.js + Fastify         |              |
|  |                 |   HTTP POST     |                           |              |
|  | +-----------+   |  /transcription | +---------------------+   |              |
|  | | Android   |   | --------------> | | HTTP Endpoint       |   |              |
|  | | Speech    |   |                 | | (receives text)     |   |              |
|  | | Recognizer|   |                 | +----------+----------+   |              |
|  | +-----------+   |                 |            |              |              |
|  |      |          |                 |            v              |              |
|  | +-----------+   |                 | +---------------------+   |              |
|  | | React UI  |   |                 | | Message Router      |   |              |
|  | | (Voice    |   |                 | | (deviceId lookup)   |   |              |
|  | |  Button)  |   |                 | +----------+----------+   |              |
|  | +-----------+   |                 |            |              |              |
|  +-----------------+                 |            |              |              |
|                                      |            v              |              |
|                                      | +---------------------+   |              |
|                                      | | WebSocket Server    |   |              |
|                                      | | (ws connections)    |   |              |
|                                      | +----------+----------+   |              |
|                                      +------------|----------+   |              |
|                                                   |              |              |
|                     WebSocket                     |              |              |
|              (persistent connection)              |              |              |
|                                                   v              |              |
|                                      +---------------------------+              |
|                                      | DESKTOP AGENT             |              |
|                                      | Node.js Client            |              |
|                                      |                           |              |
|                                      | +---------------------+   |              |
|                                      | | WebSocket Client    |   |              |
|                                      | | (receives text)     |   |              |
|                                      | +----------+----------+   |              |
|                                      |            |              |              |
|                                      |            v              |              |
|                                      | +---------------------+   |              |
|                                      | | Clipboard + Keyboard|   |              |
|                                      | | (nut.js)            |   |              |
|                                      | +---------------------+   |              |
|                                      +---------------------------+              |
|                                                                                 |
 ---------------------------------------------------------------------------------
```

### Component Responsibilities

| Component | Responsibility | Protocol/Technology |
|-----------|----------------|---------------------|
| Mobile App (Capacitor) | Voice capture, speech recognition, UI | Android SpeechRecognizer, HTTP |
| Backend Server (Fastify) | Receive transcriptions, route to devices, manage connections | HTTP + WebSocket |
| Desktop Agent (Node.js) | Receive text, paste at cursor | WebSocket client, nut.js |

## Recommended Project Structure

```
objetiva-speecher/
├── packages/
│   ├── mobile/                    # Capacitor + React mobile app
│   │   ├── android/               # Native Android project
│   │   ├── src/
│   │   │   ├── components/        # React components
│   │   │   │   └── VoiceButton.tsx
│   │   │   ├── hooks/             # Custom hooks
│   │   │   │   └── useSpeechRecognition.ts
│   │   │   ├── services/          # HTTP client, settings
│   │   │   │   └── transcriptionService.ts
│   │   │   ├── pages/             # App screens
│   │   │   └── App.tsx
│   │   ├── capacitor.config.ts
│   │   └── package.json
│   │
│   ├── server/                    # Node.js + Fastify backend
│   │   ├── src/
│   │   │   ├── routes/            # HTTP route handlers
│   │   │   │   └── transcription.ts
│   │   │   ├── websocket/         # WebSocket management
│   │   │   │   ├── server.ts      # WS server setup
│   │   │   │   ├── registry.ts    # Connection registry (Map<deviceId, socket>)
│   │   │   │   └── router.ts      # Message routing logic
│   │   │   ├── services/          # Business logic
│   │   │   │   └── deviceService.ts
│   │   │   └── index.ts           # Entry point
│   │   └── package.json
│   │
│   └── agent/                     # Desktop paste agent
│       ├── src/
│       │   ├── websocket/         # WS client with reconnection
│       │   │   ├── client.ts      # Reconnecting WebSocket
│       │   │   └── messageQueue.ts # Offline message queue
│       │   ├── clipboard/         # Paste automation
│       │   │   └── paster.ts      # nut.js integration
│       │   ├── device/            # Device identification
│       │   │   └── identity.ts    # Hostname-based deviceId
│       │   └── index.ts           # Entry point
│       └── package.json
│
├── package.json                   # Monorepo root (workspace)
└── README.md
```

### Structure Rationale

- **packages/:** Monorepo structure enables shared tooling, consistent versioning, coordinated development
- **Separation by deployment target:** Each package deploys independently (mobile to device, server to local machine, agent to desktop machines)
- **Internal modular structure:** Each package follows feature-based organization for maintainability

## Data Flow

### Primary Flow: Voice to Cursor

```
[1. User speaks]
       |
       v
[2. Android SpeechRecognizer captures audio]
       |
       v
[3. On-device speech-to-text produces transcription]
       |
       v
[4. Mobile app sends HTTP POST to backend]
   POST /transcription
   { deviceId: "target-device", text: "transcribed text" }
       |
       v
[5. Backend receives, looks up deviceId in connection registry]
       |
       v
[6. Backend sends via WebSocket to registered agent]
   { type: "paste", text: "transcribed text" }
       |
       v
[7. Agent receives message]
       |
       v
[8. Agent writes to clipboard, simulates Ctrl+V]
       |
       v
[9. Text appears at cursor position]
```

### Device Registration Flow

```
[Agent starts]
       |
       v
[Generate deviceId from hostname]
       |
       v
[Connect WebSocket to backend]
       |
       v
[Send registration message]
   { type: "register", deviceId: "hostname-1234" }
       |
       v
[Backend stores socket in registry]
   Map.set("hostname-1234", socket)
       |
       v
[Mobile discovers available devices]
   GET /devices
       |
       v
[Mobile displays device selector UI]
```

### Connection Resilience Flow

```
[WebSocket disconnects]
       |
       v
[Queue outgoing messages locally]
       |
       v
[Attempt reconnection with exponential backoff]
   delay = min(baseDelay * 2^attempt, maxDelay) + jitter
       |
       v
[On reconnect: re-register, flush queue]
       |
       v
[Resume normal operation]
```

## State Management

### Backend State

| State | Structure | Purpose |
|-------|-----------|---------|
| Connection Registry | `Map<deviceId, WebSocket>` | Route messages to correct agent |
| Device Metadata | `Map<deviceId, { name, lastSeen }>` | Device discovery, health tracking |

### Agent State

| State | Structure | Purpose |
|-------|-----------|---------|
| Connection Status | `enum { CONNECTED, CONNECTING, DISCONNECTED }` | UI feedback, behavior control |
| Message Queue | `Array<{ message, timestamp, retries }>` | Offline resilience |
| Reconnect Attempt | `number` | Exponential backoff calculation |

### Mobile State

| State | Structure | Purpose |
|-------|-----------|---------|
| Selected Device | `deviceId: string` | Target for transcriptions |
| Available Devices | `Device[]` | Device selector population |
| Recognition State | `enum { IDLE, LISTENING, PROCESSING }` | UI feedback |

## Architectural Patterns

### Pattern 1: Connection Registry

**What:** Backend maintains a Map of deviceId to active WebSocket connections
**When to use:** Always required for multi-client WebSocket routing
**Trade-offs:** Memory overhead per connection; must handle cleanup on disconnect

**Example:**
```typescript
// server/src/websocket/registry.ts
class ConnectionRegistry {
  private connections = new Map<string, WebSocket>();

  register(deviceId: string, socket: WebSocket): void {
    // Clean up existing connection if any
    const existing = this.connections.get(deviceId);
    if (existing) existing.close();

    this.connections.set(deviceId, socket);

    socket.on('close', () => {
      this.connections.delete(deviceId);
    });
  }

  send(deviceId: string, message: object): boolean {
    const socket = this.connections.get(deviceId);
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    socket.send(JSON.stringify(message));
    return true;
  }

  getRegisteredDevices(): string[] {
    return Array.from(this.connections.keys());
  }
}
```

### Pattern 2: Exponential Backoff with Jitter

**What:** Increasing delay between reconnection attempts with randomization
**When to use:** WebSocket client reconnection logic
**Trade-offs:** Slower reconnection vs. server protection from connection storms

**Example:**
```typescript
// agent/src/websocket/client.ts
class ReconnectingWebSocket {
  private baseDelay = 1000;  // 1 second
  private maxDelay = 30000;  // 30 seconds
  private attempt = 0;

  private calculateDelay(): number {
    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.attempt),
      this.maxDelay
    );
    // Add jitter: +/- 50%
    const jitter = delay * 0.5 * (Math.random() - 0.5);
    return delay + jitter;
  }

  private scheduleReconnect(): void {
    const delay = this.calculateDelay();
    this.attempt++;
    setTimeout(() => this.connect(), delay);
  }

  private onConnected(): void {
    this.attempt = 0;  // Reset on successful connection
  }
}
```

### Pattern 3: Message Queue with TTL

**What:** Queue messages during disconnection with time-based expiration
**When to use:** Agent needs to handle offline periods gracefully
**Trade-offs:** Memory usage vs. message delivery guarantee

**Example:**
```typescript
// agent/src/websocket/messageQueue.ts
interface QueuedMessage {
  message: object;
  timestamp: number;
  retries: number;
}

class MessageQueue {
  private queue: QueuedMessage[] = [];
  private maxSize = 100;
  private ttlMs = 5 * 60 * 1000;  // 5 minutes

  enqueue(message: object): void {
    if (this.queue.length >= this.maxSize) {
      this.queue.shift();  // Drop oldest
    }
    this.queue.push({
      message,
      timestamp: Date.now(),
      retries: 0
    });
  }

  flush(send: (msg: object) => boolean): void {
    const now = Date.now();
    this.queue = this.queue.filter(item => {
      if (now - item.timestamp > this.ttlMs) {
        return false;  // Expired, drop
      }
      return !send(item.message);  // Keep if send failed
    });
  }
}
```

### Pattern 4: Type-Based Message Routing

**What:** JSON messages with `type` field for dispatch
**When to use:** WebSocket communication between components
**Trade-offs:** Simple and explicit; requires consistent message schema

**Example:**
```typescript
// Shared message types
type Message =
  | { type: 'register'; deviceId: string }
  | { type: 'paste'; text: string }
  | { type: 'ack'; messageId: string }
  | { type: 'error'; code: string; message: string };

// Handler dispatch
function handleMessage(message: Message): void {
  switch (message.type) {
    case 'register':
      handleRegistration(message.deviceId);
      break;
    case 'paste':
      handlePaste(message.text);
      break;
    // ...
  }
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing WebSockets in Database

**What people do:** Persist WebSocket connection info to database for "durability"
**Why it's wrong:** WebSocket connections are ephemeral process-local state. Database adds latency and complexity without benefit. Connection is gone when process restarts regardless.
**Do this instead:** Use in-memory Map for connection registry. Accept that connections reset on server restart.

### Anti-Pattern 2: HTTP Polling Instead of WebSocket

**What people do:** Mobile polls backend every N seconds instead of using WebSocket
**Why it's wrong:** For mobile-to-backend transcription delivery, HTTP POST is correct (one-way, stateless). But for backend-to-agent communication, WebSocket is essential for real-time push.
**Do this instead:** Use HTTP POST for mobile->backend (transcription delivery), WebSocket for backend->agent (text delivery).

### Anti-Pattern 3: Global Clipboard Write Without Focus Check

**What people do:** Agent writes to clipboard and pastes immediately without context
**Why it's wrong:** User may have switched applications. Paste happens in wrong window.
**Do this instead:** Consider adding optional focus verification, or accept that user must keep target window focused.

### Anti-Pattern 4: No Heartbeat for WebSocket

**What people do:** Assume WebSocket is alive until error occurs
**Why it's wrong:** TCP connections can die silently (network change, NAT timeout). Agent won't know for minutes.
**Do this instead:** Implement ping/pong heartbeat every 30 seconds. Reconnect if pong not received.

## Deployment Topology

### Local Network Setup

```
                    Local Network (192.168.x.x)

  +-------------+        +-------------+        +-------------+
  |   Phone     |        |   Server    |        |  Desktop 1  |
  | (WiFi)      |        | (Host PC)   |        |  (Agent)    |
  | 192.168.1.5 |        | 192.168.1.10|        | 192.168.1.20|
  +------+------+        +------+------+        +------+------+
         |                      |                      |
         |    HTTP POST         |    WebSocket         |
         +--------------------->+<---------------------+
                                |
                                |        +-------------+
                                |        |  Desktop 2  |
                                +------->|  (Agent)    |
                                         | 192.168.1.21|
                                         +-------------+
```

### Component Deployment

| Component | Deployment | Network Requirement |
|-----------|------------|---------------------|
| Backend Server | Host PC (always on) | Fixed local IP or mDNS discovery |
| Mobile App | User's phone | Same WiFi network as server |
| Desktop Agent | Each target machine | Same LAN as server |

### Discovery Options

For local network operation, two approaches:

1. **Manual Configuration:** User enters server IP in mobile app settings
   - Simplest, works everywhere
   - Requires user to know IP address

2. **mDNS/Bonjour Discovery:** Server advertises `_speecher._tcp.local`
   - Automatic discovery
   - Requires mDNS support (works on most networks)

**Recommendation:** Start with manual configuration. Add mDNS in later phase for improved UX.

## Build Order (Dependencies)

### Phase 1: Backend Server (Foundation)

**Build first because:** All other components depend on it. Cannot test mobile or agent without backend.

Deliverables:
- HTTP endpoint `/transcription` accepting POST with deviceId + text
- WebSocket server accepting connections
- Connection registry (deviceId -> socket mapping)
- Basic message routing

### Phase 2: Desktop Agent

**Build second because:** Requires backend to connect to. Simpler than mobile (no native code, no UI).

Deliverables:
- WebSocket client with reconnection
- Device registration on connect
- Message handling (paste command)
- Clipboard + keyboard automation (nut.js)

### Phase 3: Mobile App

**Build third because:** Requires both backend (for HTTP) and agent (for end-to-end testing).

Deliverables:
- React UI with voice button
- Capacitor speech recognition integration
- HTTP client for transcription delivery
- Device selector (calls GET /devices)

### Phase 4: Resilience Features

**Build fourth because:** Core flow must work first. These are enhancements.

Deliverables:
- Exponential backoff reconnection (agent)
- Message queuing (agent)
- Connection health monitoring (backend)
- Error handling and recovery

### Dependency Graph

```
Phase 1: Backend
    |
    +------> Phase 2: Agent
    |            |
    |            v
    +------> Phase 3: Mobile
                 |
                 v
             Phase 4: Resilience
```

## Latency Considerations

Target: < 2 seconds end-to-end

| Segment | Expected Latency | Notes |
|---------|------------------|-------|
| Speech recognition | 500-1000ms | Varies with phrase length |
| HTTP POST (LAN) | 10-50ms | Negligible on local network |
| Message routing | < 5ms | In-memory lookup |
| WebSocket delivery | 10-50ms | Persistent connection, minimal overhead |
| Clipboard + paste | 50-100ms | nut.js keyboard simulation |
| **Total** | **600-1200ms** | Well under 2s target |

## Sources

- [WebSocket reconnection patterns](https://oneuptime.com/blog/post/2026-01-27-websocket-reconnection/view)
- [Exponential backoff strategies](https://dev.to/hexshift/robust-websocket-reconnection-strategies-in-javascript-with-exponential-backoff-40n1)
- [Fastify WebSocket guide](https://betterstack.com/community/guides/scaling-nodejs/fastify-websockets/)
- [@fastify/websocket](https://github.com/fastify/fastify-websocket)
- [ws library for Node.js](https://github.com/websockets/ws)
- [Capacitor speech recognition](https://github.com/capacitor-community/speech-recognition)
- [nut.js for desktop automation](https://nutjs.dev/)
- [Node.js mDNS discovery](https://github.com/agnat/node_mdns)

---
*Architecture research for: Objetiva Speecher*
*Researched: 2026-02-06*
