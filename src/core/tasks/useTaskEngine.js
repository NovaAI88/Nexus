import { useState, useCallback } from 'react';
import { load, save } from '../../storage/localStore';

const TASKS_KEY = 'nexus:tasks';

/**
 * Task statuses.
 */
export const TASK_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
  CANCELLED: 'cancelled',
};

/**
 * Task priorities.
 */
export const TASK_PRIORITY = {
  HIGH: 'high',
  NORMAL: 'normal',
  LOW: 'low',
};

/**
 * Generate a stable task id.
 */
function makeTaskId() {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * useTaskEngine
 *
 * Phase 8: persistent task engine for NEXUS.
 *
 * A Task:
 * {
 *   id:          string,
 *   projectId:   string | null,   // which project this belongs to
 *   date:        string | null,   // 'YYYY-MM-DD' — if scoped to a day
 *   title:       string,
 *   notes:       string,
 *   status:      'open' | 'in_progress' | 'done' | 'cancelled',
 *   priority:    'high' | 'normal' | 'low',
 *   createdAt:   ISO string,
 *   updatedAt:   ISO string,
 *   completedAt: ISO string | null,
 * }
 *
 * Storage: nexus:tasks  (flat array)
 *
 * Returns:
 *   tasks                          — all tasks
 *   getTasksForDate(date)          — tasks scoped to a day (across all projects)
 *   getTasksForProject(projectId)  — all tasks for a project
 *   addTask({ projectId, date, title, notes, priority })
 *   updateTask(id, patch)
 *   setTaskStatus(id, status)      — shortcut for status updates
 *   removeTask(id)
 */
export function useTaskEngine() {
  const [tasks, setTasksState] = useState(() => load(TASKS_KEY, []));

  const persist = useCallback((next) => {
    setTasksState(next);
    save(TASKS_KEY, next);
  }, []);

  // ── Queries ─────────────────────────────────────────────────────────────────

  const getTasksForDate = useCallback((date) =>
    tasks.filter((t) => t.date === date && t.status !== TASK_STATUS.CANCELLED),
    [tasks]
  );

  const getTasksForProject = useCallback((projectId) =>
    tasks.filter((t) => t.projectId === projectId && t.status !== TASK_STATUS.CANCELLED),
    [tasks]
  );

  // ── Mutations ────────────────────────────────────────────────────────────────

  const addTask = useCallback(({
    projectId = null,
    date = null,
    title,
    notes = '',
    priority = TASK_PRIORITY.NORMAL,
  }) => {
    const now = new Date().toISOString();
    const task = {
      id: makeTaskId(),
      projectId,
      date,
      title: title.trim(),
      notes,
      status: TASK_STATUS.OPEN,
      priority,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };
    persist((prev) => {
      const next = [...prev, task];
      save(TASKS_KEY, next);
      return next;
    });
    return task;
  }, [persist]);

  const updateTask = useCallback((id, patch) => {
    setTasksState((prev) => {
      const next = prev.map((t) =>
        t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t
      );
      save(TASKS_KEY, next);
      return next;
    });
  }, []);

  const setTaskStatus = useCallback((id, status) => {
    setTasksState((prev) => {
      const now = new Date().toISOString();
      const next = prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status,
              updatedAt: now,
              completedAt: status === TASK_STATUS.DONE ? now : t.completedAt,
            }
          : t
      );
      save(TASKS_KEY, next);
      return next;
    });
  }, []);

  const removeTask = useCallback((id) => {
    setTasksState((prev) => {
      const next = prev.filter((t) => t.id !== id);
      save(TASKS_KEY, next);
      return next;
    });
  }, []);

  return {
    tasks,
    getTasksForDate,
    getTasksForProject,
    addTask,
    updateTask,
    setTaskStatus,
    removeTask,
  };
}
