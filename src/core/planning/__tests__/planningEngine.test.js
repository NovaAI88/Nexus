/**
 * N2 Planning Core — unit tests
 *
 * Tests the core planning logic:
 *   1. computePlanningOutput — empty state guard
 *   2. Revenue-first priority ordering
 *   3. External blocker deprioritisation
 *   4. Today recommendations skip externally-blocked depts
 *   5. Blocker extraction and classification
 *   6. Week items — risk level assignment
 *   7. Execution sequence mirrors today recommendations
 *   8. Insight generation
 */

import { computePlanningOutput } from '../planningEngine';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const DEPT_AUREON = {
  id: 'aureon',
  name: 'AUREON',
  phase: 'A1 — First Revenue Active',
  status: 'active',
  nextAction: 'Research 30 Shopify leads → send 20 DMs',
  blockers: [],
  urgency: 'critical',
  lastUpdated: '2026-03-31T00:00:00.000Z',
  metrics: { revenueTarget: 1000, revenueCurrency: '€', revenueDeadline: 'April 14, 2026' },
};

const DEPT_NEXUS = {
  id: 'nexus',
  name: 'NEXUS',
  phase: 'N2 — AI Planning Core',
  status: 'active',
  nextAction: 'Build planning engine',
  blockers: [],
  urgency: 'high',
  lastUpdated: '2026-03-31T00:00:00.000Z',
  metrics: {},
};

const DEPT_XENON_BLOCKED = {
  id: 'xenon',
  name: 'XENON',
  phase: 'Phase 4 — Activation Pending',
  status: 'active',
  nextAction: 'Nicholas decides channel + format → first campaign',
  blockers: ['Awaiting direction'],
  urgency: 'low',
  lastUpdated: '2026-03-31T00:00:00.000Z',
  metrics: {},
};

const DEPT_HEPHAESTUS = {
  id: 'hephaestus',
  name: 'HEPHAESTUS',
  phase: 'V1 — Verification + Persistence',
  status: 'active',
  nextAction: 'Execute V1',
  blockers: [],
  urgency: 'normal',
  lastUpdated: '2026-03-31T00:00:00.000Z',
  metrics: {},
};

const PHASE_DEADLINES = {
  nexus: [
    { phase: 'N1 — Truth Sync', start: 'March 31, 2026', targetEnd: 'March 31, 2026', status: 'Complete' },
    { phase: 'N2 — AI Planning Core', start: 'April 14, 2026', targetEnd: 'April 21, 2026', status: 'Pending' },
  ],
  aureon: [
    { phase: 'A1 — First Revenue', start: 'April 1, 2026', targetEnd: 'April 14, 2026', status: 'Active' },
  ],
};

// ─── 1. Empty state guard ────────────────────────────────────────────────────

describe('computePlanningOutput — empty state', () => {
  it('returns safe empty output when no departments', () => {
    const result = computePlanningOutput({});
    expect(result.priorityItems).toEqual([]);
    expect(result.todayRecommendations).toEqual([]);
    expect(result.blockers).toEqual([]);
    expect(result.weekItems).toEqual([]);
    expect(result.executionSequence).toEqual([]);
    expect(result.insight).toBeTruthy();
  });

  it('handles null companyState gracefully', () => {
    const result = computePlanningOutput(null);
    expect(result.priorityItems).toEqual([]);
  });
});

// ─── 2. Revenue-first priority ordering ─────────────────────────────────────

describe('computePlanningOutput — revenue-first priority', () => {
  it('places revenue-critical dept first regardless of input order', () => {
    const state = {
      departments: [DEPT_NEXUS, DEPT_HEPHAESTUS, DEPT_AUREON],
      _generated: {},
    };
    const result = computePlanningOutput(state, { todayDate: '2026-04-01' });

    expect(result.priorityItems[0].departmentId).toBe('aureon');
    expect(result.priorityItems[0].revenueRelevant).toBe(true);
  });

  it('marks revenue-relevant items in priorityItems', () => {
    const state = {
      departments: [DEPT_AUREON, DEPT_NEXUS],
      _generated: {},
    };
    const result = computePlanningOutput(state, { todayDate: '2026-04-01' });
    const aureon = result.priorityItems.find((i) => i.departmentId === 'aureon');
    expect(aureon.revenueRelevant).toBe(true);
    expect(aureon.type).toBe('revenue');
  });
});

// ─── 3. External blocker deprioritisation ───────────────────────────────────

describe('computePlanningOutput — blocker deprioritisation', () => {
  it('places externally-blocked dept after non-blocked depts', () => {
    const state = {
      departments: [DEPT_XENON_BLOCKED, DEPT_NEXUS, DEPT_HEPHAESTUS],
      _generated: {},
    };
    const result = computePlanningOutput(state, { todayDate: '2026-04-01' });
    const xenonIndex = result.priorityItems.findIndex((i) => i.departmentId === 'xenon');
    const nexusIndex = result.priorityItems.findIndex((i) => i.departmentId === 'nexus');
    expect(xenonIndex).toBeGreaterThan(nexusIndex);
  });

  it('marks externally-blocked items as hasBlocker', () => {
    const state = {
      departments: [DEPT_XENON_BLOCKED],
      _generated: {},
    };
    const result = computePlanningOutput(state, { todayDate: '2026-04-01' });
    expect(result.priorityItems[0].hasBlocker).toBe(true);
    expect(result.priorityItems[0].type).toBe('blocked');
  });
});

// ─── 4. Today recommendations skip externally-blocked depts ─────────────────

describe('computePlanningOutput — todayRecommendations', () => {
  it('excludes externally-blocked depts from today recommendations', () => {
    const state = {
      departments: [DEPT_XENON_BLOCKED, DEPT_NEXUS, DEPT_AUREON],
      _generated: {},
    };
    const result = computePlanningOutput(state, { todayDate: '2026-04-01' });
    const ids = result.todayRecommendations.map((r) => r.departmentId);
    expect(ids).not.toContain('xenon');
  });

  it('returns at most 3 recommendations', () => {
    const state = {
      departments: [DEPT_AUREON, DEPT_NEXUS, DEPT_HEPHAESTUS, DEPT_XENON_BLOCKED],
      _generated: {},
    };
    const result = computePlanningOutput(state, { todayDate: '2026-04-01' });
    expect(result.todayRecommendations.length).toBeLessThanOrEqual(3);
  });

  it('step numbers start at 1 and are sequential', () => {
    const state = {
      departments: [DEPT_AUREON, DEPT_NEXUS, DEPT_HEPHAESTUS],
      _generated: {},
    };
    const result = computePlanningOutput(state, { todayDate: '2026-04-01' });
    result.todayRecommendations.forEach((rec, idx) => {
      expect(rec.step).toBe(idx + 1);
    });
  });

  it('includes action text and reason for each recommendation', () => {
    const state = {
      departments: [DEPT_AUREON, DEPT_NEXUS],
      _generated: {},
    };
    const result = computePlanningOutput(state, { todayDate: '2026-04-01' });
    result.todayRecommendations.forEach((rec) => {
      expect(rec.action).toBeTruthy();
      expect(rec.reason).toBeTruthy();
      expect(rec.estimatedMinutes).toBeGreaterThan(0);
    });
  });

  it('first recommendation reason mentions revenue and deadline for AUREON', () => {
    const state = {
      departments: [DEPT_AUREON, DEPT_NEXUS],
      _generated: {},
    };
    const result = computePlanningOutput(state, { todayDate: '2026-04-01' });
    const first = result.todayRecommendations[0];
    expect(first.departmentId).toBe('aureon');
    expect(first.reason.toLowerCase()).toMatch(/revenue|€|target/);
  });
});

// ─── 5. Blocker extraction ───────────────────────────────────────────────────

describe('computePlanningOutput — blockers', () => {
  it('extracts external blockers with correct type', () => {
    const state = {
      departments: [DEPT_XENON_BLOCKED],
      _generated: {},
    };
    const result = computePlanningOutput(state, { todayDate: '2026-04-01' });
    expect(result.blockers.length).toBe(1);
    expect(result.blockers[0].departmentId).toBe('xenon');
    expect(result.blockers[0].type).toBe('external');
    expect(result.blockers[0].description).toBe('Awaiting direction');
  });

  it('does not create blockers for "None" values', () => {
    const dept = { ...DEPT_NEXUS, blockers: ['None'] };
    const state = { departments: [dept], _generated: {} };
    const result = computePlanningOutput(state, { todayDate: '2026-04-01' });
    expect(result.blockers).toEqual([]);
  });

  it('does not create blockers for "None — execution-ready"', () => {
    const dept = { ...DEPT_AUREON, blockers: ['None — execution-ready'] };
    const state = { departments: [dept], _generated: {} };
    const result = computePlanningOutput(state, { todayDate: '2026-04-01' });
    expect(result.blockers).toEqual([]);
  });

  it('returns empty blockers when all departments are clear', () => {
    const state = {
      departments: [DEPT_AUREON, DEPT_NEXUS, DEPT_HEPHAESTUS],
      _generated: {},
    };
    const result = computePlanningOutput(state, { todayDate: '2026-04-01' });
    expect(result.blockers).toEqual([]);
  });
});

// ─── 6. Week items risk levels ───────────────────────────────────────────────

describe('computePlanningOutput — weekItems', () => {
  it('surfaces items due within 14 days', () => {
    const state = {
      departments: [DEPT_AUREON],
      _generated: { phaseDeadlines: PHASE_DEADLINES },
    };
    const result = computePlanningOutput(state, { todayDate: '2026-04-05' });
    // A1 deadline is April 14 — 9 days away from April 5 → medium risk (≤14d)
    const aureonItem = result.weekItems.find((i) => i.departmentId === 'aureon');
    expect(aureonItem).toBeDefined();
    expect(aureonItem.risk).toBe('medium');
  });

  it('skips completed phases', () => {
    const state = {
      departments: [DEPT_NEXUS],
      _generated: { phaseDeadlines: PHASE_DEADLINES },
    };
    const result = computePlanningOutput(state, { todayDate: '2026-04-01' });
    const n1 = result.weekItems.find((i) => i.phase?.includes('N1'));
    expect(n1).toBeUndefined();
  });

  it('returns empty weekItems when no phaseDeadlines', () => {
    const state = { departments: [DEPT_NEXUS], _generated: {} };
    const result = computePlanningOutput(state, { todayDate: '2026-04-01' });
    expect(result.weekItems).toEqual([]);
  });
});

// ─── 7. Execution sequence ───────────────────────────────────────────────────

describe('computePlanningOutput — executionSequence', () => {
  it('mirrors todayRecommendations structure', () => {
    const state = {
      departments: [DEPT_AUREON, DEPT_NEXUS, DEPT_HEPHAESTUS],
      _generated: {},
    };
    const result = computePlanningOutput(state, { todayDate: '2026-04-01' });
    expect(result.executionSequence.length).toBe(result.todayRecommendations.length);
    result.executionSequence.forEach((seq, idx) => {
      expect(seq.step).toBe(result.todayRecommendations[idx].step);
      expect(seq.departmentId).toBe(result.todayRecommendations[idx].departmentId);
      expect(seq.action).toBe(result.todayRecommendations[idx].action);
    });
  });
});

// ─── 8. Insight generation ───────────────────────────────────────────────────

describe('computePlanningOutput — insight', () => {
  it('returns a non-empty insight string', () => {
    const state = {
      departments: [DEPT_AUREON, DEPT_NEXUS],
      _generated: {},
    };
    const result = computePlanningOutput(state, { todayDate: '2026-04-01' });
    expect(typeof result.insight).toBe('string');
    expect(result.insight.length).toBeGreaterThan(0);
  });

  it('mentions revenue deadline when present and near', () => {
    const state = {
      departments: [DEPT_AUREON],
      _generated: {},
    };
    const result = computePlanningOutput(state, { todayDate: '2026-04-05' });
    expect(result.insight.toLowerCase()).toMatch(/aureon|revenue|deadline/);
  });

  it('mentions external blockers in insight', () => {
    const state = {
      departments: [DEPT_XENON_BLOCKED, DEPT_NEXUS],
      _generated: {},
    };
    const result = computePlanningOutput(state, { todayDate: '2026-04-01' });
    expect(result.insight.toLowerCase()).toMatch(/xenon|blocked/);
  });
});
