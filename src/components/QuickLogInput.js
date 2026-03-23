import { useState } from 'react';

const TYPE_ICONS = { experiment: '⚗', decision: '◆', progress: '✓', note: '·' };

/**
 * QuickLogInput
 *
 * Improvement #2: always-visible log input.
 * Type anything, hit Enter. Tagged to focus project automatically.
 * No category selection. No duration widgets. No acceptance flow.
 *
 * Shows last 5 entries below the input for immediate feedback.
 *
 * Props:
 *   focusProject   — project object | null (auto-tags entries)
 *   addEntry       — addEntry(text, projectId?) from useActivityLog
 *   recentEntries  — LogEntry[] (slice of recent log)
 *   compact        — boolean — hides recent entries (for sidebar / panel use)
 */
function QuickLogInput({ focusProject, addEntry, recentEntries = [], compact = false }) {
  const [text, setText] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const trimmed = text.trim();
      if (!trimmed) return;
      addEntry(trimmed, focusProject?.id ?? null);
      setText('');
    }
    if (e.key === 'Escape') setText('');
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const recent = recentEntries.slice(0, compact ? 3 : 5);

  return (
    <div className="quick-log-container">
      <div className="quick-log-input-row">
        <input
          className="quick-log-input"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            focusProject
              ? `Log something for ${focusProject.name}… (Enter)`
              : 'Log anything… (Enter to save)'
          }
        />
      </div>

      {!compact && recent.length > 0 && (
        <div className="quick-log-recent">
          {recent.map((entry) => (
            <div key={entry.id} className={`quick-log-entry quick-log-entry-${entry.type}`}>
              <span className="quick-log-type-icon">{TYPE_ICONS[entry.type] ?? '·'}</span>
              <span className="quick-log-text">{entry.text}</span>
              <span className="quick-log-time">{formatTime(entry.timestamp)}</span>
              {entry.projectId && focusProject?.id !== entry.projectId && (
                <span className="quick-log-project-tag">{entry.projectId}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default QuickLogInput;
