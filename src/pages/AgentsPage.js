import { useAgentData } from '../core/agents/useAgentData';

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_META = {
  running:  { color: '#6fcf97', label: 'Running',  pulse: true  },
  idle:     { color: '#b1bac4', label: 'Idle',     pulse: false },
  error:    { color: '#eb5757', label: 'Error',    pulse: false },
  paused:   { color: '#f2c94c', label: 'Paused',   pulse: false },
  default:  { color: '#6e7681', label: 'Unknown',  pulse: false },
};

function getStatusMeta(status) {
  return STATUS_META[status] || STATUS_META.default;
}

function formatHeartbeat(iso) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const PRIORITY_COLOR = {
  critical: '#ff4d6d',
  high:     '#f59e0b',
  medium:   '#6b7cff',
  low:      '#4b5563',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusDot({ status }) {
  const meta = getStatusMeta(status);
  return (
    <span
      className={`acl-status-dot${meta.pulse ? ' acl-status-dot--pulse' : ''}`}
      style={{ background: meta.color, boxShadow: `0 0 0 2px ${meta.color}22` }}
      title={meta.label}
    />
  );
}

function AssignmentTag({ assignment }) {
  const color = PRIORITY_COLOR[assignment.priority] || PRIORITY_COLOR.medium;
  return (
    <span
      className="acl-assignment-tag"
      style={{ borderLeftColor: color }}
      title={assignment.title}
    >
      <span className="acl-assignment-id">{assignment.identifier}</span>
      <span className="acl-assignment-title">{assignment.title}</span>
    </span>
  );
}

function AgentActions() {
  return (
    <div className="acl-actions">
      <button className="acl-action-btn" disabled title="Inspect assignment — available in N4.6">
        Inspect
      </button>
      <button className="acl-action-btn" disabled title="Review output — available in N4.6">
        Review
      </button>
      <button className="acl-action-btn acl-action-btn--danger" disabled title="Redirect — available in N4.6">
        Redirect
      </button>
    </div>
  );
}

function AgentCard({ agent }) {
  const meta = getStatusMeta(agent.status);
  const heartbeat = formatHeartbeat(agent.lastHeartbeatAt);
  const hasAssignments = agent.assignments && agent.assignments.length > 0;

  return (
    <div className={`acl-agent-card acl-agent-card--${agent.status}`} data-tier={agent.tier}>
      {/* Header row */}
      <div className="acl-agent-header">
        <div className="acl-agent-identity">
          <StatusDot status={agent.status} />
          <div className="acl-agent-name-block">
            <span className="acl-agent-name">{agent.name}</span>
            {agent.isHuman && <span className="acl-agent-badge acl-agent-badge--human">Human</span>}
          </div>
        </div>
        <div className="acl-agent-meta">
          <span className={`acl-status-label acl-status-label--${agent.status}`}>{meta.label}</span>
          {heartbeat && <span className="acl-heartbeat">{heartbeat}</span>}
        </div>
      </div>

      {/* Role / title */}
      <div className="acl-agent-role">
        <span className="acl-agent-title">{agent.title}</span>
        <span className="acl-agent-adapter">{agent.adapterType}</span>
      </div>

      {/* Current assignments */}
      <div className="acl-agent-assignments">
        {hasAssignments ? (
          agent.assignments.map((a) => <AssignmentTag key={a.id} assignment={a} />)
        ) : (
          <span className="acl-no-assignment">No active assignment</span>
        )}
      </div>

      {/* Structural action area */}
      {!agent.isHuman && <AgentActions />}
    </div>
  );
}

function TierSection({ title, agents, accent }) {
  if (agents.length === 0) return null;
  return (
    <div className="acl-tier" style={{ '--tier-accent': accent }}>
      <div className="acl-tier-header">
        <span className="acl-tier-dot" />
        <h3 className="acl-tier-title">{title}</h3>
        <span className="acl-tier-count">{agents.length}</span>
      </div>
      <div className="acl-tier-grid">
        {agents.map((a) => <AgentCard key={a.id} agent={a} />)}
      </div>
    </div>
  );
}

function SystemHealthBar({ agents, isLive, lastFetched }) {
  const running = agents.filter((a) => a.status === 'running').length;
  const errors  = agents.filter((a) => a.status === 'error').length;
  const total   = agents.filter((a) => !a.isHuman).length;

  const systemOk = errors === 0;

  return (
    <div className="acl-system-bar">
      <div className="acl-system-bar-left">
        <span className={`acl-system-indicator${systemOk ? ' acl-system-indicator--ok' : ' acl-system-indicator--warn'}`} />
        <span className="acl-system-platform">Paperclip</span>
        <span className="acl-system-divider" />
        <span className="acl-system-stat">
          <strong>{running}</strong> running
        </span>
        {errors > 0 && (
          <span className="acl-system-stat acl-system-stat--error">
            <strong>{errors}</strong> error
          </span>
        )}
        <span className="acl-system-stat">
          <strong>{total}</strong> total agents
        </span>
      </div>
      <div className="acl-system-bar-right">
        {isLive ? (
          <span className="acl-live-badge">LIVE</span>
        ) : (
          <span className="acl-seed-badge">SNAPSHOT</span>
        )}
        {lastFetched && (
          <span className="acl-last-fetched">{formatHeartbeat(lastFetched)}</span>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function AgentsPage({ date }) {
  const { agents, byTier, isLive, lastFetched } = useAgentData();

  return (
    <div className="acl-page">
      <header className="acl-header">
        <div className="acl-header-text">
          <h1 className="acl-title">Agents</h1>
          <p className="acl-subtitle">Control Layer · Status · Assignments</p>
        </div>
        <span className="acl-date">{date}</span>
      </header>

      <SystemHealthBar agents={agents} isLive={isLive} lastFetched={lastFetched} />

      <div className="acl-tiers">
        <TierSection
          title="Executive"
          agents={byTier.executive}
          accent="#a78bfa"
        />
        <TierSection
          title="Engineering"
          agents={byTier.engineering}
          accent="#6b7cff"
        />
        <TierSection
          title="Revenue"
          agents={byTier.revenue}
          accent="#34d399"
        />
      </div>

      <div className="acl-footer-note">
        <span>Full runtime control (pause · resume · redirect) available in N4.6.</span>
      </div>
    </div>
  );
}

export default AgentsPage;
