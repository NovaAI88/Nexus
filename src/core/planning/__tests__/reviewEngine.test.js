/**
 * N3 Review Engine — unit tests
 *
 * Tests the core review logic:
 *   1.  computeReviewOutput — empty state guard
 *   2.  Phase adherence — overdue detection
 *   3.  Phase adherence — at-risk detection (≤14 days)
 *   4.  Phase adherence — completed phases skipped
 *   5.  Execution velocity — task completions in 7d window
 *   6.  Execution velocity — activity log entries in 3d window
 *   7.  Stall detection — active dept with no recent activity
 *   8.  Revenue risk — overdue milestone
 *   9.  Revenue risk — critical deadline (≤7 days)
 *   10. Score — deductions for overdue phases
 *   11. Score — velocity bonus for active depts
 *   12. Score — internal blocker deduction
 *   13. Verdict thresholds (CONTINUE / CAUTION / REVISE / REJECT)
 *   14. Drift items — phase slip generated for overdue phase
 *   15. Drift items — stalled dept generates drift entry
 *   16. Per-department review structure
 */

import { computeReviewOutput } from '../reviewEngine';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const DEPT_AUREON = {
  id: 'aureon',
  name: 'AUREON',
  phase: 'A1 — First Revenue Active',
  status: 'active',
  nextAction: 'Research 30 Shopify leads → send 20 DMs',
  blockers: [],
  urgency: 'critical',
  metrics: { revenueTarget: 1000, revenueCurrency: '€', revenueDeadline: 'April 14, 2026' },
};

const DEPT_NEXUS = {
  id: 'nexus',
  name: 'NEXUS',
  phase: 'N3 — Review Engine Active',
  status: 'active',
  nextAction: 'Build review engine',
  blockers: [],
  urgency: 'high',
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
  metrics: {},
};

const DEPT_XENON_INTERNAL_BLOCKED = {
  id: 'xenon',
  name: 'XENON',
  phase: 'Phase 4 — Activation Pending',
  status: 'active',
  nextAction: 'Fix campaign template',
  blockers: ['Template broken'],
  urgency: 'medium',
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
  metrics: {},
};

const PHASE_DEADLINES = {
  nexus: [
    { phase: 'N1 — Truth Sync', start: 'March 31, 2026', targetEnd: 'March 31, 2026', status: 'Complete' },
    { phase: 'N3 — Review Engine', start: 'April 24, 2026', targetEnd: 'April 29, 2026', status: 'Active' },
  ],
  aureon: [
    { phase: 'A1 — First Revenue', start: 'April 1, 2026', targetEnd: 'April 14, 2026', status: 'Active' },
  ],
};

const REVENUE_MILESTONES = [
  {
    target: 'AUREON First Revenue',
    amount: '€1,000',
    deadline: 'April 14, 2026',
    status: 'In Progress',
  },
];

// Tasks completed within the last 7 days (relative to 2026-04-01)
const RECENT_TASKS = [
  {
    id: 't1',
    projectId: 'nexus',
    status: 'done',
    completedAt: '2026-03-31T10:00:00.000Z',
    title: 'Build planning engine',
  },
  {
    id: 't2',
    projectId: 'aureon',
    status: 'done',
    completedAt: '2026-03-30T08:00:00.000Z',
    title: 'Send 9 DMs',
  },
];

// Tasks completed too long ago (> 7 days)
const OLD_TASKS = [
  {
    id: 't3',
    projectId: 'nexus',
    status: 'done',
    completedAt: '2026-03-20T10:00:00.000Z',
    title: 'Old completed task',
  },
];

// Activity log entries within last 3 days (relative to 2026-04-01)
const RECENT_LOG = [
  {
    id: 'l1',
    projectId: 'hephaestus',
    type: 'progress',
    text: 'Ran V1 verification tests',
    timestamp: '2026-04-01T09:00:00.000Z',
  },
];

// ─── 1. Empty state guard ────────────────────────────────────────────────────

describe('computeReviewOutput — empty state', () => {
  it('returns safe empty output when no departments', () => {
    const result = computeReviewOutput({});
    expect(result.score).toBe(0);
    expect(result.departmentReviews).toEqual([]);
    expect(result.driftItems).toEqual([]);
    expect(result.phaseItems).toEqual([]);
    expect(result.summary).toBeTruthy();
    expect(result.verdict).toBeDefined();
  });

  it('handles null companyState gracefully', () => {
    const result = computeReviewOutput(null);
    expect(result.score).toBe(0);
    expect(result.departmentReviews).toEqual([]);
  });

  it('handles empty executionData gracefully', () => {
    const state = { departments: [DEPT_NEXUS], _generated: {} };
    const result = computeReviewOutput(state, {}, { todayDate: '2026-04-01' });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.departmentReviews.length).toBe(1);
  });
});

// ─── 2. Phase adherence — overdue detection ──────────────────────────────────

describe('computeReviewOutput — overdue phase detection', () => {
  it('marks phase as overdue when deadline has passed', () => {
    const state = {
      departments: [DEPT_AUREON],
      _generated: {
        phaseDeadlines: {
          aureon: [
            { phase: 'A1 — First Revenue', start: 'March 1, 2026', targetEnd: 'March 31, 2026', status: 'Active' },
          ],
        },
      },
    };
    const result = computeReviewOutput(state, {}, { todayDate: '2026-04-01' });
    const overdueItem = result.phaseItems.find((p) => p.adherence === 'overdue');
    expect(overdueItem).toBeDefined();
  });

  it('reduces phase adherence score for overdue phases', () => {
    const state = {
      departments: [DEPT_AUREON],
      _generated: {
        phaseDeadlines: {
          aureon: [
            { phase: 'A1 — First Revenue', start: 'March 1, 2026', targetEnd: 'March 31, 2026', status: 'Active' },
          ],
        },
      },
    };
    const result = computeReviewOutput(state, {}, { todayDate: '2026-04-01' });
    // Phase adherence starts at 40, -15 for overdue = 25
    expect(result.scoreBreakdown.phaseAdherence).toBeLessThan(40);
    expect(result.scoreBreakdown.phaseAdherence).toBeLessThanOrEqual(25);
  });
});

// ─── 3. Phase adherence — at-risk detection ──────────────────────────────────

describe('computeReviewOutput — at-risk phase detection', () => {
  it('marks phase as at_risk when ≤14 days remaining', () => {
    const state = {
      departments: [DEPT_AUREON],
      _generated: {
        phaseDeadlines: {
          aureon: [
            { phase: 'A1 — First Revenue', start: 'April 1, 2026', targetEnd: 'April 14, 2026', status: 'Active' },
          ],
        },
      },
    };
    // 9 days remaining from April 5 → high_risk (≤14d, >7d)
    const result = computeReviewOutput(state, {}, { todayDate: '2026-04-05' });
    const riskItem = result.phaseItems[0];
    expect(riskItem).toBeDefined();
    expect(['at_risk', 'high_risk', 'critical', 'overdue']).toContain(riskItem.adherence);
    expect(riskItem.daysRemaining).toBe(9);
  });
});

// ─── 4. Phase adherence — completed phases skipped ──────────────────────────

describe('computeReviewOutput — completed phases skipped', () => {
  it('does not include completed phases in phaseItems', () => {
    const state = {
      departments: [DEPT_NEXUS],
      _generated: { phaseDeadlines: PHASE_DEADLINES },
    };
    const result = computeReviewOutput(state, {}, { todayDate: '2026-04-01' });
    const n1 = result.phaseItems.find((p) => p.phase?.includes('N1'));
    expect(n1).toBeUndefined();
  });
});

// ─── 5. Execution velocity — task completions ───────────────────────────────

describe('computeReviewOutput — execution velocity from tasks', () => {
  it('counts task completions within 7 days', () => {
    const state = { departments: [DEPT_NEXUS], _generated: {} };
    const exec = { tasks: RECENT_TASKS, activityLog: [] };
    const result = computeReviewOutput(state, exec, { todayDate: '2026-04-01' });
    const nexusDept = result.departmentReviews.find((d) => d.deptId === 'nexus');
    expect(nexusDept.velocity.completions7d).toBe(1);
  });

  it('does not count tasks completed more than 7 days ago', () => {
    const state = { departments: [DEPT_NEXUS], _generated: {} };
    const exec = { tasks: OLD_TASKS, activityLog: [] };
    const result = computeReviewOutput(state, exec, { todayDate: '2026-04-01' });
    const nexusDept = result.departmentReviews.find((d) => d.deptId === 'nexus');
    expect(nexusDept.velocity.completions7d).toBe(0);
  });

  it('grants velocity score points for active depts with recent task completions', () => {
    const state = { departments: [DEPT_NEXUS, DEPT_AUREON], _generated: {} };
    const exec = { tasks: RECENT_TASKS, activityLog: [] };
    // NEXUS and AUREON both have recent completions
    const resultWithActivity = computeReviewOutput(state, exec, { todayDate: '2026-04-01' });
    const resultWithout = computeReviewOutput(state, {}, { todayDate: '2026-04-01' });
    expect(resultWithActivity.scoreBreakdown.executionVelocity).toBeGreaterThan(
      resultWithout.scoreBreakdown.executionVelocity
    );
  });
});

// ─── 6. Execution velocity — activity log entries ──────────────────────────

describe('computeReviewOutput — execution velocity from activity log', () => {
  it('counts log entries within 3 days', () => {
    const state = { departments: [DEPT_HEPHAESTUS], _generated: {} };
    const exec = { tasks: [], activityLog: RECENT_LOG };
    const result = computeReviewOutput(state, exec, { todayDate: '2026-04-01' });
    const hDept = result.departmentReviews.find((d) => d.deptId === 'hephaestus');
    expect(hDept.velocity.logEntries3d).toBe(1);
    expect(hDept.executionStatus).toBe('active');
  });
});

// ─── 7. Stall detection ─────────────────────────────────────────────────────

describe('computeReviewOutput — stall detection', () => {
  it('detects active dept with no recent activity as stalled', () => {
    const state = { departments: [DEPT_NEXUS], _generated: {} };
    const result = computeReviewOutput(state, {}, { todayDate: '2026-04-01' });
    expect(result.stalledDepts.length).toBe(1);
    expect(result.stalledDepts[0].deptId).toBe('nexus');
  });

  it('does not mark dept as stalled when it has recent task completions', () => {
    const state = { departments: [DEPT_NEXUS], _generated: {} };
    const exec = { tasks: RECENT_TASKS, activityLog: [] };
    const result = computeReviewOutput(state, exec, { todayDate: '2026-04-01' });
    const nexusStall = result.stalledDepts.find((s) => s.deptId === 'nexus');
    expect(nexusStall).toBeUndefined();
  });

  it('generates a drift item for stalled departments', () => {
    const state = { departments: [DEPT_NEXUS], _generated: {} };
    const result = computeReviewOutput(state, {}, { todayDate: '2026-04-01' });
    const stalledDrift = result.driftItems.find((d) => d.type === 'stalled');
    expect(stalledDrift).toBeDefined();
    expect(stalledDrift.deptId).toBe('nexus');
  });
});

// ─── 8. Revenue risk — overdue milestone ────────────────────────────────────

describe('computeReviewOutput — revenue risk (overdue)', () => {
  it('flags overdue revenue milestone', () => {
    const state = {
      departments: [DEPT_AUREON],
      _generated: {
        revenueMilestones: [
          { target: 'AUREON First Revenue', amount: '€1,000', deadline: 'March 31, 2026', status: 'In Progress' },
        ],
      },
    };
    const result = computeReviewOutput(state, {}, { todayDate: '2026-04-01' });
    const overdueRevenue = result.revenueRisk.find((r) => r.risk === 'overdue');
    expect(overdueRevenue).toBeDefined();
  });

  it('generates a drift item for overdue revenue milestone', () => {
    const state = {
      departments: [DEPT_AUREON],
      _generated: {
        revenueMilestones: [
          { target: 'AUREON First Revenue', amount: '€1,000', deadline: 'March 31, 2026', status: 'In Progress' },
        ],
      },
    };
    const result = computeReviewOutput(state, {}, { todayDate: '2026-04-01' });
    const revenueDrift = result.driftItems.find((d) => d.type === 'revenue_risk');
    expect(revenueDrift).toBeDefined();
    expect(revenueDrift.severity).toBe('critical');
  });

  it('reduces revenue progress score to 0 when milestone is overdue', () => {
    const state = {
      departments: [DEPT_AUREON],
      _generated: {
        revenueMilestones: [
          { target: 'AUREON First Revenue', amount: '€1,000', deadline: 'March 31, 2026', status: 'In Progress' },
        ],
      },
    };
    const result = computeReviewOutput(state, {}, { todayDate: '2026-04-01' });
    expect(result.scoreBreakdown.revenueProgress).toBe(0);
  });
});

// ─── 9. Revenue risk — critical deadline ────────────────────────────────────

describe('computeReviewOutput — revenue risk (near deadline)', () => {
  it('flags milestone due in ≤7 days as critical', () => {
    const state = {
      departments: [DEPT_AUREON],
      _generated: {
        revenueMilestones: [
          { target: 'AUREON First Revenue', amount: '€1,000', deadline: 'April 5, 2026', status: 'In Progress' },
        ],
      },
    };
    // 4 days away from April 1
    const result = computeReviewOutput(state, {}, { todayDate: '2026-04-01' });
    const criticalRevenue = result.revenueRisk.find((r) => r.risk === 'critical');
    expect(criticalRevenue).toBeDefined();
  });
});

// ─── 10. Score — overall structure ───────────────────────────────────────────

describe('computeReviewOutput — score structure', () => {
  it('score is a number between 0 and 100', () => {
    const state = {
      departments: [DEPT_AUREON, DEPT_NEXUS, DEPT_HEPHAESTUS],
      _generated: { phaseDeadlines: PHASE_DEADLINES, revenueMilestones: REVENUE_MILESTONES },
    };
    const result = computeReviewOutput(state, {}, { todayDate: '2026-04-01' });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('scoreBreakdown components sum to total score', () => {
    const state = {
      departments: [DEPT_AUREON, DEPT_NEXUS],
      _generated: { phaseDeadlines: PHASE_DEADLINES, revenueMilestones: REVENUE_MILESTONES },
    };
    const result = computeReviewOutput(state, RECENT_TASKS, { todayDate: '2026-04-01' });
    const { phaseAdherence, executionVelocity, blockerHealth, revenueProgress } = result.scoreBreakdown;
    const sum = phaseAdherence + executionVelocity + blockerHealth + revenueProgress;
    expect(result.score).toBe(Math.min(100, Math.max(0, sum)));
  });

  it('clean state achieves near-maximum score when active and on-track', () => {
    // Departments active, no blockers, recent tasks, phases not due soon
    const distantDeadlines = {
      nexus: [
        { phase: 'N5 — Health Intelligence', start: 'June 1, 2026', targetEnd: 'July 1, 2026', status: 'Pending' },
      ],
    };
    const state = {
      departments: [DEPT_NEXUS, DEPT_AUREON],
      _generated: { phaseDeadlines: distantDeadlines },
    };
    const exec = { tasks: RECENT_TASKS, activityLog: [] };
    const result = computeReviewOutput(state, exec, { todayDate: '2026-04-01' });
    // Should score well: no overdue phases, both have recent completions, no blockers
    expect(result.score).toBeGreaterThanOrEqual(60);
  });
});

// ─── 11. Score — internal blocker deduction ─────────────────────────────────

describe('computeReviewOutput — internal blocker scoring', () => {
  it('reduces blocker health score for internal blockers', () => {
    const stateWithBlocker = {
      departments: [DEPT_XENON_INTERNAL_BLOCKED],
      _generated: {},
    };
    const stateClean = {
      departments: [DEPT_HEPHAESTUS],
      _generated: {},
    };
    const withBlocker = computeReviewOutput(stateWithBlocker, {}, { todayDate: '2026-04-01' });
    const clean = computeReviewOutput(stateClean, {}, { todayDate: '2026-04-01' });
    expect(withBlocker.scoreBreakdown.blockerHealth).toBeLessThan(clean.scoreBreakdown.blockerHealth);
  });

  it('generates drift item for internal blockers on active depts', () => {
    const state = { departments: [DEPT_XENON_INTERNAL_BLOCKED], _generated: {} };
    const result = computeReviewOutput(state, {}, { todayDate: '2026-04-01' });
    const blockerDrift = result.driftItems.find((d) => d.type === 'internal_blocker');
    expect(blockerDrift).toBeDefined();
    expect(blockerDrift.deptId).toBe('xenon');
  });
});

// ─── 12. Verdict thresholds ──────────────────────────────────────────────────

describe('computeReviewOutput — verdict assignment', () => {
  it('verdict has label, level, and description', () => {
    const state = { departments: [DEPT_NEXUS], _generated: {} };
    const result = computeReviewOutput(state, {}, { todayDate: '2026-04-01' });
    expect(result.verdict.label).toBeTruthy();
    expect(result.verdict.level).toBeTruthy();
    expect(result.verdict.description).toBeTruthy();
  });

  it('verdict label is one of the expected values', () => {
    const state = { departments: [DEPT_NEXUS], _generated: {} };
    const result = computeReviewOutput(state, {}, { todayDate: '2026-04-01' });
    expect(['CONTINUE', 'CAUTION', 'REVISE', 'REJECT']).toContain(result.verdict.label);
  });
});

// ─── 13. Drift items structure ───────────────────────────────────────────────

describe('computeReviewOutput — drift items structure', () => {
  it('each drift item has type, severity, and description', () => {
    const state = { departments: [DEPT_NEXUS], _generated: {} };
    const result = computeReviewOutput(state, {}, { todayDate: '2026-04-01' });
    result.driftItems.forEach((item) => {
      expect(item.type).toBeTruthy();
      expect(item.severity).toBeTruthy();
      expect(item.description).toBeTruthy();
    });
  });

  it('phase_slip drift generated for overdue phase', () => {
    const state = {
      departments: [DEPT_AUREON],
      _generated: {
        phaseDeadlines: {
          aureon: [
            { phase: 'A1 — First Revenue', start: 'March 1, 2026', targetEnd: 'March 31, 2026', status: 'Active' },
          ],
        },
      },
    };
    const result = computeReviewOutput(state, {}, { todayDate: '2026-04-01' });
    const slip = result.driftItems.find((d) => d.type === 'phase_slip');
    expect(slip).toBeDefined();
    expect(slip.severity).toBe('critical');
  });
});

// ─── 14. Per-department review structure ────────────────────────────────────

describe('computeReviewOutput — departmentReviews', () => {
  it('returns one review per department', () => {
    const state = {
      departments: [DEPT_NEXUS, DEPT_AUREON, DEPT_HEPHAESTUS],
      _generated: {},
    };
    const result = computeReviewOutput(state, {}, { todayDate: '2026-04-01' });
    expect(result.departmentReviews.length).toBe(3);
  });

  it('each department review has required fields', () => {
    const state = { departments: [DEPT_NEXUS], _generated: {} };
    const result = computeReviewOutput(state, {}, { todayDate: '2026-04-01' });
    const review = result.departmentReviews[0];
    expect(review.deptId).toBe('nexus');
    expect(review.deptName).toBe('NEXUS');
    expect(review.executionStatus).toBeTruthy();
    expect(review.velocity).toBeDefined();
    expect(review.velocity.completions7d).toBeDefined();
    expect(review.velocity.logEntries3d).toBeDefined();
    expect(Array.isArray(review.blockers)).toBe(true);
  });

  it('external blockers are classified correctly', () => {
    const state = { departments: [DEPT_XENON_BLOCKED], _generated: {} };
    const result = computeReviewOutput(state, {}, { todayDate: '2026-04-01' });
    const review = result.departmentReviews[0];
    expect(review.blockers.length).toBe(1);
    expect(review.blockers[0].type).toBe('external');
  });
});
