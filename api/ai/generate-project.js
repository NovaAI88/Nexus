'use strict';

const { callClaude, checkAiAccess } = require('../_claude');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const hasAccess = await checkAiAccess(req.headers.authorization);
  if (!hasAccess) return res.status(403).json({ error: 'Personal+ required for AI features' });

  const { name = '', goal = '' } = req.body;
  if (!name.trim() || !goal.trim()) {
    return res.status(400).json({ error: 'name and goal are required' });
  }

  try {
    const raw = await callClaude({
      system: `You are a project planning assistant.
Return ONLY a JSON object: {"tasks": [{"title": "string", "estimate": 60, "dueOffsetDays": 3}], "timeline": "1–2 sentence overview"}
Rules: 5–10 tasks, logical order, estimate in minutes (30/60/90/120), dueOffsetDays 1–60. Valid JSON only.`,
      userMessage: `Project: ${name.trim()}\nGoal: ${goal.trim()}`,
      maxTokens: 1024,
    });

    let plan = { tasks: [], timeline: '' };
    try {
      const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
      plan = JSON.parse(cleaned);
      if (!Array.isArray(plan.tasks)) plan.tasks = [];
    } catch { plan = { tasks: [], timeline: 'Could not parse AI plan.' }; }

    return res.status(200).json(plan);
  } catch (err) {
    console.error('[ai/generate-project]', err.message);
    return res.status(500).json({ error: err.message });
  }
};
