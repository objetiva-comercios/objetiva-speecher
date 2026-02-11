# Requirements: Objetiva Speecher

**Defined:** 2026-02-06
**Core Value:** Instant, reliable voice-to-cursor flow under 2 seconds with zero manual intervention

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Backend Server

- [ ] **BACK-01**: Backend accepts HTTP POST /transcription with deviceId and text
- [ ] **BACK-02**: Backend maintains WebSocket server for agent connections
- [ ] **BACK-03**: Backend maintains connection registry (deviceId -> WebSocket mapping)
- [ ] **BACK-04**: Backend routes transcriptions to correct agent via WebSocket
- [ ] **BACK-05**: Backend provides GET /devices API listing connected agents
- [ ] **BACK-06**: Backend handles agent registration on WebSocket connect
- [ ] **BACK-07**: Backend removes agents from registry on disconnect
- [ ] **BACK-08**: Backend implements heartbeat ping/pong (20-30s intervals)

### Voice Input & Recognition

- [ ] **VOICE-01**: Mobile app provides tap-to-start voice recording button
- [ ] **VOICE-02**: Mobile app provides tap-to-stop voice recording function
- [ ] **VOICE-03**: Mobile app integrates Android SpeechRecognizer with es-AR locale
- [ ] **VOICE-04**: Mobile app displays partial results during recognition
- [ ] **VOICE-05**: Mobile app displays final transcription result
- [ ] **VOICE-06**: Mobile app shows connection status indicator (connected/disconnected)
- [ ] **VOICE-07**: Mobile app handles all SpeechRecognizer error codes gracefully
- [ ] **VOICE-08**: Mobile app auto-reconnects to backend when connection drops

### Device Management

- [ ] **DEV-01**: Mobile app discovers backend server via mDNS
- [ ] **DEV-02**: Mobile app fetches list of connected devices from backend
- [ ] **DEV-03**: Mobile app displays devices by hostname in selection list
- [ ] **DEV-04**: Mobile app allows user to select target device
- [ ] **DEV-05**: Mobile app persists selected device across app restarts
- [ ] **DEV-06**: Mobile app updates device list when devices connect/disconnect

### Desktop Agent (Windows)

- [ ] **WIN-01**: Windows agent connects to backend via WebSocket
- [ ] **WIN-02**: Windows agent registers with hostname-based deviceId
- [ ] **WIN-03**: Windows agent receives text via WebSocket messages
- [ ] **WIN-04**: Windows agent writes text to clipboard using clipboardy
- [ ] **WIN-05**: Windows agent simulates Ctrl+V keystroke using nut.js
- [ ] **WIN-06**: Windows agent adds 50-100ms delay between clipboard write and paste
- [ ] **WIN-07**: Windows agent verifies clipboard content before pasting
- [ ] **WIN-08**: Windows agent retries paste if verification fails

### Desktop Agent (Linux X11)

- [ ] **LIN-01**: Linux agent connects to backend via WebSocket
- [ ] **LIN-02**: Linux agent registers with hostname-based deviceId
- [ ] **LIN-03**: Linux agent receives text via WebSocket messages
- [ ] **LIN-04**: Linux agent writes text to clipboard using clipboardy/xclip
- [ ] **LIN-05**: Linux agent simulates Ctrl+V keystroke using nut.js/xdotool
- [ ] **LIN-06**: Linux agent detects X11 display server at runtime
- [ ] **LIN-07**: Linux agent uses X11-compatible clipboard and keyboard tools

### Connection Resilience

- [ ] **RES-01**: Mobile app queues transcriptions locally when offline
- [ ] **RES-02**: Mobile app replays queued transcriptions on reconnect
- [ ] **RES-03**: Mobile app implements exponential backoff reconnection (1s -> 30s max)
- [ ] **RES-04**: Desktop agent implements exponential backoff reconnection (1s -> 30s max)
- [ ] **RES-05**: Desktop agent responds to heartbeat ping with pong
- [ ] **RES-06**: Desktop agent detects missed pongs and reconnects
- [ ] **RES-07**: Backend implements message acknowledgment protocol
- [ ] **RES-08**: Mobile app marks transcriptions as sent only after ACK received

### Text Delivery

- [ ] **DEL-01**: End-to-end latency from tap-stop to paste under 2 seconds (P95)
- [ ] **DEL-02**: Desktop agent auto-pastes at current cursor position
- [ ] **DEL-03**: Mobile app provides silent success (no confirmation dialogs)
- [ ] **DEL-04**: Desktop agent falls back to clipboard-only if paste fails
- [ ] **DEL-05**: Desktop agent logs paste events for debugging

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Voice Commands

- **CMD-01**: User can say "new line" to insert Enter key
- **CMD-02**: User can say "tab" to insert Tab key
- **CMD-03**: User can say "delete last word" to remove previous word
- **CMD-04**: User can say "undo that" to reverse last transcription

### Phrase Replacement

- **PHR-01**: User can configure custom phrase replacements
- **PHR-02**: User can map abbreviations to full text
- **PHR-03**: User can save commonly used snippets
- **PHR-04**: User can sync replacement dictionary across devices

### Advanced Platforms

- **PLT-01**: Linux Wayland support with ydotool
- **PLT-02**: macOS support with Accessibility API
- **PLT-03**: iOS support with SFSpeechRecognizer

### Multi-Language

- **LANG-01**: Support es-ES (Spain Spanish)
- **LANG-02**: Support en-US (US English)
- **LANG-03**: Support pt-BR (Brazilian Portuguese)
- **LANG-04**: User can switch language from mobile app

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Authentication/authorization | Single user on private network, not needed for v1 |
| Cloud deployment | Local network only for v1, adds complexity and cost |
| Real-time streaming transcription | Higher complexity, current tap-to-stop is sufficient |
| AI text formatting/cleanup | Adds LLM dependency, cost, latency - defer to v2 |
| Meeting transcription | Different product category, out of scope |
| Multi-user support | Single user for v1, multi-tenancy adds complexity |
| Voice command parsing | Deferred to v2, needs design and testing |
| Custom phrase replacement | Deferred to v2, needs configuration UI |
| iOS app | Android only for v1, iOS adds development overhead |
| Linux Wayland support | Deferred to v2, fragmented tooling needs research |
| macOS support | Deferred to v2, different automation APIs |
| Web Speech API | Inferior to native Android SpeechRecognizer |
| Paid speech APIs | Free Android SpeechRecognizer sufficient for v1 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BACK-01 | Phase 1 | Complete |
| BACK-02 | Phase 1 | Complete |
| BACK-03 | Phase 1 | Complete |
| BACK-04 | Phase 1 | Complete |
| BACK-05 | Phase 1 | Complete |
| BACK-06 | Phase 1 | Complete |
| BACK-07 | Phase 1 | Complete |
| BACK-08 | Phase 1 | Complete |
| RES-07 | Phase 1 | Complete |
| WIN-01 | Phase 2 | Complete |
| WIN-02 | Phase 2 | Complete |
| WIN-03 | Phase 2 | Complete |
| WIN-04 | Phase 2 | Complete |
| WIN-05 | Phase 2 | Complete |
| WIN-06 | Phase 2 | Complete |
| WIN-07 | Phase 2 | Complete |
| WIN-08 | Phase 2 | Complete |
| RES-04 | Phase 2 | Complete |
| RES-05 | Phase 2 | Complete |
| RES-06 | Phase 2 | Complete |
| DEL-02 | Phase 2 | Complete |
| DEL-04 | Phase 2 | Complete |
| DEL-05 | Phase 2 | Complete |
| VOICE-01 | Phase 3 | Complete |
| VOICE-02 | Phase 3 | Complete |
| VOICE-03 | Phase 3 | Complete |
| VOICE-04 | Phase 3 | Complete |
| VOICE-05 | Phase 3 | Complete |
| VOICE-06 | Phase 3 | Complete |
| VOICE-07 | Phase 3 | Complete |
| VOICE-08 | Phase 3 | Complete |
| DEV-01 | Phase 3 | Complete |
| DEV-02 | Phase 3 | Complete |
| DEV-03 | Phase 3 | Complete |
| DEV-04 | Phase 3 | Complete |
| DEV-05 | Phase 3 | Complete |
| DEV-06 | Phase 3 | Complete |
| RES-01 | Phase 3 | Complete |
| RES-02 | Phase 3 | Complete |
| RES-03 | Phase 3 | Complete |
| RES-08 | Phase 3 | Complete |
| DEL-01 | Phase 3 | Complete |
| DEL-03 | Phase 3 | Complete |
| LIN-01 | Phase 4 | Pending |
| LIN-02 | Phase 4 | Pending |
| LIN-03 | Phase 4 | Pending |
| LIN-04 | Phase 4 | Pending |
| LIN-05 | Phase 4 | Pending |
| LIN-06 | Phase 4 | Pending |
| LIN-07 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 50
- Mapped to phases: 50
- Unmapped: 0

---
*Requirements defined: 2026-02-06*
*Last updated: 2026-02-11 after Phase 3 completion*
