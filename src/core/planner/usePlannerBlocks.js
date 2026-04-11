import { useState, useCallback } from 'react';
import { load, save } from '../../storage/localStore';

const BLOCKS_KEY = 'nexus:plannerBlocks';
const STOP_WORK_KEY = 'nexus:stopWork';
const WEEKLY_TEMPLATE_KEY = 'nexus:weeklyTemplate';

/**
 * Block types available for flexible planning.
 */
export const BLOCK_TYPES = [
  { id: 'work',    label: 'Work',    color: 'accent' },
  { id: 'job',     label: 'Job',     color: 'warn' },
  { id: 'fitness', label: 'Fitness', color: 'green' },
  { id: 'life',    label: 'Life',    color: 'neutral' },
  { id: 'custom',  label: 'Custom',  color: 'neutral' },
];

/**
 * Default weekly template — applied when no day-specific blocks exist.
 * Each entry: { dayOfWeek (0=Sun…6=Sat), type, label, start, end }
 * Empty by default — user builds their own.
 */
const DEFAULT_WEEKLY_TEMPLATE = [];

/**
 * Default stop-work rule.
 */
const DEFAULT_STOP_WORK = { enabled: true, time: '22:00' };

/**
 * Generate a stable block id.
 */
function makeBlockId(date, type) {
  return `block-${date}-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Get the day-of-week index (0=Sun…6=Sat) from a 'YYYY-MM-DD' string.
 */
function getDayOfWeek(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

/**
 * usePlannerBlocks
 *
 * Phase 7: flexible block-based planning system.
 * Replaces useDayConstraints (Phase 6).
 *
 * Storage:
 *   nexus:plannerBlocks      — { [date: string]: PlannerBlock[] }
 *   nexus:weeklyTemplate     — WeeklyTemplateEntry[]
 *   nexus:stopWork           — { enabled: boolean, time: string }
 *
 * A PlannerBlock:
 * {
 *   id:       string,
 *   date:     string  ('YYYY-MM-DD'),
 *   type:     'work' | 'job' | 'fitness' | 'life' | 'custom',
 *   label:    string,
 *   start:    string  ('HH:MM'),
 *   end:      string  ('HH:MM'),
 * }
 *
 * Returns:
 *   getPlannerBlocks(date)               → PlannerBlock[] for that day
 *   addBlock(date, { type, label, start, end })   → adds + persists
 *   updateBlock(date, blockId, patch)    → merges patch + persists
 *   removeBlock(date, blockId)           → removes + persists
 *   weeklyTemplate / setWeeklyTemplate  — repeated blocks
 *   stopWork / setStopWork              — hard stop rule
 */
export function usePlannerBlocks() {
  // All blocks stored as { [date]: PlannerBlock[] }
  const [blocksByDate, setBlocksByDate] = useState(() =>
    load(BLOCKS_KEY, {})
  );

  const [weeklyTemplate, setWeeklyTemplateState] = useState(() =>
    load(WEEKLY_TEMPLATE_KEY, DEFAULT_WEEKLY_TEMPLATE)
  );

  const [stopWork, setStopWorkState] = useState(() =>
    load(STOP_WORK_KEY, DEFAULT_STOP_WORK)
  );

  // ── Internal persist helpers ────────────────────────────────────────────────

  const persistBlocks = useCallback((next) => {
    setBlocksByDate(next);
    save(BLOCKS_KEY, next);
  }, []);

  // eslint-disable-next-line no-unused-vars
  const persistTemplate = useCallback((next) => {
    setWeeklyTemplateState(next);
    save(WEEKLY_TEMPLATE_KEY, next);
  }, []);

  // eslint-disable-next-line no-unused-vars
  const persistStopWork = useCallback((next) => {
    setStopWorkState(next);
    save(STOP_WORK_KEY, next);
  }, []);

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Get all planner blocks for a specific date.
   * If no day-specific blocks exist, materialise from the weekly template.
   * Once materialised, they become independent per-day instances.
   */
  const getPlannerBlocks = useCallback((date) => {
    const existing = blocksByDate[date];
    if (existing !== undefined) return existing;

    // Materialise from weekly template if any entries match this day-of-week.
    const dow = getDayOfWeek(date);
    const templated = weeklyTemplate
      .filter((entry) => entry.dayOfWeek === dow)
      .map((entry) => ({
        id: makeBlockId(date, entry.type),
        date,
        type: entry.type,
        label: entry.label,
        start: entry.start,
        end: entry.end,
      }));

    if (templated.length > 0) {
      // Save materialised blocks so edits are isolated to this day.
      const next = { ...blocksByDate, [date]: templated };
      persistBlocks(next);
      return templated;
    }

    return [];
  }, [blocksByDate, weeklyTemplate, persistBlocks]);

  /**
   * Add a block to a specific date.
   */
  const addBlock = useCallback((date, { type = 'work', label = '', start, end }) => {
    const newBlock = {
      id: makeBlockId(date, type),
      date,
      type,
      label: label || BLOCK_TYPES.find((t) => t.id === type)?.label || 'Block',
      start,
      end,
    };
    setBlocksByDate((current) => {
      const dayBlocks = current[date] ?? [];
      const next = { ...current, [date]: [...dayBlocks, newBlock] };
      save(BLOCKS_KEY, next);
      return next;
    });
    return newBlock;
  }, []);

  /**
   * Update a block (merge patch).
   */
  const updateBlock = useCallback((date, blockId, patch) => {
    setBlocksByDate((current) => {
      const dayBlocks = (current[date] ?? []).map((b) =>
        b.id === blockId ? { ...b, ...patch } : b
      );
      const next = { ...current, [date]: dayBlocks };
      save(BLOCKS_KEY, next);
      return next;
    });
  }, []);

  /**
   * Remove a block.
   */
  const removeBlock = useCallback((date, blockId) => {
    setBlocksByDate((current) => {
      const dayBlocks = (current[date] ?? []).filter((b) => b.id !== blockId);
      const next = { ...current, [date]: dayBlocks };
      save(BLOCKS_KEY, next);
      return next;
    });
  }, []);

  /**
   * Add a weekly template entry.
   * { dayOfWeek, type, label, start, end }
   */
  const addTemplateEntry = useCallback((entry) => {
    setWeeklyTemplateState((current) => {
      const next = [...current, {
        id: `tpl-${entry.dayOfWeek}-${entry.type}-${Date.now()}`,
        ...entry,
      }];
      save(WEEKLY_TEMPLATE_KEY, next);
      return next;
    });
  }, []);

  /**
   * Remove a weekly template entry by id.
   */
  const removeTemplateEntry = useCallback((id) => {
    setWeeklyTemplateState((current) => {
      const next = current.filter((e) => e.id !== id);
      save(WEEKLY_TEMPLATE_KEY, next);
      return next;
    });
  }, []);

  /**
   * Update stop-work rule.
   */
  const setStopWork = useCallback((patch) => {
    setStopWorkState((current) => {
      const next = { ...current, ...patch };
      save(STOP_WORK_KEY, next);
      return next;
    });
  }, []);

  return {
    getPlannerBlocks,
    addBlock,
    updateBlock,
    removeBlock,
    weeklyTemplate,
    addTemplateEntry,
    removeTemplateEntry,
    stopWork,
    setStopWork,
  };
}
