import { useState, useContext } from 'react';
import { DragDropContext } from '../App';

function TimelineBlock({ block, state, onRemoveBlock }) {
  const [isDragging, setIsDragging] = useState(false);
  const { onTaskDragStart, onTaskDragEnd } = useContext(DragDropContext);

  const className = ['timeline-block', `timeline-${block.type}`];
  if (state === 'current') className.push('is-current');
  if (state === 'next') className.push('is-next');
  if (state === 'past') className.push('is-past');
  if (block.fixed) className.push('is-fixed');
  if (isDragging) className.push('is-dragging');

  const canDrag = !block.fixed && state !== 'current';

  function toMinutes(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }

  const handleDragStart = (e) => {
    if (!canDrag) { e.preventDefault(); return; }
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', block.id);
    const duration = toMinutes(block.end) - toMinutes(block.start);
    onTaskDragStart(block.id, {
      type: 'block-move',
      blockId: block.id,
      title: block.label,
      blockType: block.type,
      duration,
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onTaskDragEnd();
  };

  return (
    <div
      className={className.join(' ')}
      draggable={canDrag}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={canDrag ? { cursor: 'grab' } : undefined}
    >
      <div className="timeline-time">{block.start}–{block.end}</div>
      <div className="timeline-content">
        <div className="timeline-title-row">
          <strong>{block.label}</strong>
          <div className="timeline-title-actions">
            {state === 'current' ? <span className="timeline-badge current">Now</span> : null}
            {state === 'next' ? <span className="timeline-badge next">Next</span> : null}
            {canDrag && <span className="timeline-drag-hint">⠿</span>}
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
