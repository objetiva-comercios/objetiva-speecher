# Requirements: Objetiva Speecher

**Defined:** 2026-03-23
**Core Value:** Instant, reliable voice-to-cursor flow under 2 seconds with zero manual intervention

## v1.2 Requirements

### Navigation

- [ ] **NAV-01**: App shows bottom navigation bar with 3 tabs visible on all screens
- [ ] **NAV-02**: Center tab has a large microphone icon and is the default active tab
- [ ] **NAV-03**: Left tab has a small history icon (clock/list)
- [ ] **NAV-04**: Right tab has a small settings icon (gear)
- [ ] **NAV-05**: Tapping a tab switches the visible screen without page reload
- [ ] **NAV-06**: Active tab is visually distinguished from inactive tabs
- [ ] **NAV-07**: Double tap on center mic icon enters text editing mode

### History

- [ ] **HIST-01**: History tab shows list of all sent transcriptions (text, device, timestamp)
- [ ] **HIST-02**: User can resend a history item to the current selected device
- [ ] **HIST-03**: User can copy a history item text to clipboard
- [ ] **HIST-04**: User can edit and resend a history item
- [ ] **HIST-05**: User can delete a history item
- [ ] **HIST-06**: Failed sends are visually marked in history

### Config

- [ ] **CFG-01**: Config tab shows current server URL (auto-discovered or manual)
- [ ] **CFG-02**: User can manually set server URL from config screen
- [ ] **CFG-03**: Config tab shows connected device name and connection status
- [ ] **CFG-04**: Config tab shows app version

## Future Requirements

### Config Extended
- **CFG-05**: User can configure voice command mappings
- **CFG-06**: User can toggle individual command categories on/off

## Out of Scope

| Feature | Reason |
|---------|--------|
| Home/dashboard tab | App does one thing, mic IS the home |
| Tab badges/notifications | No async events to notify about |
| Swipe between tabs | Bottom nav taps are sufficient for 3 tabs |
| Dark mode toggle | Follow system theme, no manual toggle needed |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| NAV-01 | Phase 7 | Pending |
| NAV-02 | Phase 7 | Pending |
| NAV-03 | Phase 7 | Pending |
| NAV-04 | Phase 7 | Pending |
| NAV-05 | Phase 7 | Pending |
| NAV-06 | Phase 7 | Pending |
| NAV-07 | Phase 7 | Pending |
| HIST-01 | Phase 8 | Pending |
| HIST-02 | Phase 8 | Pending |
| HIST-03 | Phase 8 | Pending |
| HIST-04 | Phase 8 | Pending |
| HIST-05 | Phase 8 | Pending |
| HIST-06 | Phase 8 | Pending |
| CFG-01 | Phase 9 | Pending |
| CFG-02 | Phase 9 | Pending |
| CFG-03 | Phase 9 | Pending |
| CFG-04 | Phase 9 | Pending |

**Coverage:**
- v1.2 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0

---
*Requirements defined: 2026-03-23*
*Last updated: 2026-03-23 after roadmap phase mapping*
