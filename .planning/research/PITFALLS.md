# Pitfalls Research

**Domain:** Voice-to-text real-time dictation with cross-device communication
**Researched:** 2026-02-06
**Confidence:** MEDIUM-HIGH

---

## Critical Pitfalls

### Pitfall 1: Android SpeechRecognizer Lifecycle Mismanagement

**What goes wrong:**
The SpeechRecognizer instance is not properly destroyed, recognition listener is set after dispatching commands, or methods are called from non-main threads. Results in silent failures, memory leaks, or crashes.

**Why it happens:**
Developers treat SpeechRecognizer like a simple API call. In reality, it requires strict lifecycle adherence: listener must be set BEFORE any command, all calls must be on main thread, and destroy() MUST be called when done. The API streams audio to remote servers and is stateful.

**How to avoid:**
- Always call `setRecognitionListener()` before any recognition commands
- Invoke all SpeechRecognizer methods only from the main application thread
- Call `destroy()` in onDestroy() or when recognition is no longer needed
- Wrap all SpeechRecognizer interactions in a dedicated manager class that enforces these constraints
- Handle the case where speech recognition is unavailable on the device

**Warning signs:**
- `ERROR_CLIENT` (error code 5) appearing in logs
- Recognition stops working after app backgrounding/foregrounding
- "RecognitionListener not set" or similar errors
- Memory leaks detected in profiler related to speech components

**Phase to address:**
Phase 1 (Android app foundation) - Build a robust SpeechRecognizerManager wrapper from the start

---

### Pitfall 2: WebSocket "Half-Open" Connection Blindness

**What goes wrong:**
The connection appears alive on one side but is actually dead. Network switches, firewalls, NAT timeouts, and mobile network transitions can sever connections without either endpoint knowing. Messages are sent into a void, user dictations are lost.

**Why it happens:**
TCP keep-alives are configured at OS level with long intervals (often 2 hours). Without application-level heartbeats, there is no way to detect connection death until the next message fails. Mobile networks are especially prone to silent disconnects.

**How to avoid:**
- Implement application-level ping/pong heartbeats (RFC 6455 control frames)
- Use 20-30 second heartbeat intervals with 10 second pong timeout
- Close connections on 2-3 repeated missed pongs
- Implement both client-side and server-side heartbeat initiation
- Log heartbeat failures for debugging connection issues

**Warning signs:**
- Users report "sent but never arrived" transcriptions
- Connection appears connected but no messages flowing
- Reconnection logic never triggers despite network issues
- High latency spikes without apparent network problems

**Phase to address:**
Phase 2 (WebSocket infrastructure) - Heartbeat mechanism is non-negotiable from the start

---

### Pitfall 3: Clipboard Race Conditions on Windows

**What goes wrong:**
Rapid clipboard updates cause data loss or wrong content pasting. Windows clipboard history may not record all items if clipboard data changes multiple times very fast because the service listens asynchronously. Some apps use delayed rendering (up to 30 second delay).

**Why it happens:**
Windows clipboard is a shared system resource with asynchronous notification processing. When auto-pasting rapid-fire transcriptions, the clipboard can be in an inconsistent state. The history service is a separate process that can miss rapid updates "by design for performance."

**How to avoid:**
- Add minimum delay (50-100ms) between clipboard write and paste simulation
- Verify clipboard content matches expected text before pasting
- Implement retry logic for paste operations with verification
- Consider direct text injection methods that bypass clipboard entirely where possible
- Queue transcriptions and paste them with controlled timing

**Warning signs:**
- Pasted text does not match latest transcription
- Previous transcription pastes instead of current one
- Intermittent "wrong content" issues that are hard to reproduce
- Issues more frequent with rapid successive dictations

**Phase to address:**
Phase 3 (PC agent auto-paste) - Build clipboard abstraction with verification and retry

---

### Pitfall 4: Message Loss During Disconnection

**What goes wrong:**
Transcriptions made while offline or during reconnection are permanently lost. User speaks, sees "sent" indication, but text never arrives at PC.

**Why it happens:**
Basic WebSocket implementations fire-and-forget messages. Without local persistence and acknowledgment protocol, messages sent during network instability vanish. The user expects voice dictation to "never lose" content.

**How to avoid:**
- Implement local SQLite queue on Android before WebSocket send
- Require server acknowledgment (ACK) for each message
- Mark messages as "pending", "sent", "acknowledged" in local storage
- Only remove from queue after ACK received
- On reconnection, replay all unacknowledged messages
- Use exponential backoff for retries (1s, 2s, 4s, etc.)

**Warning signs:**
- Users report "some dictations disappeared"
- Discrepancy between Android "sent" count and PC "received" count
- Issues more frequent on mobile data vs WiFi
- Reconnection happens but old messages never arrive

**Phase to address:**
Phase 2 (Android app) - Message persistence BEFORE WebSocket layer

---

### Pitfall 5: Latency Budget Blown by Cumulative Delays

**What goes wrong:**
Total voice-to-cursor latency exceeds 2 second target despite each component seeming "fast enough." User experience feels sluggish and unusable.

**Why it happens:**
Latency is cumulative: speech recognition (200-500ms) + WebSocket transmission (20-50ms local) + message processing (10-50ms) + clipboard write (10-30ms) + paste simulation (50-100ms) + app response (variable). Each component adds up. Additionally, transcription errors force correction cycles that destroy the latency budget entirely.

**How to avoid:**
- Establish latency budget for each component with margins
- Use streaming speech recognition (process as you speak, not after)
- Prefer WebSocket over HTTP for lowest overhead
- Minimize JSON payload sizes
- Pipeline operations where possible (send while still processing)
- Add latency instrumentation from day one
- Target 300ms or less for speech-to-text component alone

**Warning signs:**
- P95 latency much higher than P50
- Latency increases under normal load
- Users report "laggy" feeling even on good network
- Variable latency makes experience unpredictable

**Phase to address:**
All phases - Latency instrumentation in Phase 1, streaming in Phase 2, end-to-end measurement in Phase 4

---

### Pitfall 6: Linux Wayland Keyboard Simulation Fragmentation

**What goes wrong:**
Keyboard simulation that works on X11 or Windows fails silently or behaves erratically on Wayland Linux systems. xdotool does not work on Wayland at all.

**Why it happens:**
Wayland's security architecture isolates applications to prevent inter-process communication. This is intentional for security but breaks traditional keyboard automation. xdotool sends X events directly to X server, which does not exist in Wayland. Alternatives like ydotool have their own issues (daemon requirements, sudo, incomplete non-ASCII support, custom keyboard layout problems).

**How to avoid:**
- Detect display server type (X11 vs Wayland) at runtime
- Use ydotool for Wayland (requires ydotoold daemon running)
- Implement fallback chain: try multiple methods
- For Wayland, consider wtype as alternative for typing
- Document clear setup requirements for Wayland users
- Support broken bookworm repo version workarounds for ydotool
- Test extensively on multiple Linux distributions

**Warning signs:**
- "Works on my machine" across different Linux setups
- Silent failures with no error output
- Keyboard input goes to wrong window or nowhere
- Special characters (accents, non-ASCII) corrupt or missing

**Phase to address:**
Phase 3 (PC agent Linux support) - Display server detection and multi-tool fallback strategy

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Fire-and-forget WebSocket sends | Simpler implementation | Lost messages during instability | Never for production |
| Single reconnection attempt | Faster perceived recovery | Connection stays dead on flaky networks | Never |
| Synchronous clipboard operations | Simpler code flow | UI freezes, race conditions | Early prototyping only |
| Ignoring SpeechRecognizer errors | Fewer error handlers | Silent failures, confused users | Never |
| Hardcoded Spanish locale (es-ES) | Works for most Spanish | Poor accuracy for Argentine users | Early MVP, track as debt |
| No message acknowledgment | Simpler protocol | Cannot guarantee delivery | Never for production |
| No heartbeat/ping-pong | Less network traffic | Cannot detect dead connections | Never |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Android SpeechRecognizer | Assuming always available | Check `SpeechRecognizer.isRecognitionAvailable()` first |
| Android SpeechRecognizer | Using for continuous recognition | Use it for discrete utterances, restart after each result |
| Google Speech Services | Assuming consistent behavior across devices | Test on multiple OEMs (Samsung, Xiaomi, etc. restrict background services) |
| Windows SendInput | Assuming no restrictions | Handle focus loss, elevation requirements, lockscreen blocks |
| Windows Clipboard | Assuming synchronous operation | Add delays, verification, and retry logic |
| Linux ydotool | Running without daemon | Ensure ydotoold is running before automation |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Unbounded message queue | Memory growth, eventual OOM | Set max queue size, oldest-first eviction | 100+ pending messages |
| Polling for connection status | Battery drain, CPU usage | Use event-driven connection state | Always on mobile |
| Reconnection without backoff | Server overload, battery drain | Exponential backoff (1s, 2s, 4s, 8s, max 30s) | Any network instability |
| String concatenation in hot path | GC pauses, latency spikes | StringBuilder or pre-allocated buffers | Rapid successive dictations |
| Blocking main thread for network | ANR on Android, frozen UI | Async/coroutines for all network I/O | Any network latency |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Keyboard simulation without focus validation | Typing into wrong app (password field, bank site) | Validate target window before paste |
| No authentication on local WebSocket | Any device on network can send commands | Implement device pairing with shared secret |
| Storing transcription history indefinitely | Privacy violation, sensitive data exposure | Auto-expire old transcriptions, option to disable storage |
| SendInput to elevated processes | Privilege escalation attack vector | Check target process elevation, refuse if elevated |
| Broadcasting on LAN discovery | Exposes service to entire network | Use mDNS/Bonjour with authentication |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No visual feedback during recognition | User unsure if app is listening | Show pulsing mic icon, audio level indicator |
| Silent failure on connection loss | User keeps dictating into void | Immediate visual + haptic feedback on disconnect |
| No confirmation of successful paste | User unsure if text arrived | Brief toast/notification on PC confirming receipt |
| Forcing user to fix transcription errors | Frustration, workflow interruption | Allow voice correction commands or easy re-dictate |
| Auto-paste without pause option | Cannot review before paste | Add optional "review before paste" mode |
| No indication of queue state | User unsure if offline messages will sync | Show pending message count, sync status |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Speech recognition:** Often missing error handling for all 9+ error codes - verify ERROR_NETWORK, ERROR_NO_MATCH, ERROR_SPEECH_TIMEOUT are handled
- [ ] **WebSocket connection:** Often missing heartbeat mechanism - verify ping/pong with timeout detection exists
- [ ] **Reconnection logic:** Often missing exponential backoff - verify delays increase, max attempts configured
- [ ] **Message delivery:** Often missing acknowledgment - verify server confirms receipt, client retries on failure
- [ ] **Clipboard paste:** Often missing verification - verify pasted content matches sent content
- [ ] **Linux support:** Often missing Wayland handling - verify works on both X11 and Wayland
- [ ] **Offline mode:** Often missing persistence - verify messages survive app restart
- [ ] **Spanish locale:** Often uses generic es-ES - verify es-AR tested for accuracy
- [ ] **Latency measurement:** Often missing instrumentation - verify end-to-end timing is logged
- [ ] **Device pairing:** Often missing security - verify devices are authenticated, not just discovered

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Lost messages due to no queue | HIGH | Add SQLite queue, cannot recover lost data |
| Half-open connection issues | LOW | Add heartbeat mechanism, existing connections recover on next heartbeat timeout |
| Clipboard race conditions | MEDIUM | Add delays and verification, may need to restructure paste timing |
| SpeechRecognizer crashes | MEDIUM | Wrap in manager with auto-restart, add defensive recreation |
| Wayland incompatibility | HIGH | Add display server detection and alternative tool chain |
| Latency exceeds budget | MEDIUM | Profile each stage, identify bottleneck, may require streaming STT |
| Spanish accuracy issues | LOW | Switch locale or add post-processing, user education on speaking clearly |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| SpeechRecognizer lifecycle | Phase 1: Android app | Unit tests for manager, integration test for error codes |
| WebSocket half-open connections | Phase 2: Communication layer | Heartbeat in protocol tests, connection timeout integration test |
| Clipboard race conditions | Phase 3: PC agent | Paste verification tests, timing stress tests |
| Message loss | Phase 2: Android persistence | Offline mode test, kill app during send test |
| Latency budget | All phases | End-to-end latency instrumentation, P95 targets in CI |
| Wayland fragmentation | Phase 3: Linux agent | CI matrix with X11 and Wayland VMs |
| Spanish locale accuracy | Phase 1: STT integration | Word error rate benchmarks with es-AR audio samples |

---

## Sources

### Official Documentation
- [SpeechRecognizer API Reference - Android Developers](https://developer.android.com/reference/android/speech/SpeechRecognizer)
- [SendInput function - Win32 API - Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-sendinput)
- [WebSocket keepalive and latency - websockets documentation](https://websockets.readthedocs.io/en/stable/topics/keepalive.html)

### Technical Guides (2026)
- [How to Implement Heartbeat/Ping-Pong in WebSockets - OneUptime](https://oneuptime.com/blog/post/2026-01-27-websocket-heartbeat/view)
- [How to Implement Reconnection Logic for WebSockets - OneUptime](https://oneuptime.com/blog/post/2026-01-27-websocket-reconnection/view)
- [Real-time Transcription Guide 2026 - Picovoice](https://picovoice.ai/blog/complete-guide-to-streaming-speech-to-text/)
- [The 300ms rule: Why latency makes or breaks voice AI - AssemblyAI](https://www.assemblyai.com/blog/low-latency-voice-ai)

### Community Knowledge
- [Common Pitfalls in Android Voice Recognition - JavaNexus](https://javanexus.com/blog/common-pitfalls-android-voice-recognition)
- [Android Speech To Text - The missing guide - Medium](https://medium.com/reveri-engineering/android-speech-to-text-the-missing-guide-part-1-824e2636c45a)
- [SpeechRecognizer error codes - GitHub Gist](https://gist.github.com/AndrazP/120f0f65a597211ac3cde9cea95e2e91)
- [Why Windows 11 clipboard is a hit or miss - Windows Latest](https://www.windowslatest.com/2026/01/05/why-windows-11-clipboard-is-a-hit-or-miss-sometimes-according-to-microsoft/)
- [Wayland keyboard simulation fragmentation - Hacker News](https://news.ycombinator.com/item?id=45942109)
- [ydotool tutorial - Gabriel Staples](https://gabrielstaples.com/ydotool-tutorial/)
- [Offline-First Mobile Apps: Queueing & Sync - Beefed.ai](https://beefed.ai/en/offline-first-queueing-sync)

### Speech Recognition Accuracy
- [Speech Recognition Challenges in 2026 - AI Multiple](https://research.aimultiple.com/speech-recognition-challenges/)
- [Speech Recognition Accuracy: Production Metrics - Deepgram](https://deepgram.com/learn/speech-recognition-accuracy-production-metrics)

---
*Pitfalls research for: Voice-to-text real-time dictation (Objetiva Speecher)*
*Researched: 2026-02-06*
