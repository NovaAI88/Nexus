import { useEffect, useState } from 'react';
import companyData from '../../data/companyData.generated.json';

const SEED_AGENTS = companyData.agents || [];

/**
 * useAgentData — Provides the agent roster for the Agents control layer.
 *
 * Seed data comes from the build-time generated JSON (Paperclip API snapshot).
 * If the Paperclip API is reachable at runtime, refreshes automatically.
 *
 * Returns:
 *   agents      — flat array of agent objects
 *   byTier      — { executive: [], engineering: [], revenue: [] }
 *   isLive      — whether live data was successfully loaded
 *   lastFetched — ISO timestamp of last successful fetch, or null
 */
export function useAgentData() {
  const [agents, setAgents] = useState(SEED_AGENTS);
  const [isLive, setIsLive] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);

  useEffect(() => {
    const apiUrl = process.env.REACT_APP_PAPERCLIP_API_URL || 'http://127.0.0.1:3100';
    const companyId = process.env.REACT_APP_PAPERCLIP_COMPANY_ID || '';
    if (!companyId) return;

    let cancelled = false;

    async function refresh() {
      try {
        const [agentsRes, issuesRes] = await Promise.all([
          fetch(`${apiUrl}/api/companies/${companyId}/agents`),
          fetch(`${apiUrl}/api/companies/${companyId}/issues?status=in_progress,todo`),
        ]);
        if (!agentsRes.ok || !issuesRes.ok) return;

        const rawAgents = await agentsRes.json();
        const issues = await issuesRes.json();

        if (cancelled) return;

        const assignmentMap = {};
        for (const issue of issues) {
          if (issue.assigneeAgentId) {
            if (!assignmentMap[issue.assigneeAgentId]) assignmentMap[issue.assigneeAgentId] = [];
            assignmentMap[issue.assigneeAgentId].push({
              id: issue.id,
              identifier: issue.identifier,
              title: issue.title,
              status: issue.status,
              priority: issue.priority,
            });
          }
        }

        const ROLE_TIER = { ceo: 'executive', cmo: 'revenue', engineer: 'engineering' };

        const liveAgents = rawAgents
          .filter((a) => !a.metadata?.displayOnly)
          .map((a) => ({
            id: a.id,
            name: a.name,
            role: a.role,
            title: a.title || a.role,
            tier: ROLE_TIER[a.role] || 'engineering',
            status: a.status,
            adapterType: a.adapterType,
            lastHeartbeatAt: a.lastHeartbeatAt || null,
            assignments: assignmentMap[a.id] || [],
            capabilities: (a.capabilities || '').slice(0, 200),
            urlKey: a.urlKey,
          }))
          .concat(
            rawAgents
              .filter((a) => a.metadata?.displayOnly)
              .map((a) => ({
                id: a.id,
                name: a.name,
                role: a.role,
                title: a.title || a.role,
                tier: 'executive',
                status: a.status,
                adapterType: a.adapterType,
                lastHeartbeatAt: a.lastHeartbeatAt || null,
                assignments: assignmentMap[a.id] || [],
                capabilities: (a.capabilities || '').slice(0, 200),
                urlKey: a.urlKey,
                isHuman: true,
              }))
          );

        setAgents(liveAgents);
        setIsLive(true);
        setLastFetched(new Date().toISOString());
      } catch {
        // silently fall back to seed data
      }
    }

    refresh();
    const interval = setInterval(refresh, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const byTier = {
    executive: agents.filter((a) => a.tier === 'executive'),
    engineering: agents.filter((a) => a.tier === 'engineering'),
    revenue: agents.filter((a) => a.tier === 'revenue'),
  };

  return { agents, byTier, isLive, lastFetched };
}
