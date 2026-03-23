# Phase 7: Bottom Navigation & Tab Structure - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a persistent bottom tab bar with 3 tabs (History, Speech/Mic, Config) enabling navigation between distinct screens. Refactor the current single-view App.tsx into a tabbed layout. History and Config screen content will be built in Phases 8 and 9 respectively — this phase establishes the navigation structure.

</domain>

<decisions>
## Implementation Decisions

### Tab Bar Visual Style
- Solid white background with subtle gray top border (border-gray-200)
- Icons only, no text labels — 3 tabs are self-explanatory (clock, mic, gear)
- Active tab icon turns blue-500, inactive icons are gray-400
- Icons from lucide-react (Clock, Mic, Settings)
- Respects safe-area-inset-bottom for devices with gesture bars

### Screen Transition Behavior
- Instant swap, no animation — conditional rendering based on activeTab state
- Simple useState for tab routing — no React Router (Capacitor app, not a website)
- Tabs preserve their state when switching away and back (keep components mounted, toggle visibility)
- Switching tabs while recording auto-stops recording and sends transcription (existing auto-send behavior)

### Tab Content Splitting
- Speech tab: existing main screen content (header, DeviceSelector, StatusIndicator, RecordButton, TranscriptionEditor, WaveformVisualizer)
- History tab: move existing HistoryList component out of Speech screen into its own tab
- Config tab: placeholder screen ("Configuración - próximamente") — full config is Phase 9
- Header (title + DeviceSelector + StatusIndicator) stays on Speech tab only — other tabs get their own simpler headers
- OfflineBanner is shared/global, displayed above tab content area on all tabs
- ConfigScreen (connection-failure flow) remains as a pre-nav-bar state — shown before tabs load when backend is unreachable

### Center Mic Icon Treatment
- Raised circular button that floats above the nav bar edge (classic FAB-in-nav pattern)
- Blue-500 filled circle with white mic icon
- Nav mic is for navigation only — tapping selects Speech tab, does NOT start recording
- Double-tap on center mic enters text editing mode (NAV-07)
- Subtle pulse/glow animation on the mic circle when recording is active (global recording awareness)
- Existing RecordButton stays inside the Speech tab content for actual recording control

### Claude's Discretion
- Exact dimensions of the raised circle and overlap amount
- Spacing and padding within the nav bar
- Pulse animation implementation details (CSS keyframes vs Tailwind animate)
- How to structure the tab screen components (file organization)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above and in REQUIREMENTS.md (NAV-01 through NAV-07).

### Project context
- `.planning/REQUIREMENTS.md` — NAV-01 through NAV-07 define all navigation requirements
- `.planning/ROADMAP.md` — Phase 7 success criteria and dependencies

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `RecordButton` (`src/components/RecordButton.tsx`): Already has double-tap detection and mode switching (voice/text). Will stay in Speech tab.
- `HistoryList` (`src/components/HistoryList.tsx`): Complete history component with resend/copy/edit/delete actions. Will move to History tab.
- `TranscriptionEditor` (`src/components/TranscriptionEditor.tsx`): Text editing for voice and manual input. Stays in Speech tab.
- `StatusIndicator` (`src/components/StatusIndicator.tsx`): Connection status display. Stays in Speech tab header.
- `OfflineBanner` (`src/components/OfflineBanner.tsx`): Connection warning. Will become shared/global above tab content.
- `Toast` (`src/components/Toast.tsx`): Notification toasts. Already global, stays global.

### Established Patterns
- Tailwind CSS for all styling — no CSS modules or styled-components
- Safe area insets via CSS custom properties (--sat, --sab, --sal, --sar) in index.css
- Hooks pattern: useApp, useDeviceList, useHistory, useSpeechRecognition, useNetworkStatus
- All state management via React hooks — no external state library

### Integration Points
- `App.tsx` (474 lines): Main refactoring target — split into TabLayout + screen components
- `ConfigScreen` (inline in App.tsx): Pre-nav-bar state for connection failure — stays outside tabbed layout
- `useApp` hook: Controls app state (initializing/configuring/ready) — tab nav only shows in 'ready' state
- `useHistory` hook: Currently consumed in App.tsx — will be consumed in History tab screen instead

</code_context>

<specifics>
## Specific Ideas

- The raised mic circle should feel like a prominent "home" action — the thing your thumb naturally goes to
- Keep the overall feel minimal and clean, matching the current gray-100 background aesthetic
- The nav bar should feel native to Android, not like a web app footer

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-bottom-navigation-tab-structure*
*Context gathered: 2026-03-23*
