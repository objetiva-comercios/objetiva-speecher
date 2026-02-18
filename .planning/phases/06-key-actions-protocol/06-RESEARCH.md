# Phase 6: Key Actions Protocol - Research

**Researched:** 2026-02-13
**Domain:** Protocol extension for keyboard automation, robotjs/xdotool key simulation, mixed content message serialization
**Confidence:** HIGH

## Summary

This phase extends the existing text-only transcription protocol to support keyboard actions (Enter, Tab). The current flow sends `{ type: 'transcription', text: string }` messages from mobile to backend to agent, where the agent pastes the text. Phase 6 adds a new message type for "key actions" that agents execute as actual key presses instead of clipboard paste.

The implementation requires changes at all layers:
1. **Mobile app**: Parser detects "nueva linea"/"enter" and "tabulador"/"tab", converts to action markers
2. **Protocol**: New message format supporting interleaved text and key actions
3. **Backend**: Route messages with actions to agents unchanged
4. **Windows agent**: Use existing @jitsi/robotjs `keyTap('enter')` and `keyTap('tab')`
5. **Linux agent**: Use existing xdotool `xdotool key Return` and `xdotool key Tab`

The key technical decision is **protocol format**: whether to send pure actions, mixed content (array of segments), or a transformed payload. Research recommends a **segment array approach** with discriminated union types for type safety and extensibility.

**Primary recommendation:** Extend ServerMessage to support `{ type: 'transcription', id, payload: Segment[], timestamp }` where `Segment = TextSegment | KeyAction`, with agents processing segments sequentially (paste text, then execute key actions).

## Standard Stack

This phase uses existing project dependencies - no new packages required.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @jitsi/robotjs | ^0.6.21 | Windows key simulation | Already in windows-agent, `keyTap('enter')` verified |
| xdotool (system) | 3.x | Linux key simulation | Already used for paste, `key Return/Tab` supported |
| TypeScript | ~5.x | Type-safe discriminated unions | Already in all packages |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ws | ^8.0.0 | WebSocket transport | Already used, no changes needed |
| Fastify | existing | HTTP routing | Already used, minor schema update |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @jitsi/robotjs | @nut-tree/nut-js | nut-js already in project but robotjs is simpler for basic key taps |
| Segment array | Escaped string format | String escaping is error-prone, segments are type-safe |
| New message type | Extend existing `text` field | Breaking change vs clean extension |

**Installation:**
```bash
# No new dependencies required - all libraries already present
```

## Architecture Patterns

### Recommended Protocol Extension

The protocol needs to represent mixed content: text to paste + key actions to execute. Two main patterns exist:

**Pattern A: Segment Array (RECOMMENDED)**
```typescript
// Discriminated union for type safety
type Segment =
  | { type: 'text'; value: string }
  | { type: 'key'; key: 'enter' | 'tab' };

// Extended message format
type ServerMessage =
  | { type: 'transcription'; id: string; payload: Segment[]; timestamp: number }

// Example: "hola enter mundo"
payload: [
  { type: 'text', value: 'hola ' },
  { type: 'key', key: 'enter' },
  { type: 'text', value: 'mundo' }
]
```

**Pattern B: Simple Actions-Only (Alternative)**
```typescript
// Separate message type for actions
type ServerMessage =
  | { type: 'transcription'; id: string; text: string; timestamp: number }
  | { type: 'key-action'; id: string; key: 'enter' | 'tab'; timestamp: number }

// Requires mobile to send multiple messages for mixed content
```

**Recommendation:** Pattern A (Segment Array) because:
1. Single message for mixed content (atomic delivery)
2. Preserves ordering guarantees
3. Extensible for future action types
4. Type-safe with discriminated unions
5. Agent processes sequentially: paste text, execute key

### Recommended Project Structure
```
Changes required in each package:

mobile-app/src/
├── services/
│   └── commandParser.ts     # Add key action detection
├── services/
│   └── api.ts               # Update sendTranscription to send segments
└── types/
    └── index.ts             # Add Segment type, update API types

backend-server/src/
├── types/
│   └── messages.ts          # Update ServerMessage, add Segment type
├── routes/
│   └── transcription.ts     # Accept payload with segments
└── websocket/
    └── handler.ts           # Forward segments unchanged

windows-agent/src/
├── types.ts                 # Add Segment type
├── paste/
│   └── keyboard.ts          # Add keyAction function
└── agent/
    └── connection.ts        # Process segments sequentially

linux-agent/src/
├── types.ts                 # Add Segment type
├── paste/
│   └── keyboard.ts          # Add keyAction function
└── agent/
    └── connection.ts        # Process segments sequentially
```

### Pattern 1: Discriminated Union for Message Types
**What:** Use TypeScript discriminated unions for type-safe message handling
**When to use:** Always - this is the existing pattern in the codebase
**Example:**
```typescript
// Source: TypeScript Discriminated Unions pattern
// https://www.convex.dev/typescript/advanced/type-operators-manipulation/typescript-discriminated-union

type Segment =
  | { type: 'text'; value: string }
  | { type: 'key'; key: KeyAction };

type KeyAction = 'enter' | 'tab';

// Type-safe processing
function processSegment(segment: Segment): void {
  switch (segment.type) {
    case 'text':
      pasteText(segment.value);
      break;
    case 'key':
      executeKeyAction(segment.key);
      break;
    default:
      // Exhaustive check - TypeScript error if case missing
      const _exhaustive: never = segment;
  }
}
```

### Pattern 2: Sequential Segment Processing
**What:** Process segments in order, maintaining execution sequence
**When to use:** When handling mixed content with interleaved text and actions
**Example:**
```typescript
// Source: Custom implementation based on project pattern
async function executePayload(segments: Segment[]): Promise<void> {
  for (const segment of segments) {
    if (segment.type === 'text') {
      // Paste text using existing pasteText function
      await pasteText(segment.value);
    } else if (segment.type === 'key') {
      // Execute key action
      await executeKeyAction(segment.key);
    }
    // Small delay between segments to ensure proper ordering
    await delay(50);
  }
}
```

### Pattern 3: Parser Producing Segments (Mobile App)
**What:** Extend command parser to output Segment array instead of string
**When to use:** When user says "nueva linea" or "tabulador"
**Example:**
```typescript
// Source: Extension of existing parseCommands from Phase 5

interface ParseResult {
  segments: Segment[];
}

// Key action commands to detect
const KEY_COMMANDS = [
  { patterns: ['nueva linea', 'nueva línea', 'enter'], key: 'enter' as const },
  { patterns: ['tabulador', 'tab'], key: 'tab' as const },
];

export function parseToSegments(text: string): Segment[] {
  // First, apply text command parsing (punctuation, symbols)
  const parsed = parseCommands(text);

  // Then split on key action commands
  return splitIntoSegments(parsed, KEY_COMMANDS);
}

function splitIntoSegments(text: string, keyCommands: KeyCommand[]): Segment[] {
  const segments: Segment[] = [];
  let remaining = text;

  // Build combined regex for all key commands
  const patterns = keyCommands.flatMap(kc => kc.patterns);
  const regex = new RegExp(`\\b(${patterns.map(escapeRegex).join('|')})\\b`, 'gi');

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(remaining)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      const textBefore = remaining.slice(lastIndex, match.index).trim();
      if (textBefore) {
        segments.push({ type: 'text', value: textBefore });
      }
    }

    // Add key action
    const matchedPattern = match[1].toLowerCase();
    const keyCmd = keyCommands.find(kc =>
      kc.patterns.some(p => p.toLowerCase() === matchedPattern)
    );
    if (keyCmd) {
      segments.push({ type: 'key', key: keyCmd.key });
    }

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < remaining.length) {
    const textAfter = remaining.slice(lastIndex).trim();
    if (textAfter) {
      segments.push({ type: 'text', value: textAfter });
    }
  }

  return segments;
}
```

### Anti-Patterns to Avoid
- **String escaping for actions:** Don't embed `\n` or `[ENTER]` in text strings - use typed segments
- **Multiple WebSocket messages for one utterance:** Atomic delivery ensures ordering
- **Synchronous key execution without delays:** Key events need settling time
- **Modifying existing `text` field semantics:** Use new `payload` field for backwards compatibility

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Key simulation Windows | Raw Win32 API | @jitsi/robotjs keyTap | Already works, handles key up/down |
| Key simulation Linux | Raw X11 events | xdotool key | Handles modifier clearing |
| Segment serialization | Custom format | JSON array with type discriminator | Standard, debuggable |
| Type-safe message handling | Runtime type checks | TypeScript discriminated unions | Compile-time safety |

**Key insight:** Both robotjs and xdotool already support the exact key names needed: `enter` and `tab` (robotjs), `Return` and `Tab` (xdotool). No new key mapping logic needed.

## Common Pitfalls

### Pitfall 1: Key Press Not Registering in Target Application
**What goes wrong:** Agent executes keyTap but target app doesn't receive the key event
**Why it happens:** Timing issues - key sent before focus switches, or key sent too fast after paste
**How to avoid:** Add configurable delay between paste and key action, and between consecutive key actions
**Warning signs:** Key actions work in some apps but not others, intermittent failures

**Solution:**
```typescript
// Add delay between segments
const SEGMENT_DELAY_MS = 50;

async function executePayload(segments: Segment[]): Promise<void> {
  for (let i = 0; i < segments.length; i++) {
    await processSegment(segments[i]);
    if (i < segments.length - 1) {
      await delay(SEGMENT_DELAY_MS);
    }
  }
}
```

### Pitfall 2: Backwards Compatibility Breaking
**What goes wrong:** Old agents crash when receiving new message format
**Why it happens:** Changing `text` field to `payload` without version negotiation
**How to avoid:** Either keep `text` field for text-only messages, or version the protocol
**Warning signs:** Old agents disconnecting, parse errors in logs

**Solution:**
```typescript
// Option A: Coexist both formats
type ServerMessage =
  | { type: 'transcription'; id: string; text: string; timestamp: number }  // Legacy
  | { type: 'transcription-v2'; id: string; payload: Segment[]; timestamp: number }  // New

// Option B: Backwards-compatible single type
type ServerMessage = {
  type: 'transcription';
  id: string;
  payload: Segment[];  // New field
  text?: string;       // Deprecated, for old agents
  timestamp: number;
};
```

### Pitfall 3: xdotool Key Names Different from robotjs
**What goes wrong:** Using `enter` with xdotool (should be `Return`)
**Why it happens:** Assuming both tools use same key names
**How to avoid:** Map abstract key names to tool-specific names in each agent
**Warning signs:** "Invalid key" errors in Linux agent

**Solution:**
```typescript
// Windows agent (robotjs)
const ROBOTJS_KEYS: Record<KeyAction, string> = {
  enter: 'enter',  // robotjs uses lowercase
  tab: 'tab',
};

// Linux agent (xdotool)
const XDOTOOL_KEYS: Record<KeyAction, string> = {
  enter: 'Return',  // xdotool uses X11 keysym names
  tab: 'Tab',
};
```

### Pitfall 4: Empty Segments After Parsing
**What goes wrong:** User says only "enter" and payload is `[{ type: 'key', key: 'enter' }]` with no text
**Why it happens:** Not a pitfall, but needs handling - empty text segments should be filtered
**How to avoid:** Normalize segments, remove empty text values
**Warning signs:** Extra whitespace in output, unnecessary paste operations

### Pitfall 5: Rapid Key Presses Merging
**What goes wrong:** "enter enter" becomes single Enter key instead of two
**Why it happens:** No delay between key presses, OS keyboard buffer coalescing
**How to avoid:** Add minimum delay between consecutive key actions (50-100ms)
**Warning signs:** Missing line breaks, fewer tabs than expected

## Code Examples

Verified patterns from official sources and existing project code:

### robotjs keyTap for Enter/Tab (Windows)
```typescript
// Source: RobotJS documentation
// https://github.com/octalmage/robotjs.io/blob/master/_posts/docs/2016-10-12-syntax.md

import robot from '@jitsi/robotjs';

// Supported key names include: enter, tab, backspace, delete, escape, etc.
// Second parameter is optional modifier(s)

export function executeKeyAction(key: 'enter' | 'tab'): void {
  robot.keyTap(key);  // 'enter' and 'tab' are valid key names
}

// For modifier combinations (not needed for Phase 6, but FYI):
// robot.keyTap('v', 'control');  // Ctrl+V
```

### xdotool key for Enter/Tab (Linux)
```typescript
// Source: xdotool man page
// https://man.archlinux.org/man/xdotool.1.en

import { spawn } from 'child_process';

// X11 keysym names: Return (Enter), Tab, BackSpace, etc.
const XDOTOOL_KEYS: Record<'enter' | 'tab', string> = {
  enter: 'Return',
  tab: 'Tab',
};

export function executeKeyAction(key: 'enter' | 'tab'): Promise<void> {
  return new Promise((resolve, reject) => {
    const xdotool = spawn('xdotool', ['key', '--clearmodifiers', XDOTOOL_KEYS[key]]);

    let stderr = '';
    xdotool.stderr.on('data', (data) => { stderr += data.toString(); });

    xdotool.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`xdotool failed (code ${code}): ${stderr}`));
    });

    xdotool.on('error', (err) => {
      reject(new Error(`Failed to spawn xdotool: ${err.message}`));
    });
  });
}
```

### Type Definitions for Protocol
```typescript
// Source: Custom implementation based on discriminated union pattern

// Shared types (put in each package's types.ts)
export type KeyAction = 'enter' | 'tab';

export type Segment =
  | { type: 'text'; value: string }
  | { type: 'key'; key: KeyAction };

// Backend message types (backend-server/src/types/messages.ts)
export type ServerMessage = {
  type: 'transcription';
  id: string;
  payload: Segment[];
  timestamp: number;
};

// API request body (mobile -> backend)
export interface TranscriptionRequest {
  deviceId: string;
  payload: Segment[];
}
```

### Mobile API Client Update
```typescript
// Source: Extension of existing api.ts

// Update sendTranscription to accept segments
async sendTranscription(deviceId: string, payload: Segment[]): Promise<ApiResponse> {
  const response = await fetch(`${this.baseUrl}/transcription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, payload }),
  });

  return response.json() as Promise<ApiResponse>;
}

// Helper to convert text-only to segment array (backwards compat)
function textToPayload(text: string): Segment[] {
  return text ? [{ type: 'text', value: text }] : [];
}
```

### Agent Segment Processing
```typescript
// Source: Extension of existing connection.ts onMessage handler

import { pasteText } from '../paste/paste.js';
import { executeKeyAction } from '../paste/keyboard.js';

async function processPayload(payload: Segment[]): Promise<void> {
  for (const segment of payload) {
    switch (segment.type) {
      case 'text':
        if (segment.value) {
          await pasteText(segment.value);
        }
        break;
      case 'key':
        executeKeyAction(segment.key);
        break;
    }
    // Delay between segments for reliable execution
    await delay(50);
  }
}

// In onMessage:
if (msg.type === 'transcription') {
  await processPayload(msg.payload);
  // Send ACK...
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| String with escape sequences | Typed segment arrays | Industry standard | Type safety, no parsing errors |
| Single-type messages | Discriminated unions | TypeScript best practice | Exhaustive checking |
| robotjs (unmaintained) | @jitsi/robotjs | 2021 | Prebuilt binaries, maintained |

**Deprecated/outdated:**
- Original robotjs package: Unmaintained since 2019, use @jitsi/robotjs fork instead (already in project)
- nut-tree/nut-js for simple keys: Overkill for basic keyTap, robotjs is sufficient

## Open Questions

Things that couldn't be fully resolved:

1. **Segment delay timing**
   - What we know: Some delay needed between segments for reliable execution
   - What's unclear: Optimal delay value (50ms? 100ms?)
   - Recommendation: Start with 50ms, make configurable. Claude's discretion.

2. **Protocol versioning strategy**
   - What we know: Need to handle old agents gracefully
   - What's unclear: Whether to use new message type or extend existing
   - Recommendation: Extend existing `transcription` type with `payload` field, keep `text` deprecated for 1 version. Claude's discretion.

3. **Error handling for partial segment execution**
   - What we know: If paste succeeds but key fails, user gets partial result
   - What's unclear: Should we retry? Rollback? Report partial success?
   - Recommendation: Log error, continue with remaining segments, report success if any segment succeeded. Claude's discretion.

## Sources

### Primary (HIGH confidence)
- [@jitsi/robotjs npm](https://www.npmjs.com/package/@jitsi/robotjs) - Fork with prebuilt binaries
- [RobotJS Syntax Documentation](https://github.com/octalmage/robotjs.io/blob/master/_posts/docs/2016-10-12-syntax.md) - Supported key names: enter, tab
- [xdotool man page](https://man.archlinux.org/man/xdotool.1.en) - X11 keysym names: Return, Tab
- Existing project codebase - Current keyboard.ts implementations verified

### Secondary (MEDIUM confidence)
- [TypeScript Discriminated Unions](https://www.convex.dev/typescript/advanced/type-operators-manipulation/typescript-discriminated-union) - Pattern for type-safe message handling
- [JSON WebSocket Convention](https://thoughtbot.com/blog/json-event-based-convention-websockets) - Event-based message patterns

### Tertiary (LOW confidence)
- General web search on keyboard automation timing best practices

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing libraries, key names verified
- Architecture: HIGH - Discriminated union pattern is well-established
- Pitfalls: HIGH - Timing issues and key name mapping documented
- Protocol design: MEDIUM - Segment array approach is sound but untested in this codebase

**Research date:** 2026-02-13
**Valid until:** 2026-03-13 (stable domain, 30-day validity)
