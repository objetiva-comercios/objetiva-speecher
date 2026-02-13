# Requirements: Objetiva Speecher v1.1

**Defined:** 2026-02-12
**Core Value:** Instant, reliable voice-to-cursor flow under 2 seconds with zero manual intervention

## v1.1 Requirements

Requirements for this milestone. Voice commands for special keys and punctuation.

### Command Parser

- [x] **PARSE-01**: Mobile app detects command words in transcribed text
- [x] **PARSE-02**: Command words are replaced with their output (symbol or key action)
- [x] **PARSE-03**: Parser processes text before sending to backend
- [x] **PARSE-04**: Non-command words pass through unchanged
- [x] **PARSE-05**: Parser is case-insensitive (handles "Punto" and "punto")

### Special Keys

- [x] **KEY-01**: "nueva línea" or "enter" inserts Enter key action
- [x] **KEY-02**: "tabulador" or "tab" inserts Tab key action
- [x] **KEY-03**: "espacio" inserts explicit space character

### Basic Punctuation

- [x] **PUNCT-01**: "punto" → "."
- [x] **PUNCT-02**: "coma" → ","
- [x] **PUNCT-03**: "dos puntos" → ":"
- [x] **PUNCT-04**: "punto y coma" → ";"
- [x] **PUNCT-05**: "signo de interrogación" or "interrogación" → "?"
- [x] **PUNCT-06**: "signo de exclamación" or "exclamación" → "!"
- [x] **PUNCT-07**: "guión" → "-"

### Extended Punctuation

- [x] **PUNCT-08**: "abrir paréntesis" → "("
- [x] **PUNCT-09**: "cerrar paréntesis" → ")"
- [x] **PUNCT-10**: "comillas" → '"'
- [x] **PUNCT-11**: "abrir comillas" → '"'
- [x] **PUNCT-12**: "cerrar comillas" → '"'
- [x] **PUNCT-13**: "arroba" → "@"
- [x] **PUNCT-14**: "punto com" → ".com"

### Backend Support

- [x] **BACK-09**: Backend accepts messages with key actions (not just text)
- [x] **BACK-10**: Backend forwards key actions to agent via WebSocket

### Agent Support

- [x] **AGENT-01**: Windows agent executes key actions (Enter, Tab)
- [x] **AGENT-02**: Linux agent executes key actions (Enter, Tab)

## Out of Scope

Explicitly excluded for v1.1.

| Feature | Reason |
|---------|--------|
| Undo last transcription | Higher complexity, needs state tracking |
| Delete last word | Requires cursor position awareness |
| Custom phrase replacement | Needs configuration UI |
| Voice command toggle (enable/disable) | Keep simple for v1.1 |
| Multi-word command matching with fuzzy logic | Simple exact match for v1.1 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PARSE-01 | Phase 5 | Complete |
| PARSE-02 | Phase 5 | Complete |
| PARSE-03 | Phase 5 | Complete |
| PARSE-04 | Phase 5 | Complete |
| PARSE-05 | Phase 5 | Complete |
| KEY-01 | Phase 6 | Complete |
| KEY-02 | Phase 6 | Complete |
| KEY-03 | Phase 5 | Complete |
| PUNCT-01 | Phase 5 | Complete |
| PUNCT-02 | Phase 5 | Complete |
| PUNCT-03 | Phase 5 | Complete |
| PUNCT-04 | Phase 5 | Complete |
| PUNCT-05 | Phase 5 | Complete |
| PUNCT-06 | Phase 5 | Complete |
| PUNCT-07 | Phase 5 | Complete |
| PUNCT-08 | Phase 5 | Complete |
| PUNCT-09 | Phase 5 | Complete |
| PUNCT-10 | Phase 5 | Complete |
| PUNCT-11 | Phase 5 | Complete |
| PUNCT-12 | Phase 5 | Complete |
| PUNCT-13 | Phase 5 | Complete |
| PUNCT-14 | Phase 5 | Complete |
| BACK-09 | Phase 6 | Complete |
| BACK-10 | Phase 6 | Complete |
| AGENT-01 | Phase 6 | Complete |
| AGENT-02 | Phase 6 | Complete |

**Coverage:**
- v1.1 requirements: 26
- Mapped to phases: 26
- Unmapped: 0
- Coverage: 100%

**Phase Distribution:**
- Phase 5: 20 requirements (Command Parser & Text Symbols)
- Phase 6: 6 requirements (Key Actions Protocol)

---
*Requirements defined: 2026-02-12*
*Last updated: 2026-02-12 after roadmap creation*
