# Phase 5: Command Parser & Text Symbols - Context

**Gathered:** 2026-02-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Parse Spanish voice commands in the mobile app and replace them with punctuation/symbols before sending to the backend. This is a text transformation layer — no protocol changes, no agent modifications. Commands like "punto", "coma", "arroba" become ".", ",", "@" in the transcription.

Key actions (Enter, Tab) that require keyboard simulation are out of scope — they belong to Phase 6.

</domain>

<decisions>
## Implementation Decisions

### Command Vocabulary
- Spanish only — no English aliases (punto, not period)
- Natural speech command words:
  - Punctuation: punto, coma, dos puntos, punto y coma, signo de interrogación, signo de exclamación
  - Symbols: arroba (@), hashtag/numeral (#), dólar ($), porcentaje (%)
  - Whitespace: espacio (explicit space)
- Paired symbols with explicit open/close commands:
  - abre paréntesis / cierra paréntesis → ( )
  - abre corchete / cierra corchete → [ ]
  - abre llave / cierra llave → { }
  - abre comillas / cierra comillas → " "
  - abre comilla simple / cierra comilla simple → ' '

### Parser Placement
- Real-time parsing as user speaks (not on send)
- Claude's discretion on whether to parse interim or final speech results
- Flow respects auto-send toggle:
  - Auto-send enabled: parsed text sends immediately
  - Auto-send disabled: user can edit parsed result before sending
- Escape syntax for literal words: say "literal punto" to get the word "punto" instead of "."

### Word Boundary Handling
- Whole words only — "punto" in "contrapunto" stays unchanged
- Multi-word commands must be strictly adjacent — "abre paréntesis" works, "abre un paréntesis" doesn't
- Remove extra spaces around converted symbols — "hola punto adiós" → "hola. adiós"
- Case-insensitive matching — "Punto", "punto", "PUNTO" all work

### User Feedback
- Brief highlight/pulse when a command converts to symbol (visual only)
- Unrecognized words pass through silently (no error indication)
- No audio feedback
- No special undo gesture — user edits manually if needed

### Claude's Discretion
- Exact timing of parsing in speech recognition pipeline
- Highlight animation duration and style
- Escape syntax keyword ("literal" suggested, can adjust)

</decisions>

<specifics>
## Specific Ideas

- User wants to see conversions happen in real-time as they speak, not after
- The flow should feel immediate — speak "punto" and see "." appear
- Editing before send is only available when auto-send is off

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-command-parser-text-symbols*
*Context gathered: 2026-02-12*
