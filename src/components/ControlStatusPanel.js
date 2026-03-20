import SectionCard from './SectionCard';

function ControlStatusPanel({ systemState, currentFocus, progress }) {
  return (
    <SectionCard title="Control Status">
      <div className="status-list">
        <div><span className="label">System</span><strong>{systemState}</strong></div>
        <div><span className="label">Focus</span><strong>{currentFocus}</strong></div>
        <div><span className="label">Progress</span><strong>{progress}</strong></div>
      </div>
    </SectionCard>
  );
}

export default ControlStatusPanel;
