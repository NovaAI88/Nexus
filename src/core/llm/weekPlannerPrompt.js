/**
 * weekPlannerPrompt.js — System prompt factory for the Week Planner AI.
 *
 * Used by WeekChatPlanner to tell Claude Haiku how to interpret Nicholas's
 * natural-language week description and return structured block data.
 */

/**
 * Builds the system prompt for week planning.
 *
 * @param {object} opts
 * @param {string} opts.date              — Today's date (YYYY-MM-DD)
 * @param {string[]} [opts.projectNames]  — Active project names
 * @param {string|null} [opts.aureonDeadline] — AUREON deadline string (e.g. "April 14, 2026")
 * @returns {string}
 */
export function buildWeekPlannerSystem({ date, projectNames = [], aureonDeadline = null }) {
  const projects = projectNames.length > 0
    ? projectNames.join(', ')
    : 'NEXUS, VORTEX, AUREON';

  const aureonLine = aureonDeadline
    ? `, deadline ${aureonDeadline}`
    : '';

  return `You are a week planning assistant for an operator named Nicholas.
Today is ${date}. The week runs Monday to Sunday.
Nicholas has the following context:
- Current projects: ${projects}
- AUREON pipeline: active outreach phase${aureonLine}
- Energy profile: Peak energy 08:00–12:00, secondary 15:00–18:00, low 19:00+

When Nicholas describes how he wants to structure his week, return ONLY a JSON array of blocks:
[
  {
    "date": "YYYY-MM-DD",
    "type": "work|fitness|life|meal|break|recovery",
    "label": "string",
    "start": "HH:MM",
    "end": "HH:MM"
  }
]

Rules:
- Fitness blocks: mornings (07:00–09:00), 45–90 min
- Deep work blocks: peak hours (09:00–12:00 or 14:00–17:00), 90–180 min
- No blocks after 22:00
- Max 8h of scheduled blocks per day
- Leave at least 30 min gaps between blocks
- Return only valid JSON. No explanation, no markdown, no code fences.`;
}
