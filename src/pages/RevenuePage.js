import { useState } from 'react';
import PageContainer from '../components/PageContainer';
import SectionCard from '../components/SectionCard';
import {
  useDraftReview,
  DRAFT_STATUS_LABELS,
  DRAFT_STATUSES,
} from '../core/drafts/useDraftReview';

// ─── Shared helpers ───────────────────────────────────────────────────────────

function parseStatus(rawStatus) {
  if (!rawStatus) return null;
  const s = rawStatus.toLowerCase();
  if (s.includes('draft')) return 'draft';
  if (s.includes('review')) return 'review';
  if (s.includes('sent')) return 'sent';
  if (s.includes('respon') || s.includes('replied')) return 'replied';
  if (s.includes('hot')) return 'hot';
  if (s.includes('closed') || s.includes('deal')) return 'closed';
  if (s.includes('dead')) return 'dead';
  if (s.includes('hold')) return 'hold';
  return null;
}

const STATUS_LABELS = {
  draft: 'Draft Ready',
  review: 'Needs Review',
  sent: 'Sent',
  replied: 'Replied',
  hot: 'Hot',
  closed: 'Closed',
  dead: 'Dead',
  hold: 'On Hold',
};

// ─── Pipeline components ──────────────────────────────────────────────────────

function ScoreBadge({ score }) {
  const n = parseInt(score, 10);
  const cls = n >= 20 ? 'revenue-score-high' : n >= 16 ? 'revenue-score-mid' : 'revenue-score-low';
  return <span className={`revenue-score-badge ${cls}`}>{score}</span>;
}

function StatusBadge({ rawStatus }) {
  const key = parseStatus(rawStatus);
  if (!key) return null;
  return (
    <span className={`revenue-status-badge revenue-status-${key}`}>
      {STATUS_LABELS[key] || rawStatus}
    </span>
  );
}

function LeadRow({ lead }) {
  return (
    <div className="revenue-lead-row">
      <div className="revenue-lead-header">
        <span className="revenue-lead-company">{lead.company}</span>
        <div className="revenue-lead-badges">
          {lead.score && <ScoreBadge score={lead.score} />}
          <StatusBadge rawStatus={lead.status} />
        </div>
      </div>
      {(lead.founder || lead.channel) && (
        <div className="revenue-lead-meta">
          {lead.founder && <span className="revenue-lead-founder">{lead.founder}</span>}
          {lead.channel && <span className="revenue-lead-channel">{lead.channel}</span>}
        </div>
      )}
      {lead.notes && <p className="revenue-lead-notes">{lead.notes}</p>}
    </div>
  );
}

function MetricCell({ label, value, highlight }) {
  return (
    <div className={`revenue-metric-cell${highlight ? ' revenue-metric-highlight' : ''}`}>
      <span className="revenue-metric-label">{label}</span>
      <strong className="revenue-metric-value">{value ?? 0}</strong>
    </div>
  );
}

// ─── Draft Review components ──────────────────────────────────────────────────

const DRAFT_STATUS_COLORS = {
  awaiting_review: 'draft-status-awaiting',
  approved: 'draft-status-approved',
  rejected: 'draft-status-rejected',
  archived: 'draft-status-archived',
  generated: 'draft-status-generated',
};

function DraftStatusChip({ status }) {
  return (
    <span className={`draft-status-chip ${DRAFT_STATUS_COLORS[status] || ''}`}>
      {DRAFT_STATUS_LABELS[status] || status}
    </span>
  );
}

function DraftQueueItem({ draft, isSelected, onSelect }) {
  return (
    <button
      className={`draft-queue-item${isSelected ? ' draft-queue-item--selected' : ''}`}
      onClick={() => onSelect(isSelected ? null : draft.id)}
    >
      <div className="draft-queue-item-header">
        <span className="draft-queue-item-company">{draft.company}</span>
        <DraftStatusChip status={draft.draftStatus} />
      </div>
      <div className="draft-queue-item-meta">
        <span className="draft-queue-item-recipient">{draft.recipient}</span>
        <span className="draft-queue-item-channel">{draft.channel}</span>
      </div>
      <div className="draft-queue-item-subject">{draft.subject}</div>
    </button>
  );
}

function DraftDetailPanel({ draft, onApprove, onReject, onArchive, onReturn, editingNoteId, setEditingNoteId, notes, onSaveNote, isPending }) {
  const [noteText, setNoteText] = useState(notes[draft.id] || '');
  const isEditing = editingNoteId === draft.id;

  const handleEditStart = () => {
    setNoteText(notes[draft.id] || '');
    setEditingNoteId(draft.id);
  };

  return (
    <div className="draft-detail-panel">
      {/* Header */}
      <div className="draft-detail-header">
        <div className="draft-detail-title-row">
          <span className="draft-detail-company">{draft.company}</span>
          <DraftStatusChip status={draft.draftStatus} />
        </div>
        {draft.score && (
          <div className="draft-detail-lead-meta">
            <ScoreBadge score={draft.score} />
            <span className="draft-detail-lead-notes">{draft.notes}</span>
          </div>
        )}
      </div>

      {/* Email envelope fields */}
      <div className="draft-detail-envelope">
        <div className="draft-detail-field">
          <span className="draft-detail-field-label">To</span>
          <span className="draft-detail-field-value">{draft.recipient}</span>
        </div>
        <div className="draft-detail-field">
          <span className="draft-detail-field-label">Via</span>
          <span className="draft-detail-field-value">{draft.channel}</span>
        </div>
        <div className="draft-detail-field">
          <span className="draft-detail-field-label">Subject</span>
          <span className="draft-detail-field-value draft-detail-subject">{draft.subject}</span>
        </div>
      </div>

      {/* Email body */}
      <div className="draft-detail-body">
        <pre className="draft-body-text">{draft.body}</pre>
      </div>

      {/* Reviewer note */}
      <div className="draft-detail-note-section">
        {isEditing ? (
          <div className="draft-note-edit">
            <textarea
              className="draft-note-textarea"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a reviewer note…"
              rows={3}
            />
            <div className="draft-note-edit-actions">
              <button className="draft-note-save-btn" onClick={() => onSaveNote(draft.id, noteText)}>Save note</button>
              <button className="draft-note-cancel-btn" onClick={() => setEditingNoteId(null)}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="draft-note-display">
            {notes[draft.id] ? (
              <p className="draft-note-text">Note: {notes[draft.id]}</p>
            ) : null}
            <button className="draft-note-edit-trigger" onClick={handleEditStart}>
              {notes[draft.id] ? 'Edit note' : '+ Add reviewer note'}
            </button>
          </div>
        )}
      </div>

      {/* Review actions */}
      <div className="draft-review-actions">
        {draft.draftStatus === DRAFT_STATUSES.AWAITING_REVIEW || draft.draftStatus === DRAFT_STATUSES.GENERATED ? (
          <>
            <button
              className="draft-action-btn draft-action-approve"
              disabled={isPending}
              onClick={() => onApprove(draft.id)}
            >
              {isPending ? 'Sending…' : 'Approve & Send'}
            </button>
            <button
              className="draft-action-btn draft-action-reject"
              disabled={isPending}
              onClick={() => onReject(draft.id)}
            >
              Reject
            </button>
            <button
              className="draft-action-btn draft-action-hold"
              disabled={isPending}
              onClick={() => onArchive(draft.id)}
            >
              Hold
            </button>
          </>
        ) : (
          <button className="draft-action-btn draft-action-return" onClick={() => onReturn(draft.id)}>
            Return to Review
          </button>
        )}
      </div>
    </div>
  );
}

const FILTER_TABS = [
  { key: 'awaiting_review', label: 'Awaiting Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
];

function SendErrorBanner({ lastError, onDismiss }) {
  if (!lastError) return null;
  const headline =
    lastError.error === 'service_unreachable'
      ? 'Send service is not running'
      : lastError.action === 'approve'
        ? 'Failed to send email'
        : 'Failed to reject draft';
  return (
    <div className="draft-error-banner" role="alert">
      <div className="draft-error-banner-body">
        <strong className="draft-error-banner-title">{headline}</strong>
        {lastError.detail && <p className="draft-error-banner-detail">{lastError.detail}</p>}
        {lastError.hint && <p className="draft-error-banner-hint">{lastError.hint}</p>}
      </div>
      <button className="draft-error-banner-dismiss" onClick={onDismiss}>Dismiss</button>
    </div>
  );
}

function DraftReviewSystem({ draftReview }) {
  const {
    filteredDrafts,
    selectedDraft,
    selectedDraftId,
    setSelectedDraftId,
    activeFilter,
    setActiveFilter,
    counts,
    approve,
    reject,
    archive,
    returnToReview,
    editingNoteId,
    setEditingNoteId,
    notes,
    saveNote,
    pendingIds,
    lastError,
    dismissError,
  } = draftReview;

  if (counts.all === 0) {
    return (
      <SectionCard title="Draft Queue" variant="primary">
        <p className="revenue-empty-note">No drafts ready. Generate outreach drafts to begin review.</p>
      </SectionCard>
    );
  }

  return (
    <div className="draft-review-system">
      <SendErrorBanner lastError={lastError} onDismiss={dismissError} />

      {/* Filter tabs */}
      <div className="draft-filter-bar">
        {FILTER_TABS.map((tab) => {
          const count = tab.key === 'all' ? counts.all : counts[tab.key];
          return (
            <button
              key={tab.key}
              className={`draft-filter-tab${activeFilter === tab.key ? ' draft-filter-tab--active' : ''}`}
              onClick={() => { setActiveFilter(tab.key); setSelectedDraftId(null); }}
            >
              {tab.label}
              {count > 0 && <span className="draft-filter-count">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Split pane: queue list + detail */}
      <div className={`draft-review-pane${selectedDraft ? ' draft-review-pane--split' : ''}`}>
        {/* Queue list */}
        <div className="draft-queue-list">
          {filteredDrafts.length === 0 ? (
            <p className="draft-queue-empty">No drafts in this category.</p>
          ) : (
            filteredDrafts.map((draft) => (
              <DraftQueueItem
                key={draft.id}
                draft={draft}
                isSelected={selectedDraftId === draft.id}
                onSelect={setSelectedDraftId}
              />
            ))
          )}
        </div>

        {/* Detail panel */}
        {selectedDraft && (
          <DraftDetailPanel
            draft={selectedDraft}
            onApprove={approve}
            onReject={reject}
            onArchive={archive}
            onReturn={returnToReview}
            editingNoteId={editingNoteId}
            setEditingNoteId={setEditingNoteId}
            notes={notes}
            onSaveNote={saveNote}
            isPending={pendingIds.has(selectedDraft.id)}
          />
        )}
      </div>
    </div>
  );
}

// ─── AUREON Control Surface ───────────────────────────────────────────────────

const A1_TARGET_AMOUNT = 1000;
const A1_DEADLINE_DATE = '2026-04-14';

function aureonStage(rawStatus) {
  const s = (rawStatus || '').toLowerCase().replace(/[^\w\s-]/g, '');
  if (s.includes('closed') || s.includes('deal')) return 'closed';
  if (s.includes('call') || s.includes('hot')) return 'call-booked';
  if (s.includes('replied') || s.includes('responded')) return 'replied';
  if (s.includes('sent') || s.includes('dm')) return 'dm-sent';
  return 'researched';
}

const AUREON_STAGE_META = {
  'researched':  { label: 'Researched',  cls: 'stage-researched'  },
  'dm-sent':     { label: 'DM Sent',     cls: 'stage-dm-sent'     },
  'replied':     { label: 'Replied',     cls: 'stage-replied'     },
  'call-booked': { label: 'Call Booked', cls: 'stage-call-booked' },
  'closed':      { label: 'Closed',      cls: 'stage-closed'      },
  'bounced':     { label: 'Bounced',     cls: 'stage-bounced'     },
};

function AureonStageBadge({ rawStatus }) {
  const stage = aureonStage(rawStatus);
  const meta = AUREON_STAGE_META[stage] || AUREON_STAGE_META['researched'];
  return <span className={`aureon-stage-badge ${meta.cls}`}>{meta.label}</span>;
}

function AureonKPIBar({ current, target, deadline }) {
  const progress = Math.min((current / target) * 100, 100);
  const daysLeft = Math.max(0, Math.floor((new Date(deadline) - new Date()) / 86400000));
  return (
    <div className="aureon-kpi">
      <div className="aureon-kpi-header">
        <span className="aureon-kpi-label">A1 Target — €{target.toLocaleString()}</span>
        <span className="aureon-kpi-deadline">{daysLeft}d remaining · April 14</span>
      </div>
      <div className="aureon-kpi-track">
        <div className="aureon-kpi-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="aureon-kpi-footer">
        <span className="aureon-kpi-current">€{current.toLocaleString()} raised</span>
        <span className="aureon-kpi-pct">{progress.toFixed(0)}%</span>
      </div>
    </div>
  );
}

function AureonControlSurface({ leads, aureonDrafts }) {
  const drafts = aureonDrafts || [];
  const hasDraftData = drafts.length > 0;

  // Use aureonDrafts (queue.json) as truth for outreach metrics when available
  const totalLeads  = hasDraftData ? drafts.length : leads.length;
  const dmSent      = hasDraftData
    ? drafts.filter((d) => d.status === 'sent').length
    : leads.filter((l) => ['dm-sent', 'replied', 'call-booked', 'closed'].includes(aureonStage(l.status))).length;
  const bounced     = hasDraftData ? drafts.filter((d) => d.status === 'bounced').length : 0;
  const callsBooked = hasDraftData
    ? drafts.filter((d) => d.status === 'call-booked' || d.status === 'closed').length
    : leads.filter((l) => ['call-booked', 'closed'].includes(aureonStage(l.status))).length;
  const convRate    = dmSent > 0 ? ((callsBooked / dmSent) * 100).toFixed(0) : '—';

  // Build the lead list from drafts (truthful) or fall back to pipeline
  const displayLeads = hasDraftData
    ? drafts.map((d) => ({
        key: d.id,
        company: d.company || d.to,
        stage: d.status === 'sent' ? 'dm-sent'
             : d.status === 'bounced' ? 'bounced'
             : d.status === 'replied' ? 'replied'
             : d.status === 'call-booked' ? 'call-booked'
             : d.status === 'closed' ? 'closed'
             : 'researched',
      }))
    : leads.map((l, i) => ({
        key: l._ || i,
        company: l.company,
        stage: aureonStage(l.status),
      }));

  return (
    <div className="aureon-control-surface">
      <AureonKPIBar current={0} target={A1_TARGET_AMOUNT} deadline={A1_DEADLINE_DATE} />

      <div className="aureon-summary-row">
        <div className="aureon-summary-cell">
          <strong className="aureon-summary-value">{totalLeads}</strong>
          <span className="aureon-summary-label">Active Leads</span>
        </div>
        <div className="aureon-summary-cell">
          <strong className="aureon-summary-value">{dmSent}</strong>
          <span className="aureon-summary-label">DMs Sent</span>
        </div>
        <div className="aureon-summary-cell">
          <strong className="aureon-summary-value">{callsBooked}</strong>
          <span className="aureon-summary-label">Calls Booked</span>
        </div>
        <div className="aureon-summary-cell">
          <strong className="aureon-summary-value">{convRate}{convRate !== '—' ? '%' : ''}</strong>
          <span className="aureon-summary-label">Conversion</span>
        </div>
      </div>

      {bounced > 0 && (
        <div className="aureon-bounce-note">
          {bounced} bounce{bounced > 1 ? 's' : ''} detected
        </div>
      )}

      {displayLeads.length > 0 ? (
        <div className="aureon-lead-status-list">
          {displayLeads.map((lead) => (
            <div key={lead.key} className="aureon-lead-status-row">
              <span className="aureon-lead-status-company">{lead.company}</span>
              <AureonStageBadge rawStatus={lead.stage} />
            </div>
          ))}
        </div>
      ) : (
        <p className="aureon-empty">No leads in pipeline. Add leads to begin A1 execution.</p>
      )}
    </div>
  );
}

// ─── RevenuePage ──────────────────────────────────────────────────────────────

function RevenuePage({
  date,
  pipelineStats,
  revenueMilestones,
  aureonConnected,
  pipelineEntries,
  aureonStats,
  aureonPrimaryAction,
  generatedPipeline,
  generatedAureonDrafts,
}) {
  const leads = generatedPipeline?.length > 0 ? generatedPipeline : (pipelineEntries || []);
  const milestones = revenueMilestones || [];
  const draftReview = useDraftReview(leads, generatedAureonDrafts);

  const totalLeads = leads.length;
  const draftsReady = draftReview.counts.awaiting_review;
  const outreachSent = leads.filter(
    (l) => (l.sent && l.sent !== '—' && l.sent !== '') || parseStatus(l.status) === 'sent'
  ).length;
  const replies = leads.filter(
    (l) =>
      (l.response && l.response !== '—' && l.response !== '' && l.response !== 'None') ||
      parseStatus(l.status) === 'replied'
  ).length;

  const attentionLeads = leads.filter((l) => {
    const s = parseStatus(l.status);
    return s === 'hot' || s === 'replied';
  });

  const derivedAction = (() => {
    if (replies > 0) return { label: `Respond to ${replies} ${replies === 1 ? 'reply' : 'replies'} now`, urgency: 'critical' };
    if (draftsReady > 0) return { label: `Review and approve ${draftsReady} ready ${draftsReady === 1 ? 'draft' : 'drafts'}`, urgency: 'high' };
    return { label: 'Research and add new leads to pipeline', urgency: 'low' };
  })();
  const primaryAction = aureonPrimaryAction || derivedAction;

  const activeTarget = milestones.find((m) => m.status === 'In Progress');

  return (
    <PageContainer
      title="Revenue"
      subtitle="AUREON · Pipeline · Outreach execution"
      date={date}
      primaryAction={null}
    >
      <div className="page-grid two-column">

        {/* Metrics strip */}
        <div style={{ gridColumn: '1 / -1' }}>
          <SectionCard title="Pipeline Metrics" variant="primary">
            <div className="revenue-metrics-row">
              <MetricCell label="Total Leads" value={totalLeads} />
              <MetricCell label="Drafts Ready" value={draftsReady} highlight={draftsReady > 0} />
              <MetricCell label="Outreach Sent" value={outreachSent} />
              <MetricCell label="Replies" value={replies} highlight={replies > 0} />
            </div>
          </SectionCard>
        </div>

        {/* AUREON Control Surface */}
        <div style={{ gridColumn: '1 / -1' }}>
          <SectionCard title="AUREON Pipeline Control" variant="primary">
            <AureonControlSurface leads={leads} aureonDrafts={generatedAureonDrafts} />
          </SectionCard>
        </div>

        {/* Primary action */}
        <SectionCard title="Primary Action">
          <div className={`revenue-action-block revenue-action-${primaryAction.urgency || 'low'}`}>
            <span className="revenue-action-label">Focus now</span>
            <strong className="revenue-action-text">{primaryAction.label}</strong>
          </div>
          {activeTarget && (
            <div className="revenue-target-chip">
              <span className="label">Target</span>
              <strong>{activeTarget.amount}</strong>
              <span className="label">by {activeTarget.deadline}</span>
            </div>
          )}
          {!aureonConnected && (
            <p className="revenue-disconnect-note">AUREON not connected — pipeline from truth layer</p>
          )}
        </SectionCard>

        {/* Revenue milestones */}
        {milestones.length > 0 && (
          <SectionCard title="Revenue Targets">
            <div className="revenue-milestone-list">
              {milestones.map((m, i) => {
                const statusKey = m.status?.toLowerCase().replace(/\s+/g, '-') || 'pending';
                return (
                  <div key={i} className={`revenue-milestone-row revenue-milestone-${statusKey}`}>
                    <div className="revenue-milestone-header">
                      <span className="revenue-milestone-target">{m.target}</span>
                      <span className="revenue-milestone-amount">{m.amount}</span>
                    </div>
                    <div className="revenue-milestone-footer">
                      <span className="label">{m.deadline}</span>
                      <span className={`revenue-milestone-status revenue-milestone-status-${statusKey}`}>{m.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

        {/* Hot / attention leads */}
        {attentionLeads.length > 0 && (
          <div style={{ gridColumn: '1 / -1' }}>
            <SectionCard title={`Hot / Needs Action (${attentionLeads.length})`}>
              <div className="revenue-lead-list">
                {attentionLeads.map((lead, i) => (
                  <LeadRow key={lead._ || i} lead={lead} />
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        {/* Draft Review System — N4.4 */}
        <div style={{ gridColumn: '1 / -1' }}>
          <SectionCard title={`Draft Queue${draftsReady > 0 ? ` — ${draftsReady} awaiting review` : ''}`} variant="primary">
            <DraftReviewSystem draftReview={draftReview} />
          </SectionCard>
        </div>

        {/* Full pipeline */}
        <div style={{ gridColumn: '1 / -1' }}>
          {leads.length > 0 ? (
            <SectionCard title={`Pipeline — ${leads.length} Active Leads`}>
              <div className="revenue-lead-list">
                {leads.map((lead, i) => (
                  <LeadRow key={lead._ || i} lead={lead} />
                ))}
              </div>
            </SectionCard>
          ) : (
            <SectionCard title="Pipeline">
              <p className="revenue-empty-note">No leads loaded. Add leads to begin AUREON execution.</p>
            </SectionCard>
          )}
        </div>

      </div>
    </PageContainer>
  );
}

export default RevenuePage;
