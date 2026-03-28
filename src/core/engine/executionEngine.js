/**
 * executionEngine.js — Pure function. Deterministic. Testable.
 * Same inputs → same outputs. No React, no hooks, no side effects.
 */

import { energyScoreModifier, generateLifeSuggestions } from '../energy/energyModel';

function hoursStale(isoDate) {
  if (!isoDate) return 0;
  return Math.max(0, (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60));
}

function priorityScore(dept, dismissedDepts, currentZone) {
  if (dismissedDepts && dismissedDepts.has(dept.id)) return 99999;

  let score = 0;

  if (dept.status === 'blocked') score -= 1000;
  if (dept.urgency === 'critical') score -= 500;
  if (dept.id === 'aureon' && dept.status === 'active') score -= 300;
  score -= Math.min(hoursStale(dept.lastUpdated), 200);
  if (dept.status === 'active') score -= 100;
  if (dept.urgency === 'high') score -= 200;

  // Energy-aware: boost deep-work depts during peak, light depts during low
  if (currentZone) {
    score += energyScoreModifier(dept.id, currentZone);
  }

  return score;
}

const BASE_DURATION = {
  aureon: 45,
  hephaestus: 90,
  nexus: 60,
  xenon: 45,
};

const MIN_DURATION = {
  aureon: 30,
  hephaestus: 60,
  nexus: 45,
  xenon: 30,
};

function toHHMM(totalMinutes) {
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
}

function snapTo15(minutes) {
  return Math.ceil(minutes / 15) * 15;
}

function fitDepartmentsToGaps(queue, freeGaps, currentMinutes) {
  const suggestions = [];
  const consumedByGap = {};

  for (let i = 0; i < Math.min(queue.length, 3); i += 1) {
    const dept = queue[i];
    const duration = BASE_DURATION[dept.id] ?? 60;
    const minDuration = MIN_DURATION[dept.id] ?? 30;

    const effectiveDuration = dept.urgency === 'critical'
      ? Math.min(duration + 15, 120)
      : duration;

    let bestGapIndex = -1;
    let bestScore = Infinity;

    freeGaps.forEach((gap, idx) => {
      const alreadyConsumed = consumedByGap[idx] ?? 0;
      const available = gap.duration - alreadyConsumed;
      if (available < minDuration) return;
      if (gap.end <= currentMinutes) return;

      const score = Math.abs(available - effectiveDuration) + (i * 50);

      if (score < bestScore) {
        bestScore = score;
        bestGapIndex = idx;
      }
    });

    if (bestGapIndex === -1) continue;

    const gap = freeGaps[bestGapIndex];
    const alreadyConsumed = consumedByGap[bestGapIndex] ?? 0;
    const gapEffectiveStart = Math.max(gap.start, currentMinutes);
    const rawStart = gapEffectiveStart + alreadyConsumed;
    const snappedStart = snapTo15(rawStart);
    const end = snappedStart + effectiveDuration;

    if (end > gap.end) continue;

    consumedByGap[bestGapIndex] = alreadyConsumed + (end - gapEffectiveStart);

    suggestions.push({
      id: `suggest-${dept.id}-${Date.now()}-${i}`,
      source: 'engine',
      departmentId: dept.id,
      label: dept.nextAction
        ? (dept.nextAction.length > 60 ? `${dept.nextAction.slice(0, 57)}…` : dept.nextAction)
        : dept.name,
      start: toHHMM(snappedStart),
      end: toHHMM(end),
      estimatedMinutes: effectiveDuration,
      urgency: dept.urgency,
      gapIndex: bestGapIndex,
      state: 'pending',
    });
  }

  return suggestions;
}

function generateReasoning(topDept) {
  if (!topDept) return 'All departments are current. No high-priority action detected.';

  const staleHours = Math.round(hoursStale(topDept.lastUpdated));

  if (topDept.status === 'blocked') {
    return `${topDept.name} is blocked — address the blocker before scheduling work.`;
  }
  if (topDept.urgency === 'critical') {
    return `${topDept.name} is critical — ${topDept.nextAction || 'immediate action required'}.`;
  }
  if (staleHours > 24) {
    return `${topDept.name} hasn't been touched in ${staleHours}h — ${topDept.nextAction || 'resume required'}.`;
  }
  if (topDept.id === 'aureon') {
    return `AUREON execution is live — ${topDept.nextAction || 'run outreach now'}.`;
  }
  return `${topDept.name} is the current priority — ${topDept.nextAction || 'continue active phase'}.`;
}

export function computeExecutionOutput(companyState, timeContext, dismissedDepts = new Set(), energyContext = null) {
  const { departments = [] } = companyState ?? {};
  const { currentMinutes = 0, freeGaps = [] } = timeContext ?? {};

  const currentZone = energyContext?.currentZone ?? null;

  if (departments.length === 0) {
    return {
      primaryAction: null,
      recommendedBlocks: [],
      lifeBlockSuggestions: [],
      departmentQueue: [],
      reasoning: 'No department data available.',
      currentZone,
    };
  }

  const departmentQueue = [...departments].sort(
    (a, b) => priorityScore(a, dismissedDepts, currentZone) - priorityScore(b, dismissedDepts, currentZone)
  );

  const topDept = departmentQueue[0] ?? null;

  const primaryAction = topDept
    ? {
      departmentId: topDept.id,
      title: topDept.nextAction || `Continue ${topDept.name}`,
      description: `${topDept.name} · ${topDept.urgency} · Phase: ${topDept.phase}`,
      urgency: topDept.urgency,
      estimatedMinutes: BASE_DURATION[topDept.id] ?? 60,
    }
    : null;

  const recommendedBlocks = fitDepartmentsToGaps(
    departmentQueue.filter((d) => !dismissedDepts.has(d.id)),
    freeGaps,
    currentMinutes
  );

  // Generate life block suggestions if energy context is available
  const lifeBlockSuggestions = energyContext
    ? generateLifeSuggestions(
        energyContext.plannerBlocks ?? [],
        energyContext.zoneMap ?? [],
        currentMinutes,
        energyContext.dayEnd ?? 22 * 60
      )
    : [];

  const reasoning = generateReasoning(topDept, departments);

  return {
    primaryAction,
    recommendedBlocks,
    lifeBlockSuggestions,
    departmentQueue,
    reasoning,
    currentZone,
  };
}
