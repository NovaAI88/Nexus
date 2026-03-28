const DEPT_COLORS = {
  nexus: '#6b7cff',
  hephaestus: '#22d3ee',
  xenon: '#a78bfa',
  aureon: '#34d399',
};

const LIFE_COLORS = {
  fitness: '#6fcf97',
  wellness: '#a78bfa',
  nutrition: '#f59e0b',
  personalDev: '#6b7cff',
  social: '#f472b6',
  recovery: '#22d3ee',
  planning: '#f59e0b',
  life: '#34d399',
};

function SuggestedTimelineBlock({ block, onConfirm, onDismiss }) {
  const isLife = block.source === 'life-engine';
  const color = isLife
    ? (block.color || LIFE_COLORS[block.category] || '#34d399')
    : (DEPT_COLORS[block.departmentId] ?? '#6b7cff');

  const tagLabel = isLife
    ? (block.category ?? 'life').toUpperCase()
    : (block.departmentId ?? 'work').toUpperCase();

  return (
    <div
      className={`timeline-block timeline-block-suggested${isLife ? ' timeline-block-life' : ''} urgency-${block.urgency ?? 'normal'}`}
      style={{ '--dept-color': color }}
    >
      <div className="timeline-time">{block.start}–{block.end}</div>
      <div className="timeline-content">
        <div className="timeline-title-row">
          <strong>{block.label}</strong>
          <button className="timeline-dismiss-btn" onClick={onDismiss} aria-label="Dismiss suggestion">×</button>
        </div>
        {block.reason && (
          <p className="timeline-suggestion-reason">{block.reason}</p>
        )}
        <div className="timeline-meta-stack">
          <span className={`timeline-type suggested-tag${isLife ? ' suggested-tag-life' : ''}`}>
            {isLife ? 'Balance' : 'Suggested'}
          </span>
          <span className="label">{tagLabel}</span>
        </div>
        <button className="timeline-confirm-btn" onClick={onConfirm}>✓ Confirm</button>
      </div>
    </div>
  );
}

export default SuggestedTimelineBlock;
