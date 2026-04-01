/**
 * usePlanningEngine.js — React hook wrapper for N2 planning core.
 * Thin adapter: consumes useCompanyState + todayDate → computePlanningOutput.
 */

import { useMemo } from 'react';
import { useCompanyState } from '../adapters/useCompanyState';
import { computePlanningOutput } from './planningEngine';

/**
 * @param {string}      todayDate     — 'YYYY-MM-DD' string for deadline calculations
 * @param {Object|null} healthContext — from computeHealthContext (N5), optional
 * @returns {Object} planning output from computePlanningOutput
 */
export function usePlanningEngine(todayDate, healthContext = null) {
  const { departments, _generated } = useCompanyState();

  const companyStateForPlanning = useMemo(
    () => ({ departments, _generated }),
    [departments, _generated]
  );

  const timeContext = useMemo(() => ({ todayDate }), [todayDate]);

  return useMemo(
    () => computePlanningOutput(companyStateForPlanning, timeContext, healthContext),
    [companyStateForPlanning, timeContext, healthContext]
  );
}
