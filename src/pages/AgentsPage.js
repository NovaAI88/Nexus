import PageContainer from '../components/PageContainer';
import SectionCard from '../components/SectionCard';

const KNOWN_AGENTS = [
  {
    id: 'atlas',
    name: 'ATLAS',
    role: 'NEXUS Engineer',
    status: 'active',
    focus: 'NEXUS product build — Phase N4',
  },
  {
    id: 'nova',
    name: 'Nova',
    role: 'Operations Director',
    status: 'active',
    focus: 'Phase coordination and review gate',
  },
];

function AgentStatusDot({ status }) {
  const color = status === 'active' ? '#6fcf97' : status === 'paused' ? '#f2c94c' : '#eb5757';
  return (
    <span
      className="agents-status-dot"
      style={{ background: color, boxShadow: `0 0 6px ${color}` }}
      title={status}
    />
  );
}

function AgentsPage({ date }) {
  return (
    <PageContainer
      title="Agents"
      subtitle="Runtime · Status · Assignments"
      date={date}
      primaryAction={null}
    >
      <div className="page-grid single-column">

        {/* Active roster */}
        <SectionCard title="Active Roster" variant="primary">
          <div className="agents-roster-list">
            {KNOWN_AGENTS.map((agent) => (
              <div key={agent.id} className="agents-roster-row">
                <AgentStatusDot status={agent.status} />
                <div className="agents-roster-identity">
                  <strong className="agents-roster-name">{agent.name}</strong>
                  <span className="label">{agent.role}</span>
                </div>
                <span className="agents-roster-focus">{agent.focus}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Orchestration status */}
        <SectionCard title="Orchestration">
          <div className="status-list">
            <div>
              <span className="label">Platform</span>
              <strong>Paperclip</strong>
            </div>
            <div>
              <span className="label">Company</span>
              <strong>OpenClaw Gateway</strong>
            </div>
            <div>
              <span className="label">Live agent data</span>
              <strong className="label">Available in N4.3+</strong>
            </div>
          </div>
        </SectionCard>

        {/* Runtime detail — structural placeholder */}
        <SectionCard title="Runtime Detail" variant="muted">
          <div className="revenue-placeholder-note">
            <span className="label">
              Live Paperclip task assignments, run history, and agent health will be wired in a later phase.
              Structure reserved.
            </span>
          </div>
        </SectionCard>

      </div>
    </PageContainer>
  );
}

export default AgentsPage;
