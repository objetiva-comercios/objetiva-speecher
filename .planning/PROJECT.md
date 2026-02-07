# Objetiva Speecher

## What This Is

A voice-to-text system that lets you dictate from your Android phone and have the transcribed text instantly auto-paste at the cursor position on a selected PC. Designed for personal productivity when you're away from the keyboard but need to input text (during meetings, thinking through ideas, vibe coding/prompting). Works entirely on your local network with no cloud dependencies.

## Core Value

Instant, reliable voice-to-cursor flow. From the moment you finish dictating to text appearing on screen should be under 2 seconds, with zero manual intervention. Speed, reliability, and accuracy must all work together.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Dictate voice from Android using free Google SpeechRecognizer (es-AR)
- [ ] Tap-to-start, tap-to-stop button interface on mobile
- [ ] Send transcribed text to backend via HTTP
- [ ] Backend receives transcriptions and routes via WebSocket to correct agent
- [ ] Client agent connects to backend with hostname-based deviceId
- [ ] Client agent auto-pastes received text at current cursor position
- [ ] Mobile app displays list of connected PCs (by hostname)
- [ ] Select target PC from list before dictating
- [ ] Queue and retry transcriptions if connection drops
- [ ] Client agent copies text to clipboard AND simulates paste
- [ ] Backend manages WebSocket connections and message routing
- [ ] Monorepo structure: mobile-app/, client-agent/, backend-server/

### Out of Scope

- Voice commands for special keys (Enter, Tab, etc.) — v2 feature, needs design
- Custom phrase replacement system — v2 feature, needs configuration approach
- Multi-language support beyond es-AR — v1 focuses on Spanish only
- Authentication/authorization — single user on private network, not needed yet
- Cloud/internet deployment — local network only for v1
- iOS support — Android only for v1
- Confirmation feedback on mobile — silent success keeps flow fast
- App whitelisting for paste safety — paste anywhere, undo if needed

## Context

**Personal productivity tool** for a single user who frequently needs to input text while away from the keyboard. Primary use cases:
- Vibe coding / prompting while thinking through ideas
- Meetings or calls where typing is awkward or distracting
- Moving around workspace while PC is at desk

**Technical environment:**
- 1-5 Windows/Linux PCs on local network
- Android phone (Capacitor app)
- All devices on same WiFi
- Manual backend startup is acceptable

**User expectations:**
- Aggressive speed-first approach: auto-paste immediately on arrival
- High reliability: never lose a transcription, queue and retry on failures
- Minimal friction: no confirmations, no manual paste triggers
- Spanish (Argentina) speech recognition quality matters

## Constraints

- **Tech Stack**: Capacitor + React (mobile), Node.js + Fastify (backend), Node.js (client agent) — non-negotiable, specified in requirements
- **Platform**: Android only for mobile, Windows/Linux for client agent — v1 scope decision
- **Speech API**: Android SpeechRecognizer only, no paid APIs, no Web Speech API — cost and reliability constraint
- **Language**: Spanish (es-AR) — user's primary language
- **Network**: Local network only, no internet exposure — privacy and simplicity
- **Deployment**: Manual Node.js process for backend — acceptable for single-user setup

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Always auto-paste (no manual trigger) | Speed matters most; undo is acceptable if wrong location | — Pending |
| Paste anywhere (no app whitelisting) | Simplicity over safety; user knows when they're dictating | — Pending |
| Silent success (no mobile feedback) | Minimize friction in dictation flow | — Pending |
| Queue and retry on connection drops | Reliability requirement; never lose transcriptions | — Pending |
| Hostname-based device naming | Simple, automatic, no manual configuration needed | — Pending |
| Monorepo structure | Three tightly coupled components, easier to develop together | — Pending |
| Native Android plugin for speech | Web Speech API insufficient; need native SpeechRecognizer control | — Pending |

---
*Last updated: 2026-02-06 after initialization*
