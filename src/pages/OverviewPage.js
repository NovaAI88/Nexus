import TypewriterText from '../components/TypewriterText';
import HealthDashboardCard from '../components/HealthDashboardCard';

const DEPT_COLORS = {
  nexus: '#7b8cff',
  hephaestus: '#22d3ee',
  xenon: '#a78bfa',
  aureon: '#34d399',
};

const PRIORITY_COLORS = {
  critical: '#f87171',
  high: '#fb923c',
  normal: '#60a5fa',
  low: '#9ca3af',
};

const BLOCKER_TYPE_LABEL = {
  external: 'External',
  internal: 'Internal',
};

const VERDICT_COLORS = {
  pass: '#34d399',
  warn: '#fb923c',
  risk: '#f87171',
  fail: '#ef4444',
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
  // N2: planning intelligence
  planningOutput,
  // N3: review engine
  reviewOutput,
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

        {/* N2 Planning Intelligence — Today's Execution Sequence */}
        {planningOutput?.todayRecommendations?.length > 0 && (
          <div className="overview-card overview-card-planning">
            <h3 className="overview-card-title">Today's Plan</h3>
            {planningOutput.insight && (
              <p className="overview-planning-insight">{planningOutput.insight}</p>
            )}
            <ol className="overview-planning-sequence">
              {planningOutput.todayRecommendations.map((rec) => (
                <li key={rec.departmentId} className="overview-planning-step">
                  <div className="overview-planning-step-header">
                    <span
                      className="overview-planning-step-num"
                      style={{ '--step-color': PRIORITY_COLORS[rec.priority] || '#9ca3af' }}
                    >
                      {rec.step}
                    </span>
                    <span className="overview-planning-step-dept">{rec.departmentName}</span>
                    {rec.revenueRelevant && (
                      <span className="overview-planning-revenue-badge">€</span>
                    )}
                    <span className="overview-planning-step-mins">{rec.estimatedMinutes}m</span>
                  </div>
                  <p className="overview-planning-step-action">{rec.action}</p>
                  <p className="overview-planning-step-reason">{rec.reason}</p>
                  {rec.healthNote && (
                    <p className="overview-planning-health-note">{rec.healthNote}</p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* N2 Planning Intelligence — Active Blockers */}
        {planningOutput?.blockers?.length > 0 && (
          <div className="overview-card overview-card-blockers">
            <h3 className="overview-card-title">Blockers</h3>
            <ul className="overview-blockers-list">
              {planningOutput.blockers.map((blocker, idx) => (
                <li key={`${blocker.departmentId}-${idx}`} className="overview-blocker-item">
                  <div className="overview-blocker-header">
                    <span className="overview-blocker-dept">{blocker.departmentName}</span>
                    <span className={`overview-blocker-type overview-blocker-type--${blocker.type}`}>
                      {BLOCKER_TYPE_LABEL[blocker.type] || blocker.type}
                    </span>
                  </div>
                  <p className="overview-blocker-description">{blocker.description}</p>
                  {blocker.unlockPath && (
                    <p className="overview-blocker-unlock">→ {blocker.unlockPath}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* N2 Planning Intelligence — Week Risk Items */}
        {planningOutput?.weekItems?.length > 0 && (
          <div className="overview-card overview-card-week-risk">
            <h3 className="overview-card-title">Week Deadlines</h3>
            <ul className="overview-week-risk-list">
              {planningOutput.weekItems.map((item, idx) => (
                <li key={`${item.departmentId}-${idx}`} className={`overview-week-risk-item overview-week-risk--${item.risk}`}>
                  <span className="overview-week-risk-phase">{item.phase}</span>
                  <span className="overview-week-risk-deadline">
                    {item.daysRemaining !== null && item.daysRemaining >= 0
                      ? `${item.daysRemaining}d`
                      : item.daysRemaining !== null
                        ? 'Overdue'
                        : item.deadline}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* N3 Review Gate — score widget */}
        {reviewOutput && (
          <div className="overview-card overview-card-review" style={{ '--verdict-color': VERDICT_COLORS[reviewOutput.verdict?.level] || '#7b8cff' }}>
            <div className="overview-review-header">
              <h3 className="overview-card-title">Review Gate</h3>
              <span className="overview-review-verdict-badge">
                {reviewOutput.verdict?.label}
              </span>
            </div>
            <div className="overview-review-score-row">
              <span className="overview-review-score">{reviewOutput.score}</span>
              <span className="overview-review-score-max">/100</span>
              <div className="overview-review-score-bar">
                <div
                  className="overview-review-score-fill"
                  style={{ width: `${reviewOutput.score}%`, background: 'var(--verdict-color)' }}
                />
              </div>
            </div>
            {reviewOutput.driftItems?.length > 0 && (
              <p className="overview-review-drift-count">
                {reviewOutput.driftItems.length} drift item{reviewOutput.driftItems.length !== 1 ? 's' : ''}
              </p>
            )}
            <p className="overview-review-summary">{reviewOutput.verdict?.description}</p>
            <button className="overview-action-btn overview-review-open-btn" onClick={() => onNavigate('review')}>
              Open Review
            </button>
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
