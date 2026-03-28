import { useState, useCallback } from 'react';
import { load, save } from '../../storage/localStore';
import { INITIAL_COMPANY_STATE } from './initialCompanyState';

const COMPANY_STATE_KEY = 'nexus:company-state';

export function useCompanyState() {
  const [state, setState] = useState(() => {
    const stored = load(COMPANY_STATE_KEY, null);
    if (!stored) {
      save(COMPANY_STATE_KEY, INITIAL_COMPANY_STATE);
      return INITIAL_COMPANY_STATE;
    }
    return stored;
  });

  const isLoaded = state !== null;
  const departments = isLoaded ? state.departments : [];

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
    updateDepartment,
    getDepartment,
  };
}
