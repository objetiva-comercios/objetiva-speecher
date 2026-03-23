# Roadmap: Objetiva Speecher

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 (shipped 2026-02-11)
- ✅ **v1.1 Command Parser & Key Actions** — Phases 5-6 (shipped 2026-03-23)
- 🚧 **v1.2 Navigation & Settings** — Phases 7-9 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-4) — SHIPPED 2026-02-11</summary>

- [x] Phase 1: Backend Foundation (5/5 plans)
- [x] Phase 2: Windows Desktop Agent (4/4 plans)
- [x] Phase 3: Mobile App + Voice (8/8 plans)
- [x] Phase 4: Linux Desktop Agent (4/4 plans)

</details>

<details>
<summary>✅ v1.1 Command Parser & Key Actions (Phases 5-6) — SHIPPED 2026-03-23</summary>

- [x] Phase 5: Command Parser & Text Symbols (3/3 plans)
- [x] Phase 6: Key Actions Protocol (5/5 plans)

</details>

### 🚧 v1.2 Navigation & Settings

**Milestone Goal:** Add bottom navigation with 3 tabs (Speech, History, Config) so the app has proper screen structure beyond the single recording view

- [ ] **Phase 7: Bottom Navigation & Tab Structure** — Tab bar component with routing, refactor App.tsx into tabbed layout
- [ ] **Phase 8: History Screen** — Dedicated history tab with transcription list and item actions
- [ ] **Phase 9: Config Screen** — Settings tab with server URL, device info, and app version

## Phase Details

### Phase 7: Bottom Navigation & Tab Structure
**Goal**: Users can navigate between three distinct screens using a persistent bottom tab bar
**Depends on**: Phase 6
**Requirements**: NAV-01, NAV-02, NAV-03, NAV-04, NAV-05, NAV-06, NAV-07
**Success Criteria** (what must be TRUE):
  1. User sees a bottom navigation bar with 3 tabs on every screen
  2. Tapping the left (history) or right (config) tab switches the visible content without page reload
  3. The center tab has a visually larger microphone icon and is selected by default on app launch
  4. The currently active tab is visually distinct from inactive tabs
  5. Double-tapping the center mic icon enters text editing mode
**Plans**: TBD

### Phase 8: History Screen
**Goal**: Users can review, manage, and re-use past transcriptions from a dedicated history tab
**Depends on**: Phase 7
**Requirements**: HIST-01, HIST-02, HIST-03, HIST-04, HIST-05, HIST-06
**Success Criteria** (what must be TRUE):
  1. User sees a chronological list of sent transcriptions showing text, target device, and timestamp
  2. User can resend, copy, or edit-and-resend any history item
  3. User can delete individual history items
  4. Failed sends are visually marked so the user can identify and retry them
**Plans**: TBD

### Phase 9: Config Screen
**Goal**: Users can view and adjust connection settings and see app information from a dedicated config tab
**Depends on**: Phase 7
**Requirements**: CFG-01, CFG-02, CFG-03, CFG-04
**Success Criteria** (what must be TRUE):
  1. User sees the current server URL (whether auto-discovered or manually set)
  2. User can manually change the server URL from the config screen
  3. User sees the connected device name and its connection status
  4. User sees the app version number
**Plans**: TBD

## Progress

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1. Backend Foundation | v1.0 | 5/5 | Complete | 2026-02-07 |
| 2. Windows Desktop Agent | v1.0 | 4/4 | Complete | 2026-02-07 |
| 3. Mobile App + Voice | v1.0 | 8/8 | Complete | 2026-02-11 |
| 4. Linux Desktop Agent | v1.0 | 4/4 | Complete | 2026-02-11 |
| 5. Command Parser & Text Symbols | v1.1 | 3/3 | Complete | 2026-02-12 |
| 6. Key Actions Protocol | v1.1 | 5/5 | Complete | 2026-02-13 |
| 7. Bottom Navigation & Tab Structure | v1.2 | 0/? | Not started | - |
| 8. History Screen | v1.2 | 0/? | Not started | - |
| 9. Config Screen | v1.2 | 0/? | Not started | - |

---
*Roadmap created: 2026-02-06*
*Last updated: 2026-03-23 (Milestone v1.2 roadmap created)*
