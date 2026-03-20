function ActionBar({ mode, weeklyPriority, nextAction }) {
  return (
    <section className="action-bar">
      <div>
        <span className="label">Mode</span>
        <strong>{mode}</strong>
      </div>
      <div>
        <span className="label">Weekly Priority</span>
        <strong>{weeklyPriority}</strong>
      </div>
      <div>
        <span className="label">Next Action</span>
        <strong>{nextAction}</strong>
      </div>
    </section>
  );
}

export default ActionBar;
