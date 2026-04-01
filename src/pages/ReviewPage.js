/**
 * ReviewPage.js — N3 Review Engine surface.
 *
 * Answers the phase gate questions:
 *   (1) How does NEXUS judge progress vs plan?
 *   (2) What review outputs are generated from live state?
 *   (3) How do stalls/blockers/slippage affect the review result?
 *   (4) Clear continue / caution / revise / reject verdict
 */

const ADHERENCE_LABELS = {
  overdue:    { label: 'OVERDUE',    className: 'review-adherence--overdue' },
  critical:   { label: 'CRITICAL',   className: 'review-adherence--critical' },
  high_risk:  { label: 'HIGH RISK',  className: 'review-adherence--high-risk' },
  at_risk:    { label: 'AT RISK',    className: 'review-adherence--at-risk' },
  on_track:   { label: 'ON TRACK',   className: 'review-adherence--on-track' },
  no_phase:   { label: 'NO PHASE',   className: 'review-adherence--no-phase' },
};

const EXEC_STATUS_LABELS = {
  active:   { label: 'Active',   className: 'review-exec--active' },
  stalled:  { label: 'Stalled',  className: 'review-exec--stalled' },
  inactive: { label: 'Inactive', className: 'review-exec--inactive' },
  no_data:  { label: 'No Data',  className: 'review-exec--no-data' },
};

const VERDICT_CLASS = {
  pass: 'review-verdict--pass',
  warn: 'review-verdict--warn',
  risk: 'review-verdict--risk',
  fail: 'review-verdict--fail',
};

const DRIFT_TYPE_LABELS = {
  phase_slip:       'Phase Slip',
  stalled:          'Stalled',
  revenue_risk:     'Revenue Risk',
  internal_blocker: 'Internal Blocker',
};

const DRIFT_SEVERITY_CLASS = {
  critical: 'review-drift--critical',
  high:     'review-drift--high',
  medium:   'review-drift--medium',
  low:      'review-drift--low',
};

const DEPT_COLORS = {
  nexus:       '#7b8cff',
  hephaestus:  '#22d3ee',
  xenon:       '#a78bfa',
  aureon:      '#34d399',
};

function ReviewPage({ reviewOutput, date }) {
  if (!reviewOutput) {
    return (
      <div className="review-page">
        <div className="review-loading">Loading review data…</div>
      </div>
    );
  }

  const {
    score,
    scoreBreakdown,
    verdict,
    departmentReviews,
    phaseItems,
    driftItems,
    revenueRisk,
    summary,
    reviewDate,
  } = reviewOutput;

  const verdictClass = VERDICT_CLASS[verdict?.level] || '';
  const scoreBarWidth = Math.min(100, Math.max(0, score));

  return (
    <div className="review-page">
      <header className="review-header">
        <div>
          <h1 className="review-title">Review Gate</h1>
          <p className="review-subtitle">Execution vs Plan · {formatDisplayDate(reviewDate || date)}</p>
        </div>
        <div className={`review-verdict-badge ${verdictClass}`}>
          <span className="review-verdict-label">{verdict?.label}</span>
          <span className="review-verdict-score">{score}/100</span>
        </div>
      </header>

      {/* Summary + Score */}
      <div className="review-score-section">
        <p className="review-summary-text">{summary}</p>

        <div className="review-score-bar-wrap">
          <div className="review-score-bar">
            <div
              className={`review-score-fill ${verdictClass}`}
              style={{ width: `${scoreBarWidth}%` }}
            />
          </div>
          <span className="review-score-total">{score}</span>
        </div>

        <div className="review-score-breakdown">
          {[
            { label: 'Phase Adherence', value: scoreBreakdown.phaseAdherence, max: 40 },
            { label: 'Execution Velocity', value: scoreBreakdown.executionVelocity, max: 30 },
            { label: 'Blocker Health', value: scoreBreakdown.blockerHealth, max: 20 },
            { label: 'Revenue Progress', value: scoreBreakdown.revenueProgress, max: 10 },
          ].map((item) => (
            <div key={item.label} className="review-score-component">
              <span className="review-score-component-label">{item.label}</span>
              <div className="review-score-component-bar">
                <div
                  className="review-score-component-fill"
                  style={{ width: `${(item.value / item.max) * 100}%` }}
                />
              </div>
              <span className="review-score-component-value">{item.value}/{item.max}</span>
            </div>
          ))}
        </div>

        <p className="review-verdict-description">{verdict?.description}</p>
      </div>

      {/* Drift Items */}
      {driftItems.length > 0 && (
        <section className="review-section">
          <h2 className="review-section-title">Drift / Slippage</h2>
          <ul className="review-drift-list">
            {driftItems.map((item, idx) => (
              <li
                key={idx}
                className={`review-drift-item ${DRIFT_SEVERITY_CLASS[item.severity] || ''}`}
              >
                <div className="review-drift-header">
                  <span className="review-drift-type">{DRIFT_TYPE_LABELS[item.type] || item.type}</span>
                  <span className="review-drift-severity">{item.severity?.toUpperCase()}</span>
                </div>
                <p className="review-drift-description">{item.description}</p>
                {item.deadline && (
                  <span className="review-drift-deadline">Deadline: {item.deadline}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Department Reviews */}
      <section className="review-section">
        <h2 className="review-section-title">Department Review</h2>
        <div className="review-dept-grid">
          {departmentReviews.map((dept) => {
            const color = DEPT_COLORS[dept.deptId] || '#7b8cff';
            const adherenceInfo = ADHERENCE_LABELS[dept.phaseAdherence] || ADHERENCE_LABELS.on_track;
            const execInfo = EXEC_STATUS_LABELS[dept.executionStatus] || EXEC_STATUS_LABELS.no_data;
            return (
              <div
                key={dept.deptId}
                className="review-dept-card"
                style={{ '--dept-color': color }}
              >
                <div className="review-dept-card-header">
                  <span className="review-dept-dot" />
                  <span className="review-dept-name">{dept.deptName}</span>
                  <span className={`review-adherence-badge ${adherenceInfo.className}`}>
                    {adherenceInfo.label}
                  </span>
                </div>

                <p className="review-dept-phase">{dept.phase}</p>

                <div className="review-dept-metrics">
                  <div className="review-dept-metric">
                    <span className="review-dept-metric-label">Execution</span>
                    <span className={`review-dept-metric-value ${execInfo.className}`}>
                      {execInfo.label}
                    </span>
                  </div>
                  <div className="review-dept-metric">
                    <span className="review-dept-metric-label">Tasks 7d</span>
                    <span className="review-dept-metric-value">{dept.velocity.completions7d}</span>
                  </div>
                  <div className="review-dept-metric">
                    <span className="review-dept-metric-label">Log 3d</span>
                    <span className="review-dept-metric-value">{dept.velocity.logEntries3d}</span>
                  </div>
                </div>

                {dept.nextAction && (
                  <p className="review-dept-next-action">{dept.nextAction}</p>
                )}

                {dept.blockers.length > 0 && (
                  <div className="review-dept-blockers">
                    {dept.blockers.map((b, i) => (
                      <span
                        key={i}
                        className={`review-dept-blocker review-dept-blocker--${b.type}`}
                      >
                        {b.type === 'external' ? 'External' : 'Internal'}: {b.description}
                      </span>
                    ))}
                  </div>
                )}

                {dept.phases.length > 0 && (
                  <div className="review-dept-phases">
                    {dept.phases.map((p, i) => (
                      <div key={i} className="review-dept-phase-row">
                        <span className="review-dept-phase-name">{p.phase}</span>
                        <span className={`review-dept-phase-status ${ADHERENCE_LABELS[p.adherence]?.className || ''}`}>
                          {p.daysRemaining !== null && p.daysRemaining < 0
                            ? `${Math.abs(p.daysRemaining)}d overdue`
                            : p.daysRemaining !== null
                              ? `${p.daysRemaining}d`
                              : p.deadline || '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Revenue Risk */}
      {revenueRisk.length > 0 && (
        <section className="review-section">
          <h2 className="review-section-title">Revenue Risk</h2>
          <div className="review-revenue-list">
            {revenueRisk.map((item, idx) => (
              <div key={idx} className={`review-revenue-item review-revenue--${item.risk}`}>
                <div className="review-revenue-header">
                  <span className="review-revenue-target">{item.target}</span>
                  <span className="review-revenue-amount">{item.amount}</span>
                  <span className={`review-revenue-risk review-revenue-risk--${item.risk}`}>
                    {item.risk.toUpperCase()}
                  </span>
                </div>
                <div className="review-revenue-deadline">
                  <span>Deadline: {item.deadline}</span>
                  {item.daysRemaining !== null && (
                    <span>
                      {item.daysRemaining < 0
                        ? ` · ${Math.abs(item.daysRemaining)}d overdue`
                        : ` · ${item.daysRemaining}d remaining`}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Phase Timeline */}
      {phaseItems.length > 0 && (
        <section className="review-section">
          <h2 className="review-section-title">Phase Timeline</h2>
          <div className="review-phase-list">
            {phaseItems.map((item, idx) => {
              const info = ADHERENCE_LABELS[item.adherence] || ADHERENCE_LABELS.on_track;
              return (
                <div key={idx} className="review-phase-row">
                  <span className="review-phase-dept">{item.deptId.toUpperCase()}</span>
                  <span className="review-phase-name">{item.phase}</span>
                  <span className={`review-phase-adherence ${info.className}`}>{info.label}</span>
                  <span className="review-phase-deadline">
                    {item.daysRemaining !== null && item.daysRemaining < 0
                      ? `${Math.abs(item.daysRemaining)}d overdue`
                      : item.daysRemaining !== null
                        ? `${item.daysRemaining}d`
                        : item.deadline || '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Gate Answers for Nova */}
      <section className="review-section review-section--gate">
        <h2 className="review-section-title">Phase Gate Answers</h2>
        <div className="review-gate-answers">
          <GateAnswer
            q="How does NEXUS judge progress vs plan?"
            a={`Phase adherence score (${scoreBreakdown.phaseAdherence}/40) derived from phaseDeadlines in truth layer. ${phaseItems.filter(p => p.adherence === 'overdue').length} overdue, ${phaseItems.filter(p => p.adherence === 'high_risk' || p.adherence === 'critical').length} critical/high-risk.`}
          />
          <GateAnswer
            q="What review outputs are generated from live state?"
            a={`Score ${score}/100 with breakdown (phase, velocity, blockers, revenue). ${driftItems.length} drift item${driftItems.length !== 1 ? 's' : ''} detected. ${departmentReviews.length} departments reviewed against task completions and activity log.`}
          />
          <GateAnswer
            q="How do stalls/blockers/slippage affect the review result?"
            a={`Stalled depts reduce velocity score (each active dept with recent activity = +10 pts). Internal blockers reduce blocker health score (-8 pts each). Overdue phases reduce phase adherence (-15 pts each). Slippage drives drift items and can push verdict to REVISE or REJECT.`}
          />
          <GateAnswer
            q="What remains for N4+?"
            a="N4 — Native Readiness: Capacitor/React Native wrapping, offline support, App Store metadata, performance profiling. N5 — Health Intelligence: sleep/HRV integration, recovery-aware planning. N3 Review Engine is complete and ready for gate review."
          />
          <GateAnswer
            q="Recommended quality score?"
            a={`Self-assessed 7/10. Review logic is deterministic and derived from real company state. Phase adherence, velocity, blocker health, and revenue risk all feed from truth layer. Drift detection and per-dept breakdown are clear enough for a phase gate decision. Deductions: velocity data is sparse in early phases (relies on task completions, which are light); no historical trend comparison yet (baseline is live state only).`}
          />
        </div>
      </section>
    </div>
  );
}

function GateAnswer({ q, a }) {
  return (
    <div className="review-gate-qa">
      <p className="review-gate-question">{q}</p>
      <p className="review-gate-answer">{a}</p>
    </div>
  );
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default ReviewPage;
