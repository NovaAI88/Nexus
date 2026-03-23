import { useState, useCallback } from 'react';
import { load, save } from '../../storage/localStore';

const CONSTRAINTS_KEY = 'nexus:dayConstraints';

/**
 * Default day constraints.
 * All times are "HH:MM" strings — same format used throughout the existing planner.
 */
const DEFAULT_CONSTRAINTS = {
  wake: {
    enabled: true,
    time: '07:30',    // wake-up / day-start time
  },
  sideJob: {
    enabled: true,
    start: '18:00',
    end: '21:00',
    label: 'Side Job',
  },
  fitness: {
    enabled: false,
    start: '17:00',
    end: '18:00',
    label: 'Fitness',
  },
  stopWork: {
    enabled: true,
    time: '22:00',   // hard stop — no new work blocks recommended after this
  },
};

/**
 * useDayConstraints
 *
 * Manages editable, persistent day constraints for the Today planner.
 *
 * Constraints control:
 *   - Day start (wake)
 *   - Fixed side-job block (optional)
 *   - Fitness block (optional)
 *   - Hard stop-work time (no new work recommendations after this)
 *
 * These replace the hardcoded nexusData.inputs.wakeTime / sideJobBlocks
 * for the live planner. The existing static nexusData values are left
 * untouched as fallback for any legacy code path.
 *
 * Returns:
 *   constraints         — current constraints object
 *   updateConstraint    — updateConstraint(key, patch) — merges patch into constraints[key]
 *   toggleConstraint    — toggleConstraint(key) — flips constraints[key].enabled
 *   resetConstraints    — reset to DEFAULT_CONSTRAINTS
 */
export function useDayConstraints() {
  const [constraints, setConstraints] = useState(() =>
    load(CONSTRAINTS_KEY, DEFAULT_CONSTRAINTS)
  );

  const persist = useCallback((next) => {
    setConstraints(next);
    save(CONSTRAINTS_KEY, next);
  }, []);

  const updateConstraint = useCallback((key, patch) => {
    setConstraints((current) => {
      const next = { ...current, [key]: { ...current[key], ...patch } };
      save(CONSTRAINTS_KEY, next);
      return next;
    });
  }, []);

  const toggleConstraint = useCallback((key) => {
    setConstraints((current) => {
      const next = {
        ...current,
        [key]: { ...current[key], enabled: !current[key].enabled },
      };
      save(CONSTRAINTS_KEY, next);
      return next;
    });
  }, []);

  const resetConstraints = useCallback(() => {
    persist(DEFAULT_CONSTRAINTS);
  }, [persist]);

  return { constraints, updateConstraint, toggleConstraint, resetConstraints };
}
