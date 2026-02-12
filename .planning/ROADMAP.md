# Roadmap: Objetiva Speecher

## Overview

This roadmap delivers a voice-to-text system where users dictate on Android and text auto-pastes at the cursor on their PC. The journey builds backend routing first (foundation for all testing), then Windows desktop agent (enables E2E testing), then mobile app with voice recognition (most complex, requires working backend + agent), and finally Linux agent support (expands platform coverage after core flow works).

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4): Planned milestone work
- Decimal phases (e.g., 2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

### Milestone v1.0 (Completed)

- [x] **Phase 1: Backend Foundation** - HTTP/WebSocket server that routes transcriptions to agents
- [x] **Phase 2: Windows Desktop Agent** - Receives text via WebSocket, auto-pastes at cursor
- [x] **Phase 3: Mobile App + Voice** - Android voice capture with device selection and resilience
- [x] **Phase 4: Linux Desktop Agent** - X11 agent support for Linux workstations

### Milestone v1.1 (Active)

- [ ] **Phase 5: Command Parser & Text Symbols** - Parse voice commands and replace with punctuation/symbols
- [ ] **Phase 6: Key Actions Protocol** - Extend protocol for Enter/Tab keyboard simulation

## Phase Details

### Phase 1: Backend Foundation (v1.0)
**Goal**: Backend accepts transcriptions from mobile and routes them to the correct desktop agent via WebSocket
**Depends on**: Nothing (first phase)
**Requirements**: BACK-01, BACK-02, BACK-03, BACK-04, BACK-05, BACK-06, BACK-07, BACK-08, RES-07
**Success Criteria** (what must be TRUE):
  1. POST /transcription accepts deviceId and text, returns success/error response
  2. Desktop agent can connect via WebSocket and appears in connection registry
  3. GET /devices returns list of currently connected agent hostnames
  4. Text sent to /transcription arrives at the correct agent's WebSocket connection
  5. Agent receives ACK from backend confirming message delivery
**Plans**: 5 plans

Plans:
- [x] 01-01-PLAN.md - Project scaffolding, dependencies, and type definitions
- [x] 01-02-PLAN.md - Connection registry and message queue services
- [x] 01-03-PLAN.md - WebSocket handler with heartbeat and ACK mechanism
- [x] 01-04-PLAN.md - HTTP routes for transcription and device listing
- [x] 01-05-PLAN.md - Fastify integration and server entry point

### Phase 2: Windows Desktop Agent (v1.0)
**Goal**: Windows PC receives text from backend and auto-pastes it at the current cursor position
**Depends on**: Phase 1
**Requirements**: WIN-01, WIN-02, WIN-03, WIN-04, WIN-05, WIN-06, WIN-07, WIN-08, RES-04, RES-05, RES-06, DEL-02, DEL-04, DEL-05
**Success Criteria** (what must be TRUE):
  1. Agent connects to backend with hostname-based deviceId and appears in /devices
  2. Text received via WebSocket appears at cursor position in any focused application
  3. Agent reconnects automatically after network interruption (with exponential backoff)
  4. Agent responds to heartbeat pings and detects connection loss via missed pongs
  5. If paste simulation fails, text remains in clipboard for manual paste
**Plans**: 4 plans

Plans:
- [x] 02-01-PLAN.md - Project scaffolding, TypeScript config, types, and configuration
- [x] 02-02-PLAN.md - Paste flow: clipboard operations, keyboard simulation, orchestration
- [x] 02-03-PLAN.md - WebSocket connection with reconnection and entry point
- [x] 02-04-PLAN.md - End-to-end verification and human testing

### Phase 3: Mobile App + Voice (v1.0)
**Goal**: User dictates on Android phone, text is transcribed and delivered to selected PC with full resilience
**Depends on**: Phase 2
**Requirements**: VOICE-01, VOICE-02, VOICE-03, VOICE-04, VOICE-05, VOICE-06, VOICE-07, VOICE-08, DEV-01, DEV-02, DEV-03, DEV-04, DEV-05, DEV-06, RES-01, RES-02, RES-03, RES-08, DEL-01, DEL-03
**Success Criteria** (what must be TRUE):
  1. User taps button, speaks in Spanish, sees partial transcription, taps stop, text appears on selected PC
  2. End-to-end latency from tap-stop to paste is under 2 seconds (P95)
  3. User can select target PC from list of connected devices (by hostname)
  4. Transcriptions made while offline are queued and delivered when connection restores
  5. App shows connection status and handles speech recognition errors gracefully
**Plans**: 8 plans

Plans:
- [x] 03-01-PLAN.md - Project setup, Capacitor config, shared types
- [x] 03-02-PLAN.md - Services: storage, queue, API client
- [x] 03-03-PLAN.md - Services: network, discovery, speech recognition
- [x] 03-04-PLAN.md - Device selection UI and network status hooks
- [x] 03-05-PLAN.md - Voice recording UI and speech recognition hook
- [x] 03-06-PLAN.md - Transcription editor, queue list, success feedback
- [x] 03-07-PLAN.md - App integration and Android configuration
- [x] 03-08-PLAN.md - End-to-end verification on device

### Phase 4: Linux Desktop Agent (v1.0)
**Goal**: Linux workstations (X11) can receive and auto-paste text like Windows agents
**Depends on**: Phase 2
**Requirements**: LIN-01, LIN-02, LIN-03, LIN-04, LIN-05, LIN-06, LIN-07
**Success Criteria** (what must be TRUE):
  1. Linux agent connects to backend with hostname-based deviceId
  2. Text received via WebSocket appears at cursor position on X11 desktop
  3. Agent detects X11 display server and uses compatible clipboard/keyboard tools
  4. Agent shares reconnection and heartbeat behavior with Windows agent
**Plans**: 4 plans

Plans:
- [x] 04-01-PLAN.md - Project scaffolding, types, config, and startup validation
- [x] 04-02-PLAN.md - Paste flow: clipboard and xdotool keyboard simulation
- [x] 04-03-PLAN.md - WebSocket connection with reconnection and entry point
- [x] 04-04-PLAN.md - End-to-end verification on Linux desktop

### Phase 5: Command Parser & Text Symbols (v1.1)
**Goal**: User can dictate punctuation and symbols using Spanish voice commands that are replaced with their text equivalents
**Depends on**: Phase 3
**Requirements**: PARSE-01, PARSE-02, PARSE-03, PARSE-04, PARSE-05, KEY-03, PUNCT-01, PUNCT-02, PUNCT-03, PUNCT-04, PUNCT-05, PUNCT-06, PUNCT-07, PUNCT-08, PUNCT-09, PUNCT-10, PUNCT-11, PUNCT-12, PUNCT-13, PUNCT-14
**Success Criteria** (what must be TRUE):
  1. User says "punto" and "." appears in transcription at cursor position
  2. User says "coma dos puntos enter" and ",:" appears (mixed commands and text work correctly)
  3. User says "arroba ejemplo punto com" and "@ejemplo.com" appears (compound commands work)
  4. Command detection is case-insensitive (both "Punto" and "punto" produce ".")
  5. User says "espacio" and an explicit space character is inserted
**Plans**: 3 plans

Plans:
- [ ] 05-01-PLAN.md - Command parser with TDD (pure function + test suite)
- [ ] 05-02-PLAN.md - Hook integration and visual feedback
- [ ] 05-03-PLAN.md - End-to-end verification on Android device

### Phase 6: Key Actions Protocol (v1.1)
**Goal**: User can insert keyboard actions (Enter, Tab) via voice commands, executed by agents as actual key presses
**Depends on**: Phase 5
**Requirements**: KEY-01, KEY-02, BACK-09, BACK-10, AGENT-01, AGENT-02
**Success Criteria** (what must be TRUE):
  1. User says "nueva linea" or "enter" and cursor moves to next line in target application
  2. User says "tabulador" or "tab" and Tab key is pressed in target application
  3. Backend accepts and forwards messages containing key actions (not just text strings)
  4. Windows agent executes received key actions using robotjs
  5. Linux agent executes received key actions using xdotool
**Plans**: Not yet planned

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Backend Foundation | 5/5 | Complete | 2026-02-07 |
| 2. Windows Desktop Agent | 4/4 | Complete | 2026-02-07 |
| 3. Mobile App + Voice | 8/8 | Complete | 2026-02-11 |
| 4. Linux Desktop Agent | 4/4 | Complete | 2026-02-11 |
| 5. Command Parser & Text Symbols | 0/3 | Planning Complete | — |
| 6. Key Actions Protocol | 0/? | Not Started | — |

---
*Roadmap created: 2026-02-06*
*Last updated: 2026-02-12 (Phase 5 planning complete)*
