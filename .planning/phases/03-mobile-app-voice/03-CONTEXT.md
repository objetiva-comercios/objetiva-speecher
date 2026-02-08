# Phase 3: Mobile App + Voice - Context

**Gathered:** 2026-02-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Android app that captures voice, transcribes speech (Spanish), and delivers text to a selected PC. User can view/edit transcription before sending, select target device from connected list, and see connection status. Transcriptions queue when offline and deliver when connection restores.

</domain>

<decisions>
## Implementation Decisions

### Voice Recording UX
- Tap to start recording, tap to stop (two explicit taps)
- Animated waveform + timer during recording
- Live streaming text as speech is recognized (word-by-word updates)
- After stop: editable text field before send/confirm

### Device Selection
- Dropdown selector always visible on main screen
- Auto-select last used device on app open
- Show hostname + status dot (green/gray) per device
- When no devices connected: empty state message, disable recording

### Connection & Status
- Status indicator near device selector (not header bar)
- Offline state: banner + disabled recording button
- Show "Reconnecting..." state during connection recovery
- Speech recognition errors: inline message in transcription area

### Delivery Resilience
- Queue transcriptions when target device is offline
- Show visible pending list of queued items
- Brief success feedback (checkmark/green flash) on delivery
- Swipe to delete queued transcriptions

### Claude's Discretion
- Exact waveform animation implementation
- Edit field styling and send button placement
- Success feedback animation details
- Queue list UI layout

</decisions>

<specifics>
## Specific Ideas

No specific references — open to standard Android patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-mobile-app-voice*
*Context gathered: 2026-02-07*
