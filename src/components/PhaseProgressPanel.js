import SectionCard from './SectionCard';

function PhaseProgressPanel({ currentPhase, completion, nextMilestone }) {
  return (
    <SectionCard title="Phase Progress">
      <div className="status-list">
        <div><span className="label">Current Phase</span><strong>{currentPhase}</strong></div>
        <div><span className="label">Completion</span><strong>{completion}</strong></div>
        <div><span className="label">Next Milestone</span><strong>{nextMilestone}</strong></div>
      </div>
    </SectionCard>
  );
}

export default PhaseProgressPanel;
