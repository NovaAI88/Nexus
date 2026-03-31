import TypewriterText from '../components/TypewriterText';
import HealthDashboardCard from '../components/HealthDashboardCard';

const DEPT_COLORS = {
  nexus: '#7b8cff',
  hephaestus: '#22d3ee',
  xenon: '#a78bfa',
  aureon: '#34d399',
};

function OverviewPage({
  date,
  currentTime,
  currentZone,
  scheduleBlocks,
  todayTasks,
  doneTodayCount,
  openTodayCount,
  sessionBudgetText,
  departmentQueue,
  engineReasoning,
  weekHoursWorked,
  weekHoursTarget,
  pipelineStats,
  healthData,
  // N1: truth-layer data
  nextActions,
  revenueMilestones,
  phaseDeadlines,
  onNavigate,
}) {
  const hour = parseInt(currentTime?.split(':')[0] || '12', 10);
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const nextBlocks = (scheduleBlocks || [])
    .filter((b) => !b._isPast)
    .slice(0, 3);

  const weekPct = weekHoursTarget > 0
    ? Math.min(Math.round((weekHoursWorked / weekHoursTarget) * 100), 100)
    : 0;

  // Top 3 next actions from truth layer (exclude stale VORTEX-only entries if irrelevant)
  const topNextActions = (nextActions || []).slice(0, 3);

  // Active AUREON revenue milestone
  const aureonMilestone = (revenueMilestones || []).find(
    (m) => m.target?.includes('AUREON') && m.status?.toLowerCase().includes('progress')
  );

  // N1 phase deadline
  const n1Phase = (phaseDeadlines?.nexus || []).find((p) => p.phase?.startsWith('N1'));

  return (
    <div className="overview-page">
      <header className="overview-header">
        <div>
          <h1 className="overview-greeting">{greeting}, Nicholas</h1>
          <p className="overview-date">{formatDisplayDate(date)}</p>
        </div>
        <span className="overview-time">{currentTime}</span>
      </header>

      {/* Engine reasoning */}
      {engineReasoning && (
        <div className="overview-reasoning">
          <span className="overview-reasoning-dot" />
          <TypewriterText text={engineReasoning} speed={20} />
        </div>
      )}

      {/* Dashboard grid */}
      <div className="overview-grid">

        {/* Daily Summary */}
        <div className="overview-card overview-card-daily">
          <h3 className="overview-card-title">Today</h3>
          <div className="overview-stat-row">
            <div className="overview-stat">
              <span className="overview-stat-value">{scheduleBlocks?.length || 0}</span>
              <span className="overview-stat-label">Blocks</span>
            </div>
            <div className="overview-stat">
              <span className="overview-stat-value">{doneTodayCount}</span>
              <span className="overview-stat-label">Done</span>
            </div>
            <div className="overview-stat">
              <span className="overview-stat-value">{openTodayCount}</span>
              <span className="overview-stat-label">Open</span>
            </div>
          </div>
          <span className="overview-card-meta">{sessionBudgetText}</span>
          {currentZone && (
            <div className="overview-zone-indicator" style={{ '--zone-color': currentZone.color }}>
              <span className="overview-zone-dot" />
              {currentZone.label} energy
            </div>
          )}
        </div>

        {/* Weekly Progress */}
        <div className="overview-card overview-card-weekly">
          <h3 className="overview-card-title">This Week</h3>
          <div className="overview-progress-ring-wrap">
            <svg className="overview-progress-ring" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <circle
                cx="40" cy="40" r="34"
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${(weekPct / 100) * 213.6} 213.6`}
                transform="rotate(-90 40 40)"
                style={{ transition: 'stroke-dasharray 0.6s ease' }}
              />
            </svg>
            <span className="overview-ring-label">{weekPct}%</span>
          </div>
          <span className="overview-card-meta">
            {weekHoursWorked.toFixed(1)}h / {weekHoursTarget}h target
          </span>
        </div>

        {/* Health & Activity */}
        <div className="overview-card overview-card-health">
          <HealthDashboardCard healthData={healthData} />
        </div>

        {/* Department Health — from real company state via useCompanyState + useExecutionEngine */}
        {(departmentQueue || []).map((dept) => {
          const color = DEPT_COLORS[dept.id] || '#7b8cff';
          return (
            <div key={dept.id} className="overview-card overview-card-dept" style={{ '--dept-color': color }}>
              <div className="overview-dept-header">
                <span className="overview-dept-dot" />
                <h3 className="overview-card-title">{dept.name}</h3>
                <span className={`urgency-badge urgency-${dept.urgency}`}>
                  {dept.urgency?.toUpperCase()}
                </span>
              </div>
              <p className="overview-dept-phase">{dept.phase}</p>
              <p className="overview-dept-action">{dept.nextAction}</p>
            </div>
          );
        })}

        {/* N1 Company Intelligence — Next Actions from truth layer */}
        {topNextActions.length > 0 && (
          <div className="overview-card overview-card-next-actions">
            <h3 className="overview-card-title">Next Actions</h3>
            <ol className="overview-next-actions-list">
              {topNextActions.map((action) => (
                <li key={action.priority} className="overview-next-action-item">
                  <span className="overview-next-action-text">{stripMarkdown(action.title)}</span>
                </li>
              ))}
            </ol>
            <span className="overview-card-meta">From truth layer · 05_shared/03_NEXT_ACTIONS.md</span>
          </div>
        )}

        {/* N1 Revenue + Phase Status */}
        {(aureonMilestone || n1Phase) && (
          <div className="overview-card overview-card-phase-status">
            <h3 className="overview-card-title">Phase Status</h3>
            {aureonMilestone && (
              <div className="overview-phase-row">
                <span className="overview-phase-label">{aureonMilestone.target}</span>
                <span className="overview-phase-value">{aureonMilestone.amount}</span>
                <span className="overview-phase-deadline">by {aureonMilestone.deadline}</span>
              </div>
            )}
            {n1Phase && (
              <div className="overview-phase-row">
                <span className="overview-phase-label">{n1Phase.phase}</span>
                <span className="overview-phase-deadline">{n1Phase.start} → {n1Phase.targetEnd}</span>
              </div>
            )}
            <span className="overview-card-meta">From CALENDAR.md</span>
          </div>
        )}

        {/* Upcoming Blocks */}
        <div className="overview-card overview-card-upcoming">
          <h3 className="overview-card-title">Upcoming</h3>
          {nextBlocks.length === 0 ? (
            <p className="overview-empty">No upcoming blocks</p>
          ) : (
            <div className="overview-upcoming-list">
              {nextBlocks.map((b) => (
                <div key={b.id} className="overview-upcoming-block">
                  <span className="overview-upcoming-time">{b.start}–{b.end}</span>
                  <span className="overview-upcoming-label">{b.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pipeline Snapshot — AUREON */}
        {pipelineStats && (
          <div className="overview-card overview-card-pipeline">
            <h3 className="overview-card-title">AUREON Pipeline</h3>
            <div className="overview-stat-row">
              <div className="overview-stat">
                <span className="overview-stat-value">{pipelineStats.total}</span>
                <span className="overview-stat-label">Leads</span>
              </div>
              <div className="overview-stat">
                <span className="overview-stat-value">{pipelineStats.contacted}</span>
                <span className="overview-stat-label">Contacted</span>
              </div>
              <div className="overview-stat">
                <span className="overview-stat-value">{pipelineStats.responses}</span>
                <span className="overview-stat-label">Responses</span>
              </div>
              <div className="overview-stat">
                <span className="overview-stat-value">{pipelineStats.followUpsDue}</span>
                <span className="overview-stat-label">FU Due</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="overview-card overview-card-actions">
          <h3 className="overview-card-title">Quick Actions</h3>
          <div className="overview-actions-row">
            <button className="overview-action-btn" onClick={() => onNavigate('today')}>
              Plan Today
            </button>
            <button className="overview-action-btn" onClick={() => {
              onNavigate('today');
              setTimeout(() => window.dispatchEvent(new Event('nexus:new-task')), 100);
            }}>
              Add Task
            </button>
            <button className="overview-action-btn overview-action-primary" onClick={() => onNavigate('today')}>
              Start Focus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDisplayDate(dateStr) {
  try {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

/**
 * Strip markdown list numbering from action titles.
 * e.g. "1. VORTEX — Resume from Phase 2..." → "VORTEX — Resume from Phase 2..."
 */
function stripMarkdown(str) {
  if (!str) return '';
  return str.replace(/^\d+\.\s+/, '').replace(/\*{1,2}/g, '').trim();
}

export default OverviewPage;
