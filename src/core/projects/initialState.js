export const INITIAL_PROJECTS = [
  {
    id: 'nexus',
    name: 'NEXUS',
    departmentId: 'nexus',
    status: 'active',
    phase: 'Phase 9 — Execution OS',
    priority: 'high',
    currentState:
      'Phase 8.75 complete. Foundation clean. Execution OS (Phase 3) implemented — engine, adapters, Company State board, suggested blocks, Weekly rebuild all live.',
    nextAction:
      'Wire department pages to nexus:company-state. Fix AUREON department page. Integrate suggested blocks inline into Timeline.',
    lastUpdated: '2026-03-27T14:00:00.000Z',
    createdAt: '2026-03-19T00:00:00.000Z',
  },
  {
    id: 'vortex',
    name: 'VORTEX',
    departmentId: 'hephaestus',
    status: 'active',
    phase: 'V4-P7C — RANGE Intelligence Phase 2',
    priority: 'high',
    currentState:
      'Phase 2 implemented and verified. Context-first reversal confirmation live. 10/10 deterministic tests passing. Full suite: 13 files / 30 tests passed.',
    nextAction:
      'Resume with evidence-first verification sequence (path → git state → file presence → tests), then define Phase 3 RANGE plan.',
    lastUpdated: '2026-03-25T00:00:00.000Z',
    createdAt: '2026-03-19T00:00:00.000Z',
  },
  {
    id: 'xenon',
    name: 'XENON',
    departmentId: 'xenon',
    status: 'paused',
    phase: 'Phase 4 — Complete',
    priority: 'normal',
    currentState:
      'Department structure complete. Campaign template and channel tracker ready. Activation pending a channel decision.',
    nextAction:
      'Decide channel (Twitter/X or LinkedIn) and first content format to unblock first campaign.',
    lastUpdated: '2026-03-22T19:00:00.000Z',
    createdAt: '2026-03-20T00:00:00.000Z',
  },
  {
    id: 'aureon',
    name: 'AUREON',
    departmentId: 'aureon',
    status: 'active',
    phase: 'Phase 1 — Active Execution',
    priority: 'critical',
    currentState:
      'System built and operational. Offer: Abandoned Cart Recovery — €500 setup + €150/month. Target: €1,000 within 72 hours.',
    nextAction:
      'Run lead analysis on 10 Shopify stores and send 10 DMs today.',
    lastUpdated: '2026-03-26T00:00:00.000Z',
    createdAt: '2026-03-26T00:00:00.000Z',
  },
];

export const PROJECTS_STORAGE_KEY = 'nexus:projects';

/**
 * migrateProjectsIfStale
 * If stored projects are from before 2026-03-27, replace with current seed data.
 */
export function migrateProjectsIfStale() {
  try {
    const raw = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) return;
    const stored = JSON.parse(raw);
    if (!Array.isArray(stored)) return;
    const mostRecentUpdate = stored
      .map((p) => new Date(p.lastUpdated || 0).getTime())
      .reduce((max, t) => Math.max(max, t), 0);
    const cutoff = new Date('2026-03-27T00:00:00.000Z').getTime();
    if (mostRecentUpdate < cutoff) {
      window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(INITIAL_PROJECTS));
    }
  } catch {
    // silently fail
  }
}
