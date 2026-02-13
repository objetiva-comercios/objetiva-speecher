# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-12)

**Core value:** Instant, reliable voice-to-cursor flow under 2 seconds with zero manual intervention
**Current focus:** v1.1 Special Commands — Voice commands for Enter, Tab, punctuation

## Current Position

Phase: 6 of 6 (Key Actions Protocol)
Plan: 5 of 5 (all plans complete)
Status: Phase 6 complete
Last activity: 2026-02-13 — Completed 06-02-PLAN.md (Mobile Parser Extension & API Payload)

Progress: [########################] 100% (v1.0 complete, Phase 5 Plans 1-2 complete, Phase 6 Plans 1-5 complete)

## Milestone v1.1 Goals

- Parse voice commands in mobile app before sending
- Support "nueva linea" / "enter" to insert Enter key
- Support "tabulador" / "tab" to insert Tab key
- Support punctuation commands (punto, coma, dos puntos, etc.)
- Support "espacio" for explicit space insertion
- Command words replaced with their symbols

## Milestone v1.1 Structure

**Phase 5: Command Parser & Text Symbols**
- Parse commands in mobile app
- Replace punctuation commands with symbols
- Text-only transformations (no protocol changes)
- 20 requirements

**Phase 6: Key Actions Protocol**
- Extend protocol for keyboard actions
- Backend message type extension
- Agent execution (robotjs, xdotool)
- 6 requirements

## Key Decisions (v1.1)

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-12 | Command parsing in mobile app | Simplest, no backend/agent changes for Phase 5 |
| 2026-02-12 | Punctuation: word -> symbol | "punto" -> "." |
| 2026-02-12 | Key actions deferred to Phase 6 | Needs protocol extension |
| 2026-02-12 | Parser is case-insensitive | "Punto", "PUNTO" all work |
| 2026-02-12 | Used vitest for testing | Minimal, Vite-native |
| 2026-02-12 | \u0001/\u0002 markers for bracket types | Smart space normalization |
| 2026-02-12 | NBSP placeholder for espacio | Prevents space collapse |
| 2026-02-12 | Commands sorted by length | Longest-match-first |
| 2026-02-12 | Parse in onPartialResults | Real-time feedback as user speaks |
| 2026-02-12 | 180ms pulse for visual feedback | Brief, non-disruptive confirmation |
| 2026-02-13 | text field optional on ServerMessage | Forward-compatible protocol evolution |
| 2026-02-13 | payload field optional | Backward-compatible gradual rollout |
| 2026-02-13 | Segment discriminated union | Type-safe exhaustive pattern matching |
| 2026-02-13 | xdotool uses X11 keysym names | enter -> Return, tab -> Tab |
| 2026-02-13 | 50ms delay between segments | Reliable X11 event processing |
| 2026-02-13 | oneOf schema validation for Segments | Validates discriminated union in Fastify |
| 2026-02-13 | Pass-through pattern for payload | Backend stores/forwards, agents interpret |

## Performance Metrics

**v1.0 Baseline:**
- E2E latency: <2s (target met)
- 4,765 lines of TypeScript
- 5 days development (2026-02-06 -> 2026-02-11)

**v1.1 Targets:**
- Maintain <2s E2E latency
- Command parsing adds <100ms overhead
- Zero false positives on non-command words

## Accumulated Context

### Recent Decisions
- 2026-02-12: Created roadmap for v1.1, split into parser phase (5) and protocol phase (6)
- 2026-02-12: All punctuation in Phase 5 works with existing flow (text replacement only)
- 2026-02-12: Key actions (Enter, Tab) deferred to Phase 6 (needs protocol work)
- 2026-02-12: Implemented parseCommands with 23 command mappings
- 2026-02-12: Used TDD methodology (63 tests)
- 2026-02-12: Integrated parser into onPartialResults for real-time feedback
- 2026-02-12: Added 180ms blue pulse visual feedback for conversions
- 2026-02-13: Added KeyAction and Segment types to all 4 packages
- 2026-02-13: Made text optional, added payload field for Segment[] in ServerMessage
- 2026-02-13: Linux agent executeKeyAction uses xdotool with X11 keysym names
- 2026-02-13: Linux agent processPayload handles Segment[] with 50ms delay
- 2026-02-13: Backend validates Segment[] payload with oneOf schema
- 2026-02-13: Backend forwards payload unchanged to agents (pass-through pattern)

### Active TODOs
- [x] Plan Phase 5 (command parser implementation)
- [x] Define command vocabulary and mappings
- [x] Design parser API in mobile app
- [x] Integrate parser into speech recognition hook
- [x] Add visual feedback for command conversions
- [ ] Manual testing on Android device (Plan 05-03)
- [x] Add Segment/KeyAction types to all packages (Plan 06-01)
- [x] Implement parseToSegments() in mobile app (Plan 06-02)
- [x] Update backend to accept/forward payload (Plan 06-03)
- [x] Add payload processing in Windows agent (Plan 06-04)
- [x] Add payload processing in Linux agent (Plan 06-05)

### Blockers
None.

## Session Continuity

Last session: 2026-02-13T09:28:00Z
Stopped at: Completed 06-02-PLAN.md (Phase 6 complete)
Resume file: None
Next action: Manual testing on Android device (Plan 05-03) to verify end-to-end flow
