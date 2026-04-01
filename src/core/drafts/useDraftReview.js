import { useCallback, useMemo, useState } from 'react';

// Draft status lifecycle
export const DRAFT_STATUSES = {
  GENERATED: 'generated',
  AWAITING_REVIEW: 'awaiting_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ARCHIVED: 'archived',
};

export const DRAFT_STATUS_LABELS = {
  generated: 'Generated',
  awaiting_review: 'Awaiting Review',
  approved: 'Approved',
  rejected: 'Rejected',
  archived: 'Archived',
};

const STORAGE_KEY = 'nexus_draft_statuses';

function loadStoredStatuses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredStatuses(statuses) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(statuses));
  } catch { /* ignore */ }
}

// Derive a subject line from lead data
export function generateSubject(lead) {
  if (!lead.company) return 'Introduction — OpenClaw Gateway';
  return `Growth opportunity — ${lead.company}`;
}

// Derive a first-name salutation from founder field
function firstName(founderStr) {
  if (!founderStr) return 'there';
  const parts = founderStr.split(/[/,&]/)[0].trim().split(' ');
  return parts[0] || 'there';
}

// Generate a plausible outreach email body from lead data
export function generateBody(lead) {
  const name = firstName(lead.founder);
  const company = lead.company || 'your brand';
  const contextNote = lead.notes ? `\n\nContext: ${lead.notes}` : '';

  return `Hi ${name},

I came across ${company} and was impressed by what you're building — the positioning feels differentiated and the brand has strong founder energy.

I run OpenClaw Gateway, a small team that helps founder-led brands accelerate growth through strategic outreach and conversion systems. We work selectively with a few companies per month to drive measurable pipeline results.

I'd love to share a quick overview of how we've been generating results for similar brands, and explore if there's a fit.

Would you have 20 minutes this week for a short call?${contextNote}

Best,
Nicholas
OpenClaw Gateway`;
}

// Build structured draft objects from pipeline leads
export function buildDrafts(leads, storedStatuses) {
  return leads
    .filter((l) => l.draft === '✅' || (l.status && l.status.toLowerCase().includes('draft')))
    .map((lead) => {
      const id = `draft_${lead._}`;
      const storedStatus = storedStatuses[id];
      return {
        id,
        leadId: lead._,
        company: lead.company,
        founder: lead.founder,
        recipient: lead.founder
          ? `${lead.founder} — ${lead.company}`
          : lead.company,
        channel: lead.channel || 'Email',
        subject: generateSubject(lead),
        body: generateBody(lead),
        score: lead.score,
        notes: lead.notes,
        rawStatus: lead.status,
        draftStatus: storedStatus || DRAFT_STATUSES.AWAITING_REVIEW,
      };
    });
}

export function useDraftReview(leads) {
  const [storedStatuses, setStoredStatuses] = useState(() => loadStoredStatuses());
  const [selectedDraftId, setSelectedDraftId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('awaiting_review');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [notes, setNotes] = useState({});

  const drafts = useMemo(() => buildDrafts(leads, storedStatuses), [leads, storedStatuses]);

  const updateStatus = useCallback((draftId, newStatus) => {
    setStoredStatuses((prev) => {
      const next = { ...prev, [draftId]: newStatus };
      saveStoredStatuses(next);
      return next;
    });
    // Auto-deselect after action
    if (newStatus !== DRAFT_STATUSES.AWAITING_REVIEW) {
      setSelectedDraftId((prev) => (prev === draftId ? null : prev));
    }
  }, []);

  const approve = useCallback((draftId) => updateStatus(draftId, DRAFT_STATUSES.APPROVED), [updateStatus]);
  const reject = useCallback((draftId) => updateStatus(draftId, DRAFT_STATUSES.REJECTED), [updateStatus]);
  const archive = useCallback((draftId) => updateStatus(draftId, DRAFT_STATUSES.ARCHIVED), [updateStatus]);
  const returnToReview = useCallback((draftId) => updateStatus(draftId, DRAFT_STATUSES.AWAITING_REVIEW), [updateStatus]);

  const saveNote = useCallback((draftId, noteText) => {
    setNotes((prev) => ({ ...prev, [draftId]: noteText }));
    setEditingNoteId(null);
  }, []);

  const filteredDrafts = useMemo(() => {
    if (activeFilter === 'all') return drafts;
    return drafts.filter((d) => d.draftStatus === activeFilter);
  }, [drafts, activeFilter]);

  const counts = useMemo(() => ({
    all: drafts.length,
    awaiting_review: drafts.filter((d) => d.draftStatus === DRAFT_STATUSES.AWAITING_REVIEW).length,
    approved: drafts.filter((d) => d.draftStatus === DRAFT_STATUSES.APPROVED).length,
    rejected: drafts.filter((d) => d.draftStatus === DRAFT_STATUSES.REJECTED).length,
    archived: drafts.filter((d) => d.draftStatus === DRAFT_STATUSES.ARCHIVED).length,
  }), [drafts]);

  const selectedDraft = useMemo(
    () => drafts.find((d) => d.id === selectedDraftId) || null,
    [drafts, selectedDraftId]
  );

  return {
    drafts,
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
  };
}
