import SectionCard from './SectionCard';

function DepartmentStatusPanel({ focus, phase, nextActions, done }) {
  return (
    <SectionCard title="Department Status">
      <div className="status-list">
        <div><span className="label">Focus</span><strong>{focus}</strong></div>
        <div><span className="label">Phase</span><strong>{phase}</strong></div>
      </div>
      <div className="panel-group">
        <h3>Next Actions</h3>
        <ul>{nextActions.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
      <div className="panel-group">
        <h3>Done</h3>
        <ul>{done.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
    </SectionCard>
  );
}

export default DepartmentStatusPanel;
