# Project Research Summary

**Project:** Objetiva Speecher
**Domain:** Voice-to-Text + Real-Time Cross-Device Communication (Local Network)
**Researched:** 2026-02-06
**Confidence:** HIGH

## Executive Summary

Objetiva Speecher is a voice dictation system that enables users to speak on their Android phone and have text automatically appear at the cursor on their desktop PC. This is a real-time communication system with three distinct components: a mobile app for voice capture, a backend server for message routing, and a desktop agent for automated pasting. Research shows that experts in this space prioritize sub-2-second latency, reliable message delivery over unreliable networks, and zero-friction UX (silent, automatic pasting without user intervention).

The recommended approach uses native Android SpeechRecognizer for on-device transcription (with es-AR locale support), Fastify with WebSocket for real-time backend routing, and a Node.js desktop agent using nut.js for keyboard automation. The architecture follows a hybrid HTTP+WebSocket pattern: mobile sends transcriptions via HTTP POST (simpler, stateless), while the backend pushes text to desktop agents via persistent WebSocket connections. This combination provides reliability for mobile networking while enabling instant desktop delivery.

Key risks include WebSocket half-open connections (mitigated with heartbeat ping/pong), Android SpeechRecognizer lifecycle crashes (requires strict manager wrapper), clipboard race conditions on Windows (needs verification and retry logic), and message loss during disconnection (requires local persistence queue with acknowledgments). The research identifies clear build-order dependencies: backend server must come first (provides foundation), followed by desktop agent (simpler, no UI), then mobile app (most complex, native integration), and finally resilience features (enhancements once core flow works).

## Key Findings

### Recommended Stack

The stack centers on Node.js 20 LTS for runtime consistency across all components. Fastify v5 is mandated for the backend (8x faster than Express, already specified in requirements), with @fastify/websocket for WebSocket support. The mobile app uses Capacitor 7 as the React-to-native bridge, with @capacitor-community/speech-recognition for Android SpeechRecognizer access (supports es-AR locale and partial results streaming). The desktop agent uses ws for WebSocket client, nut.js for keyboard simulation, and clipboardy for cross-platform clipboard access.

**Core technologies:**
- **Node.js 20.x LTS** — Runtime for all backend and agent code. Required for Fastify v5 and Capacitor 7.
- **Fastify 5.7.x + @fastify/websocket 11.2.x** — Backend HTTP and WebSocket server. Fast, TypeScript-native, route-based integration.
- **Capacitor 7.x + @capacitor-community/speech-recognition 7.0.x** — Mobile native bridge with Android SpeechRecognizer access. Supports es-AR and partial results.
- **ws 8.19.x** — WebSocket client for desktop agent. Battle-tested, lightweight (17.7M weekly downloads).
- **@nut-tree/nut-js 4.2.x** — Desktop keyboard automation. Actively maintained, prebuilt binaries for Windows/Linux/Mac.
- **clipboardy 5.2.x** — Cross-platform clipboard access. Works on Windows (PowerShell), Linux (xclip/wl-clipboard).
- **Zustand 5.x + @tanstack/react-query 5.x** — Mobile app state management. Simple global state + server state with caching/retries.

**Version compatibility critical:** Fastify 5 requires Node 20+. Capacitor 7 requires Node 20+. @fastify/websocket 11 is built specifically for Fastify 5. All version constraints align on Node 20 LTS.

### Expected Features

Research on competitors (Wispr Flow, Dragon Anywhere, Otter.ai) and general dictation software reveals clear feature tiers. Table stakes are features users assume exist; missing them makes the product feel broken. Differentiators set the product apart from competitors. Anti-features are deliberately excluded from v1 to maintain simplicity.

**Must have (table stakes):**
- **Voice input with tap-to-start/stop** — Core interaction model, standard in all dictation apps
- **Speech-to-text transcription (es-AR)** — Core value delivery, Spanish Argentina locale required
- **Text delivery to desktop** — Completing the workflow, what makes this different from phone-only dictation
- **Device selection by hostname** — Users need to target specific PC among multiple connected devices
- **Connection status indicator** — Users must know if dictation will work before speaking
- **Auto-reconnection on disconnect** — Network is unreliable, especially mobile; exponential backoff required
- **Message queue on connection loss** — Never lose transcriptions, queue locally and replay on reconnect
- **Sub-2-second latency** — Industry expects <300ms STT + <500ms total. Modern APIs achieve 95%+ accuracy.

**Should have (competitive advantages):**
- **Auto-paste at cursor** — Zero friction, no Ctrl+V required. Wispr Flow has this (Fn key), competitors don't.
- **Silent success (no dialogs/confirmations)** — Avoid "dialog fatigue", keep user in flow state
- **Hostname-based device names** — More intuitive than "Device 1", "Device 2"
- **Single-purpose simplicity** — Most competitors are complex; intentional constraint creates focus
- **No account required (v1)** — Immediate usability, privacy benefit, simpler architecture

**Defer to v2+ (anti-features for v1):**
- **Voice commands (Enter, Tab, etc.)** — Adds parsing complexity, error states. Wait for core dictation validation.
- **Custom phrase replacement** — Dictionary management, edge cases. Add after user feedback.
- **Multi-language support** — es-AR is target market; adding languages is exponential complexity.
- **Real-time streaming transcription** — Higher complexity, more network traffic. Only if tap-to-stop latency insufficient.
- **AI text formatting/cleanup** — Wispr Flow differentiator, adds LLM dependency, cost, latency.
- **Meeting transcription** — Different product category (Otter.ai territory), out of scope.

### Architecture Approach

The architecture uses a three-component model with clear separation by deployment target. Mobile app runs on user's Android phone, backend server runs on always-on host PC, and desktop agents run on each target PC. Communication follows a hybrid pattern: mobile uses HTTP POST to backend (stateless, reliable, simple), backend uses WebSocket to push text to agents (persistent, instant delivery). This avoids WebSocket lifecycle complexity on mobile while enabling real-time desktop push.

**Major components:**

1. **Mobile App (Capacitor + React)** — Voice capture via Android SpeechRecognizer, transcription processing, HTTP client for sending text to backend. Device selection UI. State management with Zustand (connection status, selected device) and TanStack Query (HTTP requests with retry/cache).

2. **Backend Server (Fastify + @fastify/websocket)** — HTTP endpoint receives transcriptions from mobile (`POST /transcription`), WebSocket server manages persistent connections from desktop agents, connection registry (Map<deviceId, WebSocket>) routes messages to correct agent, device discovery API (`GET /devices`) returns list of connected agents.

3. **Desktop Agent (Node.js + ws + nut.js)** — WebSocket client maintains persistent connection to backend with auto-reconnection, device registration on connect (sends hostname-based deviceId), receives paste commands via WebSocket, clipboard write + keyboard simulation (Ctrl+V) using nut.js. Message queue for offline resilience.

**Data flow:** User speaks → Android SpeechRecognizer → Mobile app → HTTP POST /transcription → Backend router → WebSocket message → Desktop agent → Clipboard write + Ctrl+V paste → Text appears at cursor.

**Build order dependencies:** Backend first (foundation for all testing), then desktop agent (simpler, no native code/UI), then mobile app (most complex, requires backend+agent for end-to-end testing), finally resilience features (queue, reconnection, heartbeat).

### Critical Pitfalls

Research identified six critical pitfalls specific to this domain, with clear prevention strategies and phase-specific warnings.

1. **Android SpeechRecognizer Lifecycle Mismanagement** — Listener must be set BEFORE any command, all calls must be on main thread, destroy() MUST be called when done. Failures result in silent crashes, ERROR_CLIENT (code 5), memory leaks. **Prevention:** Build SpeechRecognizerManager wrapper in Phase 1 that enforces lifecycle constraints. Handle all 9+ error codes explicitly.

2. **WebSocket Half-Open Connection Blindness** — Network switches, NAT timeouts, mobile transitions sever connections without either endpoint knowing. Messages sent into void, dictations lost. **Prevention:** Application-level ping/pong heartbeat every 20-30 seconds with 10 second pong timeout. Close connection on 2-3 missed pongs. Implement in Phase 2 (non-negotiable from start).

3. **Clipboard Race Conditions on Windows** — Rapid clipboard updates cause wrong content pasting. Windows clipboard history service is asynchronous and can miss rapid updates "by design for performance." Some apps use delayed rendering (up to 30 seconds). **Prevention:** Add 50-100ms delay between clipboard write and paste, verify clipboard content matches before pasting, implement retry logic. Address in Phase 3 (PC agent).

4. **Message Loss During Disconnection** — Transcriptions made while offline vanish. Basic WebSocket fire-and-forget loses messages during network instability. Users expect dictation to "never lose" content. **Prevention:** Local SQLite queue on Android before WebSocket send, require server ACK for each message, mark as pending/sent/acknowledged, replay unacknowledged on reconnect. Build in Phase 2 (Android app).

5. **Latency Budget Blown by Cumulative Delays** — Each component seems "fast enough" but total exceeds 2 second target. Speech recognition (200-500ms) + WebSocket (20-50ms) + processing (10-50ms) + clipboard (10-30ms) + paste (50-100ms) = 600-1200ms. P95 can be much higher. **Prevention:** Establish latency budget per component with margins, use streaming recognition, minimize JSON payloads, add instrumentation from day one. Address across all phases.

6. **Linux Wayland Keyboard Simulation Fragmentation** — xdotool doesn't work on Wayland (sends X events to non-existent X server). ydotool requires daemon, sudo, has incomplete non-ASCII support and custom layout issues. **Prevention:** Detect display server at runtime (X11 vs Wayland), use ydotool for Wayland with documented setup requirements, implement fallback chain. Address in Phase 3 (Linux agent support).

## Implications for Roadmap

Based on combined research, the roadmap should follow a dependency-driven structure with four distinct phases. Build order is dictated by architecture dependencies (backend → agent → mobile) and feature complexity (core flow → resilience enhancements).

### Phase 1: Backend Foundation + Device Registry

**Rationale:** Backend provides the foundation for all other components. Cannot test mobile or agent without backend operational. Simplest component to build first (HTTP + WebSocket server with in-memory state). Establishes message routing patterns that other components depend on.

**Delivers:**
- Fastify server with HTTP and WebSocket support
- `/transcription` endpoint accepting POST with deviceId + text
- WebSocket server accepting persistent connections
- Connection registry (Map<deviceId, WebSocket>) for routing
- Device registration protocol (agents send deviceId on connect)
- `/devices` API returning list of connected agents
- Basic message routing (lookup deviceId, send via WebSocket)

**Addresses (from FEATURES.md):**
- Text delivery to desktop (backend routing piece)
- Device selection (backend provides device list)

**Avoids (from PITFALLS.md):**
- N/A for backend (core architecture risk is WebSocket half-open, addressed in Phase 2)

**Research flag:** Standard pattern, well-documented. Skip `/gsd:research-phase`.

---

### Phase 2: Desktop Agent + Resilience

**Rationale:** Agent is simpler than mobile (no native code, no UI, just console app). Building agent second enables end-to-end testing of backend message routing. Resilience features (reconnection, heartbeat, queue) are critical for production readiness and affect both agent and backend.

**Delivers:**
- Node.js desktop agent with WebSocket client (ws)
- Device registration on connect (hostname-based deviceId)
- Message handling for paste commands
- Clipboard write + keyboard simulation (nut.js: Ctrl+V)
- Auto-reconnection with exponential backoff (1s → 2s → 4s → max 30s)
- Heartbeat ping/pong (20-30s intervals, 10s timeout)
- Message queue with TTL for offline resilience
- Windows support (PowerShell clipboard, SendInput keyboard)

**Uses (from STACK.md):**
- ws 8.19.x — WebSocket client
- @nut-tree/nut-js 4.2.x — Keyboard automation
- clipboardy 5.2.x — Clipboard access

**Implements (from ARCHITECTURE.md):**
- Connection Registry pattern (agent side)
- Exponential Backoff with Jitter pattern
- Message Queue with TTL pattern

**Avoids (from PITFALLS.md):**
- WebSocket half-open connections (heartbeat mechanism)
- Clipboard race conditions (Windows-specific delays and verification)
- Message loss (queue with ACK protocol)

**Research flag:** Desktop automation on Windows may need `/gsd:research-phase` for edge cases (focus validation, elevated processes). Heartbeat and reconnection are standard patterns.

---

### Phase 3: Mobile App + Speech Recognition

**Rationale:** Mobile app is most complex (native Android integration, React UI, HTTP client). Requires backend (for HTTP) and agent (for end-to-end testing). Building mobile third enables full flow validation. Speech recognition is core value delivery but has strict lifecycle requirements.

**Delivers:**
- Capacitor 7 mobile app with React 18
- Android SpeechRecognizer integration (@capacitor-community/speech-recognition)
- SpeechRecognizerManager wrapper enforcing lifecycle constraints
- Voice button UI with tap-to-start/stop
- Partial results streaming during recognition
- HTTP client for transcription delivery (POST /transcription)
- Device selector UI (calls GET /devices, displays hostname list)
- Connection status indicator (visual feedback)
- es-AR locale configuration
- Error handling for all SpeechRecognizer error codes

**Uses (from STACK.md):**
- Capacitor 7.x — Native bridge
- @capacitor-community/speech-recognition 7.0.x — Android SpeechRecognizer
- Zustand 5.x — Global state (selected device, connection status)
- @tanstack/react-query 5.x — HTTP with retry/cache
- ky 1.x — Lightweight HTTP client

**Addresses (from FEATURES.md):**
- Voice input with tap-to-start/stop
- Speech-to-text transcription (es-AR)
- Device selection by hostname
- Connection status indicator
- Sub-2-second latency (STT component)

**Avoids (from PITFALLS.md):**
- Android SpeechRecognizer lifecycle crashes (manager wrapper in Phase 3)
- Message loss during disconnection (local queue before HTTP send)
- Spanish locale accuracy (es-AR configuration, word error rate benchmarks)

**Research flag:** Needs `/gsd:research-phase` for Android SpeechRecognizer lifecycle edge cases, error code handling, and es-AR accuracy validation.

---

### Phase 4: Cross-Platform + Polish

**Rationale:** Core flow (mobile → backend → desktop) works. This phase adds multi-platform agent support (Linux, Mac) and UX polish. Linux Wayland support is complex (display server detection, ydotool daemon). Mac adds AppleScript/Accessibility API requirements. UX enhancements improve user confidence without changing core flow.

**Delivers:**
- Linux desktop agent (X11 + Wayland support)
- Display server detection (X11 vs Wayland at runtime)
- ydotool integration for Wayland (with daemon setup docs)
- xdotool fallback for X11
- Mac desktop agent (AppleScript or Accessibility API for paste)
- End-to-end latency instrumentation
- Performance profiling (P50, P95, P99 latencies)
- UX enhancements (visual feedback during recognition, haptic on disconnect)
- Optional "review before paste" mode
- Pending message count indicator

**Addresses (from FEATURES.md):**
- Cross-platform agent (Windows, Mac, Linux)
- Silent success (no dialogs)
- Auto-paste at cursor (cross-platform completion)

**Avoids (from PITFALLS.md):**
- Linux Wayland keyboard simulation fragmentation (detection + fallback chain)
- Latency budget exceeded (instrumentation and profiling)

**Research flag:** Needs `/gsd:research-phase` for Linux Wayland automation (ydotool, wtype, tool comparison) and Mac Accessibility API (sandbox restrictions, permissions).

---

### Phase Ordering Rationale

- **Backend first:** Provides foundation for all testing. Simplest component (HTTP + WebSocket server, in-memory state). No dependencies on other components.

- **Agent second:** Simpler than mobile (no native code, no UI). Enables end-to-end testing of backend routing. Resilience features (heartbeat, reconnection, queue) benefit both agent and backend, so build together in Phase 2.

- **Mobile third:** Most complex component (native Android integration, React UI, SpeechRecognizer lifecycle). Requires backend (HTTP endpoint) and agent (end-to-end flow) to test properly. Speech recognition is critical but can only be validated with full system.

- **Cross-platform fourth:** Core flow must work before expanding platform support. Linux Wayland and Mac automation are niche complexity that shouldn't block core product. UX polish comes after core value delivery is validated.

- **Dependency-driven grouping:** Each phase delivers a testable unit. Phase 1 = backend testable via Postman/wscat. Phase 2 = agent testable with manual backend messages. Phase 3 = full end-to-end flow testable. Phase 4 = cross-platform expansion.

- **Pitfall alignment:** Each phase addresses specific pitfalls identified in research. Phase 1 avoids premature complexity. Phase 2 handles WebSocket resilience. Phase 3 tackles SpeechRecognizer lifecycle. Phase 4 solves platform fragmentation.

### Research Flags

Phases needing deeper research during planning (use `/gsd:research-phase`):

- **Phase 2 (Desktop Agent):** Windows SendInput edge cases (elevated processes, focus validation, lockscreen blocking). Clipboard race condition mitigation strategies. Not critical path but need validation.

- **Phase 3 (Mobile App):** Android SpeechRecognizer error handling (9+ error codes, device-specific behavior across OEMs like Samsung, Xiaomi). es-AR locale accuracy benchmarks (word error rate testing). Partial results streaming behavior. **High priority research.**

- **Phase 4 (Linux Agent):** Wayland automation tooling comparison (ydotool vs wtype vs alternatives). Daemon setup requirements. Non-ASCII character support. Custom keyboard layout handling. **High priority for Linux support.**

- **Phase 4 (Mac Agent):** macOS Accessibility API permissions and sandbox restrictions. AppleScript vs native API trade-offs. Keyboard simulation on modern macOS (security restrictions post-Catalina).

Phases with standard patterns (skip research, proceed to planning):

- **Phase 1 (Backend):** HTTP server with Fastify is well-documented. WebSocket server with @fastify/websocket has clear examples. Connection registry is standard Map pattern. No novel research needed.

- **Phase 2 (Reconnection):** Exponential backoff is standard algorithm. Heartbeat ping/pong is WebSocket best practice. Message queue with TTL is common pattern. All extensively documented.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **HIGH** | All recommendations verified with official docs, npm package stats, and GitHub repos. Version compatibility confirmed (Node 20+ alignment). Alternative comparisons based on bundle size, maintenance status, and community adoption. |
| Features | **MEDIUM** | Based on competitor analysis (Wispr Flow, Dragon, Otter) and general dictation software research. Feature prioritization inferred from UX patterns, not direct user research. Anti-features identified from complexity analysis. |
| Architecture | **HIGH** | Standard patterns for WebSocket routing, connection registry, exponential backoff. Data flow validated against local network constraints. Build order derived from clear dependency graph. Multiple authoritative sources on WebSocket best practices. |
| Pitfalls | **HIGH** | Critical pitfalls sourced from official Android docs (SpeechRecognizer), Microsoft docs (SendInput/Clipboard), WebSocket RFC (heartbeat), and 2026 technical guides. Community validation from Medium, GitHub discussions, and HN threads. Recovery strategies based on established patterns. |

**Overall confidence:** **HIGH**

Research is based on official documentation (Android Developers, Microsoft Learn, WebSocket specs), verified libraries (npm stats, GitHub stars/activity), and recent technical guides (2026 sources on WebSocket patterns, STT latency, offline-first mobile). Feature recommendations are MEDIUM confidence (inferred from competitors, not direct user research) but all other areas are HIGH confidence with authoritative sources.

### Gaps to Address

Areas where research was inconclusive or needs validation during implementation:

- **es-AR locale accuracy:** Research confirms es-AR is supported by Android SpeechRecognizer, but word error rate benchmarks are generic Spanish, not Argentina-specific. **During Phase 3:** Test with native Argentine speakers, measure word error rate on common phrases, validate accent handling.

- **Windows clipboard delay tuning:** Research identifies race condition issue and suggests 50-100ms delay, but optimal delay may vary by system. **During Phase 2:** Implement configurable delay, test on multiple Windows versions (10, 11), profile clipboard write-to-read latency.

- **Heartbeat interval optimization:** Research recommends 20-30 second intervals, but optimal value depends on NAT timeout behavior on target networks. **During Phase 2:** Make configurable, test on typical home router NAT timeouts, measure false positive disconnect rate.

- **Message queue TTL:** Research suggests 5-minute TTL, but right value depends on user behavior (how long between dictations during disconnection?). **During Phase 2:** Make configurable, add telemetry to measure actual offline durations, adjust based on usage patterns.

- **mDNS discovery vs manual config:** Research identifies both approaches but doesn't prioritize. **During Phase 1:** Start with manual IP configuration for simplicity. Add mDNS discovery in Phase 4 if user feedback requests it.

- **Cross-platform keyboard automation trade-offs:** nut.js is recommended but Linux Wayland support is via ydotool (requires daemon). **During Phase 4:** Research confirms fragmentation, but need to validate ydotool installation UX and fallback strategies for users without daemon access.

## Sources

### Primary (HIGH confidence)

From STACK.md:
- GitHub: capacitor-community/speech-recognition — Plugin docs, version 7.0.1, native Android implementation
- GitHub: fastify/fastify-websocket — @fastify/websocket built on ws@8
- nutjs.dev — nut.js v4.2.0, keyboard/clipboard APIs, Windows/Linux support
- GitHub: websockets/ws — ws 8.19.0, closeTimeout option
- npmjs.com: fastify@5.7.4, @fastify/websocket@11.2.0, zustand@5.0.11, @tanstack/react-query@5.90.20
- GitHub: sindresorhus/clipboardy — clipboardy v5.2.1, Windows/Linux support
- capacitorjs.com/docs/updating/7-0 — Capacitor 7 requirements (Node 20+)

From ARCHITECTURE.md:
- WebSocket reconnection patterns — OneUptime blog (2026-01-27)
- Exponential backoff strategies — Dev.to/Hexshift
- Fastify WebSocket guide — BetterStack
- @fastify/websocket official docs — GitHub
- ws library for Node.js — GitHub
- Capacitor speech recognition — GitHub
- nut.js for desktop automation — nutjs.dev

From PITFALLS.md:
- Android SpeechRecognizer API Reference — Android Developers (official)
- SendInput function — Win32 API, Microsoft Learn (official)
- WebSocket keepalive and latency — websockets.readthedocs.io (official library docs)
- WebSocket heartbeat/ping-pong — OneUptime (2026-01-27)
- WebSocket reconnection logic — OneUptime (2026-01-27)
- Real-time transcription guide — Picovoice (2026)
- Low latency voice AI (300ms rule) — AssemblyAI
- Android Speech To Text guide — Medium/Reveri Engineering
- SpeechRecognizer error codes — GitHub Gist
- Windows 11 clipboard behavior — Windows Latest (2026-01-05)
- Wayland keyboard simulation fragmentation — Hacker News, Gabriel Staples ydotool tutorial
- Offline-first mobile apps — Beefed.ai

### Secondary (MEDIUM confidence)

From FEATURES.md:
- Zapier: Best Dictation Software 2026
- TechCrunch: AI Dictation Apps 2025
- Deepgram: STT Benchmarks
- Picovoice: STT Latency Analysis
- Ably: WebSocket Architecture Best Practices
- Wispr Flow vs Otter Comparison
- Microsoft: Spanish Language Support
- NN/g: Confirmation Dialogs UX
- Smashing Magazine: Notifications UX 2025

From STACK.md:
- Velt Blog: WebSocket Libraries (ws vs Socket.IO comparison)
- developerway.com: React State Management 2025 (Zustand + TanStack Query recommendation)
- Dev.to: Ky HTTP Client (ky vs Axios bundle size)
- OpenJS Foundation: Fastify v5 (Node 20+ requirement)

### Tertiary (LOW confidence)

No tertiary sources used. All recommendations verified with multiple sources or official documentation.

---
*Research completed: 2026-02-06*
*Ready for roadmap: yes*
