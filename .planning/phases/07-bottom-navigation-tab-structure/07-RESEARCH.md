# Phase 7: Bottom Navigation & Tab Structure - Research

**Researched:** 2026-03-23
**Domain:** React mobile tab navigation, Capacitor app layout, CSS safe areas
**Confidence:** HIGH

## Summary

This phase transforms a single-view Capacitor/React app into a tabbed layout with a bottom navigation bar. The existing App.tsx (474 lines) must be decomposed into a TabLayout container with three screen components (History, Speech, Config), where the Speech tab inherits all current main-screen content and the History tab receives the existing HistoryList component.

The core challenge is structural refactoring, not new technology. The app already uses React 19, Tailwind CSS v4, and Capacitor 8. The only new dependency needed is `lucide-react` for tab icons (Clock, Mic, Settings). The raised center mic button (FAB-in-nav pattern) requires careful CSS positioning with `absolute` placement and negative top offset.

**Primary recommendation:** Decompose App.tsx into a TabLayout shell + three screen components. Use `display: none`/`display: block` toggling (not conditional rendering) to preserve mounted state across tab switches. Install lucide-react for icons.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Solid white background with subtle gray top border (border-gray-200)
- Icons only, no text labels -- 3 tabs are self-explanatory (clock, mic, gear)
- Active tab icon turns blue-500, inactive icons are gray-400
- Icons from lucide-react (Clock, Mic, Settings)
- Respects safe-area-inset-bottom for devices with gesture bars
- Instant swap, no animation -- conditional rendering based on activeTab state
- Simple useState for tab routing -- no React Router (Capacitor app, not a website)
- Tabs preserve their state when switching away and back (keep components mounted, toggle visibility)
- Switching tabs while recording auto-stops recording and sends transcription (existing auto-send behavior)
- Speech tab: existing main screen content (header, DeviceSelector, StatusIndicator, RecordButton, TranscriptionEditor, WaveformVisualizer)
- History tab: move existing HistoryList component out of Speech screen into its own tab
- Config tab: placeholder screen ("Configuracion - proximamente") -- full config is Phase 9
- Header (title + DeviceSelector + StatusIndicator) stays on Speech tab only -- other tabs get their own simpler headers
- OfflineBanner is shared/global, displayed above tab content area on all tabs
- ConfigScreen (connection-failure flow) remains as a pre-nav-bar state -- shown before tabs load when backend is unreachable
- Raised circular button that floats above the nav bar edge (classic FAB-in-nav pattern)
- Blue-500 filled circle with white mic icon
- Nav mic is for navigation only -- tapping selects Speech tab, does NOT start recording
- Double-tap on center mic enters text editing mode (NAV-07)
- Subtle pulse/glow animation on the mic circle when recording is active (global recording awareness)
- Existing RecordButton stays inside the Speech tab content for actual recording control

### Claude's Discretion
- Exact dimensions of the raised circle and overlap amount
- Spacing and padding within the nav bar
- Pulse animation implementation details (CSS keyframes vs Tailwind animate)
- How to structure the tab screen components (file organization)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NAV-01 | App shows bottom navigation bar with 3 tabs visible on all screens | TabLayout component with fixed bottom bar; safe-area-inset-bottom padding |
| NAV-02 | Center tab has a large microphone icon and is the default active tab | Raised FAB circle with lucide-react Mic icon; `useState<TabId>('speech')` default |
| NAV-03 | Left tab has a small history icon (clock/list) | lucide-react Clock icon in left tab position |
| NAV-04 | Right tab has a small settings icon (gear) | lucide-react Settings icon in right tab position |
| NAV-05 | Tapping a tab switches the visible screen without page reload | Display toggling (show/hide) preserves mounted state, no unmount/remount |
| NAV-06 | Active tab is visually distinguished from inactive tabs | blue-500 for active icon, gray-400 for inactive; center FAB always blue-500 filled |
| NAV-07 | Double tap on center mic icon enters text editing mode | Reuse double-tap detection pattern from RecordButton; triggers setButtonMode('text') + setIsTextModeActive(true) on Speech tab |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | ^19.2.0 | UI framework | Already installed |
| tailwindcss | ^4.1.18 | Styling | Already installed, all styling via Tailwind |
| lucide-react | 1.0.1 | Tab bar icons (Clock, Mic, Settings) | User decision; tree-shakeable, consistent icon set |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @capacitor/core | ^8.0.2 | Native platform APIs | Already installed, safe area insets |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| lucide-react | Inline SVGs | User explicitly chose lucide-react; provides consistency and smaller bundle via tree-shaking |
| useState tab routing | React Router | User explicitly rejected React Router -- this is a Capacitor app, not a website |

**Installation:**
```bash
cd mobile-app && npm install lucide-react
```

**Version verification:** lucide-react 1.0.1 is the current latest on npm (verified 2026-03-23).

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    BottomNavBar.tsx       # Nav bar with 3 tabs + raised center FAB
    screens/
      SpeechScreen.tsx     # Extracted from App.tsx main content
      HistoryScreen.tsx    # Wraps existing HistoryList with own header
      ConfigScreen.tsx     # Placeholder screen (rename existing ConfigScreen to ConnectionSetup)
    TabLayout.tsx          # Orchestrates screens + nav bar + shared OfflineBanner
    ... (existing components unchanged)
  hooks/
    ... (existing hooks unchanged)
  App.tsx                  # Simplified: appState checks -> TabLayout or ConnectionSetup
```

### Pattern 1: Display Toggle for Tab Persistence
**What:** Keep all three screen components mounted at all times; toggle visibility with CSS `display: none`/`display: block` instead of conditional rendering.
**When to use:** When tabs must preserve internal state (scroll position, form inputs, recording state) across switches.
**Example:**
```typescript
type TabId = 'history' | 'speech' | 'config';

function TabLayout() {
  const [activeTab, setActiveTab] = useState<TabId>('speech');

  return (
    <div className="flex flex-col h-screen">
      {/* Shared banner above content */}
      <OfflineBanner status={networkStatus} />

      {/* Tab content area - all mounted, visibility toggled */}
      <div className="flex-1 overflow-y-auto">
        <div className={activeTab === 'history' ? 'block' : 'hidden'}>
          <HistoryScreen />
        </div>
        <div className={activeTab === 'speech' ? 'block' : 'hidden'}>
          <SpeechScreen />
        </div>
        <div className={activeTab === 'config' ? 'block' : 'hidden'}>
          <ConfigScreen />
        </div>
      </div>

      {/* Bottom nav */}
      <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
```

### Pattern 2: Raised Center FAB in Nav Bar
**What:** A circular button that sits partially above the nav bar, creating a visual focal point for the primary action tab.
**When to use:** When one tab is the "home" or primary action and should be visually prominent.
**Example:**
```typescript
function BottomNavBar({ activeTab, onTabChange, isRecording }: NavBarProps) {
  return (
    <nav
      className="relative bg-white border-t border-gray-200"
      style={{ paddingBottom: 'var(--sab, 0px)' }}
    >
      <div className="flex items-center justify-around h-14">
        {/* Left tab: History */}
        <button onClick={() => onTabChange('history')} className="flex-1 ...">
          <Clock className={activeTab === 'history' ? 'text-blue-500' : 'text-gray-400'} size={24} />
        </button>

        {/* Center: Raised mic FAB */}
        <div className="flex-1 flex justify-center">
          <button
            onClick={handleCenterTap}
            className="absolute -top-6 w-14 h-14 rounded-full bg-blue-500
                       flex items-center justify-center shadow-lg"
          >
            <Mic className="text-white" size={26} />
          </button>
        </div>

        {/* Right tab: Config */}
        <button onClick={() => onTabChange('config')} className="flex-1 ...">
          <Settings className={activeTab === 'config' ? 'text-blue-500' : 'text-gray-400'} size={24} />
        </button>
      </div>
    </nav>
  );
}
```

### Pattern 3: Auto-Stop Recording on Tab Switch
**What:** When user switches tabs while recording is active, automatically stop recording and trigger the existing auto-send flow.
**When to use:** Preventing orphaned recording sessions when user navigates away.
**Example:**
```typescript
const handleTabChange = useCallback((newTab: TabId) => {
  // Auto-stop recording if switching away from speech tab
  if (activeTab === 'speech' && newTab !== 'speech' && recordingState === 'recording') {
    stopRecording(); // This triggers auto-send via existing useEffect
  }
  setActiveTab(newTab);
}, [activeTab, recordingState, stopRecording]);
```

### Anti-Patterns to Avoid
- **Conditional rendering for tabs:** Using `{activeTab === 'speech' && <SpeechScreen />}` will unmount/remount components, losing state. Use `hidden` class or `display: none` instead.
- **Lifting all state to TabLayout:** The Speech screen has significant local state (recording, text mode, etc.). Keep it in the screen component, only lift what TabLayout needs (e.g., `isRecording` for the FAB pulse).
- **Using the nav mic FAB as a recording trigger:** User decision is clear -- nav mic is navigation only, NOT a record button. The existing RecordButton inside SpeechScreen handles recording.
- **Forgetting safe-area-inset-bottom:** The nav bar MUST account for gesture bars on modern phones. Use `var(--sab, 0px)` for bottom padding.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Icon set | Custom SVG icons | lucide-react (Clock, Mic, Settings) | User decision; consistent sizing, stroke width, and alignment |
| Double-tap detection | New gesture handler | Copy pattern from existing RecordButton.tsx | Already battle-tested in the codebase (lines 41-67 of RecordButton.tsx) |
| Safe area handling | Manual pixel calculations | CSS `env(safe-area-inset-bottom)` via `--sab` variable | Already defined in index.css, works across devices |

**Key insight:** This phase is a refactoring/restructuring task. All the hard functionality (recording, history, speech recognition) already exists. The work is decomposition and layout, not new features.

## Common Pitfalls

### Pitfall 1: State Loss on Tab Switch
**What goes wrong:** Using conditional rendering (`&&`) instead of display toggling causes components to unmount, losing scroll position, form state, and in-progress recordings.
**Why it happens:** Default React pattern is conditional rendering; visibility toggling feels non-idiomatic.
**How to avoid:** Use Tailwind's `hidden` class (which applies `display: none`) for inactive tabs, `block` for active.
**Warning signs:** History list scroll position resets when switching back; recording state lost.

### Pitfall 2: Content Hidden Behind Nav Bar
**What goes wrong:** Page content scrolls behind the fixed bottom nav bar, making the last items inaccessible.
**Why it happens:** Fixed/absolute bottom nav overlays content without reserving space.
**How to avoid:** Use flexbox layout: `flex flex-col h-screen` with content area `flex-1 overflow-y-auto` and nav bar as a natural flex child (not absolute). The nav bar then takes its natural height and the content area fills remaining space.
**Warning signs:** Last history item or bottom content cut off by nav bar.

### Pitfall 3: FAB Click Area Overflow
**What goes wrong:** The raised center FAB circle extends above the nav bar but clicks on the overflowing portion don't register.
**Why it happens:** Parent element has `overflow: hidden` or the clickable area is clipped.
**How to avoid:** Ensure the nav bar container does NOT have `overflow: hidden`. Use `absolute` positioning for the FAB relative to the nav container. The nav container needs enough relative context.
**Warning signs:** Tapping the top half of the raised mic circle does nothing.

### Pitfall 4: Double-Tap Conflicts with Single-Tap
**What goes wrong:** Double-tap on center mic triggers a single-tap (tab switch) first, then the double-tap action.
**Why it happens:** No debounce window for single-tap detection.
**How to avoid:** Use the same delayed single-tap pattern from RecordButton.tsx -- wait `DOUBLE_TAP_WINDOW_MS` (300ms) before committing to single-tap action.
**Warning signs:** Double-tap on mic first switches to speech tab, then enters text mode (two actions instead of one).

### Pitfall 5: Renaming ConfigScreen Collision
**What goes wrong:** The existing `ConfigScreen` component (connection failure flow) conflicts with the new Config tab screen.
**Why it happens:** Both logically relate to "config" but serve different purposes.
**How to avoid:** Rename the existing `ConfigScreen` to `ConnectionSetup` or `ConnectionScreen`. The new Config tab placeholder is a separate component.
**Warning signs:** Import confusion, wrong component rendered.

### Pitfall 6: Recording Pulse Animation on Nav FAB
**What goes wrong:** The pulse animation on the center FAB doesn't work or looks janky.
**Why it happens:** CSS animation on an absolutely-positioned element with shadow can cause repaints.
**How to avoid:** Use `box-shadow` animation (like existing `success-pulse` in RecordButton) or a pseudo-element ring. Keep it GPU-accelerated with `will-change: box-shadow` or use `transform: scale()` on a wrapper.
**Warning signs:** Animation stutters on low-end Android devices.

## Code Examples

### Tab Type and State
```typescript
// types or inline
export type TabId = 'history' | 'speech' | 'config';
```

### BottomNavBar Component Structure
```typescript
import { Clock, Mic, Settings } from 'lucide-react';

interface BottomNavBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  isRecording: boolean;
  onCenterDoubleTap: () => void;
}
```

### CSS Keyframe for Recording Pulse
```css
@keyframes recording-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
  }
}
.animate-recording-pulse {
  animation: recording-pulse 1.5s ease-in-out infinite;
}
```

### Full-Screen Flex Layout
```typescript
// TabLayout wrapper ensuring nav bar doesn't overlap content
<div className="flex flex-col h-screen bg-gray-100">
  {/* Global elements */}
  <OfflineBanner status={networkStatus} />

  {/* Scrollable content area */}
  <main className="flex-1 overflow-y-auto">
    <div className={activeTab === 'history' ? 'block' : 'hidden'}>
      <HistoryScreen {...historyProps} />
    </div>
    <div className={activeTab === 'speech' ? 'block' : 'hidden'}>
      <SpeechScreen {...speechProps} />
    </div>
    <div className={activeTab === 'config' ? 'block' : 'hidden'}>
      <ConfigPlaceholder />
    </div>
  </main>

  {/* Fixed bottom nav */}
  <BottomNavBar
    activeTab={activeTab}
    onTabChange={handleTabChange}
    isRecording={isRecording}
    onCenterDoubleTap={handleCenterDoubleTap}
  />

  {/* Toast stays global */}
  <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
</div>
```

### Safe Area Bottom Padding for Nav Bar
```typescript
// Nav bar respects device gesture area
<nav
  className="relative bg-white border-t border-gray-200"
  style={{ paddingBottom: 'var(--sab, 0px)' }}
>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| React Router for Capacitor tabs | useState-based tab routing | Common in Capacitor/Ionic apps | Simpler, no URL routing overhead for native-feel apps |
| Manual SVG icons | lucide-react tree-shaking | lucide-react 1.x (2025) | Import only needed icons, consistent API |
| Tailwind v3 `hidden` | Tailwind v4 `hidden` | Tailwind v4 (2025) | Same utility class, works identically |

**Note on Tailwind v4:** This project uses Tailwind v4 with `@import "tailwindcss"` syntax. The `hidden` utility (display: none) and `block` utility (display: block) work the same as v3. No `tailwind.config.js` needed -- v4 uses CSS-first configuration.

## Open Questions

1. **State lifting strategy for SpeechScreen**
   - What we know: SpeechScreen needs significant state (recording, text mode, history actions, device list). Currently all in App.tsx.
   - What's unclear: How much state stays in SpeechScreen vs. gets lifted to TabLayout. The `isRecording` flag is needed by both TabLayout (for auto-stop on tab switch) and BottomNavBar (for pulse animation).
   - Recommendation: Keep most state in SpeechScreen. Expose `isRecording` and `stopRecording` via a ref or callback to TabLayout. Alternatively, since useHistory and useSpeechRecognition are hooks, they can be called at TabLayout level and props drilled down.

2. **History edit action cross-tab behavior**
   - What we know: Currently tapping "Edit" on a history item opens text mode with that item's text.
   - What's unclear: When History is in its own tab, should "Edit" switch to the Speech tab and open text mode there?
   - Recommendation: Yes -- "Edit" on history item should switch to Speech tab and activate text mode with that item's text. This preserves existing UX.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^4.0.18 |
| Config file | none -- see Wave 0 |
| Quick run command | `cd mobile-app && npx vitest run --reporter=verbose` |
| Full suite command | `cd mobile-app && npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NAV-01 | Bottom nav bar renders with 3 tab buttons | unit | `cd mobile-app && npx vitest run src/components/BottomNavBar.test.tsx -x` | No -- Wave 0 |
| NAV-02 | Center tab has Mic icon, speech is default active tab | unit | `cd mobile-app && npx vitest run src/components/BottomNavBar.test.tsx -x` | No -- Wave 0 |
| NAV-03 | Left tab has Clock icon | unit | `cd mobile-app && npx vitest run src/components/BottomNavBar.test.tsx -x` | No -- Wave 0 |
| NAV-04 | Right tab has Settings icon | unit | `cd mobile-app && npx vitest run src/components/BottomNavBar.test.tsx -x` | No -- Wave 0 |
| NAV-05 | Tab switch toggles visibility without unmount | unit | `cd mobile-app && npx vitest run src/components/TabLayout.test.tsx -x` | No -- Wave 0 |
| NAV-06 | Active tab icon has blue-500, inactive gray-400 | unit | `cd mobile-app && npx vitest run src/components/BottomNavBar.test.tsx -x` | No -- Wave 0 |
| NAV-07 | Double-tap center mic enters text editing mode | unit | `cd mobile-app && npx vitest run src/components/BottomNavBar.test.tsx -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `cd mobile-app && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd mobile-app && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `mobile-app/vitest.config.ts` -- vitest config with jsdom environment for component tests
- [ ] `mobile-app/src/test-setup.ts` -- test setup (if needed for DOM mocking)
- [ ] `mobile-app/src/components/BottomNavBar.test.tsx` -- covers NAV-01, NAV-02, NAV-03, NAV-04, NAV-06, NAV-07
- [ ] `mobile-app/src/components/TabLayout.test.tsx` -- covers NAV-05

**Note:** Component tests require `@testing-library/react` and `jsdom`. These are not currently installed:
```bash
cd mobile-app && npm install -D @testing-library/react @testing-library/jest-dom jsdom
```

## Sources

### Primary (HIGH confidence)
- Project codebase direct inspection: App.tsx, RecordButton.tsx, HistoryList.tsx, useApp.ts, index.css, package.json
- CONTEXT.md -- all user decisions for this phase
- REQUIREMENTS.md -- NAV-01 through NAV-07

### Secondary (MEDIUM confidence)
- npm registry: lucide-react version 1.0.1 verified current
- Tailwind v4 `hidden`/`block` utility behavior -- consistent with v3, verified by project's existing Tailwind v4 usage

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- only new dependency is lucide-react (user-chosen), everything else already installed
- Architecture: HIGH -- straightforward React component decomposition with well-established patterns
- Pitfalls: HIGH -- identified from direct codebase analysis and standard mobile nav patterns

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable domain, no fast-moving dependencies)
