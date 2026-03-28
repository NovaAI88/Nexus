import { useState, useRef, useCallback, useContext } from 'react';
import { DragDropContext } from '../App';

function toMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function formatMinutes(m) {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

function TimelineBlock({ block, state, onRemoveBlock, onUpdateBlock }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeEnd, setResizeEnd] = useState(null);
  const resizeRef = useRef(null);
  const { onTaskDragStart, onTaskDragEnd } = useContext(DragDropContext);

  const className = ['timeline-block', `timeline-${block.type}`];
  if (state === 'current') className.push('is-current');
  if (state === 'next') className.push('is-next');
  if (state === 'past') className.push('is-past');
  if (block.fixed) className.push('is-fixed');
  if (isDragging) className.push('is-dragging');
  if (isResizing) className.push('is-resizing');

  const canDrag = !block.fixed && state !== 'current';
  const canResize = state !== 'current' && onUpdateBlock;

  const handleDragStart = (e) => {
    if (!canDrag || isResizing) { e.preventDefault(); return; }
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

  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    const startY = e.clientY;
    const originalEnd = toMinutes(block.end);
    const startMin = toMinutes(block.start);
    const dayEnd = 22 * 60;

    setIsResizing(true);

    const handleMove = (moveEvent) => {
      const deltaY = moveEvent.clientY - startY;
      // 2px per minute
      const deltaMinutes = Math.round(deltaY / 2);
      const snapped = Math.round((originalEnd + deltaMinutes) / 15) * 15;
      // Minimum 15min block, max day end
      const clamped = Math.max(startMin + 15, Math.min(snapped, dayEnd));
      setResizeEnd(clamped);
    };

    const handleUp = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      setIsResizing(false);

      // Get the final value from the ref
      const finalEnd = resizeRef.current;
      if (finalEnd !== null && finalEnd !== originalEnd) {
        onUpdateBlock(block.id, { end: formatMinutes(finalEnd) });
      }
      setResizeEnd(null);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [block.end, block.id, block.start, onUpdateBlock]);

  // Keep ref in sync with state for use in mouseup handler
  resizeRef.current = resizeEnd;

  const displayEnd = resizeEnd !== null ? formatMinutes(resizeEnd) : block.end;
  const durationMin = toMinutes(displayEnd) - toMinutes(block.start);

  return (
    <div
      className={className.join(' ')}
      draggable={canDrag && !isResizing}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={canDrag && !isResizing ? { cursor: 'grab' } : undefined}
    >
      <div className="timeline-time">
        {block.start}–{displayEnd}
        {isResizing && <span className="timeline-resize-indicator">{durationMin}m</span>}
      </div>
      <div className="timeline-content">
        <div className="timeline-title-row">
          <strong>{block.label}</strong>
          <div className="timeline-title-actions">
            {state === 'current' ? <span className="timeline-badge current">Now</span> : null}
            {state === 'next' ? <span className="timeline-badge next">Next</span> : null}
            {canDrag && !isResizing && <span className="timeline-drag-hint">⠿</span>}
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
      {canResize && (
        <div
          className="timeline-resize-handle"
          onMouseDown={handleResizeStart}
          title="Drag to resize"
        >
          <span className="timeline-resize-grip">⋯</span>
        </div>
      )}
    </div>
  );
}

export default TimelineBlock;
