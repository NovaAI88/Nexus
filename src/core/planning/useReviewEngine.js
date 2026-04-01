/**
 * useReviewEngine.js — React hook wrapper for N3 review core.
 * Thin adapter: consumes useCompanyState + useTaskEngine + useActivityLog → computeReviewOutput.
 */

import { useMemo } from 'react';
import { useCompanyState } from '../adapters/useCompanyState';
import { computeReviewOutput } from './reviewEngine';

/**
 * @param {string}  todayDate   — 'YYYY-MM-DD' string for deadline calculations
 * @param {Array}   tasks       — all tasks from useTaskEngine
 * @param {Array}   activityLog — all entries from useActivityLog
 * @returns {Object} review output from computeReviewOutput
 */
export function useReviewEngine(todayDate, tasks, activityLog) {
  const { departments, _generated } = useCompanyState();

  const companyStateForReview = useMemo(
    () => ({ departments, _generated }),
    [departments, _generated]
  );

  const executionData = useMemo(
    () => ({ tasks: tasks || [], activityLog: activityLog || [] }),
    [tasks, activityLog]
  );

  const timeContext = useMemo(() => ({ todayDate }), [todayDate]);

  return useMemo(
    () => computeReviewOutput(companyStateForReview, executionData, timeContext),
    [companyStateForReview, executionData, timeContext]
  );
}
