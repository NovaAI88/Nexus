/**
 * planningEngine.js — Pure function. Deterministic. Testable.
 * N2: AI Planning Core.
 *
 * Interprets real company state and produces clear planning guidance:
 *   (1) Priority logic from real company state
 *   (2) Planning recommendations for today / this week
 *   (3) Blocker awareness with unlock paths
 *   (4) Execution sequencing with revenue-first bias
 *
 * Same inputs → same outputs. No React, no hooks, no side effects.
 */

const DEPT_BASE_MINUTES = {
  aureon: 60,
  nexus: 90,
  hephaestus: 90,
  xenon: 45,
};

/**
 * Parse a date string like "April 14, 2026" into a Date object.
 * Returns null if unparseable.
 */
function parseDeadline(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/**
 * Days remaining until a deadline from a reference date.
 * Negative = overdue.
 */
function daysUntil(deadlineDate, todayDateStr) {
  if (!deadlineDate) return null;
  const today = todayDateStr
    ? new Date(todayDateStr + 'T12:00:00')
    : new Date();
  const diff = deadlineDate.getTime() - today.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

/**
 * Classify a blocker string as external (requires outside input)
 * or internal (can be resolved by working on it).
 * Returns null if no real blocker.
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

/**
 * Score a department for planning priority.
 * Lower score = higher priority (matches executionEngine convention).
 *
 * Factors:
 *   Revenue deadline proximity  → strong negative scores (higher priority)
 *   Urgency                     → moderate negative scores
 *   Active status               → small negative score
 *   External blockers           → large positive score (deprioritise)
 *   Blocked status              → large positive score
 */
function planningScore(dept, todayDateStr) {
  let score = 0;

  // Blocked status — deprioritise, can't do meaningful work
  if (dept.status === 'blocked') score += 1000;

  // Blocker array — classify and score
  const activeBlockers = (dept.blockers || []).filter((b) => classifyBlocker(b) !== null);
  if (activeBlockers.length > 0) {
    const classified = classifyBlocker(activeBlockers[0]);
    if (classified?.type === 'external') {
      score += 500; // Waiting on outside input — deprioritise
    } else if (classified?.type === 'internal') {
      score -= 100; // Internal blocker — slight urgency boost to resolve it
    }
  }

  // Revenue-critical scoring — most powerful positive signal
  if (dept.metrics?.revenueTarget) {
    const deadline = parseDeadline(dept.metrics.revenueDeadline);
    const days = daysUntil(deadline, todayDateStr);
    if (days !== null) {
      if (days < 0)    score -= 2500; // Overdue revenue target — critical
      else if (days <= 7)  score -= 2000; // Under a week — very high
      else if (days <= 14) score -= 1500; // Under two weeks — high
      else if (days <= 30) score -= 1000; // Under a month — elevated
      else                 score -= 500;  // Future revenue — still matters
    } else {
      score -= 300; // Revenue relevant, no parseable deadline
    }
  }

  // Urgency
  if (dept.urgency === 'critical') score -= 500;
  else if (dept.urgency === 'high') score -= 300;
  else if (dept.urgency === 'normal') score -= 100;

  // Active departments get a small boost over paused ones
  if (dept.status === 'active') score -= 200;

  return score;
}

/**
 * Determine if a department has a real (non-None) blocker in its blockers array.
 */
function hasRealBlocker(dept) {
  return (dept.blockers || []).some((b) => classifyBlocker(b) !== null);
}

/**
 * Extract active blockers from departments.
 */
function extractBlockers(departments) {
  const result = [];
  for (const dept of departments) {
    for (const blockerText of dept.blockers || []) {
      const classified = classifyBlocker(blockerText);
      if (!classified) continue;
      result.push({
        departmentId: dept.id,
        departmentName: dept.name,
        description: classified.description,
        type: classified.type,
        unlockPath: dept.nextAction || null,
      });
    }
  }
  return result;
}

/**
 * Extract week-level risk items from phaseDeadlines.
 * Only surfaces items due within 14 days or overdue.
 */
function extractWeekItems(phaseDeadlines, todayDateStr) {
  const items = [];
  const DEPT_KEY_MAP = { vortex: 'hephaestus' };

  for (const [key, phases] of Object.entries(phaseDeadlines || {})) {
    const deptId = DEPT_KEY_MAP[key] || key;
    for (const phase of phases || []) {
      const statusLower = (phase.status || '').toLowerCase();
      if (statusLower === 'complete' || statusLower === 'completed') continue;

      const deadline = parseDeadline(phase.targetEnd);
      const days = daysUntil(deadline, todayDateStr);

      let risk = 'low';
      if (days !== null) {
        if (days < 0)    risk = 'overdue';
        else if (days <= 7)  risk = 'high';
        else if (days <= 14) risk = 'medium';
      }

      if (risk !== 'low') {
        items.push({
          departmentId: deptId,
          phase: phase.phase,
          deadline: phase.targetEnd,
          daysRemaining: days,
          risk,
          status: phase.status,
        });
      }
    }
  }

  return items.sort((a, b) => (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999));
}

/**
 * Build today's top 3 concrete recommendations from priority-sorted departments.
 * Skips externally-blocked departments (can't act on them).
 * Optionally applies health context to adjust estimated minutes and add health notes.
 */
function buildTodayRecommendations(prioritySorted, todayDateStr, healthContext) {
  const actionable = prioritySorted.filter((dept) => {
    if (dept.status === 'blocked') return false;
    const activeBlockers = (dept.blockers || []).filter((b) => classifyBlocker(b) !== null);
    if (activeBlockers.length === 0) return true;
    const classified = classifyBlocker(activeBlockers[0]);
    return classified?.type !== 'external';
  });

  return actionable.slice(0, 3).map((dept, idx) => {
    const isRevenue = !!dept.metrics?.revenueTarget;
    let reason = '';

    if (isRevenue) {
      const deadline = dept.metrics?.revenueDeadline;
      const parsed = parseDeadline(deadline);
      const days = daysUntil(parsed, todayDateStr);
      if (days !== null && days >= 0) {
        reason = `Revenue-critical: ${dept.metrics.revenueCurrency || '€'}${dept.metrics.revenueTarget} target in ${days} days.`;
      } else if (days !== null && days < 0) {
        reason = `Revenue target overdue by ${Math.abs(days)} days — escalate immediately.`;
      } else {
        reason = `Revenue-critical: target ${dept.metrics.revenueCurrency || '€'}${dept.metrics.revenueTarget}.`;
      }
    } else if (dept.urgency === 'critical') {
      reason = `Critical urgency — ${dept.phase || 'immediate action required'}.`;
    } else if (dept.urgency === 'high') {
      reason = `High priority — ${dept.phase || 'active phase'}.`;
    } else {
      reason = `${dept.name} is active — ${dept.phase || 'continue current phase'}.`;
    }

    const baseMinutes = DEPT_BASE_MINUTES[dept.id] ?? 60;
    const multiplier = healthContext?.intensityMultiplier ?? 1.0;
    const estimatedMinutes = Math.round(baseMinutes / multiplier);
    const healthNote = healthContext?.healthNote ?? null;

    return {
      step: idx + 1,
      departmentId: dept.id,
      departmentName: dept.name,
      action: dept.nextAction || `Continue ${dept.name}`,
      reason,
      priority: dept.urgency,
      revenueRelevant: isRevenue,
      estimatedMinutes,
      healthNote,
      type: isRevenue ? 'revenue' : (dept.urgency === 'critical' ? 'urgent' : 'product'),
    };
  });
}

/**
 * Generate a one-line planning insight from the current state.
 * Optionally prefixes with a health warning when fatigue is high.
 */
function generateInsight(departments, blockers, weekItems, healthContext) {
  const parts = [];

  // Overdue items are most urgent
  const overdue = weekItems.filter((w) => w.risk === 'overdue');
  if (overdue.length > 0) {
    parts.push(`${overdue[0].departmentId.toUpperCase()} phase overdue`);
  }

  // Revenue deadline pressure
  const activeRevenueDept = departments.find(
    (d) => d.metrics?.revenueTarget && d.status !== 'blocked' && !hasRealBlocker(d)
  );
  if (activeRevenueDept) {
    const deadline = activeRevenueDept.metrics?.revenueDeadline;
    const parsed = parseDeadline(deadline);
    const days = daysUntil(parsed, null);
    if (days !== null && days <= 14 && days >= 0) {
      parts.push(`${activeRevenueDept.name} revenue deadline in ${days}d`);
    } else if (days !== null && days < 0) {
      parts.push(`${activeRevenueDept.name} revenue target overdue`);
    } else {
      parts.push(`${activeRevenueDept.name} execution active`);
    }
  }

  // External blockers worth surfacing
  const externalBlockers = blockers.filter((b) => b.type === 'external');
  if (externalBlockers.length > 0) {
    const names = [...new Set(externalBlockers.map((b) => b.departmentName))].join(', ');
    parts.push(`${names} blocked externally`);
  }

  if (parts.length === 0) {
    const topActive = departments.find((d) => d.status === 'active');
    const baseInsight = topActive
      ? `${topActive.name} is the current priority — ${topActive.nextAction || 'continue active phase'}.`
      : 'All systems active.';

    if (healthContext?.fatigueIndex >= 70) {
      return `Recovery low (${healthContext.recoveryLevel}) · ${baseInsight}`;
    }
    return baseInsight;
  }

  if (healthContext?.fatigueIndex >= 70) {
    parts.unshift(`Recovery ${healthContext.recoveryLevel}`);
  }

  return parts.join(' · ') + '.';
}

/**
 * Main planning engine.
 *
 * @param {Object} companyState  — { departments[], _generated: { phaseDeadlines, ... } }
 * @param {Object} timeContext   — { todayDate: 'YYYY-MM-DD' }
 * @param {Object|null} healthContext — from computeHealthContext (N5), optional
 * @returns {Object} planning output
 */
export function computePlanningOutput(companyState, timeContext = {}, healthContext = null) {
  const { departments = [] } = companyState ?? {};
  const generated = companyState?._generated ?? {};
  const todayDateStr = timeContext?.todayDate ?? null;

  if (departments.length === 0) {
    return {
      priorityItems: [],
      todayRecommendations: [],
      weekItems: [],
      blockers: [],
      executionSequence: [],
      insight: 'No company data available.',
      healthContext,
    };
  }

  // Sort departments by planning priority
  const prioritySorted = [...departments].sort(
    (a, b) => planningScore(a, todayDateStr) - planningScore(b, todayDateStr)
  );

  const blockers = extractBlockers(departments);
  const weekItems = extractWeekItems(generated.phaseDeadlines, todayDateStr);
  const todayRecommendations = buildTodayRecommendations(prioritySorted, todayDateStr, healthContext);

  // Execution sequence mirrors today recommendations with explicit step + reason
  const executionSequence = todayRecommendations.map((rec) => ({
    step: rec.step,
    departmentId: rec.departmentId,
    departmentName: rec.departmentName,
    action: rec.action,
    reason: rec.reason,
    revenueRelevant: rec.revenueRelevant,
    estimatedMinutes: rec.estimatedMinutes,
  }));

  // All departments ranked, annotated
  const priorityItems = prioritySorted.map((dept) => ({
    id: `${dept.id}-${(dept.phase || 'item').replace(/\s+/g, '-').toLowerCase().slice(0, 30)}`,
    departmentId: dept.id,
    departmentName: dept.name,
    action: dept.nextAction || `Continue ${dept.name}`,
    phase: dept.phase,
    priority: dept.urgency,
    status: dept.status,
    revenueRelevant: !!dept.metrics?.revenueTarget,
    hasBlocker: hasRealBlocker(dept),
    estimatedMinutes: DEPT_BASE_MINUTES[dept.id] ?? 60,
    type: dept.metrics?.revenueTarget ? 'revenue' : (hasRealBlocker(dept) ? 'blocked' : 'product'),
  }));

  return {
    priorityItems,
    todayRecommendations,
    weekItems,
    blockers,
    executionSequence,
    insight: generateInsight(departments, blockers, weekItems, healthContext),
    healthContext,
  };
}
