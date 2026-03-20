function PrimaryActionPanel({ mode, nextAction, weeklyPriority, milestone, onStartBlock }) {
  return (
    <section className="primary-action-panel">
      <span className="label">{mode}</span>
      <h2 className="primary-action-title">{nextAction}</h2>
      <div className="primary-action-controls">
        <button className="primary-action-button" onClick={onStartBlock}>
          Start Block
        </button>
      </div>
      <p className="primary-action-support">
        <span className="label">Weekly Priority</span>
        <strong>{weeklyPriority}</strong>
      </p>
      <p className="primary-action-support">
        <span className="label">Current Phase / Milestone</span>
        <strong>{milestone}</strong>
      </p>
    </section>
  );
}

export default PrimaryActionPanel;
