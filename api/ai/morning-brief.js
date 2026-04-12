'use strict';

const { callClaude, checkAiAccess } = require('../_claude');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const hasAccess = await checkAiAccess(req.headers.authorization);
  if (!hasAccess) return res.status(403).json({ error: 'Personal+ required for AI features' });

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
    return res.status(200).json({ brief });
  } catch (err) {
    console.error('[ai/morning-brief]', err.message);
    return res.status(500).json({ error: err.message });
  }
};
