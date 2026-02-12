# Objetiva Speecher

## What This Is

A voice-to-text system that lets you dictate from your Android phone and have the transcribed text instantly auto-paste at the cursor position on a selected PC (Windows or Linux). Designed for personal productivity when you're away from the keyboard but need to input text. Works entirely on your local network with no cloud dependencies.

**Current State:** v1.0 shipped with full Android → Windows/Linux flow working.

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

### Active

(None — planning next milestone)

### Out of Scope

- Voice commands for special keys (Enter, Tab, etc.) — v2 feature, needs design
- Custom phrase replacement system — v2 feature, needs configuration approach
- Multi-language support beyond es-AR — v2 feature
- Authentication/authorization — single user on private network, not needed
- Cloud/internet deployment — local network only
- iOS support — Android only
- macOS support — v2 feature, different automation APIs
- Linux Wayland support — v2 feature, ydotool

## Context

**Shipped v1.0 with:**
- 4,765 lines of TypeScript
- Backend (Fastify + WebSocket), Windows agent (robotjs), Linux agent (xdotool), Mobile app (Capacitor + React)
- 5 days development (2026-02-06 → 2026-02-11)

**Technical environment:**
- 1-5 Windows/Linux PCs on local network
- Android phone (Capacitor app)
- All devices on same WiFi

## Constraints

- **Tech Stack**: Capacitor + React (mobile), Node.js + Fastify (backend), Node.js (agents)
- **Platform**: Android only for mobile, Windows/Linux for agents
- **Speech API**: Android SpeechRecognizer only, no paid APIs
- **Language**: Spanish (es-AR) for v1
- **Network**: Local network only

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Always auto-paste (no manual trigger) | Speed matters most; undo is acceptable | ✓ Good |
| Paste anywhere (no app whitelisting) | Simplicity over safety | ✓ Good |
| Silent success (no mobile feedback) | Minimize friction in dictation flow | ✓ Good |
| Queue and retry on connection drops | Reliability requirement | ✓ Good |
| Hostname-based device naming | Simple, automatic | ✓ Good |
| @jitsi/robotjs for Windows | nut-tree requires paid registry | ✓ Good |
| xdotool spawn for Linux | No native compilation needed | ✓ Good |
| mDNS with fallback to stored URL | Handle discovery failures | ✓ Good |
| Discriminated union for API responses | Type safety | ✓ Good |
| Duplicate types per agent | Simplicity over shared package | — Pending review |

---
*Last updated: 2026-02-11 after v1.0 milestone*
