/**
 * INITIAL_PROJECTS — canonical seed data.
 *
 * Reflects actual company state as of 2026-03-31 (N1 kickoff).
 * Source of truth: 01_NOVA/03_COMPANY_STATUS.md
 *
 * These are loaded on first use (empty localStorage) or after migration.
 * Users can edit projects via the UI; changes persist to localStorage.
 */
export const INITIAL_PROJECTS = [
  {
    id: 'nexus',
    name: 'NEXUS',
    departmentId: 'nexus',
    status: 'active',
    phase: 'N1 — Truth Sync + Company Intelligence',
    priority: 'high',
    currentState:
      'Phase 8.75 complete. Foundation clean. N1 Truth Sync in progress — connecting dashboard to real company state.',
    nextAction:
      'Build truth sync layer, connect dashboard surfaces to live company state from truth files.',
    lastUpdated: '2026-03-31T00:00:00.000Z',
    createdAt: '2026-03-19T00:00:00.000Z',
  },
  {
    id: 'vortex',
    name: 'VORTEX',
    departmentId: 'hephaestus',
    status: 'active',
    phase: 'V4-P8 Complete → V1 — Verification + Persistence',
    priority: 'high',
    currentState:
      'V4-P8 Signal Metrics API complete. Full AETHER→VORTEX rename done. Paperclip installed and running at 127.0.0.1:3100.',
    nextAction:
      'Execute V1: verification + observability + persistence — run paper trading, observe live signal metrics, baseline emission rate.',
    lastUpdated: '2026-03-31T00:00:00.000Z',
    createdAt: '2026-03-19T00:00:00.000Z',
  },
  {
    id: 'xenon',
    name: 'XENON',
    departmentId: 'xenon',
    status: 'paused',
    phase: 'Phase 4 — Complete. Activation pending.',
    priority: 'normal',
    currentState:
      'Department structure complete. 27 launch strategy docs, campaign template, and channel tracker ready. Activation pending a channel decision.',
    nextAction:
      'Nicholas decides channel (Twitter/X or LinkedIn) and first content format to unblock first campaign.',
    lastUpdated: '2026-03-31T00:00:00.000Z',
    createdAt: '2026-03-20T00:00:00.000Z',
  },
  {
    id: 'aureon',
    name: 'AUREON',
    departmentId: 'aureon',
    status: 'active',
    phase: 'A1 — First Revenue 🟡 Active',
    priority: 'critical',
    currentState:
      'System fully operational. Offer: Abandoned Cart Recovery — €500 setup + €150/month. Target: €1,000 by April 14, 2026.',
    nextAction:
      'Research 30 Shopify leads → send 20 DMs today.',
    lastUpdated: '2026-03-31T00:00:00.000Z',
    createdAt: '2026-03-26T00:00:00.000Z',
  },
];

export const PROJECTS_STORAGE_KEY = 'nexus:projects';

/**
 * migrateProjectsIfStale
 * If stored projects were last updated before 2026-03-31 (N1 kickoff),
 * replace with current seed data so the UI reflects actual state.
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
    const cutoff = new Date('2026-03-31T00:00:00.000Z').getTime();
    if (mostRecentUpdate < cutoff) {
      window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(INITIAL_PROJECTS));
    }
  } catch {
    // silently fail
  }
}
