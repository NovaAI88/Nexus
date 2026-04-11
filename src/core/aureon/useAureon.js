import { useState, useCallback, useMemo } from 'react';
import { load, save } from '../../storage/localStore';

const STORAGE_KEY = 'nexus:aureon';

function loadAureonState() {
  try {
    const parsed = load(STORAGE_KEY, null);
    if (!parsed || !Array.isArray(parsed.pipelineEntries)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function useAureon() {
  const [aureonState, setAureonState] = useState(() => loadAureonState());
  const [lastFetched] = useState(() => new Date().toISOString());

  const isConnected = aureonState !== null;
  const pipelineEntries = useMemo(
    () => (aureonState !== null ? aureonState.pipelineEntries : []),
    [aureonState]
  );

  const updatePipeline = useCallback((entries) => {
    const next = { pipelineEntries: entries };
    save(STORAGE_KEY, next);
    setAureonState(next);
  }, []);

  const addEntry = useCallback((entry) => {
    const entries = [...pipelineEntries, { ...entry, id: `aureon-${Date.now()}` }];
    updatePipeline(entries);
  }, [pipelineEntries, updatePipeline]);

  const updateEntry = useCallback((id, patch) => {
    const entries = pipelineEntries.map((e) => (e.id === id ? { ...e, ...patch } : e));
    updatePipeline(entries);
  }, [pipelineEntries, updatePipeline]);

  const removeEntry = useCallback((id) => {
    updatePipeline(pipelineEntries.filter((e) => e.id !== id));
  }, [pipelineEntries, updatePipeline]);

  const stats = useMemo(() => {
    if (!isConnected) return null;
    return {
      leads: pipelineEntries.length,
      contacted: pipelineEntries.filter((e) => ['contacted', 'replied', 'call-booked'].includes(e.stage)).length,
      replies: pipelineEntries.filter((e) => ['replied', 'call-booked'].includes(e.stage)).length,
      callsBooked: pipelineEntries.filter((e) => e.stage === 'call-booked').length,
    };
  }, [isConnected, pipelineEntries]);

  const primaryAction = useMemo(() => {
    if (!isConnected || pipelineEntries.length === 0) return null;
    const replies = pipelineEntries.filter((e) => ['replied', 'call-booked'].includes(e.stage)).length;
    const fu1Due = pipelineEntries.filter((e) => e.followUp1Due).length;
    const fu2Due = pipelineEntries.filter((e) => e.followUp2Due).length;
    if (replies > 0) return { label: `Respond to ${replies} replies NOW`, urgency: 'critical' };
    if (fu1Due > 0) return { label: `Send FU1 to ${fu1Due} leads`, urgency: 'high' };
    if (fu2Due > 0) return { label: `Send FU2 to ${fu2Due} leads`, urgency: 'high' };
    return { label: 'Monitor for replies', urgency: 'low' };
  }, [isConnected, pipelineEntries]);

  return {
    isConnected,
    pipelineEntries,
    stats,
    primaryAction,
    lastFetched,
    addEntry,
    updateEntry,
    removeEntry,
  };
}

export default useAureon;
