import { useState, useCallback, useMemo } from 'react';
import { load, save } from '../../storage/localStore';

const STORAGE_KEY = 'nexus:lead-pipeline';

// Canonical stage order for the AUREON outreach lifecycle
export const STAGES = ['researched', 'dm-sent', 'replied', 'call-booked', 'closed'];

export const STAGE_META = {
  'researched':  { label: 'Researched',  order: 0 },
  'dm-sent':     { label: 'DM Sent',     order: 1 },
  'replied':     { label: 'Replied',     order: 2 },
  'call-booked': { label: 'Call Booked', order: 3 },
  'closed':      { label: 'Closed',      order: 4 },
  'bounced':     { label: 'Bounced',     order: -1 },
};

// Map raw statuses from aureonDrafts / pipeline data into canonical stages
function deriveStage(rawStatus) {
  const s = (rawStatus || '').toLowerCase().replace(/[^\w\s-]/g, '');
  if (s.includes('closed') || s.includes('deal')) return 'closed';
  if (s.includes('call') || s.includes('hot') || s === 'call-booked') return 'call-booked';
  if (s.includes('replied') || s.includes('responded')) return 'replied';
  if (s.includes('sent') || s.includes('dm')) return 'dm-sent';
  if (s.includes('bounced')) return 'bounced';
  return 'researched';
}

function loadOverrides() {
  return load(STORAGE_KEY, {});
}

/**
 * Manages the AUREON lead pipeline with one-click stage advancement.
 *
 * Merges data from aureonDrafts (queue.json) and pipeline (truth layer)
 * with localStorage overrides for stage changes made in the UI.
 */
export function useLeadPipeline(aureonDrafts, pipelineLeads) {
  const [overrides, setOverrides] = useState(() => loadOverrides());

  const persistOverrides = useCallback((next) => {
    save(STORAGE_KEY, next);
    setOverrides(next);
  }, []);

  // Build unified lead list: prefer aureonDrafts, fall back to pipeline
  const leads = useMemo(() => {
    const drafts = Array.isArray(aureonDrafts) && aureonDrafts.length > 0
      ? aureonDrafts
      : [];

    const pipeline = Array.isArray(pipelineLeads) ? pipelineLeads : [];

    if (drafts.length > 0) {
      // Build a lookup for pipeline metadata (score, founder, country)
      const pipelineByCompany = {};
      pipeline.forEach((p) => {
        const key = (p.company || '').toLowerCase().trim();
        if (key) pipelineByCompany[key] = p;
      });

      return drafts.map((d) => {
        const co = (d.company || '').toLowerCase().trim();
        const pl = pipelineByCompany[co] || {};
        const baseStage = deriveStage(d.status);
        const overrideStage = overrides[d.id];
        return {
          id: d.id,
          company: d.company || d.to || '(unknown)',
          founder: pl.founder || '',
          contact: d.to || pl.contact || '',
          country: pl.country || '',
          score: pl.score || null,
          channel: 'Email',
          stage: overrideStage || baseStage,
          baseStage,
          sentAt: d.sentAt || d.approvedAt || null,
          notes: pl.notes || '',
        };
      });
    }

    // Fallback: pipeline only
    return pipeline.map((p, i) => {
      const id = `pipeline-${p._ || i}`;
      const baseStage = deriveStage(p.status);
      const overrideStage = overrides[id];
      return {
        id,
        company: p.company || '(unknown)',
        founder: p.founder || '',
        contact: p.contact || '',
        country: p.country || '',
        score: p.score || null,
        channel: p.channel || 'Email',
        stage: overrideStage || baseStage,
        baseStage,
        sentAt: null,
        notes: p.notes || '',
      };
    });
  }, [aureonDrafts, pipelineLeads, overrides]);

  // Group leads by stage
  const byStage = useMemo(() => {
    const groups = {};
    STAGES.forEach((s) => { groups[s] = []; });
    groups['bounced'] = [];
    leads.forEach((lead) => {
      const bucket = groups[lead.stage] || groups['researched'];
      bucket.push(lead);
    });
    return groups;
  }, [leads]);

  // Conversion funnel stats
  const funnel = useMemo(() => {
    const total = leads.length;
    const bounced = byStage['bounced']?.length || 0;
    const sent = leads.filter((l) => STAGE_META[l.stage]?.order >= 1).length;
    const replied = leads.filter((l) => STAGE_META[l.stage]?.order >= 2).length;
    const callsBooked = leads.filter((l) => STAGE_META[l.stage]?.order >= 3).length;
    const closed = leads.filter((l) => STAGE_META[l.stage]?.order >= 4).length;

    const dmToReply = sent > 0 ? ((replied / sent) * 100).toFixed(1) : '0.0';
    const replyToCall = replied > 0 ? ((callsBooked / replied) * 100).toFixed(1) : '0.0';
    const callToClose = callsBooked > 0 ? ((closed / callsBooked) * 100).toFixed(1) : '0.0';
    const overallConversion = total > 0 ? ((closed / total) * 100).toFixed(1) : '0.0';

    return {
      total,
      bounced,
      sent,
      replied,
      callsBooked,
      closed,
      dmToReply,
      replyToCall,
      callToClose,
      overallConversion,
    };
  }, [leads, byStage]);

  // Advance a lead to the next stage
  const advanceLead = useCallback((leadId) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;
    const currentOrder = STAGE_META[lead.stage]?.order ?? 0;
    const nextStage = STAGES.find((s) => STAGE_META[s].order === currentOrder + 1);
    if (!nextStage) return;
    persistOverrides({ ...overrides, [leadId]: nextStage });
  }, [leads, overrides, persistOverrides]);

  // Revert a lead to the previous stage
  const revertLead = useCallback((leadId) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;
    const currentOrder = STAGE_META[lead.stage]?.order ?? 0;
    if (currentOrder <= 0) return;
    const prevStage = STAGES.find((s) => STAGE_META[s].order === currentOrder - 1);
    if (!prevStage) return;
    persistOverrides({ ...overrides, [leadId]: prevStage });
  }, [leads, overrides, persistOverrides]);

  // Set a lead to a specific stage
  const setLeadStage = useCallback((leadId, stage) => {
    if (!STAGE_META[stage]) return;
    persistOverrides({ ...overrides, [leadId]: stage });
  }, [overrides, persistOverrides]);

  // Reset a lead to its original derived stage
  const resetLead = useCallback((leadId) => {
    const next = { ...overrides };
    delete next[leadId];
    persistOverrides(next);
  }, [overrides, persistOverrides]);

  return {
    leads,
    byStage,
    funnel,
    advanceLead,
    revertLead,
    setLeadStage,
    resetLead,
  };
}
