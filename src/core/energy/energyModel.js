/**
 * energyModel.js — Pure functions. No React. No side effects.
 *
 * Energy zone definitions, time-of-day mapping, work-style presets,
 * and the life-suggestion algorithm that enforces work/life balance rules.
 */

// ── Zone Definitions ────────────────────────────────────────────────────────────

export const ENERGY_ZONES = [
  { id: 'peak',     label: 'Peak',     color: '#ff4d6d', intensity: 5 },
  { id: 'high',     label: 'High',     color: '#f59e0b', intensity: 4 },
  { id: 'moderate', label: 'Moderate', color: '#eab308', intensity: 3 },
  { id: 'low',      label: 'Low',      color: '#3b82f6', intensity: 2 },
  { id: 'recovery', label: 'Recovery', color: '#a78bfa', intensity: 1 },
];

// ── Default Zone Map ────────────────────────────────────────────────────────────
// Covers 07:00–22:00. Each entry: { start, end, zone }. Times in 'HH:MM'.

export const DEFAULT_ZONE_MAP = [
  { start: '07:00', end: '08:00', zone: 'moderate' },  // morning routine
  { start: '08:00', end: '10:00', zone: 'peak' },      // deep work block 1
  { start: '10:00', end: '10:15', zone: 'low' },       // mid-morning break
  { start: '10:15', end: '12:00', zone: 'peak' },      // deep work block 2
  { start: '12:00', end: '13:00', zone: 'low' },       // lunch + recovery
  { start: '13:00', end: '15:00', zone: 'moderate' },   // lighter work
  { start: '15:00', end: '16:30', zone: 'high' },      // second wind
  { start: '16:30', end: '17:30', zone: 'moderate' },   // wind-down work
  { start: '17:30', end: '19:00', zone: 'moderate' },   // personal / life
  { start: '19:00', end: '21:00', zone: 'low' },       // evening
  { start: '21:00', end: '22:00', zone: 'recovery' },   // wind-down
];

// ── Work-Style Presets ──────────────────────────────────────────────────────────

export const WORK_STYLE_PRESETS = {
  default:   { shiftMinutes: 0,   label: 'Default' },
  earlyBird: { shiftMinutes: -60, label: 'Early Bird (−1h)' },
  nightOwl:  { shiftMinutes: 60,  label: 'Night Owl (+1h)' },
};

// ── Helpers ─────────────────────────────────────────────────────────────────────

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function toHHMM(totalMinutes) {
  const clamped = Math.max(0, Math.min(totalMinutes, 24 * 60 - 1));
  return `${String(Math.floor(clamped / 60)).padStart(2, '0')}:${String(clamped % 60).padStart(2, '0')}`;
}

function snapTo15(minutes) {
  return Math.ceil(minutes / 15) * 15;
}

// ── Public API ──────────────────────────────────────────────────────────────────

/**
 * Get the energy zone active at a given time (minutes from midnight).
 */
export function getZoneAtTime(minutesFromMidnight, zoneMap = DEFAULT_ZONE_MAP) {
  for (const entry of zoneMap) {
    const start = toMinutes(entry.start);
    const end = toMinutes(entry.end);
    if (minutesFromMidnight >= start && minutesFromMidnight < end) {
      return ENERGY_ZONES.find((z) => z.id === entry.zone) ?? ENERGY_ZONES[2];
    }
  }
  return ENERGY_ZONES[4]; // recovery fallback
}

/**
 * Get color for a zone id.
 */
export function getZoneColor(zoneId) {
  return ENERGY_ZONES.find((z) => z.id === zoneId)?.color ?? '#a78bfa';
}

/**
 * Shift all zone map entries by N minutes (for early-bird / night-owl).
 */
export function applyWorkStyleShift(zoneMap, shiftMinutes) {
  if (!shiftMinutes) return zoneMap;
  return zoneMap.map((entry) => ({
    ...entry,
    start: toHHMM(Math.max(toMinutes(entry.start) + shiftMinutes, 0)),
    end: toHHMM(Math.max(toMinutes(entry.end) + shiftMinutes, 0)),
  }));
}

/**
 * Check if a planner block overlaps a given time range.
 */
function overlaps(blockStart, blockEnd, rangeStart, rangeEnd) {
  return blockStart < rangeEnd && blockEnd > rangeStart;
}

/**
 * Check if a slot is free (no overlap with existing blocks).
 */
function isSlotFree(startMin, endMin, existingBlocks) {
  return !existingBlocks.some((b) => {
    const bStart = toMinutes(b.start);
    const bEnd = toMinutes(b.end);
    return overlaps(bStart, bEnd, startMin, endMin);
  });
}

/**
 * Find the next free slot of at least `duration` minutes, starting from `fromMinutes`.
 * Returns { start, end } in minutes, or null.
 */
function findFreeSlot(fromMinutes, duration, existingBlocks, dayEnd) {
  let cursor = snapTo15(fromMinutes);
  while (cursor + duration <= dayEnd) {
    const end = cursor + duration;
    if (isSlotFree(cursor, end, existingBlocks)) {
      return { start: cursor, end };
    }
    cursor += 15;
  }
  return null;
}

/**
 * Detect consecutive work streaks in planner blocks.
 * Returns total consecutive work minutes ending at `atMinutes` (or current streak).
 */
function getWorkStreak(plannerBlocks, currentMinutes) {
  const workBlocks = plannerBlocks
    .filter((b) => b.type === 'work' || b.type === 'job')
    .map((b) => ({ start: toMinutes(b.start), end: toMinutes(b.end) }))
    .sort((a, b) => a.start - b.start);

  let streak = 0;
  let lastEnd = -1;

  for (const block of workBlocks) {
    if (block.start > currentMinutes) break;
    // Allow 15-min gap tolerance (short break doesn't reset streak)
    if (lastEnd !== -1 && block.start - lastEnd > 15) {
      streak = 0;
    }
    streak += Math.min(block.end, currentMinutes) - block.start;
    lastEnd = block.end;
  }

  return Math.max(0, streak);
}

/**
 * Count how many deep work blocks (type=work, duration >= 45 min) exist today.
 */
function countDeepWorkBlocks(plannerBlocks) {
  return plannerBlocks.filter((b) => {
    if (b.type !== 'work') return false;
    const dur = toMinutes(b.end) - toMinutes(b.start);
    return dur >= 45;
  }).length;
}

/**
 * Check if a block of a given type/label exists in the planner.
 */
function hasBlockLike(plannerBlocks, matchFn) {
  return plannerBlocks.some(matchFn);
}

// ── Life Suggestion Engine ──────────────────────────────────────────────────────

/**
 * generateLifeSuggestions
 *
 * Pure function. Analyzes current planner blocks and returns an array
 * of suggested life activities to maintain work/life balance.
 *
 * Rules:
 * 1. After 90 min continuous work → suggest 15 min break
 * 2. After 3 deep work blocks → suggest 30 min wellness (gym, walk, yoga)
 * 3. Never stack 2+ deep work blocks without a break between them
 * 4. Suggest lunch 12:00–13:00 if none scheduled
 * 5. Suggest morning planning at day start if none scheduled
 * 6. Suggest evening review before wind-down if none scheduled
 * 7. Suggest breakfast if morning is empty
 * 8. If no fitness block today → suggest walk or gym
 *
 * @param {Array} plannerBlocks - Today's planner blocks
 * @param {Array} zoneMap - Energy zone map
 * @param {number} currentMinutes - Minutes from midnight
 * @param {number} dayEnd - Day end in minutes (default 22*60)
 * @returns {Array} Suggestions: { id, type, label, start, end, category, reason, icon, color, activityId }
 */
export function generateLifeSuggestions(plannerBlocks, zoneMap, currentMinutes, dayEnd = 22 * 60) {
  const suggestions = [];
  const allBlocks = plannerBlocks || [];

  // Rule 5: Morning planning
  const hasMorningPlanning = hasBlockLike(allBlocks, (b) =>
    b.label?.toLowerCase().includes('planning') && toMinutes(b.start) < 9 * 60
  );
  if (!hasMorningPlanning && currentMinutes < 8 * 60 + 30) {
    const slot = findFreeSlot(Math.max(currentMinutes, 7 * 60), 15, allBlocks, 9 * 60);
    if (slot) {
      suggestions.push({
        id: `life-suggest-morning-${Date.now()}`,
        type: 'life',
        label: '🌅 Morning Planning',
        start: toHHMM(slot.start),
        end: toHHMM(slot.end),
        category: 'planning',
        reason: 'Start your day with intention — 15 min to set priorities',
        icon: '🌅',
        color: '#f59e0b',
        activityId: 'planning-morning',
      });
    }
  }

  // Rule 7: Breakfast
  const hasBreakfast = hasBlockLike(allBlocks, (b) => {
    const label = b.label?.toLowerCase() ?? '';
    return (label.includes('breakfast') || label.includes('🥣')) && toMinutes(b.start) < 10 * 60;
  });
  if (!hasBreakfast && currentMinutes < 9 * 60) {
    const slot = findFreeSlot(Math.max(currentMinutes, 7 * 60 + 30), 20, allBlocks, 10 * 60);
    if (slot) {
      suggestions.push({
        id: `life-suggest-breakfast-${Date.now()}`,
        type: 'life',
        label: '🥣 Breakfast',
        start: toHHMM(slot.start),
        end: toHHMM(slot.end),
        category: 'nutrition',
        reason: 'Fuel your peak performance — eat before deep work',
        icon: '🥣',
        color: '#f59e0b',
        activityId: 'nutrition-breakfast',
      });
    }
  }

  // Rule 1: Break after 90 min work streak
  const workStreak = getWorkStreak(allBlocks, currentMinutes);
  if (workStreak >= 90) {
    const slot = findFreeSlot(currentMinutes, 15, allBlocks, dayEnd);
    if (slot) {
      suggestions.push({
        id: `life-suggest-break-${Date.now()}`,
        type: 'life',
        label: '☕ Break',
        start: toHHMM(slot.start),
        end: toHHMM(slot.end),
        category: 'recovery',
        reason: `${workStreak} min of continuous work — take a break to recharge`,
        icon: '☕',
        color: '#22d3ee',
        activityId: 'recovery-break',
      });
    }
  }

  // Rule 4: Lunch around 12:00–13:00
  const hasLunch = hasBlockLike(allBlocks, (b) => {
    const label = b.label?.toLowerCase() ?? '';
    const start = toMinutes(b.start);
    return (label.includes('lunch') || label.includes('🍽')) && start >= 11 * 60 && start <= 14 * 60;
  });
  if (!hasLunch && currentMinutes < 13 * 60) {
    const slot = findFreeSlot(Math.max(currentMinutes, 12 * 60), 40, allBlocks, 14 * 60);
    if (slot) {
      suggestions.push({
        id: `life-suggest-lunch-${Date.now()}`,
        type: 'life',
        label: '🍽 Lunch',
        start: toHHMM(slot.start),
        end: toHHMM(slot.end),
        category: 'nutrition',
        reason: 'Refuel — sustained energy for the afternoon',
        icon: '🍽',
        color: '#f59e0b',
        activityId: 'nutrition-lunch',
      });
    }
  }

  // Rule 2: Wellness after 3+ deep work blocks
  const deepWorkCount = countDeepWorkBlocks(allBlocks);
  if (deepWorkCount >= 3) {
    const hasFitness = hasBlockLike(allBlocks, (b) => b.type === 'fitness');
    if (!hasFitness) {
      const slot = findFreeSlot(currentMinutes, 30, allBlocks, dayEnd);
      if (slot) {
        suggestions.push({
          id: `life-suggest-wellness-${Date.now()}`,
          type: 'fitness',
          label: '🚶 Walk or Gym',
          start: toHHMM(slot.start),
          end: toHHMM(slot.end),
          category: 'fitness',
          reason: `${deepWorkCount} deep work blocks today — move your body`,
          icon: '🚶',
          color: '#6fcf97',
          activityId: 'fitness-walk',
        });
      }
    }
  }

  // Rule 8: If no fitness block at all today, suggest one in a moderate/low zone
  const hasFitnessBlock = hasBlockLike(allBlocks, (b) => b.type === 'fitness');
  if (!hasFitnessBlock && currentMinutes < 19 * 60) {
    // Find a slot in afternoon or evening (moderate/low energy zone)
    const preferredStart = Math.max(currentMinutes, 16 * 60);
    const slot = findFreeSlot(preferredStart, 30, allBlocks, dayEnd);
    if (slot && !suggestions.some((s) => s.category === 'fitness')) {
      suggestions.push({
        id: `life-suggest-fitness-${Date.now()}`,
        type: 'fitness',
        label: '💪 Exercise',
        start: toHHMM(slot.start),
        end: toHHMM(slot.end),
        category: 'fitness',
        reason: 'No exercise scheduled today — even 30 min makes a difference',
        icon: '💪',
        color: '#6fcf97',
        activityId: 'fitness-gym',
      });
    }
  }

  // Rule 6: Evening review
  const hasEveningReview = hasBlockLike(allBlocks, (b) => {
    const label = b.label?.toLowerCase() ?? '';
    return (label.includes('review') || label.includes('🌙')) && toMinutes(b.start) >= 19 * 60;
  });
  if (!hasEveningReview && currentMinutes < 21 * 60) {
    const slot = findFreeSlot(Math.max(currentMinutes, 20 * 60), 15, allBlocks, 22 * 60);
    if (slot) {
      suggestions.push({
        id: `life-suggest-evening-${Date.now()}`,
        type: 'life',
        label: '🌙 Evening Review',
        start: toHHMM(slot.start),
        end: toHHMM(slot.end),
        category: 'planning',
        reason: 'Reflect on today, set tomorrow\'s intent',
        icon: '🌙',
        color: '#a78bfa',
        activityId: 'planning-evening',
      });
    }
  }

  // Rule: Suggest reading in low-energy afternoon slot if no personal dev scheduled
  const hasPersonalDev = hasBlockLike(allBlocks, (b) => {
    const label = b.label?.toLowerCase() ?? '';
    return label.includes('reading') || label.includes('learning') || label.includes('📖') || label.includes('🎓');
  });
  if (!hasPersonalDev && currentMinutes < 20 * 60) {
    const zone = getZoneAtTime(Math.max(currentMinutes, 19 * 60), zoneMap);
    if (zone.id === 'low' || zone.id === 'recovery') {
      const slot = findFreeSlot(Math.max(currentMinutes, 19 * 60), 30, allBlocks, dayEnd);
      if (slot) {
        suggestions.push({
          id: `life-suggest-reading-${Date.now()}`,
          type: 'life',
          label: '📖 Reading',
          start: toHHMM(slot.start),
          end: toHHMM(slot.end),
          category: 'personalDev',
          reason: 'Low-energy zone — perfect for reading or learning',
          icon: '📖',
          color: '#6b7cff',
          activityId: 'dev-reading',
        });
      }
    }
  }

  return suggestions;
}

// ── Energy-Aware Department Scoring ─────────────────────────────────────────────

/**
 * Get an energy-based score modifier for a department.
 * Deep-work departments (hephaestus, nexus) are prioritized during peak/high zones.
 * Lighter departments (aureon, xenon) are prioritized during low/moderate zones.
 *
 * Returns a negative number (lower = higher priority).
 */
export function energyScoreModifier(deptId, currentZone) {
  if (!currentZone) return 0;

  const deepWorkDepts = new Set(['hephaestus', 'nexus']);
  const lightDepts = new Set(['aureon', 'xenon']);

  if (currentZone.id === 'peak' || currentZone.id === 'high') {
    if (deepWorkDepts.has(deptId)) return -150;
    if (lightDepts.has(deptId)) return 50;
  }

  if (currentZone.id === 'low' || currentZone.id === 'recovery') {
    if (lightDepts.has(deptId)) return -100;
    if (deepWorkDepts.has(deptId)) return 80;
  }

  return 0;
}
