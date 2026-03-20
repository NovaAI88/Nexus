function TimelineBlock({ block, state }) {
  const className = ['timeline-block', `timeline-${block.type}`];

  if (state === 'current') className.push('is-current');
  if (state === 'next') className.push('is-next');
  if (state === 'past') className.push('is-past');

  return (
    <div className={className.join(' ')}>
      <div className="timeline-time">{block.start}–{block.end}</div>
      <div className="timeline-content">
        <div className="timeline-title-row">
          <strong>{block.label}</strong>
          {state === 'current' ? <span className="timeline-badge current">Now</span> : null}
          {state === 'next' ? <span className="timeline-badge next">Next</span> : null}
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
