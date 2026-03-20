import { useContext, useMemo } from 'react';
import { DragDropContext } from '../App';
import SectionCard from './SectionCard';
import TimelineBlock from './TimelineBlock';

function TimelinePanel({ blocks, currentTime, currentBlockId, nextBlockId, onAddBlock }) {
  const {
    draggedTaskId,
    dragOverMinutes,
    canDropTaskAtMinutes,
    onTimelineDragOver,
    onTimelineDragLeave,
    onTimelineDrop,
  } = useContext(DragDropContext);

  const dropSlots = useMemo(() => {
    const slots = [];
    const dayStart = 7 * 60 + 30;
    const dayEnd = 22 * 60;
    for (let minutes = dayStart; minutes <= dayEnd - 30; minutes += 30) {
      slots.push(minutes);
    }
    return slots;
  }, []);

  return (
    <SectionCard title="Timeline">
      <div className="timeline-now-marker">
        <span className="label">Current Time</span>
        <strong>{currentTime}</strong>
      </div>
      <div className="timeline-drop-slots">
        {dropSlots.map((slotMinutes) => {
          const isActive = dragOverMinutes === slotMinutes;
          const canDrop = draggedTaskId ? canDropTaskAtMinutes(draggedTaskId, slotMinutes) : false;
          return (
            <button
              key={`drop-slot-${slotMinutes}`}
              type="button"
              className={[
                'timeline-drop-slot',
                draggedTaskId ? 'is-visible' : '',
                isActive ? 'is-active' : '',
                draggedTaskId && !canDrop ? 'is-invalid' : ''
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
            >
              <span>{String(Math.floor(slotMinutes / 60)).padStart(2, '0')}:{String(slotMinutes % 60).padStart(2, '0')}</span>
            </button>
          );
        })}
      </div>
      <div className="timeline-list">
        {blocks.map((block) => {
          let state = 'upcoming';
          if (block.id === currentBlockId) state = 'current';
          else if (block.id === nextBlockId) state = 'next';
          else if (block._isPast) state = 'past';

          return <TimelineBlock key={block.id} block={block} state={state} />;
        })}
      </div>
      <button className="timeline-add-button" onClick={onAddBlock}>Add Block</button>
    </SectionCard>
  );
}

export default TimelinePanel;
