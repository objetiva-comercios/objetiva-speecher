/**
 * Command Parser - Converts Spanish voice commands to punctuation/symbols
 *
 * Implements real-time parsing of voice commands like "punto" -> "."
 * with word boundary protection, case insensitivity, and escape syntax.
 */

/** Command definition with patterns (primary + aliases) and output symbol */
interface CommandDef {
  patterns: string[];
  output: string;
}

/**
 * Commands sorted by pattern length (longest first) for correct multi-word matching.
 * "punto y coma" must match before "punto".
 *
 * Opening brackets use \u0001 prefix, closing brackets use \u0002 prefix
 * for smart space normalization.
 */
const COMMANDS: CommandDef[] = [
  // Multi-word commands FIRST (longest patterns)
  // Android SR variants: "Sierra" for "cierra", accented for non-accented
  { patterns: ['signo de interrogacion', 'signo de interrogación', 'interrogacion', 'interrogación'], output: '?' },
  { patterns: ['signo de exclamacion', 'signo de exclamación', 'exclamacion', 'exclamación'], output: '!' },
  // Comilla simple variants: singular/plural combinations
  { patterns: ['cierra comilla simple', 'sierra comilla simple', 'cierra comillas simple', 'sierra comillas simple', 'cierra comilla simples', 'sierra comilla simples', 'cierra comillas simples', 'sierra comillas simples'], output: "\u0002'" },
  { patterns: ['abre comilla simple', 'abre comillas simple', 'abre comilla simples', 'abre comillas simples'], output: "\u0001'" },
  // Single word "comilla simple" variants (without abre/cierra)
  { patterns: ['comilla simple', 'comillas simple', 'comilla simples', 'comillas simples'], output: "'" },
  { patterns: ['cierra parentesis', 'sierra parentesis', 'cierra paréntesis', 'sierra paréntesis'], output: ')' },
  { patterns: ['abre parentesis', 'abre paréntesis'], output: '\u0001(' },
  { patterns: ['cierra corchete', 'sierra corchete'], output: ']' },
  { patterns: ['abre corchete'], output: '\u0001[' },
  { patterns: ['cierra comillas', 'sierra comillas'], output: '\u0002"' },
  { patterns: ['abre comillas'], output: '\u0001"' },
  { patterns: ['cierra llave', 'sierra llave'], output: '}' },
  { patterns: ['abre llave'], output: '\u0001{' },
  { patterns: ['punto y coma'], output: ';' },
  { patterns: ['dos puntos'], output: ':' },
  { patterns: ['punto com'], output: '.com' },

  // Single-word commands AFTER multi-word
  { patterns: ['porcentaje'], output: '%' },
  { patterns: ['hashtag', 'numeral'], output: '\u0003#' }, // \u0003 marker for # to remove space after
  { patterns: ['comillas'], output: '"' }, // Single word "comillas" -> "
  { patterns: ['espacio'], output: '\u00A0' }, // Non-breaking space placeholder
  { patterns: ['punto'], output: '.' },
  { patterns: ['guion', 'guión'], output: '-' },
  { patterns: ['pesos', 'dolar', 'dólar'], output: '$' }, // pesos is primary, dolar/dólar as aliases
  { patterns: ['coma'], output: ',' },
  { patterns: ['arroba'], output: '@' },
];

/** Keyword for escape syntax: "literal X" preserves X as-is */
const ESCAPE_KEYWORD = 'literal';

/** Placeholder for escaped words during processing */
const ESC_PLACEHOLDER = '\u0000ESC';

/**
 * Escapes special regex characters in a string.
 */
function escapeRegexChars(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Parses Spanish voice commands and converts them to punctuation/symbols.
 *
 * Features:
 * - Case-insensitive matching ("Punto", "PUNTO" -> ".")
 * - Word boundary protection ("contrapunto" stays unchanged)
 * - Multi-word commands ("dos puntos" -> ":")
 * - Escape syntax ("literal punto" -> "punto")
 * - Space normalization around punctuation
 *
 * @param text - Input text containing voice commands
 * @returns Text with commands replaced by their corresponding symbols
 */
export function parseCommands(text: string): string {
  if (!text) return text;

  let processed = text;

  // Step 1: Handle escape sequences "literal X" - protect words from conversion
  // Also handle "literal." "literal," etc. where Android already converted the punctuation
  const escapeRegex = new RegExp(`\\b${ESCAPE_KEYWORD}[\\s]*(\\S+)`, 'gi');
  const escapes: string[] = [];

  // Reverse mapping: if Android converted "punto" to ".", convert back to word
  const punctToWord: Record<string, string> = {
    '.': 'punto', ',': 'coma', ':': 'dos puntos', ';': 'punto y coma',
    '?': 'interrogacion', '!': 'exclamacion', '-': 'guion',
    '@': 'arroba', '#': 'hashtag', '$': 'pesos', '%': 'porcentaje',
    '(': 'abre parentesis', ')': 'cierra parentesis',
    '[': 'abre corchete', ']': 'cierra corchete',
    '{': 'abre llave', '}': 'cierra llave',
    '"': 'comillas', "'": 'comilla simple'
  };

  processed = processed.replace(escapeRegex, (_, word) => {
    // If word is punctuation, convert to the Spanish word
    const actualWord = punctToWord[word] || word;
    escapes.push(actualWord);
    return `${ESC_PLACEHOLDER}${escapes.length - 1}\u0000`;
  });

  // Step 2: Replace commands in order (longest patterns first)
  for (const cmd of COMMANDS) {
    for (const pattern of cmd.patterns) {
      const regex = new RegExp(`\\b${escapeRegexChars(pattern)}\\b`, 'gi');
      processed = processed.replace(regex, cmd.output);
    }
  }

  // Step 3: Restore escaped words
  escapes.forEach((word, i) => {
    processed = processed.replace(`${ESC_PLACEHOLDER}${i}\u0000`, word);
  });

  // Step 4: Normalize spaces around punctuation
  // Use [ ] (regular space only) instead of \s to preserve NBSP placeholders

  // Opening brackets (\u0001 prefix):
  // For parens/brackets: remove space BEFORE and AFTER
  // For quotes: keep space BEFORE, remove space AFTER
  // Combined regex: optional-space + marker + bracket/quote + optional-space
  processed = processed.replace(/ *\u0001([({\[]) */g, '$1');  // brackets: remove space both sides
  processed = processed.replace(/\u0001(["']) */g, '$1');       // quotes: keep space before, remove after

  // Closing quotes (\u0002 prefix): remove space BEFORE, then remove marker
  // Pattern: space + \u0002 + symbol -> symbol
  processed = processed.replace(/(?: )+\u0002/g, '\u0002');
  // Remove the \u0002 marker
  processed = processed.replace(/\u0002/g, '');

  // Remove space BEFORE these symbols (they attach to previous word)
  // Includes: . , ; : ! ? ) ] }
  processed = processed.replace(/(?: )+([.,;:!?)\]}])/g, '$1');

  // Handle @ specifically - remove space on both sides
  processed = processed.replace(/(?: )+@/g, '@');
  processed = processed.replace(/@(?: )+/g, '@');

  // Handle .com specifically - remove space before the dot
  processed = processed.replace(/(?: )+\.com/g, '.com');

  // Handle # (\u0003 prefix): remove space after hashtag
  processed = processed.replace(/\u0003# */g, '#');

  // Step 5: Convert non-breaking space placeholders to regular spaces
  // Collapse regular-space + NBSP or NBSP + regular-space to just NBSP
  // This handles "hola espacio espacio adios" -> "hola NBSP NBSP adios"
  // Note: Use [ ] for regular space only, not \s which includes NBSP
  processed = processed.replace(/ +\u00A0/g, '\u00A0');
  processed = processed.replace(/\u00A0 +/g, '\u00A0');
  // Then convert NBSP to regular spaces
  processed = processed.replace(/\u00A0/g, ' ');

  // Trim only if result is not just spaces (preserve explicit espacios)
  const trimmed = processed.trim();
  return trimmed === '' && processed.length > 0 ? processed : trimmed;
}
