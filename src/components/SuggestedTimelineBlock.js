const DEPT_COLORS = {
  nexus: '#6b7cff',
  hephaestus: '#22d3ee',
  xenon: '#a78bfa',
  aureon: '#34d399',
};

function SuggestedTimelineBlock({ block, onConfirm, onDismiss }) {
  const color = DEPT_COLORS[block.departmentId] ?? '#6b7cff';

  return (
    <div
      className={`timeline-block timeline-block-suggested urgency-${block.urgency}`}
      style={{ '--dept-color': color }}
    >
      <div className="timeline-time">{block.start}–{block.end}</div>
      <div className="timeline-content">
        <div className="timeline-title-row">
          <strong>{block.label}</strong>
          <button className="timeline-dismiss-btn" onClick={onDismiss} aria-label="Dismiss suggestion">×</button>
        </div>
        <div className="timeline-meta-stack">
          <span className="timeline-type suggested-tag">Suggested</span>
          <span className="label">{block.departmentId.toUpperCase()}</span>
        </div>
        <button className="timeline-confirm-btn" onClick={onConfirm}>✓ Confirm</button>
      </div>
    </div>
  );
}

export default SuggestedTimelineBlock;
