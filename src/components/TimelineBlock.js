function TimelineBlock({ block, state, onRemoveBlock }) {
  const className = ['timeline-block', `timeline-${block.type}`];

  if (state === 'current') className.push('is-current');
  if (state === 'next') className.push('is-next');
  if (state === 'past') className.push('is-past');
  if (block.fixed) className.push('is-fixed');

  return (
    <div className={className.join(' ')}>
      <div className="timeline-time">{block.start}–{block.end}</div>
      <div className="timeline-content">
        <div className="timeline-title-row">
          <strong>{block.label}</strong>
          <div className="timeline-title-actions">
            {state === 'current' ? <span className="timeline-badge current">Now</span> : null}
            {state === 'next' ? <span className="timeline-badge next">Next</span> : null}
            {!block.fixed ? (
              <button
                type="button"
                className="timeline-remove-button"
                onClick={() => onRemoveBlock(block.id)}
                aria-label={`Remove ${block.label}`}
              >
                ×
              </button>
            ) : null}
          </div>
        </div>
        <div className="timeline-meta-stack">
          <span className="timeline-type">{block.type}</span>
          {block.taskTitle ? <div className="timeline-linked-task">Task · {block.taskTitle}</div> : null}
        </div>
      </div>
    </div>
  );
}

export default TimelineBlock;
