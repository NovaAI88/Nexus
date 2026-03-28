/**
 * Chat Parser — Client-side natural language day planner
 *
 * Parses input like "3h vortex, 1h gym, dinner at 7" into scheduled blocks.
 * Pure function, zero external dependencies.
 */

// Known activity keywords → { type, duration (minutes), label }
const KNOWN_ACTIVITIES = {
  gym: { type: 'fitness', duration: 60, label: 'Gym' },
  workout: { type: 'fitness', duration: 60, label: 'Workout' },
  exercise: { type: 'fitness', duration: 60, label: 'Exercise' },
  lift: { type: 'fitness', duration: 60, label: 'Lifting' },
  run: { type: 'fitness', duration: 45, label: 'Running' },
  running: { type: 'fitness', duration: 45, label: 'Running' },
  jog: { type: 'fitness', duration: 45, label: 'Jogging' },
  cycling: { type: 'fitness', duration: 45, label: 'Cycling' },
  swim: { type: 'fitness', duration: 45, label: 'Swimming' },
  swimming: { type: 'fitness', duration: 45, label: 'Swimming' },
  walk: { type: 'fitness', duration: 30, label: 'Walk' },
  yoga: { type: 'fitness', duration: 45, label: 'Yoga' },
  stretch: { type: 'fitness', duration: 20, label: 'Stretching' },
  dinner: { type: 'meal', duration: 45, label: 'Dinner' },
  supper: { type: 'meal', duration: 45, label: 'Dinner' },
  lunch: { type: 'meal', duration: 40, label: 'Lunch' },
  breakfast: { type: 'meal', duration: 25, label: 'Breakfast' },
  eat: { type: 'meal', duration: 40, label: 'Meal' },
  break: { type: 'break', duration: 15, label: 'Break' },
  coffee: { type: 'break', duration: 15, label: 'Coffee Break' },
  tea: { type: 'break', duration: 15, label: 'Tea Break' },
  nap: { type: 'recovery', duration: 20, label: 'Nap' },
  rest: { type: 'recovery', duration: 20, label: 'Rest' },
  meditate: { type: 'life', duration: 15, label: 'Meditation' },
  meditation: { type: 'life', duration: 15, label: 'Meditation' },
  read: { type: 'life', duration: 30, label: 'Reading' },
  reading: { type: 'life', duration: 30, label: 'Reading' },
  journal: { type: 'life', duration: 20, label: 'Journaling' },
  shower: { type: 'life', duration: 15, label: 'Shower' },
  'cold shower': { type: 'recovery', duration: 10, label: 'Cold Shower' },
  plan: { type: 'life', duration: 15, label: 'Planning' },
  planning: { type: 'life', duration: 15, label: 'Planning' },
  review: { type: 'life', duration: 15, label: 'Review' },
};

// Department aliases → departmentId
const DEPT_ALIASES = {
  vortex: 'hephaestus',
  hephaestus: 'hephaestus',
  build: 'hephaestus',
  engineering: 'hephaestus',
  nexus: 'nexus',
  product: 'nexus',
  xenon: 'xenon',
  content: 'xenon',
  marketing: 'xenon',
  growth: 'xenon',
  aureon: 'aureon',
  sales: 'aureon',
  outreach: 'aureon',
  leads: 'aureon',
};

const DEPT_LABELS = {
  hephaestus: 'VORTEX',
  nexus: 'NEXUS',
  xenon: 'XENON',
  aureon: 'AUREON',
};

function formatTime(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

/**
 * Parse a single directive token into a block descriptor.
 * Returns { type, label, duration, fixedStart?, departmentId? } or null.
 */
function parseDirective(token) {
  const trimmed = token.trim().toLowerCase();
  if (!trimmed) return null;

  // 1. Check for time anchor: "at 7", "at 19:00", "@7pm", "at 7:30 pm"
  const timeMatch = trimmed.match(/(?:at|@)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  let fixedStart = null;
  let labelPart = trimmed;

  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const min = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const ampm = timeMatch[3]?.toLowerCase();
    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;
    // If no am/pm and hour <= 6, assume PM (e.g., "at 7" = 19:00)
    if (!ampm && hour >= 1 && hour <= 6) hour += 12;
    fixedStart = hour * 60 + min;
    // Remove the time part from the label
    labelPart = trimmed.replace(/(?:at|@)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?/i, '').trim();
  }

  // 2. Check for duration: "3h", "3 hours", "45min", "1.5h", "90m"
  const durationMatch = labelPart.match(/^(\d+(?:\.\d+)?)\s*h(?:ours?|r(?:s)?)?\s*(?:on|of|for)?\s*(.*)$/i)
    || labelPart.match(/^(\d+)\s*m(?:in(?:utes?)?)?\s*(?:on|of|for)?\s*(.*)$/i);

  let duration = null;
  if (durationMatch) {
    const num = parseFloat(durationMatch[1]);
    // Check if it's hours or minutes based on original match
    if (/h/i.test(labelPart)) {
      duration = Math.round(num * 60);
    } else {
      duration = Math.round(num);
    }
    labelPart = durationMatch[2]?.trim() || '';
  }

  // 3. Check label against known activities
  const activityKey = Object.keys(KNOWN_ACTIVITIES).find((key) =>
    labelPart === key || labelPart.startsWith(key + ' ') || labelPart.endsWith(' ' + key)
  );

  if (activityKey) {
    const activity = KNOWN_ACTIVITIES[activityKey];
    return {
      type: activity.type,
      label: activity.label,
      duration: duration || activity.duration,
      fixedStart,
      departmentId: null,
    };
  }

  // 4. Check label against department aliases
  const deptKey = Object.keys(DEPT_ALIASES).find((key) =>
    labelPart === key || labelPart.includes(key)
  );

  if (deptKey) {
    const departmentId = DEPT_ALIASES[deptKey];
    const deptLabel = DEPT_LABELS[departmentId] || deptKey.toUpperCase();
    // Use the remaining label or default to department name
    const customLabel = labelPart.replace(new RegExp(deptKey, 'i'), '').trim();
    return {
      type: 'work',
      label: customLabel ? `${deptLabel}: ${customLabel}` : deptLabel,
      duration: duration || 60,
      fixedStart,
      departmentId,
    };
  }

  // 5. If we have a duration but no recognized label, use the raw text
  if (duration && labelPart) {
    return {
      type: 'work',
      label: capitalize(labelPart),
      duration,
      fixedStart,
      departmentId: null,
    };
  }

  // 6. If we only have a time anchor with a label
  if (fixedStart !== null && labelPart) {
    // Check known activities again with the cleaned label
    const actKey2 = Object.keys(KNOWN_ACTIVITIES).find((key) => labelPart.includes(key));
    if (actKey2) {
      const act = KNOWN_ACTIVITIES[actKey2];
      return { type: act.type, label: act.label, duration: act.duration, fixedStart, departmentId: null };
    }
    return {
      type: 'life',
      label: capitalize(labelPart),
      duration: 30,
      fixedStart,
      departmentId: null,
    };
  }

  // 7. Last resort: try the whole trimmed token as a known activity
  const wholeMatch = Object.keys(KNOWN_ACTIVITIES).find((key) => trimmed.includes(key));
  if (wholeMatch) {
    const act = KNOWN_ACTIVITIES[wholeMatch];
    return { type: act.type, label: act.label, duration: duration || act.duration, fixedStart, departmentId: null };
  }

  // Unrecognized
  return null;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Schedule parsed directives into free gaps.
 *
 * @param {Array} directives - parsed directive objects
 * @param {Array} freeGaps - [{ start: minutes, end: minutes }]
 * @param {number} currentMinutes - current time in minutes
 * @returns {{ blocks: Array, unscheduled: Array }}
 */
function scheduleDirectives(directives, freeGaps, currentMinutes) {
  const blocks = [];
  const unscheduled = [];

  // Separate fixed-time and floating directives
  const fixed = directives.filter((d) => d.fixedStart !== null);
  const floating = directives.filter((d) => d.fixedStart === null);

  // Schedule fixed blocks first
  for (const dir of fixed) {
    const snapStart = Math.round(dir.fixedStart / 15) * 15;
    const end = snapStart + dir.duration;
    blocks.push({
      ...dir,
      start: formatTime(snapStart),
      end: formatTime(Math.min(end, 22 * 60)),
    });
  }

  // Build occupied ranges from fixed blocks
  const occupied = blocks.map((b) => ({
    start: toMin(b.start),
    end: toMin(b.end),
  }));

  // Schedule floating blocks into gaps
  // Merge free gaps with occupied exclusions
  const availableGaps = [];
  for (const gap of freeGaps) {
    let cursor = Math.max(gap.start, currentMinutes);
    // Sort occupied within this gap
    const overlaps = occupied
      .filter((o) => o.start < gap.end && o.end > gap.start)
      .sort((a, b) => a.start - b.start);

    for (const occ of overlaps) {
      if (cursor < occ.start) {
        availableGaps.push({ start: cursor, end: occ.start });
      }
      cursor = Math.max(cursor, occ.end);
    }
    if (cursor < gap.end) {
      availableGaps.push({ start: cursor, end: gap.end });
    }
  }

  // If no free gaps provided, use full day from current time
  const effectiveGaps = availableGaps.length > 0 ? availableGaps :
    [{ start: Math.max(currentMinutes, 7 * 60), end: 22 * 60 }];

  let gapIdx = 0;
  let gapCursor = effectiveGaps[0]?.start || currentMinutes;

  for (const dir of floating) {
    let placed = false;
    while (gapIdx < effectiveGaps.length) {
      const gap = effectiveGaps[gapIdx];
      const snapStart = Math.ceil(Math.max(gapCursor, gap.start) / 15) * 15;
      if (snapStart + dir.duration <= gap.end) {
        blocks.push({
          ...dir,
          start: formatTime(snapStart),
          end: formatTime(snapStart + dir.duration),
        });
        gapCursor = snapStart + dir.duration;
        placed = true;
        break;
      }
      gapIdx++;
      if (gapIdx < effectiveGaps.length) {
        gapCursor = effectiveGaps[gapIdx].start;
      }
    }
    if (!placed) {
      unscheduled.push(dir);
    }
  }

  // Sort all blocks by start time
  blocks.sort((a, b) => toMin(a.start) - toMin(b.start));

  return { blocks, unscheduled };
}

function toMin(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Main entry point: parse natural language input into scheduled blocks.
 *
 * @param {string} input - e.g. "3h vortex, 1h gym, dinner at 7"
 * @param {object} context - { date, currentMinutes, freeGaps, departments }
 * @returns {{ blocks: Array, errors: string[] }}
 */
export function parseChatInput(input, context) {
  const { currentMinutes = 0, freeGaps = [] } = context || {};

  // Split on commas, semicolons, "then", "and then"
  const tokens = input
    .split(/[,;]|\bthen\b|\band\s+then\b/i)
    .map((t) => t.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    return { blocks: [], errors: ['Nothing to parse. Try something like "3h vortex, gym, dinner at 7"'] };
  }

  // Check for meta commands
  const lower = input.toLowerCase().trim();
  if (lower === 'plan my day' || lower === 'plan today' || lower === 'auto plan') {
    return { blocks: [], errors: [], meta: 'plan-day' };
  }
  if (lower === 'plan my week' || lower === 'plan week') {
    return { blocks: [], errors: [], meta: 'plan-week' };
  }

  const directives = [];
  const errors = [];

  for (const token of tokens) {
    const parsed = parseDirective(token);
    if (parsed) {
      directives.push(parsed);
    } else {
      errors.push(`Could not parse: "${token}"`);
    }
  }

  if (directives.length === 0) {
    return { blocks: [], errors: errors.length > 0 ? errors : ['No recognizable items found.'] };
  }

  const { blocks, unscheduled } = scheduleDirectives(directives, freeGaps, currentMinutes);

  for (const u of unscheduled) {
    errors.push(`No free slot for: ${u.label} (${u.duration}min)`);
  }

  // Add unique IDs
  const result = blocks.map((b, i) => ({
    id: `chat-${Date.now()}-${i}`,
    type: b.type,
    label: b.label,
    start: b.start,
    end: b.end,
    departmentId: b.departmentId || null,
    duration: b.duration,
  }));

  return { blocks: result, errors };
}

export default parseChatInput;
