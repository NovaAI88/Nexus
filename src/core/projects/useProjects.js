import { useState, useEffect, useCallback } from 'react';
import { load, save } from '../../storage/localStore';
import { INITIAL_PROJECTS, PROJECTS_STORAGE_KEY } from './initialState';

/**
 * useProjects
 *
 * Manages the live project list.
 * - Loads from localStorage on first render (falls back to INITIAL_PROJECTS).
 * - Persists to localStorage on every change.
 *
 * Returns:
 *   projects        — current project array
 *   setProjects     — raw setter (for bulk operations)
 *   updateProject   — update a single project by id
 *   getProject      — retrieve a single project by id
 */
export function useProjects() {
  const [projects, setProjectsState] = useState(() => {
    return load(PROJECTS_STORAGE_KEY, INITIAL_PROJECTS);
  });

  // Persist on every change.
  useEffect(() => {
    save(PROJECTS_STORAGE_KEY, projects);
  }, [projects]);

  // Wrapped setter — keeps persistence in sync even for bulk updates.
  const setProjects = useCallback((next) => {
    setProjectsState(next);
  }, []);

  // Update a single project by id, merging partial updates.
  const updateProject = useCallback((id, updates) => {
    setProjectsState((current) =>
      current.map((project) =>
        project.id === id
          ? { ...project, ...updates, lastUpdated: new Date().toISOString() }
          : project
      )
    );
  }, []);

  // Retrieve a single project by id (returns undefined if not found).
  const getProject = useCallback(
    (id) => projects.find((project) => project.id === id),
    [projects]
  );

  return { projects, setProjects, updateProject, getProject };
}
