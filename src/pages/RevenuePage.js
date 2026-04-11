import { useState } from 'react';
import PageContainer from '../components/PageContainer';
import SectionCard from '../components/SectionCard';
import FreshnessBadge from '../components/FreshnessBadge';
import {
  useDraftReview,
  DRAFT_STATUS_LABELS,
  DRAFT_STATUSES,
} from '../core/drafts/useDraftReview';
import {
  useLeadPipeline,
  STAGES,
  STAGE_META,
} from '../core/aureon/useLeadPipeline';

// ─── Pipeline components ──────────────────────────────────────────────────────

function ScoreBadge({ score }) {
  const n = parseInt(score, 10);
  const cls = n >= 20 ? 'revenue-score-high' : n >= 16 ? 'revenue-score-mid' : 'revenue-score-low';
  return <span className={`revenue-score-badge ${cls}`}>{score}</span>;
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

      <div className="draft-detail-body">
        <pre className="draft-body-text">{draft.body}</pre>
      </div>

      <div className="draft-detail-note-section">
        {isEditing ? (
          <div className="draft-note-edit">
            <textarea
              className="draft-note-textarea"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a reviewer note..."
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

      <div className="draft-review-actions">
        {draft.draftStatus === DRAFT_STATUSES.AWAITING_REVIEW || draft.draftStatus === DRAFT_STATUSES.GENERATED ? (
          <>
            <button
              className="draft-action-btn draft-action-approve"
              disabled={isPending}
              onClick={() => onApprove(draft.id)}
            >
              {isPending ? 'Sending...' : 'Approve & Send'}
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

      <div className={`draft-review-pane${selectedDraft ? ' draft-review-pane--split' : ''}`}>
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

// ─── Outreach KPI Dashboard ──────────────────────────────────────────────────

const A1_TARGET_AMOUNT = 1000;
const A1_DEADLINE_DATE = '2026-04-14';

function OutreachKPIDashboard({ funnel, revenueMilestones }) {
  const daysLeft = Math.max(0, Math.floor((new Date(A1_DEADLINE_DATE) - new Date()) / 86400000));
  const activeTarget = (revenueMilestones || []).find((m) => m.status === 'In Progress');

  return (
    <div className="outreach-kpi-dashboard">
      {/* Revenue Target Progress */}
      <div className="outreach-kpi-target">
        <div className="outreach-kpi-target-header">
          <span className="outreach-kpi-target-label">A1 Revenue Target</span>
          <span className="outreach-kpi-target-deadline">{daysLeft}d remaining</span>
        </div>
        <div className="outreach-kpi-target-track">
          <div
            className="outreach-kpi-target-fill"
            style={{ width: `${Math.min((funnel.closed * 650 / A1_TARGET_AMOUNT) * 100, 100)}%` }}
          />
        </div>
        <div className="outreach-kpi-target-footer">
          <span>
            {funnel.closed > 0
              ? `${funnel.closed} closed (est. ${(funnel.closed * 650).toLocaleString()} EUR)`
              : '0 EUR raised'}
          </span>
          <span>{A1_TARGET_AMOUNT.toLocaleString()} EUR target</span>
        </div>
      </div>

      {/* Funnel Metrics Grid */}
      <div className="outreach-kpi-funnel">
        <div className="outreach-funnel-step">
          <strong className="outreach-funnel-value">{funnel.total}</strong>
          <span className="outreach-funnel-label">Total Leads</span>
        </div>
        <div className="outreach-funnel-arrow">&rarr;</div>
        <div className="outreach-funnel-step">
          <strong className="outreach-funnel-value">{funnel.sent}</strong>
          <span className="outreach-funnel-label">DMs Sent</span>
        </div>
        <div className="outreach-funnel-arrow">&rarr;</div>
        <div className="outreach-funnel-step">
          <strong className="outreach-funnel-value">{funnel.replied}</strong>
          <span className="outreach-funnel-label">Replied</span>
        </div>
        <div className="outreach-funnel-arrow">&rarr;</div>
        <div className="outreach-funnel-step">
          <strong className="outreach-funnel-value">{funnel.callsBooked}</strong>
          <span className="outreach-funnel-label">Calls Booked</span>
        </div>
        <div className="outreach-funnel-arrow">&rarr;</div>
        <div className="outreach-funnel-step outreach-funnel-step--highlight">
          <strong className="outreach-funnel-value">{funnel.closed}</strong>
          <span className="outreach-funnel-label">Closed</span>
        </div>
      </div>

      {/* Conversion Rates */}
      <div className="outreach-kpi-rates">
        <div className="outreach-rate-cell">
          <span className="outreach-rate-value">{funnel.dmToReply}%</span>
          <span className="outreach-rate-label">DM &rarr; Reply</span>
        </div>
        <div className="outreach-rate-cell">
          <span className="outreach-rate-value">{funnel.replyToCall}%</span>
          <span className="outreach-rate-label">Reply &rarr; Call</span>
        </div>
        <div className="outreach-rate-cell">
          <span className="outreach-rate-value">{funnel.callToClose}%</span>
          <span className="outreach-rate-label">Call &rarr; Close</span>
        </div>
        <div className="outreach-rate-cell outreach-rate-cell--overall">
          <span className="outreach-rate-value">{funnel.overallConversion}%</span>
          <span className="outreach-rate-label">Overall</span>
        </div>
      </div>

      {funnel.bounced > 0 && (
        <div className="outreach-kpi-bounce-note">
          {funnel.bounced} bounce{funnel.bounced > 1 ? 's' : ''} detected — check contact info
        </div>
      )}

      {activeTarget && (
        <div className="outreach-kpi-milestone">
          <span>{activeTarget.target}</span>
          <strong>{activeTarget.amount}</strong>
          <span>by {activeTarget.deadline}</span>
        </div>
      )}
    </div>
  );
}

// ─── Lead Lifecycle Board ────────────────────────────────────────────────────

const STAGE_COLORS = {
  'researched':  'lifecycle-stage-researched',
  'dm-sent':     'lifecycle-stage-dm-sent',
  'replied':     'lifecycle-stage-replied',
  'call-booked': 'lifecycle-stage-call-booked',
  'closed':      'lifecycle-stage-closed',
};

function LeadCard({ lead, onAdvance, onRevert, onSetStage }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const meta = STAGE_META[lead.stage] || STAGE_META['researched'];
  const canAdvance = meta.order < 4;
  const canRevert = meta.order > 0;

  return (
    <div className="lifecycle-lead-card">
      <div className="lifecycle-lead-header">
        <span className="lifecycle-lead-company">{lead.company}</span>
        {lead.score && <ScoreBadge score={lead.score} />}
      </div>
      {lead.founder && (
        <span className="lifecycle-lead-founder">{lead.founder}</span>
      )}
      {lead.contact && (
        <span className="lifecycle-lead-contact">{lead.contact}</span>
      )}
      <div className="lifecycle-lead-actions">
        {canAdvance && (
          <button
            className="lifecycle-action-btn lifecycle-action-advance"
            onClick={() => onAdvance(lead.id)}
            title={`Move to ${STAGE_META[STAGES[meta.order + 1]]?.label}`}
          >
            Advance &rarr;
          </button>
        )}
        {canRevert && (
          <button
            className="lifecycle-action-btn lifecycle-action-revert"
            onClick={() => onRevert(lead.id)}
            title={`Move back to ${STAGE_META[STAGES[meta.order - 1]]?.label}`}
          >
            &larr;
          </button>
        )}
        <div className="lifecycle-stage-menu-wrapper">
          <button
            className="lifecycle-action-btn lifecycle-action-menu"
            onClick={() => setMenuOpen(!menuOpen)}
            title="Set stage"
          >
            ...
          </button>
          {menuOpen && (
            <div className="lifecycle-stage-menu">
              {STAGES.map((s) => (
                <button
                  key={s}
                  className={`lifecycle-stage-menu-item${lead.stage === s ? ' lifecycle-stage-menu-item--active' : ''}`}
                  onClick={() => { onSetStage(lead.id, s); setMenuOpen(false); }}
                >
                  {STAGE_META[s].label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LeadLifecycleBoard({ byStage, advanceLead, revertLead, setLeadStage }) {
  return (
    <div className="lifecycle-board">
      {STAGES.map((stage) => {
        const leads = byStage[stage] || [];
        const meta = STAGE_META[stage];
        const colorClass = STAGE_COLORS[stage] || '';
        return (
          <div key={stage} className={`lifecycle-column ${colorClass}`}>
            <div className="lifecycle-column-header">
              <span className="lifecycle-column-title">{meta.label}</span>
              <span className="lifecycle-column-count">{leads.length}</span>
            </div>
            <div className="lifecycle-column-body">
              {leads.length === 0 ? (
                <div className="lifecycle-column-empty">No leads</div>
              ) : (
                leads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onAdvance={advanceLead}
                    onRevert={revertLead}
                    onSetStage={setLeadStage}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}

      {/* Bounced column (separate) */}
      {(byStage['bounced'] || []).length > 0 && (
        <div className="lifecycle-column lifecycle-stage-bounced">
          <div className="lifecycle-column-header">
            <span className="lifecycle-column-title">Bounced</span>
            <span className="lifecycle-column-count">{byStage['bounced'].length}</span>
          </div>
          <div className="lifecycle-column-body">
            {byStage['bounced'].map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onAdvance={advanceLead}
                onRevert={revertLead}
                onSetStage={setLeadStage}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Primary Action ──────────────────────────────────────────────────────────

function PrimaryActionBar({ funnel, aureonPrimaryAction }) {
  const derivedAction = (() => {
    if (funnel.replied > 0) return { label: `Respond to ${funnel.replied} ${funnel.replied === 1 ? 'reply' : 'replies'} now`, urgency: 'critical' };
    if (funnel.callsBooked > 0 && funnel.closed === 0) return { label: `Prepare for ${funnel.callsBooked} booked ${funnel.callsBooked === 1 ? 'call' : 'calls'}`, urgency: 'high' };
    if (funnel.sent > 0 && funnel.replied === 0) return { label: 'Monitor inbox for replies — follow up if silent 48h+', urgency: 'high' };
    return { label: 'Research and add new leads to pipeline', urgency: 'low' };
  })();
  const action = aureonPrimaryAction || derivedAction;

  return (
    <div className={`outreach-primary-action outreach-primary-action--${action.urgency || 'low'}`}>
      <span className="outreach-primary-action-label">Focus Now</span>
      <strong className="outreach-primary-action-text">{action.label}</strong>
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
  lastFetched,
}) {
  const leads = generatedPipeline?.length > 0 ? generatedPipeline : (pipelineEntries || []);
  const draftReview = useDraftReview(leads, generatedAureonDrafts);
  const pipeline = useLeadPipeline(generatedAureonDrafts, leads);

  const [activeTab, setActiveTab] = useState('lifecycle');

  const tabs = [
    { key: 'lifecycle', label: 'Lead Pipeline' },
    { key: 'drafts', label: `Draft Queue${draftReview.counts.awaiting_review > 0 ? ` (${draftReview.counts.awaiting_review})` : ''}` },
  ];

  return (
    <PageContainer
      title="AUREON Outreach Engine"
      subtitle="Pipeline control, draft review, conversion tracking"
      date={date}
      primaryAction={null}
      headerExtra={<FreshnessBadge lastFetched={lastFetched} onRefresh={() => window.dispatchEvent(new Event('nexus:refresh'))} />}
    >
      <div className="outreach-engine">
        {leads.length === 0 && draftReview.counts.all === 0 && (
          <div className="empty-state">
            <span className="empty-state-icon">◎</span>
            <p className="empty-state-text">No leads yet. Start outreach from the AUREON pipeline.</p>
          </div>
        )}

        {/* Primary Action */}
        <PrimaryActionBar funnel={pipeline.funnel} aureonPrimaryAction={aureonPrimaryAction} />

        {/* KPI Dashboard */}
        <SectionCard title="Outreach KPIs" variant="primary">
          <OutreachKPIDashboard
            funnel={pipeline.funnel}
            revenueMilestones={revenueMilestones}
          />
        </SectionCard>

        {/* Tab Switcher */}
        <div className="outreach-tab-bar">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`outreach-tab${activeTab === tab.key ? ' outreach-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'lifecycle' && (
          <SectionCard title="Lead Lifecycle" variant="primary">
            <LeadLifecycleBoard
              byStage={pipeline.byStage}
              advanceLead={pipeline.advanceLead}
              revertLead={pipeline.revertLead}
              setLeadStage={pipeline.setLeadStage}
            />
          </SectionCard>
        )}

        {activeTab === 'drafts' && (
          <SectionCard
            title={`Draft Queue${draftReview.counts.awaiting_review > 0 ? ` — ${draftReview.counts.awaiting_review} awaiting review` : ''}`}
            variant="primary"
          >
            <DraftReviewSystem draftReview={draftReview} />
          </SectionCard>
        )}

        {/* Disconnection note */}
        {!aureonConnected && (
          <p className="outreach-disconnect-note">AUREON live sync not connected — showing truth-layer data</p>
        )}
      </div>
    </PageContainer>
  );
}

export default RevenuePage;
