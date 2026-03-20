import SectionCard from './SectionCard';

function BlockSummaryPanel({ currentBlock, nextBlock }) {
  return (
    <SectionCard title="Current / Next Block">
      <div className="status-list">
        <div>
          <span className="label">Current Block</span>
          <strong>{currentBlock ? `${currentBlock.start}–${currentBlock.end} · ${currentBlock.label}` : 'No active block'}</strong>
        </div>
        <div>
          <span className="label">Next Block</span>
          <strong>{nextBlock ? `${nextBlock.start}–${nextBlock.end} · ${nextBlock.label}` : 'No upcoming block'}</strong>
        </div>
      </div>
    </SectionCard>
  );
}

export default BlockSummaryPanel;
