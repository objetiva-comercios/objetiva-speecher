# Objetiva Speecher

## What This Is

A voice-to-text system that lets you dictate from your Android phone and have the transcribed text instantly auto-paste at the cursor position on a selected PC (Windows or Linux). Supports Spanish voice commands for punctuation, symbols, and keyboard actions (Enter, Tab). Works entirely on your local network with no cloud dependencies.

**Current State:** v1.1 shipped — full voice-to-cursor flow with command parsing and key actions.

## Core Value

Instant, reliable voice-to-cursor flow. From the moment you finish dictating to text appearing on screen should be under 2 seconds, with zero manual intervention.

## Requirements

### Validated

- Dictate voice from Android using free Google SpeechRecognizer (es-AR) — v1.0
- Tap-to-start, tap-to-stop button interface on mobile — v1.0
- Send transcribed text to backend via HTTP — v1.0
- Backend receives transcriptions and routes via WebSocket to correct agent — v1.0
- Client agent connects to backend with hostname-based deviceId — v1.0
- Client agent auto-pastes received text at current cursor position — v1.0
- Mobile app displays list of connected PCs (by hostname) — v1.0
- Select target PC from list before dictating — v1.0
- Queue and retry transcriptions if connection drops — v1.0
- Client agent copies text to clipboard AND simulates paste — v1.0
- Backend manages WebSocket connections and message routing — v1.0
- Windows agent with robotjs keyboard simulation — v1.0
- Linux agent with xdotool keyboard simulation — v1.0
- Parse voice commands in mobile app before sending — v1.1
- Support punctuation commands (punto, coma, dos puntos, etc.) — v1.1
- Support "nueva linea" / "enter" to insert Enter key — v1.1
- Support "tabulador" / "tab" to insert Tab key — v1.1
- Support "espacio" for explicit space insertion — v1.1
- Command words replaced with their symbols — v1.1

### Active

**Current Milestone: v1.2 Navigation & Settings**

**Goal:** Add bottom navigation with 3 tabs (Historial, Speech, Config) and separate history/settings screens

**Target features:**
- Bottom navigation bar with center mic icon (large) and two side icons (small)
- Speech tab (center, default) — current main screen with device selector and recording
- Double tap on center mic icon enters text editing mode
- History tab (left) — transcription history in its own screen
- Config tab (right) — server URL, device info, app version

### Out of Scope
- Custom phrase replacement system — future feature
- Multi-language support beyond es-AR — future feature
- Authentication/authorization — single user on private network, not needed
- Cloud/internet deployment — local network only
- iOS support — Android only
- macOS support — different automation APIs
- Linux Wayland support — ydotool needed

## Context

**Shipped v1.1 with:**
- Backend (Fastify + WebSocket), Windows agent (robotjs), Linux agent (xdotool), Mobile app (Capacitor + React)
- Command parser with 23 Spanish voice commands, 63 tests
- Segment/KeyAction protocol for keyboard action simulation
- mDNS auto-discovery with production fallback
- Production backend at speecher.objetiva.com.ar

**Technical environment:**
- 1-5 Windows/Linux PCs on local network
- Android phone (Capacitor app)
- All devices on same WiFi or via production VPS

## Constraints

- **Tech Stack**: Capacitor + React (mobile), Node.js + Fastify (backend), Node.js (agents)
- **Platform**: Android only for mobile, Windows/Linux for agents
- **Speech API**: Android SpeechRecognizer only, no paid APIs
- **Language**: Spanish (es-AR) for v1
- **Network**: Local network + production VPS fallback

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Always auto-paste (no manual trigger) | Speed matters most; undo is acceptable | ✓ Good |
| Paste anywhere (no app whitelisting) | Simplicity over safety | ✓ Good |
| Queue and retry on connection drops | Reliability requirement | ✓ Good |
| Hostname-based device naming | Simple, automatic | ✓ Good |
| @jitsi/robotjs for Windows | nut-tree requires paid registry | ✓ Good |
| xdotool spawn for Linux | No native compilation needed | ✓ Good |
| mDNS with fallback to stored URL | Handle discovery failures | ✓ Good |
| Parse commands in mobile app | Simplest, no backend/agent changes for Phase 5 | ✓ Good |
| Replace command words with symbols | "punto" → "." (not append) | ✓ Good |
| Segment discriminated union | Type-safe exhaustive pattern matching | ✓ Good |
| Pass-through pattern for payload | Backend stores/forwards, agents interpret | ✓ Good |
| xdotool uses X11 keysym names | enter → Return, tab → Tab | ✓ Good |

---
*Last updated: 2026-03-23 after starting v1.2 milestone*
