import { useState, useCallback } from 'react';
import { load, save } from '../../storage/localStore';

const FOCUS_PROJECT_KEY = 'nexus:focusProjectId';

/**
 * useFocusProject
 *
 * Tracks which project is the current active focus.
 * Exactly one project (or none) can be in focus at a time.
 * Persisted to localStorage so focus survives page reloads.
 *
 * Consumed by:
 *   - ProjectCard (Set as Focus / In Focus controls)
 *   - ProjectsContext (available to Today, Dashboard, planner — future phases)
 *
 * Returns:
 *   focusProjectId    — string id of the focused project, or null
 *   setFocusProject   — set focus to a project id (clears previous focus)
 *   clearFocusProject — clear focus entirely
 */
export function useFocusProject() {
  const [focusProjectId, setFocusProjectIdState] = useState(() =>
    load(FOCUS_PROJECT_KEY, null)
  );

  const setFocusProject = useCallback((id) => {
    setFocusProjectIdState(id);
    save(FOCUS_PROJECT_KEY, id);
  }, []);

  const clearFocusProject = useCallback(() => {
    setFocusProjectIdState(null);
    save(FOCUS_PROJECT_KEY, null);
  }, []);

  return { focusProjectId, setFocusProject, clearFocusProject };
}
