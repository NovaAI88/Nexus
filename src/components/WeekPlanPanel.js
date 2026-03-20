import SectionCard from './SectionCard';

function WeekPlanPanel({ work, gym, rest }) {
  return (
    <SectionCard title="Current Week Plan">
      <div className="panel-group">
        <h3>Work</h3>
        <ul>{work.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
      <div className="panel-group">
        <h3>Gym</h3>
        <ul>{gym.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
      <div className="panel-group">
        <h3>Rest</h3>
        <ul>{rest.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
    </SectionCard>
  );
}

export default WeekPlanPanel;
