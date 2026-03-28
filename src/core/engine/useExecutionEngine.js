import { useState, useCallback, useEffect, useMemo } from 'react';
import { computeExecutionOutput } from './executionEngine';

const COOLDOWN_MS = 60 * 60 * 1000;

export function useExecutionEngine(companyState, timeContext) {
  const [dismissed, setDismissed] = useState(() => new Map());

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setDismissed((current) => {
        const next = new Map(current);
        let changed = false;
        for (const [id, ts] of next) {
          if (now - ts > COOLDOWN_MS) {
            next.delete(id);
            changed = true;
          }
        }
        return changed ? next : current;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const dismissDept = useCallback((deptId) => {
    setDismissed((current) => {
      const next = new Map(current);
      next.set(deptId, Date.now());
      return next;
    });
  }, []);

  const dismissedSet = useMemo(() => new Set(dismissed.keys()), [dismissed]);

  const output = useMemo(
    () => computeExecutionOutput(companyState, timeContext, dismissedSet),
    [companyState, timeContext, dismissedSet]
  );

  return {
    ...output,
    dismissDept,
    dismissedDepts: dismissedSet,
  };
}
