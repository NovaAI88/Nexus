import { useContext, useMemo } from 'react';
import { DragDropContext } from '../App';
import SectionCard from './SectionCard';
import TimelineBlock from './TimelineBlock';

function TimelinePanel({ blocks, currentTime, currentBlockId, nextBlockId, onAddBlock, onRemoveBlock }) {
  const {
    draggedTaskId,
    dragPayload,
    dragOverMinutes,
    canDropTaskAtMinutes,
    onTimelineDragOver,
    onTimelineDragLeave,
    onTimelineDrop,
  } = useContext(DragDropContext);

  const dropSlots = useMemo(() => {
    const slots = [];
    const dayStart = 7 * 60;
    const dayEnd = 22 * 60;
    for (let minutes = dayStart; minutes <= dayEnd - 15; minutes += 15) {
      slots.push(minutes);
    }
    return slots;
  }, []);

  return (
    <SectionCard title="Timeline">
      <div className="timeline-panel">
        <div className="timeline-now-marker">
          <span className="label">Current Time</span>
          <strong>{currentTime}</strong>
        </div>

        {/* Drop zone grid — visible only when dragging */}
        {draggedTaskId && (
          <div className="timeline-drop-slots">
            {dropSlots.map((slotMinutes) => {
              const isActive = dragOverMinutes === slotMinutes;
              const duration = dragPayload?.duration || 30;
              const canDrop = draggedTaskId ? canDropTaskAtMinutes(slotMinutes, duration) : false;
              const timeLabel = `${String(Math.floor(slotMinutes / 60)).padStart(2, '0')}:${String(slotMinutes % 60).padStart(2, '0')}`;
              return (
                <button
                  key={`drop-slot-${slotMinutes}`}
                  type="button"
                  className={[
                    'timeline-drop-slot',
                    draggedTaskId ? 'is-visible' : '',
                    isActive && canDrop ? 'is-active' : '',
                    isActive && !canDrop ? 'is-invalid' : ''
                  ].filter(Boolean).join(' ')}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
                    onTimelineDragOver(slotMinutes);
                  }}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    onTimelineDragOver(slotMinutes);
                  }}
                  onDragLeave={() => {
                    if (isActive) onTimelineDragLeave();
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    onTimelineDrop(slotMinutes);
                  }}
                  aria-label={`Drop at ${timeLabel}`}
                >
                  {isActive && <span className="drop-slot-time-hint">{timeLabel}</span>}
                </button>
              );
            })}
          </div>
        )}

        <div className="timeline-surface">
          <div className="timeline-list">
            {blocks.map((block) => {
              let state = 'upcoming';
              if (block.id === currentBlockId) state = 'current';
              else if (block.id === nextBlockId) state = 'next';
              else if (block._isPast) state = 'past';

              return <TimelineBlock key={block.id} block={block} state={state} onRemoveBlock={onRemoveBlock} />;
            })}
          </div>
        </div>

        <button className="timeline-add-button" onClick={onAddBlock}>Add Block</button>
      </div>
    </SectionCard>
  );
}

export default TimelinePanel;
