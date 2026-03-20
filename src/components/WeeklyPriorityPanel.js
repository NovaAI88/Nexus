import SectionCard from './SectionCard';

function WeeklyPriorityPanel({ priority, outcomes }) {
  return (
    <SectionCard title="Weekly Goal">
      <p>{priority}</p>
      {outcomes && outcomes.length > 0 ? (
        <div className="panel-group">
          <h3>Key Outcomes</h3>
          <ul>{outcomes.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      ) : null}
    </SectionCard>
  );
}

export default WeeklyPriorityPanel;
