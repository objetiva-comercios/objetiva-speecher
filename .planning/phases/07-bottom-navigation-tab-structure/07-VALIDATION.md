---
phase: 7
slug: bottom-navigation-tab-structure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest ^4.0.18 |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `cd mobile-app && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd mobile-app && npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd mobile-app && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd mobile-app && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 0 | NAV-01 | unit | `cd mobile-app && npx vitest run src/components/BottomNavBar.test.tsx` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 0 | NAV-02 | unit | `cd mobile-app && npx vitest run src/components/BottomNavBar.test.tsx` | ❌ W0 | ⬜ pending |
| 07-01-03 | 01 | 0 | NAV-03 | unit | `cd mobile-app && npx vitest run src/components/BottomNavBar.test.tsx` | ❌ W0 | ⬜ pending |
| 07-01-04 | 01 | 0 | NAV-04 | unit | `cd mobile-app && npx vitest run src/components/BottomNavBar.test.tsx` | ❌ W0 | ⬜ pending |
| 07-01-05 | 01 | 0 | NAV-05 | unit | `cd mobile-app && npx vitest run src/components/TabLayout.test.tsx` | ❌ W0 | ⬜ pending |
| 07-01-06 | 01 | 0 | NAV-06 | unit | `cd mobile-app && npx vitest run src/components/BottomNavBar.test.tsx` | ❌ W0 | ⬜ pending |
| 07-01-07 | 01 | 0 | NAV-07 | unit | `cd mobile-app && npx vitest run src/components/BottomNavBar.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `mobile-app/vitest.config.ts` — vitest config with jsdom environment for component tests
- [ ] `mobile-app/src/test-setup.ts` — test setup for DOM mocking
- [ ] `mobile-app/src/components/BottomNavBar.test.tsx` — stubs for NAV-01, NAV-02, NAV-03, NAV-04, NAV-06, NAV-07
- [ ] `mobile-app/src/components/TabLayout.test.tsx` — stubs for NAV-05
- [ ] Install `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` as devDependencies

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Safe area inset respected on notched devices | NAV-01 | Requires physical device with gesture bar | Open app on iPhone with notch, verify nav bar doesn't overlap gesture area |
| Tab switch stops recording and sends transcription | NAV-05 | Requires audio hardware | Start recording, tap History tab, verify recording stops and transcription is sent |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
