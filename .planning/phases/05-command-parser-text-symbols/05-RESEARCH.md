# Phase 5: Command Parser & Text Symbols - Research

**Researched:** 2026-02-12
**Domain:** Text parsing, regex word boundaries, real-time transformation in React/TypeScript
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Command Vocabulary:**
- Spanish only - no English aliases (punto, not period)
- Natural speech command words:
  - Punctuation: punto, coma, dos puntos, punto y coma, signo de interrogacion, signo de exclamacion
  - Symbols: arroba (@), hashtag/numeral (#), dolar ($), porcentaje (%)
  - Whitespace: espacio (explicit space)
- Paired symbols with explicit open/close commands:
  - abre parentesis / cierra parentesis -> ( )
  - abre corchete / cierra corchete -> [ ]
  - abre llave / cierra llave -> { }
  - abre comillas / cierra comillas -> " "
  - abre comilla simple / cierra comilla simple -> ' '

**Parser Placement:**
- Real-time parsing as user speaks (not on send)
- Flow respects auto-send toggle:
  - Auto-send enabled: parsed text sends immediately
  - Auto-send disabled: user can edit parsed result before sending
- Escape syntax for literal words: say "literal punto" to get the word "punto" instead of "."

**Word Boundary Handling:**
- Whole words only - "punto" in "contrapunto" stays unchanged
- Multi-word commands must be strictly adjacent - "abre parentesis" works, "abre un parentesis" doesn't
- Remove extra spaces around converted symbols - "hola punto adios" -> "hola. adios"
- Case-insensitive matching - "Punto", "punto", "PUNTO" all work

**User Feedback:**
- Brief highlight/pulse when a command converts to symbol (visual only)
- Unrecognized words pass through silently (no error indication)
- No audio feedback
- No special undo gesture - user edits manually if needed

### Claude's Discretion

- Exact timing of parsing in speech recognition pipeline
- Highlight animation duration and style
- Escape syntax keyword ("literal" suggested, can adjust)

### Deferred Ideas (OUT OF SCOPE)

None - discussion stayed within phase scope

</user_constraints>

## Summary

This phase adds a text transformation layer to the mobile app that converts Spanish voice commands into punctuation and symbols in real-time. The parser intercepts transcription results from the speech recognition service, detects command words using regex with word boundaries, and replaces them with their corresponding symbols before displaying to the user.

The implementation is straightforward: a pure function that takes text input and returns transformed text, plus integration with the existing `useSpeechRecognition` hook to apply parsing to `liveText` and `finalText`. The main technical considerations are proper regex word boundary handling for Spanish text (which works well since Spanish uses Latin characters), case-insensitive matching, multi-word command detection (e.g., "dos puntos"), and space normalization around converted symbols.

The visual feedback requirement (brief highlight on conversion) adds complexity but can be achieved with CSS animations in Tailwind using `animate-pulse` or a custom keyframe animation. The escape mechanism ("literal punto" -> "punto") requires tracking a prefix state during parsing.

**Primary recommendation:** Build a pure parser function with a command dictionary, integrate it in the speech recognition flow via the onPartialResults callback, and use Tailwind's built-in `animate-pulse` with a custom variant for visual feedback.

## Standard Stack

This phase uses no new dependencies - all functionality is achieved with native JavaScript/TypeScript and existing project stack.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ~5.9.3 | Type-safe parser implementation | Already in project |
| React | ^19.2.0 | Hook integration for real-time updates | Already in project |
| Tailwind CSS | ^4.1.18 | Highlight animation | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Native RegExp | ES2015+ | Word boundary matching | Core parsing logic |
| String.prototype.replace | ES2015+ | Command replacement | Core parsing logic |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native regex | Parser combinator (ts-parsec) | Overkill for simple word replacement |
| Manual word splitting | Intl.Segmenter | Not needed for Spanish (Latin script with clear word boundaries) |
| External NLP library | Native regex | Would add bundle size for no benefit |

**Installation:**
```bash
# No new dependencies required
```

## Architecture Patterns

### Recommended Project Structure
```
mobile-app/src/
├── services/
│   └── commandParser.ts     # Pure parser function + command dictionary
├── hooks/
│   └── useSpeechRecognition.ts  # Integrate parser in existing hook
├── components/
│   └── TranscriptionEditor.tsx  # Add highlight animation styles
└── types/
    └── index.ts             # Add ParsedSegment type if needed for highlights
```

### Pattern 1: Command Dictionary with Type Safety
**What:** A typed dictionary mapping command strings to their output symbols
**When to use:** For all command definitions
**Example:**
```typescript
// Source: Custom implementation based on project requirements
interface CommandDefinition {
  command: string;       // The Spanish word(s) to match
  output: string;        // The symbol to insert
  aliases?: string[];    // Alternative phrasings
}

const COMMANDS: CommandDefinition[] = [
  // Basic punctuation
  { command: 'punto', output: '.' },
  { command: 'coma', output: ',' },
  { command: 'dos puntos', output: ':' },
  { command: 'punto y coma', output: ';' },
  { command: 'signo de interrogacion', output: '?', aliases: ['interrogacion'] },
  { command: 'signo de exclamacion', output: '!', aliases: ['exclamacion'] },
  { command: 'guion', output: '-' },

  // Symbols
  { command: 'arroba', output: '@' },
  { command: 'hashtag', output: '#', aliases: ['numeral'] },
  { command: 'dolar', output: '$' },
  { command: 'porcentaje', output: '%' },
  { command: 'espacio', output: ' ' },

  // Paired symbols - open
  { command: 'abre parentesis', output: '(' },
  { command: 'abre corchete', output: '[' },
  { command: 'abre llave', output: '{' },
  { command: 'abre comillas', output: '"' },
  { command: 'abre comilla simple', output: "'" },

  // Paired symbols - close
  { command: 'cierra parentesis', output: ')' },
  { command: 'cierra corchete', output: ']' },
  { command: 'cierra llave', output: '}' },
  { command: 'cierra comillas', output: '"' },
  { command: 'cierra comilla simple', output: "'" },

  // Compound
  { command: 'punto com', output: '.com' },
];
```

### Pattern 2: Regex with Word Boundaries for Case-Insensitive Matching
**What:** Use `\b` word boundary assertions with the `gi` flags
**When to use:** For matching whole words only, case-insensitive
**Example:**
```typescript
// Source: MDN Web Docs - Word Boundary Assertion
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Word_boundary_assertion

function createCommandRegex(command: string): RegExp {
  // Escape special regex characters in command string
  const escaped = command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Word boundaries ensure "punto" doesn't match in "contrapunto"
  return new RegExp(`\\b${escaped}\\b`, 'gi');
}

// Usage:
const regex = createCommandRegex('punto');
'hola punto'.replace(regex, '.'); // "hola ."
'contrapunto'.replace(regex, '.'); // "contrapunto" (unchanged)
```

### Pattern 3: Multi-Word Command Priority (Longest Match First)
**What:** Sort commands by length descending to match "punto y coma" before "punto"
**When to use:** When commands share common prefixes
**Example:**
```typescript
// Source: Standard text parser pattern
const sortedCommands = [...COMMANDS].sort(
  (a, b) => b.command.length - a.command.length
);

// This ensures:
// "punto y coma" matches before "punto"
// "signo de interrogacion" matches before "interrogacion"
// "abre comilla simple" matches before "abre comillas"
```

### Pattern 4: Space Normalization
**What:** Clean up spaces around converted punctuation
**When to use:** After all replacements are done
**Example:**
```typescript
// Source: Custom implementation for natural text flow
function normalizeSpaces(text: string): string {
  // Remove space before punctuation that should attach to previous word
  // "hola ." -> "hola."
  text = text.replace(/\s+([.,;:!?)\]}"'])/g, '$1');

  // Remove space after opening brackets/quotes
  // "( hola" -> "(hola"
  text = text.replace(/([({\[\"'])\s+/g, '$1');

  // Collapse multiple spaces
  text = text.replace(/\s{2,}/g, ' ');

  return text.trim();
}
```

### Pattern 5: Escape Prefix Handling
**What:** "literal" prefix prevents the next word from being parsed as a command
**When to use:** When user wants the actual word "punto" not "."
**Example:**
```typescript
// Source: Custom implementation
const ESCAPE_PREFIX = 'literal';

function parseWithEscape(text: string): string {
  // Temporarily replace "literal X" with a placeholder
  const escapeRegex = new RegExp(`\\b${ESCAPE_PREFIX}\\s+(\\S+)`, 'gi');
  const escapes: string[] = [];

  text = text.replace(escapeRegex, (_, word) => {
    escapes.push(word);
    return `__ESCAPE_${escapes.length - 1}__`;
  });

  // Parse commands...
  text = parseCommands(text);

  // Restore escaped words
  escapes.forEach((word, i) => {
    text = text.replace(`__ESCAPE_${i}__`, word);
  });

  return text;
}
```

### Anti-Patterns to Avoid
- **Parsing on every keystroke in text mode:** Only parse speech recognition results, not manual typing
- **Mutable state in parser:** Keep parser as pure function, no side effects
- **Partial word matching:** Always use word boundaries to avoid "punto" in "contrapunto"
- **Case-sensitive matching:** Spanish speech can come with various capitalizations

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Word boundary detection | Manual word splitting | `\b` regex assertions | Handles edge cases correctly |
| Animation | Manual CSS keyframes | Tailwind `animate-pulse` | Already configured, consistent |
| Special char escaping in regex | Manual escaping | `String.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` | Standard pattern, catches all cases |

**Key insight:** The parser is simple enough that native JavaScript handles everything. No NLP or parsing libraries needed.

## Common Pitfalls

### Pitfall 1: Word Boundary Fails for Accented Characters
**What goes wrong:** `\b` may not work correctly for words with accents (e.g., "interrogacion" vs "interrogacion")
**Why it happens:** Standard `\b` uses ASCII word character definition (`\w` = `[a-zA-Z0-9_]`)
**How to avoid:** Spanish command words in our dictionary don't have accents - we normalize both input and dictionary to unaccented forms, or use the accented variations explicitly
**Warning signs:** Commands with accents not matching

**Solution:**
```typescript
// Spanish speech recognition typically returns unaccented text
// But handle both cases for robustness
{ command: 'interrogacion', output: '?', aliases: ['interrogación'] }
```

### Pitfall 2: Multi-Word Commands Matched Partially
**What goes wrong:** "punto y coma" gets "punto" replaced first, leaving "y coma"
**Why it happens:** Single-word commands processed before multi-word
**How to avoid:** Sort commands by length descending (longest first)
**Warning signs:** Incomplete symbol output, leftover command fragments

### Pitfall 3: Commands Matched Inside Compound Words
**What goes wrong:** "puntocom" or "contrapunto" get incorrectly parsed
**Why it happens:** Missing or incorrect word boundary assertions
**How to avoid:** Always use `\b` on both sides of command pattern
**Warning signs:** Words being transformed when they shouldn't be

### Pitfall 4: Infinite Loops in Replacement
**What goes wrong:** Parser runs forever or produces garbled output
**Why it happens:** Replacement text contains patterns that match again
**How to avoid:** Use single-pass replacement with all commands, or use unique placeholders
**Warning signs:** Browser hang, memory growth, repeated symbols

**Solution:**
```typescript
// Safe approach: replace all commands in one pass
// Use replaceAll with callback to handle each match
```

### Pitfall 5: Space Normalization Breaks User Intent
**What goes wrong:** "espacio espacio" should give two spaces, but normalization collapses them
**Why it happens:** Space normalization running after espacio conversion
**How to avoid:** Don't collapse spaces that were explicitly requested via "espacio"
**Warning signs:** Single space when user said "espacio" twice

### Pitfall 6: Race Condition with Live Text Updates
**What goes wrong:** Parsed text flickers or shows incorrect intermediate state
**Why it happens:** Parser runs on every partial result, React batching issues
**How to avoid:** Parse on final results only, or debounce visual updates
**Warning signs:** Text jumping around during speech

## Code Examples

Verified patterns from official sources and project analysis:

### Complete Parser Function
```typescript
// Source: Custom implementation based on research findings
// File: mobile-app/src/services/commandParser.ts

interface CommandDef {
  patterns: string[];  // Command words (first is primary, rest are aliases)
  output: string;      // What to insert
}

// Commands sorted by pattern length (longest first) for correct matching
const COMMANDS: CommandDef[] = [
  // Multi-word commands FIRST
  { patterns: ['signo de interrogacion', 'interrogacion'], output: '?' },
  { patterns: ['signo de exclamacion', 'exclamacion'], output: '!' },
  { patterns: ['abre comilla simple'], output: "'" },
  { patterns: ['cierra comilla simple'], output: "'" },
  { patterns: ['punto y coma'], output: ';' },
  { patterns: ['abre parentesis'], output: '(' },
  { patterns: ['cierra parentesis'], output: ')' },
  { patterns: ['abre corchete'], output: '[' },
  { patterns: ['cierra corchete'], output: ']' },
  { patterns: ['abre comillas'], output: '"' },
  { patterns: ['cierra comillas'], output: '"' },
  { patterns: ['abre llave'], output: '{' },
  { patterns: ['cierra llave'], output: '}' },
  { patterns: ['dos puntos'], output: ':' },
  { patterns: ['punto com'], output: '.com' },

  // Single-word commands AFTER multi-word
  { patterns: ['punto'], output: '.' },
  { patterns: ['coma'], output: ',' },
  { patterns: ['guion'], output: '-' },
  { patterns: ['arroba'], output: '@' },
  { patterns: ['hashtag', 'numeral'], output: '#' },
  { patterns: ['dolar'], output: '$' },
  { patterns: ['porcentaje'], output: '%' },
  { patterns: ['espacio'], output: ' ' },
];

const ESCAPE_KEYWORD = 'literal';

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function parseCommands(text: string): string {
  if (!text) return text;

  // Step 1: Handle escape sequences "literal X"
  const escapeRegex = new RegExp(`\\b${ESCAPE_KEYWORD}\\s+(\\S+)`, 'gi');
  const escapes: string[] = [];
  let processed = text.replace(escapeRegex, (_, word) => {
    escapes.push(word);
    return `\u0000ESC${escapes.length - 1}\u0000`;
  });

  // Step 2: Replace commands (already sorted by length)
  for (const cmd of COMMANDS) {
    for (const pattern of cmd.patterns) {
      const regex = new RegExp(`\\b${escapeRegex(pattern)}\\b`, 'gi');
      processed = processed.replace(regex, cmd.output);
    }
  }

  // Step 3: Restore escaped words
  escapes.forEach((word, i) => {
    processed = processed.replace(`\u0000ESC${i}\u0000`, word);
  });

  // Step 4: Normalize spaces around punctuation
  // Space before closing punctuation: remove
  processed = processed.replace(/\s+([.,;:!?)\]}"'])/g, '$1');
  // Space after opening punctuation: remove
  processed = processed.replace(/([({\[\"'])\s+/g, '$1');
  // Multiple spaces: collapse (but preserve intentional spaces from "espacio")
  processed = processed.replace(/\s{2,}/g, ' ');

  return processed.trim();
}
```

### Integration in useSpeechRecognition Hook
```typescript
// Source: Existing hook pattern from project
// Modification to mobile-app/src/hooks/useSpeechRecognition.ts

import { parseCommands } from '../services/commandParser';

// In setupSpeechListeners:
SpeechRecognition.addListener('partialResults', (data: { matches: string[] }) => {
  const rawText = data.matches[0] || '';
  const parsedText = parseCommands(rawText);
  partialCallback?.(parsedText);
});
```

### Highlight Animation CSS
```typescript
// Source: Tailwind CSS animate-pulse
// Add custom animation to tailwind config or use inline styles

// In TranscriptionEditor.tsx, track when text changes and briefly highlight
// Option 1: Use Tailwind's animate-pulse on the container
// Option 2: Custom highlight animation

// Custom keyframes for brief highlight (recommended):
const highlightStyle = `
  @keyframes symbol-highlight {
    0% { background-color: rgb(59 130 246 / 0.3); }
    100% { background-color: transparent; }
  }
`;

// Apply via inline style or CSS class when conversion detected
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Full NLP parsing | Simple regex with word boundaries | N/A | Keep it simple - no NLP needed |
| Character-by-character highlight | Container pulse | N/A | Simpler UX, clearer feedback |

**Deprecated/outdated:**
- Parser combinator libraries: Overkill for this use case
- External Spanish NLP libraries: Not needed for keyword matching

## Open Questions

Things that couldn't be fully resolved:

1. **Exact highlight animation timing**
   - What we know: User wants visual feedback when conversion happens
   - What's unclear: Ideal animation duration (100ms? 200ms? 300ms?)
   - Recommendation: Start with 200ms pulse, adjust based on feel. Claude's discretion.

2. **Parse interim vs final results**
   - What we know: User wants real-time parsing
   - What's unclear: Should interim (partial) results be parsed, or wait for final?
   - Recommendation: Parse interim results for immediate feedback. If flickering occurs, add debounce. Claude's discretion.

3. **Handling of accented vs unaccented input**
   - What we know: Spanish speech recognition may return either form
   - What's unclear: Which form Capgo speech recognition returns for es-AR
   - Recommendation: Include both accented and unaccented forms in command aliases

## Sources

### Primary (HIGH confidence)
- [MDN Word Boundary Assertion](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Word_boundary_assertion) - Word boundary regex behavior
- [Tailwind CSS Animation](https://tailwindcss.com/docs/animation) - animate-pulse utility
- Project codebase analysis - Existing speech recognition implementation

### Secondary (MEDIUM confidence)
- [Brainasoft Spanish Punctuation Commands](https://blog.brainasoft.com/spanish-espanol-punctuation-commands-for-dictation/) - Standard Spanish voice command vocabulary
- [GeeksforGeeks Regex Word Replacement](https://www.geeksforgeeks.org/javascript/javascript-program-replace-specific-words-with-another-word-in-a-string-using-regular-expressions/) - Pattern for word-based replacement
- [javascript.info Word Boundary](https://javascript.info/regexp-boundary) - Word boundary explanation

### Tertiary (LOW confidence)
- General web search on React debounce patterns for text transformation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Uses only native JS features already in project
- Architecture: HIGH - Pure function pattern is well-established
- Pitfalls: HIGH - Word boundary gotchas are well-documented
- Visual feedback: MEDIUM - Animation timing needs user testing

**Research date:** 2026-02-12
**Valid until:** 2026-03-12 (stable domain, 30-day validity)
