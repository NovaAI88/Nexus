import { useState } from 'react';

const DEPT_COLORS = {
  nexus: '#6b7cff',
  hephaestus: '#22d3ee',
  xenon: '#a78bfa',
  aureon: '#34d399',
};

function PrimaryActionBanner({ action, reasoning, onSchedule, onSkip }) {
  const [animating] = useState(false);

  if (!action) {
    return (
      <div className="primary-action-banner primary-action-banner-empty">
        <span className="label">System Ready</span>
        <p>{reasoning || 'No priority action detected.'}</p>
      </div>
    );
  }

  const color = DEPT_COLORS[action.departmentId] ?? '#6b7cff';
  const urgencyClass = `primary-action-urgency-${action.urgency}`;

  return (
    <div
      className={`primary-action-banner ${urgencyClass} ${animating ? 'is-updating' : ''}`}
      style={{ '--dept-color': color }}
    >
      <div className="primary-action-meta">
        <span className="label primary-action-dept">{action.description}</span>
        <span className={`primary-action-urgency-badge urgency-${action.urgency}`}>
          {action.urgency.toUpperCase()}
        </span>
      </div>
      <p className="primary-action-title">{action.title}</p>
      <div className="primary-action-controls">
        <button className="primary-action-schedule-btn" onClick={onSchedule}>Schedule Now</button>
        <button className="primary-action-skip-btn" onClick={onSkip}>Skip</button>
      </div>
    </div>
  );
}

export default PrimaryActionBanner;
