# Phase 1: Backend Foundation - Context

**Gathered:** 2026-02-07
**Status:** Ready for planning

<domain>
## Phase Boundary

HTTP/WebSocket server that routes transcriptions from mobile devices to desktop agents. This phase builds the communication backbone that all other phases depend on. Mobile app sends transcriptions via HTTP POST, backend maintains WebSocket connections to desktop agents, and routes messages to the correct destination.

</domain>

<decisions>
## Implementation Decisions

### API design & responses
- **Request/Response format:** JSON only for both requests and responses
- **Offline agent handling:** Accept & queue message (HTTP 200) — backend holds messages and delivers when agent reconnects
- **Status codes:** Simple 200/500 only — 200 for all successful accepts, 500 for server errors, details in response body
- **Queue limits:** Max 50 messages per device OR 24-hour TTL — older/excess messages dropped

### Connection management
- **Agent identification:** Hostname as deviceId — agents use machine hostname (e.g., 'DESKTOP-ABC123') as unique identifier
- **Heartbeat interval:** 30 seconds — ping every 30s, disconnect after 2 missed pongs
- **Disconnect handling:** Remove immediately from registry — agent disappears from /devices list instantly on disconnect
- **Duplicate connections:** Reject new connection — only one connection per hostname allowed at a time

### Routing logic
- **Message delivery confirmation:** Wait for ACK from desktop agent before responding to POST /transcription request
- **Queued message delivery:** Immediate burst — send all queued messages as fast as possible on reconnection
- **Message ordering:** Strict ordering — messages delivered in exact order received, even if it means blocking

### Error handling & resilience
- **Error detail level:** Detailed errors — specific error codes/messages (e.g., 'QUEUE_FULL', 'INVALID_DEVICE_ID') for client handling
- **Logging:** Structured JSON logs — machine-readable logs with timestamps, severity, deviceId, error codes
- **Persistence:** In-memory only — connection registry and queued messages lost on backend restart (agents reconnect and rebuild state)
- **Rate limiting:** No rate limiting — trust clients, keep it simple for MVP

### Claude's Discretion
- deviceId matching strategy (exact vs fuzzy hostname matching)
- Exact error code taxonomy and naming
- WebSocket message protocol details
- HTTP endpoint path structure

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-backend-foundation*
*Context gathered: 2026-02-07*
