'use strict';

/**
 * server/api/ai.js
 * Express router — proxies Claude API calls so the API key never reaches the frontend.
 *
 * Endpoints:
 *   POST /api/ai/morning-brief    — daily context brief
 *   POST /api/ai/daily-planner    — time-block suggestions
 *   POST /api/ai/generate-project — task list + timeline from name + goal
 *   POST /api/ai/weekly-review    — end-of-week summary
 *
 * All endpoints are gated to Personal+ (stub — always granted in Phase 1).
 */

const express = require('express');
const router = express.Router();

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';

// ── Personal+ gate stub ────────────────────────────────────────────────────────
// Always returns true in Phase 1. Replace with real tier check in a later phase.
function hasAiAccess() {
  return true;
}

// ── Core Claude call ───────────────────────────────────────────────────────────
async function callClaude({ system, userMessage, maxTokens = 512 }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured on the server.');

  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try { detail = await res.text(); } catch { /* ignore */ }
    throw new Error(`Anthropic API error: ${detail}`);
  }

  const data = await res.json();
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error('Anthropic API returned empty response');
  return text;
}

// ── POST /api/ai/morning-brief ─────────────────────────────────────────────────
router.post('/morning-brief', async (req, res) => {
  if (!hasAiAccess()) return res.status(403).json({ error: 'Personal+ required' });

  const { todayTasks = [], overdueKTasks = [], deadlines = [] } = req.body;

  const taskLines = todayTasks.length > 0
    ? todayTasks.map((t) => `- ${t.title} [${t.status}]`).join('\n')
    : 'No tasks scheduled.';

  const overdueLines = overdueKTasks.length > 0
    ? overdueKTasks.map((t) => `- ${t.title} (due ${t.dueDate})`).join('\n')
    : 'None.';

  const deadlineLines = deadlines.length > 0
    ? deadlines.map((t) => `- ${t.title} (due ${t.dueDate})`).join('\n')
    : 'None.';

  try {
    const brief = await callClaude({
      system: `You are a concise operational briefing assistant for an ambitious startup founder named Nicholas.
Write a 2–3 sentence morning brief that gives a clear picture of his day.
Be direct, practical, and motivating. Focus on what matters most.
No preamble, no greeting, no sign-off — just the brief itself.`,
      userMessage: `Today's tasks:\n${taskLines}\n\nOverdue items:\n${overdueLines}\n\nUpcoming deadlines (7 days):\n${deadlineLines}`,
      maxTokens: 200,
    });
    return res.json({ brief });
  } catch (err) {
    console.error('[ai/morning-brief]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/ai/daily-planner ─────────────────────────────────────────────────
router.post('/daily-planner', async (req, res) => {
  if (!hasAiAccess()) return res.status(403).json({ error: 'Personal+ required' });

  const { unscheduledTasks = [], date = '' } = req.body;

  if (unscheduledTasks.length === 0) {
    return res.json({ suggestions: [] });
  }

  const taskLines = unscheduledTasks
    .map((t, i) => `${i + 1}. ${t.title}${t.estimate ? ` (${t.estimate}m)` : ''}`)
    .join('\n');

  try {
    const raw = await callClaude({
      system: `You are a time-blocking assistant.
Return ONLY a JSON array of time-block suggestions for today's tasks.
Format: [{"taskIndex": 0, "start": "09:00", "end": "10:00"}]
Rules: start at 09:00 or later, finish by 20:00, 30-min increments, 15-min gaps between blocks.
taskIndex is 0-based and refers to the numbered list provided.
Return only valid JSON. No explanation, no markdown, no code fences.`,
      userMessage: `Date: ${date}\nTasks:\n${taskLines}`,
      maxTokens: 512,
    });

    let suggestions = [];
    try {
      const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
      suggestions = JSON.parse(cleaned);
      if (!Array.isArray(suggestions)) suggestions = [];
    } catch {
      suggestions = [];
    }

    return res.json({ suggestions });
  } catch (err) {
    console.error('[ai/daily-planner]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/ai/generate-project ─────────────────────────────────────────────
router.post('/generate-project', async (req, res) => {
  if (!hasAiAccess()) return res.status(403).json({ error: 'Personal+ required' });

  const { name = '', goal = '' } = req.body;
  if (!name.trim() || !goal.trim()) {
    return res.status(400).json({ error: 'name and goal are required' });
  }

  try {
    const raw = await callClaude({
      system: `You are a project planning assistant.
Given a project name and goal, return ONLY a JSON object with a task list and timeline summary.
Format:
{
  "tasks": [
    {"title": "string", "estimate": 60, "dueOffsetDays": 3}
  ],
  "timeline": "1–2 sentence timeline overview"
}
Rules:
- Return 5–10 actionable tasks in logical order
- estimate is in minutes: 30, 60, 90, or 120
- dueOffsetDays is days from today (1–60)
- Tasks should be concrete and specific — avoid vague placeholders
- Return only valid JSON. No explanation, no markdown, no code fences.`,
      userMessage: `Project: ${name.trim()}\nGoal: ${goal.trim()}`,
      maxTokens: 1024,
    });

    let plan = { tasks: [], timeline: '' };
    try {
      const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
      plan = JSON.parse(cleaned);
      if (!Array.isArray(plan.tasks)) plan.tasks = [];
    } catch {
      plan = { tasks: [], timeline: 'Could not parse AI plan.' };
    }

    return res.json(plan);
  } catch (err) {
    console.error('[ai/generate-project]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/ai/weekly-review ─────────────────────────────────────────────────
router.post('/weekly-review', async (req, res) => {
  if (!hasAiAccess()) return res.status(403).json({ error: 'Personal+ required' });

  const { weekTasks = [], weekStart = '', projects = [] } = req.body;

  const total = weekTasks.length;
  const done = weekTasks.filter((t) => t.status === 'done').length;
  const rate = total > 0 ? Math.round((done / total) * 100) : 0;

  const taskSummary = total > 0
    ? `${done}/${total} tasks completed (${rate}% completion rate)`
    : 'No tasks were scheduled this week.';

  const breakdown = projects.length > 0
    ? projects.map((p) => {
        const pts = weekTasks.filter((t) => t.projectId === p.id);
        const pdone = pts.filter((t) => t.status === 'done').length;
        return `- ${p.name}: ${pdone}/${pts.length} done`;
      }).join('\n')
    : 'No project breakdown available.';

  try {
    const review = await callClaude({
      system: `You are a weekly review assistant for an ambitious startup founder named Nicholas.
Write a concise, honest review in 3–4 sentences: what was accomplished, what patterns you notice, one actionable recommendation for next week.
Be direct and specific — no fluff. No greeting, no sign-off.`,
      userMessage: `Week of ${weekStart}:\n${taskSummary}\n\nBy project:\n${breakdown}`,
      maxTokens: 200,
    });
    return res.json({ review });
  } catch (err) {
    console.error('[ai/weekly-review]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
