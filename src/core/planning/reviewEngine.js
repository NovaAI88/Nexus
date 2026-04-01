/**
 * reviewEngine.js — Pure function. Deterministic. Testable.
 * N3: Review Engine.
 *
 * Measures execution quality against plan using real company state:
 *   (1) Phase adherence — compares phaseDeadlines vs today
 *   (2) Execution velocity — task completions + activity log entries per dept
 *   (3) Drift / slippage detection — overdue phases, stalled depts, revenue risk
 *   (4) Blocker health — internal vs external blocker count
 *   (5) Review scoring (0–100) with deterministic inputs
 *   (6) Verdict: CONTINUE / CAUTION / REVISE / REJECT
 *   (7) Per-department review breakdown
 *
 * Same inputs → same outputs. No React, no hooks, no side effects.
 */

// ─── Date Utilities ───────────────────────────────────────────────────────────

/**
 * Parse a date string like "April 14, 2026" or "2026-04-14" into a Date.
 * Returns null if unparseable.
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/**
 * Days remaining until a future date from a reference date string (YYYY-MM-DD).
 * Negative = overdue.
 */
function daysUntil(futureDate, todayDateStr) {
  if (!futureDate) return null;
  const today = todayDateStr
    ? new Date(todayDateStr + 'T12:00:00')
    : new Date();
  const diff = futureDate.getTime() - today.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

// ─── Blocker Classification ───────────────────────────────────────────────────

/**
 * Returns null if the blocker text is "none" (no real blocker).
 * Otherwise returns { type: 'external' | 'internal', description }.
 */
function classifyBlocker(blockerText) {
  if (!blockerText) return null;
  const normalised = blockerText.toLowerCase().trim();
  if (
    normalised === 'none' ||
    normalised === 'none — execution-ready' ||
    normalised === 'none - execution-ready'
  ) {
    return null;
  }
  const externalKeywords = ['awaiting', 'waiting', 'decides', 'direction', 'external', 'approval', 'pending direction'];
  const isExternal = externalKeywords.some((kw) => normalised.includes(kw));
  return {
    description: blockerText,
    type: isExternal ? 'external' : 'internal',
  };
}

function getActiveBlockers(dept) {
  return (dept.blockers || [])
    .map((b) => classifyBlocker(b))
    .filter(Boolean);
}

// ─── Phase Adherence Analysis ─────────────────────────────────────────────────

/**
 * Analyse phaseDeadlines and return per-phase adherence items.
 * Maps vortex → hephaestus (consistent with planning engine convention).
 */
function analysePhaseAdherence(phaseDeadlines, todayDateStr) {
  const DEPT_KEY_MAP = { vortex: 'hephaestus' };
  const items = [];

  for (const [key, phases] of Object.entries(phaseDeadlines || {})) {
    const deptId = DEPT_KEY_MAP[key] || key;
    for (const phase of phases || []) {
      const statusLower = (phase.status || '').toLowerCase();
      if (statusLower === 'complete' || statusLower === 'completed') continue;

      const deadline = parseDate(phase.targetEnd);
      const days = daysUntil(deadline, todayDateStr);
      const startDate = parseDate(phase.start);
      const daysInPhase = startDate ? Math.max(0, -daysUntil(startDate, todayDateStr)) : null;

      let adherence = 'on_track';
      if (days !== null) {
        if (days < 0) adherence = 'overdue';
        else if (days <= 3) adherence = 'critical';
        else if (days <= 7) adherence = 'high_risk';
        else if (days <= 14) adherence = 'at_risk';
      }

      items.push({
        deptId,
        phase: phase.phase,
        deadline: phase.targetEnd,
        status: phase.status,
        daysRemaining: days,
        daysInPhase,
        adherence,
      });
    }
  }

  return items.sort((a, b) => (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999));
}

// ─── Execution Velocity ───────────────────────────────────────────────────────

/**
 * Compute execution velocity per department:
 *   - task completions in last 7 days (projectId matches deptId)
 *   - activity log entries in last 3 days
 *
 * Returns a map: deptId → { completions7d, logEntries3d, isActive, lastActivity }
 */
function computeVelocity(tasks, activityLog, todayDateStr) {
  const today = todayDateStr
    ? new Date(todayDateStr + 'T23:59:59')
    : new Date();

  const velocityMap = {};

  // Tasks completed in last 7 days, grouped by projectId (= deptId)
  for (const task of tasks || []) {
    if (task.status !== 'done' || !task.completedAt) continue;
    const completed = new Date(task.completedAt);
    if (isNaN(completed.getTime())) continue;
    const ageDays = Math.floor((today.getTime() - completed.getTime()) / (1000 * 60 * 60 * 24));
    if (ageDays > 7) continue;

    const key = task.projectId || 'unknown';
    if (!velocityMap[key]) velocityMap[key] = { completions7d: 0, logEntries3d: 0, lastActivity: null };
    velocityMap[key].completions7d += 1;
    if (!velocityMap[key].lastActivity || completed > new Date(velocityMap[key].lastActivity)) {
      velocityMap[key].lastActivity = task.completedAt;
    }
  }

  // Activity log entries in last 3 days, grouped by projectId
  for (const entry of activityLog || []) {
    if (!entry.timestamp) continue;
    const logged = new Date(entry.timestamp);
    if (isNaN(logged.getTime())) continue;
    const ageDays = Math.floor((today.getTime() - logged.getTime()) / (1000 * 60 * 60 * 24));
    if (ageDays > 3) continue;

    const key = entry.projectId || 'unknown';
    if (!velocityMap[key]) velocityMap[key] = { completions7d: 0, logEntries3d: 0, lastActivity: null };
    velocityMap[key].logEntries3d += 1;
    if (!velocityMap[key].lastActivity || logged > new Date(velocityMap[key].lastActivity)) {
      velocityMap[key].lastActivity = entry.timestamp;
    }
  }

  return velocityMap;
}

// ─── Stall Detection ──────────────────────────────────────────────────────────

/**
 * A department is stalled if:
 *   - status is 'active'
 *   - no task completions in last 7 days
 *   - no activity log entries in last 3 days
 */
function detectStalls(departments, velocityMap) {
  const stalled = [];
  for (const dept of departments || []) {
    if (dept.status !== 'active') continue;
    const v = velocityMap[dept.id];
    const hasActivity = v && (v.completions7d > 0 || v.logEntries3d > 0);
    if (!hasActivity) {
      stalled.push({
        deptId: dept.id,
        deptName: dept.name,
        reason: 'No task completions or log entries in recent window',
        lastActivity: v?.lastActivity || null,
      });
    }
  }
  return stalled;
}

// ─── Revenue Risk ─────────────────────────────────────────────────────────────

/**
 * Evaluate revenue milestones and return risk items.
 */
function evaluateRevenueRisk(revenueMilestones, todayDateStr) {
  const items = [];
  for (const milestone of revenueMilestones || []) {
    const statusLower = (milestone.status || '').toLowerCase();
    if (statusLower.includes('complete') || statusLower === 'done') continue;

    const deadline = parseDate(milestone.deadline);
    const days = daysUntil(deadline, todayDateStr);

    let risk = 'low';
    if (days !== null) {
      if (days < 0) risk = 'overdue';
      else if (days <= 7) risk = 'critical';
      else if (days <= 14) risk = 'high';
      else if (days <= 30) risk = 'medium';
    }

    if (risk !== 'low') {
      items.push({
        target: milestone.target,
        amount: milestone.amount,
        deadline: milestone.deadline,
        status: milestone.status,
        daysRemaining: days,
        risk,
      });
    }
  }
  return items.sort((a, b) => (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999));
}

// ─── Review Scoring ───────────────────────────────────────────────────────────

/**
 * Compute deterministic review score (0–100).
 *
 * Components:
 *   Phase Adherence  (40 pts): starts at 40, deductions per overdue/at-risk phase
 *   Execution Velocity (30 pts): 10 per active dept with recent activity (max 3)
 *   Blocker Health   (20 pts): starts at 20, deductions for internal blockers
 *   Revenue Progress (10 pts): milestone on-track = 10, at-risk = 5, overdue = 0
 */
function computeScore({ departments, phaseItems, velocityMap, revenueItems }) {
  // 1. Phase adherence (40 pts max)
  let phaseScore = 40;
  for (const item of phaseItems) {
    if (item.adherence === 'overdue') phaseScore -= 15;
    else if (item.adherence === 'critical') phaseScore -= 10;
    else if (item.adherence === 'high_risk') phaseScore -= 6;
    else if (item.adherence === 'at_risk') phaseScore -= 3;
  }
  phaseScore = Math.max(0, phaseScore);

  // 2. Execution velocity (30 pts max, 10 per active dept with recent activity)
  const activeDepts = (departments || []).filter((d) => d.status === 'active');
  let velocityScore = 0;
  let activeDepsWithActivity = 0;
  for (const dept of activeDepts) {
    const v = velocityMap[dept.id];
    if (v && (v.completions7d > 0 || v.logEntries3d > 0)) {
      activeDepsWithActivity += 1;
    }
  }
  velocityScore = Math.min(activeDepsWithActivity * 10, 30);

  // 3. Blocker health (20 pts max)
  let blockerScore = 20;
  for (const dept of departments || []) {
    const classified = getActiveBlockers(dept);
    for (const b of classified) {
      if (b.type === 'internal') blockerScore -= 8;
      else blockerScore -= 2; // external blocker: minor deduction (acceptable)
    }
  }
  blockerScore = Math.max(0, blockerScore);

  // 4. Revenue progress (10 pts max)
  let revenueScore = 5; // neutral when no active milestone
  const activeRevenueMilestones = revenueItems.filter(
    (r) => r.risk !== 'overdue'
  );
  const overdueRevenueMilestones = revenueItems.filter(
    (r) => r.risk === 'overdue'
  );
  if (activeRevenueMilestones.length > 0 && overdueRevenueMilestones.length === 0) {
    // Active milestones, none overdue = on track
    revenueScore = 10;
  } else if (overdueRevenueMilestones.length > 0) {
    revenueScore = 0;
  } else if (revenueItems.length === 0) {
    revenueScore = 5; // no milestones in window
  }

  const total = phaseScore + velocityScore + blockerScore + revenueScore;
  return {
    total: Math.min(100, Math.max(0, total)),
    breakdown: {
      phaseAdherence: phaseScore,
      executionVelocity: velocityScore,
      blockerHealth: blockerScore,
      revenueProgress: revenueScore,
    },
  };
}

// ─── Verdict ──────────────────────────────────────────────────────────────────

function computeVerdict(score) {
  if (score >= 80) return { label: 'CONTINUE', level: 'pass', description: 'Execution is on track. Continue current plan.' };
  if (score >= 60) return { label: 'CAUTION', level: 'warn', description: 'Minor slippage detected. Review specific items before proceeding.' };
  if (score >= 40) return { label: 'REVISE', level: 'risk', description: 'Significant drift. Adjust plan before next phase.' };
  return { label: 'REJECT', level: 'fail', description: 'Execution is off-plan. Major replanning required.' };
}

// ─── Per-Department Review ────────────────────────────────────────────────────

/**
 * Build per-department review breakdown.
 */
function buildDeptReviews(departments, phaseItems, velocityMap, todayDateStr) {
  return (departments || []).map((dept) => {
    const deptPhases = phaseItems.filter((p) => p.deptId === dept.id);
    const velocity = velocityMap[dept.id] || { completions7d: 0, logEntries3d: 0, lastActivity: null };
    const classified = getActiveBlockers(dept);
    const hasActivity = velocity.completions7d > 0 || velocity.logEntries3d > 0;
    const isStalled = dept.status === 'active' && !hasActivity;

    const worstPhase = deptPhases.reduce((worst, p) => {
      const rank = { overdue: 4, critical: 3, high_risk: 2, at_risk: 1, on_track: 0 };
      return (rank[p.adherence] ?? 0) > (rank[worst?.adherence] ?? -1) ? p : worst;
    }, null);

    let executionStatus = 'no_data';
    if (dept.status !== 'active') executionStatus = 'inactive';
    else if (isStalled) executionStatus = 'stalled';
    else if (velocity.completions7d > 0) executionStatus = 'active';
    else if (velocity.logEntries3d > 0) executionStatus = 'active';

    return {
      deptId: dept.id,
      deptName: dept.name,
      phase: dept.phase,
      status: dept.status,
      urgency: dept.urgency,
      phaseAdherence: worstPhase?.adherence || (deptPhases.length > 0 ? 'on_track' : 'no_phase'),
      executionStatus,
      velocity: {
        completions7d: velocity.completions7d,
        logEntries3d: velocity.logEntries3d,
        lastActivity: velocity.lastActivity,
      },
      blockers: classified,
      phases: deptPhases,
      nextAction: dept.nextAction || null,
    };
  });
}

// ─── Drift Items ──────────────────────────────────────────────────────────────

/**
 * Collect drift items — concrete signals that execution is diverging from plan.
 */
function collectDriftItems(phaseItems, stalledDepts, revenueItems, departments) {
  const items = [];

  // Overdue / critical phases → drift
  for (const p of phaseItems) {
    if (p.adherence === 'overdue' || p.adherence === 'critical' || p.adherence === 'high_risk') {
      items.push({
        type: 'phase_slip',
        severity: p.adherence === 'overdue' ? 'critical' : p.adherence === 'critical' ? 'high' : 'medium',
        deptId: p.deptId,
        description: `${p.phase} — ${p.daysRemaining !== null && p.daysRemaining < 0 ? `overdue by ${Math.abs(p.daysRemaining)} days` : `${p.daysRemaining}d remaining`}`,
        deadline: p.deadline,
      });
    }
  }

  // Stalled active departments → drift
  for (const s of stalledDepts) {
    items.push({
      type: 'stalled',
      severity: 'medium',
      deptId: s.deptId,
      description: `${s.deptName} — no recent execution activity detected`,
      lastActivity: s.lastActivity,
    });
  }

  // Revenue risk items → drift
  for (const r of revenueItems) {
    if (r.risk === 'overdue' || r.risk === 'critical') {
      items.push({
        type: 'revenue_risk',
        severity: r.risk === 'overdue' ? 'critical' : 'high',
        description: `${r.target} (${r.amount}) — ${r.daysRemaining !== null && r.daysRemaining < 0 ? `overdue by ${Math.abs(r.daysRemaining)} days` : `${r.daysRemaining}d to deadline`}`,
        deadline: r.deadline,
      });
    }
  }

  // Internal blockers on active depts → drift (potential)
  for (const dept of departments || []) {
    if (dept.status !== 'active') continue;
    const classified = getActiveBlockers(dept);
    const internalBlockers = classified.filter((b) => b.type === 'internal');
    for (const b of internalBlockers) {
      items.push({
        type: 'internal_blocker',
        severity: 'medium',
        deptId: dept.id,
        description: `${dept.name} — internal blocker: ${b.description}`,
      });
    }
  }

  // Deduplicate by description (simple guard for edge cases)
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.description)) return false;
    seen.add(item.description);
    return true;
  });
}

// ─── Review Summary ───────────────────────────────────────────────────────────

/**
 * Generate a concise review summary string.
 */
function generateSummary(score, verdict, driftItems, stalledDepts, phaseItems) {
  const parts = [];

  const overduePhases = phaseItems.filter((p) => p.adherence === 'overdue');
  if (overduePhases.length > 0) {
    parts.push(`${overduePhases.length} phase${overduePhases.length > 1 ? 's' : ''} overdue`);
  }

  if (stalledDepts.length > 0) {
    const names = stalledDepts.map((s) => s.deptName).join(', ');
    parts.push(`${names} stalled`);
  }

  const revenueRiskItems = driftItems.filter((d) => d.type === 'revenue_risk');
  if (revenueRiskItems.length > 0) {
    parts.push('revenue deadline at risk');
  }

  if (parts.length === 0) {
    return `Score ${score}/100 — ${verdict.description}`;
  }

  return `Score ${score}/100 — ${parts.join(', ')}. ${verdict.label}: ${verdict.description}`;
}

// ─── Main Review Engine ───────────────────────────────────────────────────────

/**
 * Compute a full review output from company state + execution data.
 *
 * @param {Object} companyState  — { departments[], _generated: { phaseDeadlines, revenueMilestones } }
 * @param {Object} executionData — { tasks[], activityLog[] }
 * @param {Object} timeContext   — { todayDate: 'YYYY-MM-DD' }
 * @returns {Object} reviewOutput
 */
export function computeReviewOutput(companyState, executionData = {}, timeContext = {}) {
  const { departments = [] } = companyState ?? {};
  const generated = companyState?._generated ?? {};
  const { tasks = [], activityLog = [] } = executionData;
  const todayDateStr = timeContext?.todayDate ?? null;

  if (departments.length === 0) {
    return {
      score: 0,
      scoreBreakdown: { phaseAdherence: 0, executionVelocity: 0, blockerHealth: 0, revenueProgress: 0 },
      verdict: computeVerdict(0),
      departmentReviews: [],
      phaseItems: [],
      driftItems: [],
      stalledDepts: [],
      revenueRisk: [],
      summary: 'No company data available.',
      reviewDate: todayDateStr,
    };
  }

  const phaseItems = analysePhaseAdherence(generated.phaseDeadlines, todayDateStr);
  const velocityMap = computeVelocity(tasks, activityLog, todayDateStr);
  const stalledDepts = detectStalls(departments, velocityMap);
  const revenueItems = evaluateRevenueRisk(generated.revenueMilestones, todayDateStr);
  const driftItems = collectDriftItems(phaseItems, stalledDepts, revenueItems, departments);
  const { total: score, breakdown: scoreBreakdown } = computeScore({
    departments,
    phaseItems,
    velocityMap,
    revenueItems,
  });
  const verdict = computeVerdict(score);
  const departmentReviews = buildDeptReviews(departments, phaseItems, velocityMap, todayDateStr);
  const summary = generateSummary(score, verdict, driftItems, stalledDepts, phaseItems);

  return {
    score,
    scoreBreakdown,
    verdict,
    departmentReviews,
    phaseItems,
    driftItems,
    stalledDepts,
    revenueRisk: revenueItems,
    summary,
    reviewDate: todayDateStr,
  };
}
