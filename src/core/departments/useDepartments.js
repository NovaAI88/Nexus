import { useState, useEffect, useCallback } from 'react';
import { load, save } from '../../storage/localStore';
import { INITIAL_DEPARTMENTS, DEPARTMENTS_STORAGE_KEY } from './initialState';

/**
 * useDepartments
 *
 * Manages the live department list.
 * - Loads from localStorage on first render (falls back to INITIAL_DEPARTMENTS).
 * - Persists to localStorage on every change.
 *
 * Returns:
 *   departments       — current department array
 *   setDepartments    — raw setter (for bulk operations)
 *   getDepartment     — retrieve a single department by id
 */
export function useDepartments() {
  const [departments, setDepartmentsState] = useState(() => {
    return load(DEPARTMENTS_STORAGE_KEY, INITIAL_DEPARTMENTS);
  });

  // Persist on every change.
  useEffect(() => {
    save(DEPARTMENTS_STORAGE_KEY, departments);
  }, [departments]);

  const setDepartments = useCallback((next) => {
    setDepartmentsState(next);
  }, []);

  // Retrieve a single department by id (returns undefined if not found).
  const getDepartment = useCallback(
    (id) => departments.find((dept) => dept.id === id),
    [departments]
  );

  return { departments, setDepartments, getDepartment };
}
