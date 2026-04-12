'use strict';

const { callClaude, checkAiAccess } = require('../_claude');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const hasAccess = await checkAiAccess(req.headers.authorization);
  if (!hasAccess) return res.status(403).json({ error: 'Personal+ required for AI features' });

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
Write a concise, honest review in 3–4 sentences: what was accomplished, what patterns you notice, one actionable recommendation.
Be direct and specific — no fluff. No greeting, no sign-off.`,
      userMessage: `Week of ${weekStart}:\n${taskSummary}\n\nBy project:\n${breakdown}`,
      maxTokens: 200,
    });
    return res.status(200).json({ review });
  } catch (err) {
    console.error('[ai/weekly-review]', err.message);
    return res.status(500).json({ error: err.message });
  }
};
