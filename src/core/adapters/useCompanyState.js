import { useState, useCallback, useMemo } from 'react';
import { load, save } from '../../storage/localStore';
import { INITIAL_COMPANY_STATE } from './initialCompanyState';

const COMPANY_STATE_KEY = 'nexus:company-state';

/**
 * Determine if stored state is stale relative to freshly-generated data.
 *
 * Staleness conditions:
 *   1. Schema version mismatch — shape has changed, must reset.
 *   2. Generated data is newer — truth files were re-read since last store.
 */
function isStaleState(stored) {
  if (!stored) return true;

  // Check schema version
  if (stored._schemaVersion !== INITIAL_COMPANY_STATE._schemaVersion) {
    return true;
  }

  // Check generated data freshness
  const storedGenerated = stored._generated?.lastGenerated;
  const freshGenerated = INITIAL_COMPANY_STATE._generated?.lastGenerated;
  if (storedGenerated && freshGenerated && storedGenerated < freshGenerated) {
    return true;
  }

  return false;
}

/**
 * Merge fresh generated data into a stored state object,
 * preserving any manual user edits (currentState, nextAction overrides).
 *
 * We merge at the department level:
 *   - Auto-update `phase` from fresh generated data (always truth-layer driven)
 *   - Preserve user-edited `currentState` / `nextAction` if they differ from
 *     what the previous generated data would have produced (i.e. manual edits)
 *   - Always update `_generated` and `_schemaVersion` from fresh state
 */
function mergeFreshIntoStored(stored) {
  const fresh = INITIAL_COMPANY_STATE;
  const freshDeptMap = Object.fromEntries(fresh.departments.map((d) => [d.id, d]));

  const mergedDepts = stored.departments.map((storedDept) => {
    const freshDept = freshDeptMap[storedDept.id];
    if (!freshDept) return storedDept;

    // Always take phase from fresh truth
    // For currentState/nextAction: if stored matches what the old generated
    // data would have set (i.e. no manual edit), take the fresh value.
    // Simplest heuristic: if stored lastUpdated is older than fresh lastUpdated, override.
    const storedAge = new Date(storedDept.lastUpdated || 0).getTime();
    const freshAge = new Date(freshDept.lastUpdated || 0).getTime();
    const userHasEdited = storedAge > freshAge;

    return {
      ...storedDept,
      phase: freshDept.phase,
      blockers: freshDept.blockers,
      // Only override currentState/nextAction if user hasn't manually edited
      currentState: userHasEdited ? storedDept.currentState : freshDept.currentState,
      nextAction: userHasEdited ? storedDept.nextAction : freshDept.nextAction,
    };
  });

  return {
    ...stored,
    departments: mergedDepts,
    _schemaVersion: fresh._schemaVersion,
    _generated: fresh._generated,
  };
}

export function useCompanyState() {
  const [state, setState] = useState(() => {
    const stored = load(COMPANY_STATE_KEY, null);

    // First-time init or stale schema/generated data
    if (!stored || isStaleState(stored)) {
      const initialState = stored
        ? mergeFreshIntoStored(stored)   // preserve user edits, refresh generated fields
        : INITIAL_COMPANY_STATE;         // clean start
      save(COMPANY_STATE_KEY, initialState);
      return initialState;
    }

    return stored;
  });

  const isLoaded = state !== null;
  const departments = useMemo(() => (isLoaded ? state.departments : []), [isLoaded, state]);
  const _generated = useMemo(() => (isLoaded ? state._generated ?? {} : {}), [isLoaded, state]);

  const updateDepartment = useCallback((id, patch) => {
    setState((current) => {
      const next = {
        ...current,
        departments: current.departments.map((d) => (
          d.id === id
            ? { ...d, ...patch, lastUpdated: new Date().toISOString() }
            : d
        )),
      };
      save(COMPANY_STATE_KEY, next);
      return next;
    });
  }, []);

  const getDepartment = useCallback(
    (id) => departments.find((d) => d.id === id) ?? null,
    [departments]
  );

  return {
    isLoaded,
    departments,
    _generated,
    updateDepartment,
    getDepartment,
  };
}
