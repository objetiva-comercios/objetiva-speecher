# Feature Research

**Domain:** Voice-to-Text Dictation with Mobile-to-Desktop Sync
**Researched:** 2026-02-06
**Confidence:** MEDIUM (based on web search of current market landscape)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Voice Input & Recording** | Core product function - tap to start/stop | LOW | Standard mobile audio capture APIs |
| **Speech-to-Text Transcription** | Core product function - the main value | MEDIUM | Requires STT API integration (cloud-based or local) |
| **Text Delivery to Desktop** | Core product function - completing the workflow | MEDIUM | WebSocket connection, message routing |
| **Device Selection** | User needs to target specific PC | LOW | List connected clients by hostname |
| **Connection Status Indicator** | Users need to know if dictation will work | LOW | Visual indicator of WebSocket state |
| **Reconnection on Disconnect** | Network is unreliable, especially mobile | MEDIUM | Exponential backoff, automatic retry |
| **Queue on Connection Loss** | Never lose transcriptions | MEDIUM | Local queue, flush when reconnected |
| **Sub-2-second Latency** | Industry expects <300ms STT, <500ms total | MEDIUM | API selection critical; Deepgram achieves 150ms |
| **Adequate Accuracy (>90%)** | Minimum usability threshold | MEDIUM | Modern APIs achieve 95%+; es-AR datasets show 95% SAR |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Auto-Paste at Cursor** | Zero friction - no Ctrl+V required | MEDIUM | Requires desktop agent with OS-level keyboard simulation |
| **Silent Success** | No interruptions, no dialogs, no confirmations | LOW | UX decision - avoid "dialog fatigue" |
| **Hostname-Based PC Selection** | Intuitive device identification | LOW | Use computer hostname rather than generic "Device 1" |
| **Single-Purpose Simplicity** | Fast, focused, no feature bloat | LOW | Most competitors are complex; this is intentional constraint |
| **Cross-Platform Agent** | Works on Windows, Mac, Linux | HIGH | Different keyboard simulation per OS (Windows first) |
| **No Account Required (v1)** | Immediate usability, no signup friction | LOW | Simplifies architecture, privacy benefit |

### Anti-Features (Deliberately NOT Building in v1)

Features to explicitly NOT build. Common in competitors but out of scope.

| Anti-Feature | Why Requested | Why Avoid in v1 | Alternative/Later |
|--------------|---------------|-----------------|-------------------|
| **Voice Commands (Enter, Tab, etc.)** | Users want to control cursor/formatting | Adds complexity, parsing logic, error states | v2: Build after core dictation is solid |
| **Custom Phrase Replacement** | Auto-correct, abbreviation expansion | Requires dictionary management, edge cases | v2: Consider after user feedback |
| **Multi-Language Support** | International users expect it | Exponential complexity; es-AR is target market | v2: Add languages based on demand |
| **Authentication/User Accounts** | Multi-user, security, sync | Significant infrastructure; personal tool doesn't need it | v2: Only if multi-user or cloud sync needed |
| **Real-Time Streaming Transcription** | Words appear as you speak | Higher complexity, more network traffic, partial results | v2: Evaluate if tap-to-stop latency is insufficient |
| **Meeting Transcription** | Common in Otter.ai, competitors | Different product category entirely | Out of scope |
| **AI Text Formatting/Cleanup** | Wispr Flow differentiator | Adds LLM dependency, cost, latency | v2: Maybe for polished prose mode |
| **Custom Vocabulary/Learning** | Dragon Professional feature | Significant ML infrastructure | v2: Only if accuracy issues reported |
| **Offline/Local Transcription** | Privacy, no internet requirement | Requires bundling Whisper model (~1GB+), GPU | v2: Evaluate based on latency/privacy needs |
| **Visual Confirmation Feedback** | "Your text was sent!" popups | Dialog fatigue, interrupts flow | Keep silent; log for debugging only |
| **Push Notifications** | "PC connected/disconnected" | Interruptions for low-value info | Status shown in-app only |

## Feature Dependencies

```
[Mobile App: Voice Recording]
    |
    v
[STT API: Transcription] -----> [Backend: Message Routing]
                                         |
                                         v
                                [WebSocket: Delivery]
                                         |
                                         v
                        [Desktop Agent: Auto-Paste at Cursor]

Connection Management (parallel concern):
[Connection Status] --enables--> [Device Selection]
[Queue/Retry Logic] --resilience--> [WebSocket Delivery]
```

### Dependency Notes

- **Transcription requires Voice Recording:** Cannot transcribe without audio capture
- **Text Delivery requires Backend Running:** WebSocket hub must be operational
- **Auto-Paste requires Desktop Agent:** OS-level keyboard simulation only possible from native agent
- **Device Selection requires Connection Status:** Can only show connected PCs
- **Queue/Retry is independent:** Works alongside delivery, provides resilience layer

## MVP Definition

### Launch With (v1)

Minimum viable product - what's needed to validate the concept.

- [x] **Voice Recording (tap start/stop)** - Core interaction model
- [x] **STT Transcription (es-AR)** - Core value delivery
- [x] **Backend Message Routing** - Connects mobile to desktop
- [x] **WebSocket Delivery** - Real-time text transmission
- [x] **Desktop Agent with Auto-Paste** - Zero-friction output
- [x] **Device Selection by Hostname** - Target the right PC
- [x] **Connection Status Indicator** - User knows if it will work
- [x] **Queue on Disconnect** - Never lose transcriptions
- [x] **Auto-Reconnection** - Resilient to network issues

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] **Voice Commands (Enter, Tab)** - After confirming core UX works
- [ ] **Custom Phrase Replacement** - After user feedback on common corrections
- [ ] **Additional Languages** - If user demand emerges
- [ ] **Mac/Linux Desktop Agents** - After Windows agent is solid

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Real-Time Streaming** - Only if tap-to-stop latency proves insufficient
- [ ] **AI Text Formatting** - Only if users request polished output
- [ ] **Offline/Local Transcription** - Only if privacy/latency demands it
- [ ] **Authentication** - Only if multi-user or cloud sync needed
- [ ] **Custom Vocabulary Training** - Only if accuracy complaints arise

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Voice Recording | HIGH | LOW | P1 |
| STT Transcription | HIGH | MEDIUM | P1 |
| WebSocket Delivery | HIGH | MEDIUM | P1 |
| Auto-Paste at Cursor | HIGH | MEDIUM | P1 |
| Device Selection | HIGH | LOW | P1 |
| Connection Status | MEDIUM | LOW | P1 |
| Queue on Disconnect | HIGH | MEDIUM | P1 |
| Auto-Reconnection | HIGH | MEDIUM | P1 |
| Voice Commands | MEDIUM | HIGH | P2 |
| Phrase Replacement | LOW | MEDIUM | P3 |
| Multi-Language | MEDIUM | HIGH | P3 |
| Real-Time Streaming | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch (v1)
- P2: Should have, add when possible (v1.x)
- P3: Nice to have, future consideration (v2+)

## Competitor Feature Analysis

| Feature | Wispr Flow | Dragon Anywhere | Otter.ai | Objetiva Speecher (v1) |
|---------|------------|-----------------|----------|------------------------|
| Voice Dictation | Yes | Yes | Yes (meetings) | Yes |
| Auto-Paste | Yes (Fn key) | No | No | Yes (via agent) |
| Mobile-to-Desktop | iOS/Mac only | Sync via cloud | N/A | Yes (WebSocket) |
| Device Selection | N/A (same device) | N/A | N/A | Yes (hostname list) |
| Voice Commands | Yes | Yes (extensive) | No | No (v2) |
| AI Formatting | Yes (polished) | Limited | Yes (summaries) | No |
| Offline Mode | Some (local Whisper) | No | No | No |
| Price | $15/mo | $15/mo | $16.99/mo | Free (self-hosted) |
| Target User | Professionals | Enterprise | Teams | Personal productivity |

**Objetiva Speecher's Niche:**
- Simpler than Wispr Flow (no AI formatting, just raw dictation)
- More immediate than Dragon (auto-paste, no manual transfer)
- Different use case than Otter (personal dictation, not meetings)
- Self-hosted / free for personal use
- Mobile-to-desktop sync with PC selection (unique combination)

## Sources

- [Zapier - Best Dictation Software 2026](https://zapier.com/blog/best-text-dictation-software/)
- [TechCrunch - AI Dictation Apps 2025](https://techcrunch.com/2025/12/30/the-best-ai-powered-dictation-apps-of-2025/)
- [Deepgram - STT Benchmarks](https://deepgram.com/learn/speech-to-text-benchmarks)
- [Picovoice - STT Latency Analysis](https://picovoice.ai/blog/speech-to-text-latency/)
- [Ably - WebSocket Best Practices](https://ably.com/topic/websocket-architecture-best-practices)
- [Wispr Flow vs Otter Comparison](https://wisprflow.ai/post/wispr-flow-vs-otter-december-2025)
- [Microsoft - Spanish Language Support](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support)
- [NN/g - Confirmation Dialogs UX](https://www.nngroup.com/articles/confirmation-dialog/)
- [Smashing Magazine - Notifications UX 2025](https://www.smashingmagazine.com/2025/07/design-guidelines-better-notifications-ux/)

---
*Feature research for: Voice-to-Text Dictation with Mobile-to-Desktop Sync*
*Researched: 2026-02-06*
