import { useState, useCallback } from 'react';
import { callClaude, hasApiKey } from '../core/llm/anthropicClient';
import { buildWeekPlannerSystem } from '../core/llm/weekPlannerPrompt';

/**
 * WeekChatPlanner — AI-powered natural language week planning panel.
 *
 * Nicholas describes how he wants his week structured in plain text.
 * Claude Haiku parses it and returns proposed blocks shown as ghost rows.
 * He clicks "Apply All" to confirm or "Clear" to dismiss.
 *
 * Props:
 *   date                 — Today's ISO date string (YYYY-MM-DD)
 *   projects             — Array of project objects ({ name, status, ... })
 *   weekDates            — Array of visible date strings for context
 *   weeklyProposedBlocks — { [date]: Block[] } — current proposed blocks
 *   onSetProposedBlocks  — setState fn for proposedBlocks
 *   onApplyAll           — () => void — confirm all proposed blocks
 *   onClearProposed      — () => void — clear all proposed blocks
 *   totalProposed        — number — total proposed block count
 */
function WeekChatPlanner({
  date,
  projects = [],
  weekDates = [],
  weeklyProposedBlocks = {},
  onSetProposedBlocks,
  onApplyAll,
  onClearProposed,
  totalProposed = 0,
}) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiConfigured = hasApiKey();

  // Extract project names for context
  const projectNames = projects
    .filter((p) => p.status !== 'completed')
    .map((p) => p.name);

  // AUREON deadline from generated data (read once)
  let aureonDeadline = null;
  try {
    const gen = require('../data/companyData.generated.json');
    const milestones = gen?.revenueMilestones;
    if (Array.isArray(milestones) && milestones[0]?.deadline) {
      aureonDeadline = milestones[0].deadline;
    }
  } catch { /* no generated data */ }

  const handleGenerate = useCallback(async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError(null);

    try {
      const system = buildWeekPlannerSystem({ date, projectNames, aureonDeadline });
      const text = await callClaude({ system, userMessage: input.trim() });

      // Strip markdown code fences if model adds them despite instructions
      const cleaned = text
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

      let blocks;
      try {
        blocks = JSON.parse(cleaned);
      } catch {
        throw new Error('AI returned invalid JSON. Try rephrasing your request.');
      }

      if (!Array.isArray(blocks)) {
        throw new Error('Expected a JSON array of blocks from the AI.');
      }

      // Filter to valid blocks only
      const valid = blocks.filter(
        (b) => b.date && b.type && b.label && b.start && b.end
      );

      if (valid.length === 0) {
        throw new Error('No valid blocks were returned. Try a more specific description.');
      }

      // Group by date for proposed state
      const grouped = {};
      valid.forEach((b) => {
        if (!grouped[b.date]) grouped[b.date] = [];
        grouped[b.date].push({
          ...b,
          id: `proposed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        });
      });
      onSetProposedBlocks(grouped);
    } catch (err) {
      if (err.message.includes('REACT_APP_ANTHROPIC_API_KEY')) {
        setError('API key not configured. Add REACT_APP_ANTHROPIC_API_KEY to .env and restart.');
      } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Network error — CORS may block direct API calls in dev. See anthropicClient.js for setup notes.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, loading, date, aureonDeadline, onSetProposedBlocks]);

  const handleKeyDown = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleGenerate();
    }
  }, [handleGenerate]);

  return (
    <div className="week-chat-planner">
      <div className="week-chat-planner-header">
        <span className="week-chat-planner-icon">✦</span>
        <span className="week-chat-planner-title">Plan your week</span>
        <span className="week-chat-planner-powered">Powered by Claude Haiku</span>
      </div>

      {!apiConfigured ? (
        <div className="week-chat-no-key">
          <p className="week-chat-no-key-text">
            AI week planning requires an Anthropic API key.
          </p>
          <p className="week-chat-no-key-steps">
            1. Get a key at <strong>console.anthropic.com</strong><br />
            2. Add <code>REACT_APP_ANTHROPIC_API_KEY=your-key</code> to <code>.env</code><br />
            3. Restart the dev server
          </p>
        </div>
      ) : (
        <>
          <textarea
            className="week-chat-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Gym Monday Wednesday Friday morning, deep work on NEXUS Tuesday Thursday, AUREON outreach every day 1h..."
            rows={3}
            disabled={loading}
          />

          <div className="week-chat-actions-row">
            <button
              className="week-chat-generate-btn"
              onClick={handleGenerate}
              disabled={loading || !input.trim()}
            >
              {loading ? (
                <><span className="week-chat-spinner" /> Thinking...</>
              ) : (
                'Generate Plan →'
              )}
            </button>
            <span className="week-chat-shortcut">⌘↵</span>
          </div>

          {error && (
            <div className="week-chat-error" role="alert">{error}</div>
          )}

          {totalProposed > 0 && (
            <div className="week-chat-proposed-bar">
              <span className="week-chat-proposed-count">
                {totalProposed} block{totalProposed !== 1 ? 's' : ''} proposed across{' '}
                {Object.keys(weeklyProposedBlocks).length} day{Object.keys(weeklyProposedBlocks).length !== 1 ? 's' : ''}
              </span>
              <div className="week-chat-proposed-actions">
                <button className="week-chat-apply-btn" onClick={onApplyAll}>
                  Apply All ✓
                </button>
                <button className="week-chat-clear-btn" onClick={onClearProposed}>
                  Clear ✗
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default WeekChatPlanner;
