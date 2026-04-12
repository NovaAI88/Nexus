'use strict';

const { callClaude, checkAiAccess } = require('../_claude');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const hasAccess = await checkAiAccess(req.headers.authorization);
  if (!hasAccess) return res.status(403).json({ error: 'Personal+ required for AI features' });

  const { unscheduledTasks = [], date = '' } = req.body;

  if (unscheduledTasks.length === 0) {
    return res.status(200).json({ suggestions: [] });
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
taskIndex is 0-based. Return only valid JSON. No explanation, no markdown, no code fences.`,
      userMessage: `Date: ${date}\nTasks:\n${taskLines}`,
      maxTokens: 512,
    });

    let suggestions = [];
    try {
      const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
      suggestions = JSON.parse(cleaned);
      if (!Array.isArray(suggestions)) suggestions = [];
    } catch { suggestions = []; }

    return res.status(200).json({ suggestions });
  } catch (err) {
    console.error('[ai/daily-planner]', err.message);
    return res.status(500).json({ error: err.message });
  }
};
