# Project Milestones: Objetiva Speecher

## v1.1 Command Parser & Key Actions (Shipped: 2026-03-23)

**Delivered:** Voice commands for punctuation, symbols, and keyboard actions (Enter/Tab) integrated across the full stack

**Phases completed:** 5-6 (8 plans total)

**Key accomplishments:**

- Command parser with 23 Spanish voice command mappings (punto→., coma→, arroba→@, etc.)
- TDD-driven parser with 63 test cases covering all edge cases
- Real-time command parsing with 180ms visual feedback pulse
- Segment/KeyAction discriminated union protocol across all 4 packages
- Enter/Tab key action execution via robotjs (Windows) and xdotool (Linux)
- Backend pass-through pattern for Segment[] payload forwarding

**Stats:**

- 2 phases, 8 plans
- 2 days development (2026-02-12 → 2026-02-13)

**Git range:** `feat(05-01)` → `docs(06): complete Key Actions Protocol phase`

**What's next:** v1.2 — UI improvements (bottom navigation, settings, history tab)

---

## v1.0 MVP (Shipped: 2026-02-11)

**Delivered:** Complete voice-to-cursor system for Android to Windows/Linux with sub-2-second latency

**Phases completed:** 1-4 (21 plans total)

**Key accomplishments:**

- Backend server routing transcriptions to desktop agents via WebSocket with ACK
- Windows agent with clipboard paste and keyboard simulation using robotjs
- Android mobile app with Spanish speech recognition and offline queue
- Linux agent with X11 support via xdotool and clipboardy
- Full reconnection resilience with exponential backoff (1s-30s)
- Sub-2-second end-to-end latency from voice stop to cursor paste

**Stats:**

- 4,765 lines of TypeScript
- 4 phases, 21 plans, ~100 tasks
- 5 days from start to ship (2026-02-06 → 2026-02-11)

**Git range:** `feat(01-01)` → `docs(04): complete Linux Desktop Agent phase`

---
