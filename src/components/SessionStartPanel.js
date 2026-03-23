/**
 * SessionStartPanel
 *
 * Improvement #1: unified session start screen.
 * Shown on Dashboard when a focus project exists.
 * Answers the question: "where am I and what do I do next?"
 *
 * Props:
 *   focusProject     — project object (required — only shown when focus is set)
 *   department       — department object | null
 *   todayTaskCount   — number of open tasks today
 *   doneTodayCount   — number of tasks done today
 *   onGoToToday      — navigate to Today page
 *   onChangeFocus    — navigate to Hephaestus/dept to change focus
 *   logPanel         — QuickLogInput component (passed as renderable)
 */
function SessionStartPanel({
  focusProject,
  department,
  todayTaskCount,
  doneTodayCount,
  onGoToToday,
  onChangeFocus,
  logPanel,
}) {
  if (!focusProject) return null;

  const statusClass = `project-status-badge project-status-${focusProject.status}`;
  const lastUpdated = new Date(focusProject.lastUpdated);
  const daysSince = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));

  const staleness = daysSince === 0
    ? 'Updated today'
    : daysSince === 1
    ? 'Last updated yesterday'
    : `Last updated ${daysSince} days ago`;

  const isStale = daysSince >= 2;

  return (
    <div className="session-start-panel">

      {/* Staleness warning */}
      {isStale && (
        <div className="session-staleness-warning">
          ⚠ {focusProject.name} hasn't been touched in {daysSince} days
        </div>
      )}

      {/* Focus project identity */}
      <div className="session-project-header">
        <div className="session-project-identity">
          <span className="session-dept-label">{department?.label ?? '—'}</span>
          <h1 className="session-project-name">{focusProject.name}</h1>
          <div className="session-project-meta">
            <span className={statusClass}>{focusProject.status.toUpperCase()}</span>
            <span className="session-meta-sep">·</span>
            <span className="session-phase">{focusProject.phase}</span>
            <span className="session-meta-sep">·</span>
            <span className="session-staleness">{staleness}</span>
          </div>
        </div>
        <button
          className="secondary-button session-change-focus"
          onClick={onChangeFocus}
        >
          Change focus
        </button>
      </div>

      {/* Current State */}
      <div className="session-state-block">
        <div className="session-block-label">Current State</div>
        <p className="session-current-state">{focusProject.currentState}</p>
      </div>

      {/* Next Action — the most important element */}
      <div className="session-next-action-block">
        <div className="session-block-label">Next Action</div>
        <p className="session-next-action">{focusProject.nextAction}</p>
      </div>

      {/* Today summary + CTA */}
      <div className="session-day-row">
        <div className="session-day-stats">
          <span className="session-stat">
            <strong>{todayTaskCount}</strong> open today
          </span>
          {doneTodayCount > 0 && (
            <span className="session-stat session-done-stat">
              <strong>{doneTodayCount}</strong> done ✓
            </span>
          )}
        </div>
        <button className="primary-action-button session-go-today" onClick={onGoToToday}>
          Go to Today →
        </button>
      </div>

      {/* Quick log — log directly from session start */}
      {logPanel && (
        <div className="session-log-section">
          <div className="session-block-label">Quick Log</div>
          {logPanel}
        </div>
      )}

    </div>
  );
}

export default SessionStartPanel;
