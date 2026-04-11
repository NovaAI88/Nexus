import { useState, useEffect, useCallback } from 'react';
import { useAgentData } from '../core/agents/useAgentData';

const API_URL = process.env.REACT_APP_PAPERCLIP_API_URL || 'http://127.0.0.1:3100';
const COMPANY_ID = process.env.REACT_APP_PAPERCLIP_COMPANY_ID || '';
const API_KEY = process.env.REACT_APP_PAPERCLIP_API_KEY || '';

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_META = {
  running:  { color: 'var(--accent-success)', label: 'Running',  pulse: true  },
  idle:     { color: 'var(--color-text-body)', label: 'Idle',     pulse: false },
  error:    { color: 'var(--color-danger)', label: 'Error',    pulse: false },
  paused:   { color: 'var(--accent-warning)', label: 'Paused',   pulse: false },
  default:  { color: 'var(--color-text-meta)', label: 'Unknown',  pulse: false },
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
  critical: 'var(--color-urgency-critical)',
  high:     'var(--accent-warning)',
  medium:   'var(--color-dept-nexus)',
  low:      'var(--color-urgency-low)',
};

// ─── Panel: Inspect ───────────────────────────────────────────────────────────

function InspectPanel({ agent, onClose }) {
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const assignment = agent.assignments?.[0];
    if (!assignment) return;
    setLoading(true);
    fetch(`${API_URL}/api/issues/${assignment.id}`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.statusText))
      .then((data) => { setIssue(data); setLoading(false); })
      .catch((e) => { setError(String(e)); setLoading(false); });
  }, [agent]);

  const assignment = agent.assignments?.[0];

  return (
    <div className="acl-panel">
      <div className="acl-panel-header">
        <span className="acl-panel-title">Inspect — {agent.name}</span>
        <button className="acl-panel-close" onClick={onClose} aria-label="Close">✕</button>
      </div>
      {!assignment && (
        <p className="acl-panel-empty">No active assignment for this agent.</p>
      )}
      {assignment && loading && <p className="acl-panel-loading">Loading…</p>}
      {assignment && error && <p className="acl-panel-error">{error}</p>}
      {issue && (
        <div className="acl-panel-body">
          <div className="acl-inspect-field">
            <span className="acl-inspect-label">ID</span>
            <span className="acl-inspect-value acl-inspect-mono">{issue.identifier}</span>
          </div>
          <div className="acl-inspect-field">
            <span className="acl-inspect-label">Title</span>
            <span className="acl-inspect-value acl-inspect-title">{issue.title}</span>
          </div>
          <div className="acl-inspect-row">
            <div className="acl-inspect-field">
              <span className="acl-inspect-label">Status</span>
              <span className={`acl-inspect-status acl-inspect-status--${issue.status}`}>{issue.status}</span>
            </div>
            <div className="acl-inspect-field">
              <span className="acl-inspect-label">Priority</span>
              <span className="acl-inspect-value">{issue.priority}</span>
            </div>
          </div>
          {issue.description && (
            <div className="acl-inspect-field">
              <span className="acl-inspect-label">Description</span>
              <p className="acl-inspect-desc">
                {issue.description.slice(0, 500)}{issue.description.length > 500 ? '…' : ''}
              </p>
            </div>
          )}
          <div className="acl-inspect-row">
            {issue.createdAt && (
              <div className="acl-inspect-field">
                <span className="acl-inspect-label">Created</span>
                <span className="acl-inspect-value">{new Date(issue.createdAt).toLocaleDateString()}</span>
              </div>
            )}
            {issue.updatedAt && (
              <div className="acl-inspect-field">
                <span className="acl-inspect-label">Updated</span>
                <span className="acl-inspect-value">{new Date(issue.updatedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Panel: Review Output ─────────────────────────────────────────────────────

function ReviewPanel({ agent, onClose }) {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!COMPANY_ID) {
      setError('REACT_APP_PAPERCLIP_COMPANY_ID not configured.');
      return;
    }
    setLoading(true);
    fetch(`${API_URL}/api/companies/${COMPANY_ID}/issues?assigneeAgentId=${agent.id}&status=done`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.statusText))
      .then((data) => {
        const arr = Array.isArray(data) ? data : (data.items || data.issues || []);
        setItems(arr.slice(0, 5));
        setLoading(false);
      })
      .catch((e) => { setError(String(e)); setLoading(false); });
  }, [agent]);

  return (
    <div className="acl-panel">
      <div className="acl-panel-header">
        <span className="acl-panel-title">Recent Output — {agent.name}</span>
        <button className="acl-panel-close" onClick={onClose} aria-label="Close">✕</button>
      </div>
      {loading && <p className="acl-panel-loading">Loading…</p>}
      {error && <p className="acl-panel-error">{error}</p>}
      {items !== null && items.length === 0 && !loading && (
        <p className="acl-panel-empty">No completed activity on record.</p>
      )}
      {items && items.length > 0 && (
        <div className="acl-panel-body">
          {items.map((issue) => (
            <div key={issue.id} className="acl-review-item">
              <span className="acl-review-id">{issue.identifier}</span>
              <span className="acl-review-title">{issue.title}</span>
              {issue.updatedAt && (
                <span className="acl-review-date">{new Date(issue.updatedAt).toLocaleDateString()}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Panel: Redirect ──────────────────────────────────────────────────────────

function RedirectPanel({ agent, onClose }) {
  const [issues, setIssues] = useState(null);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!COMPANY_ID) {
      setError('REACT_APP_PAPERCLIP_COMPANY_ID not configured.');
      return;
    }
    setLoading(true);
    fetch(`${API_URL}/api/companies/${COMPANY_ID}/issues?status=todo,in_progress`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.statusText))
      .then((data) => {
        const arr = Array.isArray(data) ? data : (data.items || data.issues || []);
        setIssues(arr.filter((i) => i.assigneeAgentId !== agent.id));
        setLoading(false);
      })
      .catch((e) => { setError(String(e)); setLoading(false); });
  }, [agent]);

  const handleRedirect = useCallback(async () => {
    if (!selectedId) return;
    setSubmitting(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (API_KEY) headers['Authorization'] = `Bearer ${API_KEY}`;
      const res = await fetch(`${API_URL}/api/issues/${selectedId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ assigneeAgentId: agent.id, status: 'todo' }),
      });
      if (res.ok) {
        setResult({ ok: true, message: `Issue reassigned to ${agent.name}.` });
      } else {
        const text = await res.text().catch(() => '');
        setResult({ ok: false, message: `Failed: ${res.status} ${text.slice(0, 120)}` });
      }
    } catch (e) {
      setResult({ ok: false, message: String(e) });
    } finally {
      setSubmitting(false);
    }
  }, [selectedId, agent]);

  const selectedIssue = issues?.find((i) => i.id === selectedId);

  return (
    <div className="acl-panel">
      <div className="acl-panel-header">
        <span className="acl-panel-title">Redirect — {agent.name}</span>
        <button className="acl-panel-close" onClick={onClose} aria-label="Close">✕</button>
      </div>
      {loading && <p className="acl-panel-loading">Loading open issues…</p>}
      {error && <p className="acl-panel-error">{error}</p>}
      {result && (
        <div className={`acl-redirect-result${result.ok ? ' acl-redirect-result--ok' : ' acl-redirect-result--err'}`}>
          {result.message}
          {result.ok && (
            <button className="acl-action-btn" style={{ marginTop: 12 }} onClick={onClose}>Close</button>
          )}
        </div>
      )}
      {!result && issues && (
        <div className="acl-panel-body">
          <p className="acl-redirect-label">
            Assign a different issue to <strong>{agent.name}</strong>:
          </p>
          <select
            className="acl-redirect-select"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">— select issue —</option>
            {issues.map((i) => (
              <option key={i.id} value={i.id}>
                [{i.identifier}] {i.title}
              </option>
            ))}
          </select>
          {selectedIssue && (
            <div className="acl-redirect-preview">
              <span className={`acl-inspect-status acl-inspect-status--${selectedIssue.status}`}>
                {selectedIssue.status}
              </span>
              <span className="acl-inspect-value">{selectedIssue.priority}</span>
            </div>
          )}
          {issues.length === 0 && !loading && (
            <p className="acl-panel-empty">No unassigned open issues found.</p>
          )}
          <div className="acl-redirect-actions">
            <button
              className="acl-action-btn acl-action-btn--primary"
              disabled={!selectedId || submitting}
              onClick={handleRedirect}
            >
              {submitting ? 'Redirecting…' : 'Confirm Redirect'}
            </button>
            <button className="acl-action-btn" onClick={onClose}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

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

function AgentActions({ agent, onInspect, onReview, onRedirect }) {
  return (
    <div className="acl-actions">
      <button
        className="acl-action-btn acl-action-btn--active"
        onClick={() => onInspect(agent)}
        title="Inspect current assignment"
      >
        Inspect
      </button>
      <button
        className="acl-action-btn acl-action-btn--active"
        onClick={() => onReview(agent)}
        title="Review recent agent output"
      >
        Review
      </button>
      <button
        className="acl-action-btn acl-action-btn--danger acl-action-btn--active"
        onClick={() => onRedirect(agent)}
        title="Redirect agent to a different issue"
      >
        Redirect
      </button>
    </div>
  );
}

function AgentCard({ agent, onInspect, onReview, onRedirect }) {
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

      {/* Action area */}
      {!agent.isHuman && (
        <AgentActions
          agent={agent}
          onInspect={onInspect}
          onReview={onReview}
          onRedirect={onRedirect}
        />
      )}
    </div>
  );
}

function TierSection({ title, agents, accent, onInspect, onReview, onRedirect }) {
  if (agents.length === 0) return null;
  return (
    <div className="acl-tier" style={{ '--tier-accent': accent }}>
      <div className="acl-tier-header">
        <span className="acl-tier-dot" />
        <h3 className="acl-tier-title">{title}</h3>
        <span className="acl-tier-count">{agents.length}</span>
      </div>
      <div className="acl-tier-grid">
        {agents.map((a) => (
          <AgentCard
            key={a.id}
            agent={a}
            onInspect={onInspect}
            onReview={onReview}
            onRedirect={onRedirect}
          />
        ))}
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
  const [panel, setPanel] = useState(null); // { type: 'inspect'|'review'|'redirect', agent }

  const openInspect  = useCallback((agent) => setPanel({ type: 'inspect',  agent }), []);
  const openReview   = useCallback((agent) => setPanel({ type: 'review',   agent }), []);
  const openRedirect = useCallback((agent) => setPanel({ type: 'redirect', agent }), []);
  const closePanel   = useCallback(() => setPanel(null), []);

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

      {agents.length === 0 && (
        <div className="empty-state">
          <span className="empty-state-icon">◍</span>
          <p className="empty-state-text">Agent data unavailable. Check truth layer.</p>
        </div>
      )}

      <div className="acl-tiers">
        <TierSection
          title="Executive"
          agents={byTier.executive}
          accent="var(--color-dept-xenon)"
          onInspect={openInspect}
          onReview={openReview}
          onRedirect={openRedirect}
        />
        <TierSection
          title="Engineering"
          agents={byTier.engineering}
          accent="var(--color-dept-nexus)"
          onInspect={openInspect}
          onReview={openReview}
          onRedirect={openRedirect}
        />
        <TierSection
          title="Revenue"
          agents={byTier.revenue}
          accent="var(--accent-success)"
          onInspect={openInspect}
          onReview={openReview}
          onRedirect={openRedirect}
        />
      </div>

      {/* Slide-over panel overlay */}
      {panel && (
        <div className="acl-panel-overlay" onClick={closePanel}>
          <div className="acl-panel-drawer" onClick={(e) => e.stopPropagation()}>
            {panel.type === 'inspect'  && <InspectPanel  agent={panel.agent} onClose={closePanel} />}
            {panel.type === 'review'   && <ReviewPanel   agent={panel.agent} onClose={closePanel} />}
            {panel.type === 'redirect' && <RedirectPanel agent={panel.agent} onClose={closePanel} />}
          </div>
        </div>
      )}
    </div>
  );
}

export default AgentsPage;
