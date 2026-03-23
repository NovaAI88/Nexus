import { useState, useCallback } from 'react';
import { load, save } from '../../storage/localStore';

const LOG_KEY = 'nexus:activityLog';
const MAX_ENTRIES = 500; // prevent unbounded growth

/**
 * Log entry types — inferred from input text, not user-selected.
 * 'note' is the default; inference is optional and lightweight.
 */
export const LOG_TYPES = {
  NOTE: 'note',
  EXPERIMENT: 'experiment',
  DECISION: 'decision',
  PROGRESS: 'progress',
};

/**
 * Infer log entry type from text content.
 * Keeps the input frictionless — user just types, system classifies.
 */
function inferType(text) {
  const t = text.toLowerCase();
  if (/tested|result|found|experiment|tried|backtested|ran|measured/.test(t)) return LOG_TYPES.EXPERIMENT;
  if (/decided|choosing|going with|switched|changed direction|concluded|resolved/.test(t)) return LOG_TYPES.DECISION;
  if (/done|completed|finished|shipped|fixed|implemented|deployed/.test(t)) return LOG_TYPES.PROGRESS;
  return LOG_TYPES.NOTE;
}

/**
 * useActivityLog
 *
 * Improvement #2: minimal-friction activity log.
 * Single input → Enter → logged with timestamp, project tag, inferred type.
 *
 * Storage: nexus:activityLog  (array, newest first, max 500)
 *
 * LogEntry:
 * {
 *   id:         string,
 *   text:       string,
 *   type:       'note' | 'experiment' | 'decision' | 'progress',
 *   projectId:  string | null,
 *   timestamp:  ISO string,
 * }
 *
 * Returns:
 *   log                — LogEntry[] (newest first)
 *   addEntry(text, projectId?)  — add + persist
 *   removeEntry(id)   — remove + persist
 *   getProjectLog(projectId)   — filter by project
 */
export function useActivityLog() {
  const [log, setLogState] = useState(() => load(LOG_KEY, []));

  const addEntry = useCallback((text, projectId = null) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const entry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text: trimmed,
      type: inferType(trimmed),
      projectId,
      timestamp: new Date().toISOString(),
    };
    setLogState((current) => {
      const next = [entry, ...current].slice(0, MAX_ENTRIES);
      save(LOG_KEY, next);
      return next;
    });
    return entry;
  }, []);

  const removeEntry = useCallback((id) => {
    setLogState((current) => {
      const next = current.filter((e) => e.id !== id);
      save(LOG_KEY, next);
      return next;
    });
  }, []);

  const getProjectLog = useCallback((projectId) =>
    log.filter((e) => e.projectId === projectId),
    [log]
  );

  return { log, addEntry, removeEntry, getProjectLog };
}
