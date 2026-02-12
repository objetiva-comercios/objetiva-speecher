# Requirements: Objetiva Speecher v1.1

**Defined:** 2026-02-12
**Core Value:** Instant, reliable voice-to-cursor flow under 2 seconds with zero manual intervention

## v1.1 Requirements

Requirements for this milestone. Voice commands for special keys and punctuation.

### Command Parser

- [ ] **PARSE-01**: Mobile app detects command words in transcribed text
- [ ] **PARSE-02**: Command words are replaced with their output (symbol or key action)
- [ ] **PARSE-03**: Parser processes text before sending to backend
- [ ] **PARSE-04**: Non-command words pass through unchanged
- [ ] **PARSE-05**: Parser is case-insensitive (handles "Punto" and "punto")

### Special Keys

- [ ] **KEY-01**: "nueva línea" or "enter" inserts Enter key action
- [ ] **KEY-02**: "tabulador" or "tab" inserts Tab key action
- [ ] **KEY-03**: "espacio" inserts explicit space character

### Basic Punctuation

- [ ] **PUNCT-01**: "punto" → "."
- [ ] **PUNCT-02**: "coma" → ","
- [ ] **PUNCT-03**: "dos puntos" → ":"
- [ ] **PUNCT-04**: "punto y coma" → ";"
- [ ] **PUNCT-05**: "signo de interrogación" or "interrogación" → "?"
- [ ] **PUNCT-06**: "signo de exclamación" or "exclamación" → "!"
- [ ] **PUNCT-07**: "guión" → "-"

### Extended Punctuation

- [ ] **PUNCT-08**: "abrir paréntesis" → "("
- [ ] **PUNCT-09**: "cerrar paréntesis" → ")"
- [ ] **PUNCT-10**: "comillas" → '"'
- [ ] **PUNCT-11**: "abrir comillas" → '"'
- [ ] **PUNCT-12**: "cerrar comillas" → '"'
- [ ] **PUNCT-13**: "arroba" → "@"
- [ ] **PUNCT-14**: "punto com" → ".com"

### Backend Support

- [ ] **BACK-09**: Backend accepts messages with key actions (not just text)
- [ ] **BACK-10**: Backend forwards key actions to agent via WebSocket

### Agent Support

- [ ] **AGENT-01**: Windows agent executes key actions (Enter, Tab)
- [ ] **AGENT-02**: Linux agent executes key actions (Enter, Tab)

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
| PARSE-01 | — | Pending |
| PARSE-02 | — | Pending |
| PARSE-03 | — | Pending |
| PARSE-04 | — | Pending |
| PARSE-05 | — | Pending |
| KEY-01 | — | Pending |
| KEY-02 | — | Pending |
| KEY-03 | — | Pending |
| PUNCT-01 | — | Pending |
| PUNCT-02 | — | Pending |
| PUNCT-03 | — | Pending |
| PUNCT-04 | — | Pending |
| PUNCT-05 | — | Pending |
| PUNCT-06 | — | Pending |
| PUNCT-07 | — | Pending |
| PUNCT-08 | — | Pending |
| PUNCT-09 | — | Pending |
| PUNCT-10 | — | Pending |
| PUNCT-11 | — | Pending |
| PUNCT-12 | — | Pending |
| PUNCT-13 | — | Pending |
| PUNCT-14 | — | Pending |
| BACK-09 | — | Pending |
| BACK-10 | — | Pending |
| AGENT-01 | — | Pending |
| AGENT-02 | — | Pending |

**Coverage:**
- v1.1 requirements: 26
- Mapped to phases: 0
- Unmapped: 26

---
*Requirements defined: 2026-02-12*
*Last updated: 2026-02-12 after initial definition*
