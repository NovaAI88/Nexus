import SectionCard from './SectionCard';
import TimelineBlock from './TimelineBlock';

function TimelinePanel({ blocks, currentTime, currentBlockId, nextBlockId, onAddBlock }) {
  return (
    <SectionCard title="Timeline">
      <div className="timeline-now-marker">
        <span className="label">Current Time</span>
        <strong>{currentTime}</strong>
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
