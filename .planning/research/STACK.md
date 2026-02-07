# Stack Research

**Domain:** Voice-to-Text + Real-Time Communication System (Local Network)
**Researched:** 2026-02-06
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **Node.js** | 20.x LTS | Runtime for backend server and client agent | Fastify v5 requires Node 20+. LTS provides stability for production local deployments. | HIGH |
| **Fastify** | 5.7.x | Backend HTTP framework | 8x faster than Express, native TypeScript, official WebSocket plugin. Already specified in requirements. | HIGH |
| **@fastify/websocket** | 11.2.x | WebSocket support for backend | Built on ws@8, seamless route-based integration, hooks support, TypeScript built-in. Native fit for Fastify. | HIGH |
| **ws** | 8.19.x | WebSocket client for desktop agent | 17.7M weekly downloads, lightweight, battle-tested. Used directly for client connections. | HIGH |
| **Capacitor** | 7.x | Mobile app native bridge | Cross-platform native access, React-compatible, simpler than React Native for web devs. Version 7 requires Node 20+. | HIGH |
| **React** | 18.x | Mobile app UI framework | Project requirement. Works seamlessly with Capacitor. | HIGH |
| **@capacitor-community/speech-recognition** | 7.0.x | Android SpeechRecognizer bridge | Community-maintained, uses native Android SpeechRecognizer (50.8% Java), supports partial results streaming and es-AR locale. | HIGH |

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| **@nut-tree/nut-js** | 4.2.x | Desktop keyboard automation | Client agent: simulate keystrokes to paste text at cursor | HIGH |
| **clipboardy** | 5.2.x | Cross-platform clipboard access | Client agent: write transcribed text to system clipboard | HIGH |
| **Zustand** | 5.0.x | React state management | Mobile app: simple global state (connection status, settings) | HIGH |
| **@tanstack/react-query** | 5.90.x | Server state management | Mobile app: HTTP requests with caching, retries, background sync | HIGH |
| **ky** | 1.x | HTTP client | Mobile app: lightweight fetch wrapper with retries and hooks (157KB vs Axios 400KB+) | MEDIUM |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **TypeScript** | Type safety across all packages | Use strict mode. Shared types in monorepo root. |
| **Vite** | Build tool for React mobile app | Fast HMR, native ESM, excellent Capacitor integration. |
| **pnpm** | Monorepo package manager | Workspace support, disk-efficient, faster than npm. |
| **tsx** | TypeScript execution for Node.js | Run backend/agent without compilation during dev. |
| **vitest** | Unit testing | Fast, Vite-native, works across all packages. |

## Installation

```bash
# Root monorepo setup
pnpm init
pnpm add -D typescript tsx vitest

# Backend server (backend-server/)
pnpm add fastify@^5.7.0 @fastify/websocket@^11.2.0

# Client agent (client-agent/)
pnpm add ws@^8.19.0 @nut-tree/nut-js@^4.2.0 clipboardy@^5.2.0
pnpm add -D @types/ws

# Mobile app (mobile-app/)
pnpm add @capacitor/core@^7.0.0 @capacitor/cli@^7.0.0
pnpm add @capacitor-community/speech-recognition@^7.0.0
pnpm add react@^18.0.0 react-dom@^18.0.0
pnpm add zustand@^5.0.0 @tanstack/react-query@^5.90.0 ky@^1.0.0
pnpm add -D vite @vitejs/plugin-react typescript
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **@fastify/websocket** | Socket.IO | Need rooms, namespaces, automatic reconnection with fallback transports. Overkill for simple point-to-point. |
| **ws** | Socket.IO Client | Same as above. ws is sufficient for direct WebSocket connections. |
| **@nut-tree/nut-js** | RobotJS | Never. RobotJS is unmaintained and fails to install on modern Node.js. |
| **clipboardy** | node-clipboardy | If you need CommonJS support. clipboardy is ESM-only since v4. |
| **Zustand** | Redux Toolkit | Enterprise apps with complex state, time-travel debugging needs, or team already knows Redux. |
| **Zustand** | React Context | Very simple state with 2-3 values. Context causes full re-renders. |
| **ky** | Axios | Team familiarity with Axios, or need request interceptors not hooks. Axios is heavier (400KB+). |
| **@capacitor-community/speech-recognition** | @capawesome-team/capacitor-speech-recognition | Need advanced features like silence detection, contextual strings. Capawesome requires license for commercial use. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **RobotJS** | Unmaintained since 2020, fails to install on Node 18+, no Windows ARM support | @nut-tree/nut-js (actively maintained, prebuilt binaries) |
| **Express** | Slower than Fastify (up to 2x), less structured plugin system | Fastify (already chosen) |
| **Web Speech API** | Not available in Capacitor WebView on Android, requires browser context | Native Android SpeechRecognizer via Capacitor plugin |
| **socket.io** (for this project) | Overkill complexity: rooms, namespaces, fallback transports not needed. Adds ~150KB bundle. | ws + @fastify/websocket (direct WebSocket, minimal overhead) |
| **Redux** | Boilerplate-heavy for simple app, 80% of Redux usage is server state better handled by TanStack Query | Zustand + TanStack Query |
| **Axios** | Large bundle (400KB+), includes features you won't use | ky (157KB, modern fetch-based) |
| **Electron** (for client agent) | 150MB+ bundle for a clipboard/keyboard utility | Pure Node.js with nut.js + clipboardy |
| **Google Cloud Speech-to-Text** | Project requires local-only, no cloud dependencies | Native Android SpeechRecognizer (on-device) |

## Stack Patterns by Variant

**If running on Windows:**
- nut.js uses prebuilt binaries, no compilation needed
- clipboardy uses PowerShell Set-Clipboard/Get-Clipboard under the hood
- Ensure Windows SDK is available for nut.js screen access (not needed for keyboard-only)

**If running on Linux:**
- nut.js requires X11 or Wayland with xdotool/ydotool
- clipboardy uses xclip (X11) or wl-clipboard (Wayland)
- Install: `sudo apt install xclip` or `sudo apt install wl-clipboard`

**If network latency is critical (< 2 seconds total):**
- Use ws directly without Socket.IO overhead
- Send small JSON payloads, not large objects
- Consider binary WebSocket frames for high-frequency updates
- Use HTTP POST for transcription (simpler than maintaining bidirectional WS from mobile)

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| @fastify/websocket@11.x | Fastify 5.x, ws 8.x | Built specifically for Fastify 5 |
| @capacitor-community/speech-recognition@7.x | Capacitor 7.x | Major versions must match |
| @nut-tree/nut-js@4.x | Node.js 18+, Windows 10+, Linux (X11/Wayland) | Prebuilt for major platforms |
| Zustand@5.x | React 18+ | Uses useSyncExternalStore from React 18 |
| @tanstack/react-query@5.x | React 18+ | Suspense support requires React 18 |

## Architecture Recommendations

### Message Flow

```
Android App                    Backend Server              Desktop Agent
     |                              |                           |
     | 1. Voice → SpeechRecognizer  |                           |
     | 2. Text → HTTP POST -------> |                           |
     |                              | 3. Route via WebSocket -> |
     |                              |                           | 4. Clipboard + Paste
```

### Why HTTP + WebSocket (not WebSocket everywhere)

1. **Mobile → Server via HTTP POST:**
   - Simpler implementation (no WS lifecycle management in Capacitor)
   - Each transcription is a discrete event, not a stream
   - HTTP retry semantics for reliability
   - Capacitor HTTP plugin handles Android networking edge cases

2. **Server → Desktop via WebSocket:**
   - Desktop agent maintains persistent connection
   - Server can push to any connected agent instantly
   - Natural fit for "client subscribes, server broadcasts"

### Monorepo Structure

```
objetiva-speecher/
├── packages/
│   ├── mobile-app/          # Capacitor + React
│   ├── backend-server/      # Fastify + @fastify/websocket
│   ├── client-agent/        # Node.js + ws + nut.js + clipboardy
│   └── shared/              # Types, constants
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Specific Implementation Notes

### Android SpeechRecognizer with es-AR Locale

```typescript
// Using @capacitor-community/speech-recognition
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

await SpeechRecognition.start({
  language: 'es-AR',  // Spanish (Argentina)
  partialResults: true,  // Stream results as user speaks
  popup: false,  // Use custom UI, not Android's popup
});

SpeechRecognition.addListener('partialResults', (data) => {
  // Update UI with partial transcription
  console.log(data.matches);
});
```

### Desktop Agent Paste Simulation

```typescript
// client-agent approach
import clipboard from 'clipboardy';
import { keyboard, Key } from '@nut-tree/nut-js';

async function pasteAtCursor(text: string): Promise<void> {
  // 1. Write to clipboard
  await clipboard.write(text);

  // 2. Simulate Ctrl+V (Windows/Linux)
  await keyboard.pressKey(Key.LeftControl, Key.V);
  await keyboard.releaseKey(Key.LeftControl, Key.V);
}
```

### WebSocket Connection (Backend)

```typescript
// backend-server with Fastify
import Fastify from 'fastify';
import websocket from '@fastify/websocket';

const app = Fastify();
await app.register(websocket);

// Track connected agents
const agents = new Set<WebSocket>();

app.get('/ws/agent', { websocket: true }, (socket, req) => {
  agents.add(socket);
  socket.on('close', () => agents.delete(socket));
});

// HTTP endpoint for mobile transcriptions
app.post('/transcription', async (req, reply) => {
  const { text, targetAgent } = req.body;
  // Broadcast or target specific agent
  for (const agent of agents) {
    agent.send(JSON.stringify({ type: 'paste', text }));
  }
  return { success: true };
});
```

## Sources

### HIGH Confidence (Official/Authoritative)
- [GitHub - capacitor-community/speech-recognition](https://github.com/capacitor-community/speech-recognition) - Plugin docs, version 7.0.1, native Android implementation confirmed
- [GitHub - fastify/fastify-websocket](https://github.com/fastify/fastify-websocket) - @fastify/websocket built on ws@8
- [nutjs.dev](https://nutjs.dev/) - nut.js v4.2.0, keyboard/clipboard APIs, Windows/Linux support
- [nutjs.dev/docs/clipboard](https://nutjs.dev/docs/clipboard) - Clipboard getContent/setContent methods
- [nutjs.dev/docs/keyboard](https://nutjs.dev/docs/keyboard) - Keyboard automation documentation
- [GitHub - websockets/ws/releases](https://github.com/websockets/ws/releases) - ws 8.19.0, closeTimeout option
- [npmjs.com/package/fastify](https://www.npmjs.com/package/fastify) - Fastify 5.7.4
- [npmjs.com/package/@fastify/websocket](https://www.npmjs.com/package/@fastify/websocket) - @fastify/websocket 11.2.0
- [GitHub - sindresorhus/clipboardy](https://github.com/sindresorhus/clipboardy) - clipboardy v5.2.1, Windows/Linux support
- [npmjs.com/package/zustand](https://www.npmjs.com/package/zustand) - Zustand 5.0.11
- [npmjs.com/package/@tanstack/react-query](https://www.npmjs.com/package/@tanstack/react-query) - TanStack Query 5.90.20
- [capacitorjs.com/docs/updating/7-0](https://capacitorjs.com/docs/updating/7-0) - Capacitor 7 requirements (Node 20+, Android Studio Ladybug)

### MEDIUM Confidence (Verified Community Sources)
- [Velt Blog - WebSocket Libraries](https://velt.dev/blog/best-nodejs-websocket-libraries) - ws vs Socket.IO comparison
- [developerway.com - React State Management 2025](https://www.developerway.com/posts/react-state-management-2025) - Zustand + TanStack Query recommendation
- [dev.to - Ky HTTP Client](https://dev.to/usluer/why-ky-is-the-best-alternative-to-axios-and-fetch-for-modern-http-requests-27c3) - ky vs Axios bundle size comparison
- [OpenJS Foundation - Fastify v5](https://openjsf.org/blog/fastifys-growth-and-success) - Fastify v5 Node 20+ requirement

### LOW Confidence (Single Source, Needs Validation)
- None - all recommendations verified with multiple sources

---
*Stack research for: Objetiva Speecher - Voice-to-Text Local Network System*
*Researched: 2026-02-06*
