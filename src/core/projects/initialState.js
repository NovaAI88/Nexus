/**
 * initialState.js — Projects
 * Seed data for the project model.
 * Used on first load when localStorage contains no project data.
 * Reflects real current state as of 2026-03-22.
 *
 * Projects belong to Departments via departmentId.
 * Department IDs match the id field in core/departments/initialState.js.
 */

export const INITIAL_PROJECTS = [
  {
    id: 'vortex',
    name: 'VORTEX',
    departmentId: 'hephaestus',        // belongs to 03_HEPHAESTUS
    status: 'paused',                  // active | paused | blocked | completed
    phase: 'V4-P7B',
    priority: 'high',                  // critical | high | normal
    currentState:
      'ATR-based exit system complete through Phase 7B. TREND strategy is structurally flawed — pullback window too narrow, neutral bias rate too high. RANGE strategy shows promise. Backtest run: 5 winners, 14 losses. Repo is clean, pushed, and stable.',
    nextAction:
      'Run TREND-only optimization sweep on 5m/1000-candle setup. Verify blocker profile shift via GET /api/diagnosis/trend-suppression. Do NOT activate RANGE stale/location filters until clean TREND measurement is complete.',
    lastUpdated: '2026-03-22T22:42:00.000Z',
    createdAt: '2026-03-19T00:00:00.000Z',
  },
  {
    id: 'nexus',
    name: 'NEXUS',
    departmentId: 'nexus',             // belongs to 02_NEXUS
    status: 'active',
    phase: 'Phase 2 — Department Model',
    priority: 'high',
    currentState:
      'Phase 1 complete: localStore, useProjects, initialState in place. Phase 2 now adding department model (useDepartments, departmentId on projects). UI is untouched — data layer only.',
    nextAction:
      'Phase 3: wire useProjects + useDepartments into App.js, build ProjectPage with live editable state, rewrite Dashboard with real project cards.',
    lastUpdated: '2026-03-23T00:17:00.000Z',
    createdAt: '2026-03-19T00:00:00.000Z',
  },
  {
    id: 'xenon',
    name: 'XENON',
    departmentId: 'xenon',             // belongs to 04_XENON
    status: 'paused',
    phase: 'Phase 4 — Complete',
    priority: 'normal',
    currentState:
      'Department structure complete. All files populated. Campaign template and channel tracker ready. Activation pending a decision on channel and content format.',
    nextAction:
      'Nicholas decides: channel (Twitter/X, LinkedIn, other) and first content format. This unblocks the first campaign.',
    lastUpdated: '2026-03-22T19:00:00.000Z',
    createdAt: '2026-03-20T00:00:00.000Z',
  },
];

export const PROJECTS_STORAGE_KEY = 'nexus:projects';
