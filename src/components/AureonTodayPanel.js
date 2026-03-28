function AureonTodayPanel({ isConnected, pipelineEntries, stats, primaryAction }) {
  if (!isConnected) {
    return (
      <section className="section-card aureon-panel aureon-panel-empty">
        <div className="aureon-header-row">
          <h2>AUREON</h2>
          <span className="label urgency-critical">NOT CONNECTED</span>
        </div>
        <p className="aureon-empty-message">
          No pipeline data. Add your first lead to begin tracking.
        </p>
      </section>
    );
  }

  const fu1Due = pipelineEntries.filter((entry) => entry.followUp1Due).length;
  const fu2Due = pipelineEntries.filter((entry) => entry.followUp2Due).length;

  return (
    <section className="section-card aureon-panel">
      <div className="aureon-header-row">
        <h2>AUREON</h2>
        <span className="label">{stats.leads} leads</span>
      </div>

      <div className="aureon-stats-grid">
        <div className="aureon-stat-cell">
          <span className="label">Leads</span>
          <strong>{stats.leads}</strong>
        </div>
        <div className="aureon-stat-cell">
          <span className="label">Contacted</span>
          <strong>{stats.contacted}</strong>
        </div>
        <div className="aureon-stat-cell">
          <span className="label">Replies</span>
          <strong>{stats.replies}</strong>
        </div>
        <div className="aureon-stat-cell">
          <span className="label">Calls booked</span>
          <strong>{stats.callsBooked}</strong>
        </div>
      </div>

      <div className={`aureon-primary-action aureon-primary-action-${primaryAction?.urgency || 'low'}`}>
        <span className="label">Primary Action</span>
        <strong>{primaryAction?.label || 'Monitor for replies'}</strong>
      </div>

      <div className="aureon-secondary-context">
        <p>FU1 due now: {fu1Due}</p>
        <p>FU2 due now: {fu2Due}</p>
      </div>
    </section>
  );
}

export default AureonTodayPanel;
