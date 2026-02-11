# Phase 4: Linux Desktop Agent - Context

**Gathered:** 2026-02-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Linux workstations (X11) can receive text from backend via WebSocket and auto-paste it at the current cursor position. Same functionality as Windows agent, adapted for Linux/X11 environment.

</domain>

<decisions>
## Implementation Decisions

### Display server support
- X11 only, no Wayland support in this phase
- Broad distro compatibility (Ubuntu, Fedora, etc.)

### Clipboard & paste method
- Use xclip for clipboard operations
- Use xdotool for keyboard simulation
- Paste via Ctrl+V (standard shortcut)
- If paste fails, text remains in clipboard for manual paste

### Code reuse strategy
- Separate linux-agent/ package parallel to windows-agent/
- Copy shared patterns but maintain independent codebase
- Identical WebSocket protocol and message format as Windows agent

### Distribution format
- Run from source with Node.js (npm start)
- Manual process (user starts/stops), no systemd service
- Server URL via environment variable (SPEECHER_SERVER_URL)
- Console output for logging (stdout/stderr)

### Claude's Discretion
- X11 detection behavior (fail vs headless mode)
- Startup dependency validation approach
- Reconnection timing (likely same as Windows: 1s-30s backoff)
- Type definition strategy (duplicate vs import)

</decisions>

<specifics>
## Specific Ideas

- Should feel consistent with Windows agent behavior
- Same protocol means backend needs no changes
- User expects paste to "just work" in any focused X11 application

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-linux-desktop-agent*
*Context gathered: 2026-02-11*
