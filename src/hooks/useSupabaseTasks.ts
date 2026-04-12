import { useState, useEffect, useCallback } from 'react';
import { supabase, DbTask } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// ── Local type alias ──────────────────────────────────────────────────────────
// Keep the same shape as the existing useTaskEngine hook so pages work with both.
export type Task = {
  id: string;
  projectId: string | null;
  date: string | null;
  title: string;
  notes: string;
  status: 'open' | 'in_progress' | 'done' | 'cancelled';
  priority: 'high' | 'normal' | 'low';
  estimate?: number;
  timeSlot?: string | null;
  subtaskCount?: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

// ── DB ↔ App shape adapters ───────────────────────────────────────────────────

function fromDb(row: DbTask): Task {
  return {
    id:           row.id,
    projectId:    row.project_id,
    date:         row.date,
    title:        row.title,
    notes:        row.notes,
    status:       row.status,
    priority:     row.priority,
    estimate:     row.estimate ?? undefined,
    timeSlot:     row.time_slot,
    subtaskCount: row.subtask_count,
    createdAt:    row.created_at,
    updatedAt:    row.updated_at,
    completedAt:  row.completed_at,
  };
}

function toDb(task: Partial<Task> & { id: string }, userId: string): Partial<DbTask> & { id: string; user_id: string } {
  const row: any = { id: task.id, user_id: userId };
  if (task.projectId !== undefined) row.project_id = task.projectId;
  if (task.date !== undefined)      row.date = task.date;
  if (task.title !== undefined)     row.title = task.title;
  if (task.notes !== undefined)     row.notes = task.notes;
  if (task.status !== undefined)    row.status = task.status;
  if (task.priority !== undefined)  row.priority = task.priority;
  if (task.estimate !== undefined)  row.estimate = task.estimate;
  if (task.timeSlot !== undefined)  row.time_slot = task.timeSlot;
  if (task.subtaskCount !== undefined) row.subtask_count = task.subtaskCount;
  if (task.completedAt !== undefined)  row.completed_at = task.completedAt;
  return row;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSupabaseTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all tasks for the user on mount
  useEffect(() => {
    if (!user) { setTasks([]); setLoading(false); return; }

    const fetch = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (!error && data) setTasks((data as DbTask[]).map(fromDb));
      setLoading(false);
    };

    fetch();

    // Real-time subscription
    const channel = supabase
      .channel(`tasks:${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTasks((prev) => [...prev, fromDb(payload.new as DbTask)]);
        } else if (payload.eventType === 'UPDATE') {
          setTasks((prev) => prev.map((t) => t.id === payload.new.id ? fromDb(payload.new as DbTask) : t));
        } else if (payload.eventType === 'DELETE') {
          setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // ── Queries ──────────────────────────────────────────────────────────────────

  const getTasksForDate = useCallback((date: string) =>
    tasks.filter((t) => t.date === date && t.status !== 'cancelled'),
    [tasks]
  );

  const getTasksForProject = useCallback((projectId: string) =>
    tasks.filter((t) => t.projectId === projectId && t.status !== 'cancelled'),
    [tasks]
  );

  // ── Mutations ─────────────────────────────────────────────────────────────────

  const addTask = useCallback(async (input: {
    projectId?: string | null;
    date?: string | null;
    title: string;
    notes?: string;
    priority?: Task['priority'];
    estimate?: number;
    timeSlot?: string | null;
  }) => {
    if (!user) return;
    const now = new Date().toISOString();
    const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const row: DbTask = {
      id,
      user_id:       user.id,
      project_id:    input.projectId ?? null,
      date:          input.date ?? null,
      title:         input.title,
      notes:         input.notes ?? '',
      status:        'open',
      priority:      input.priority ?? 'normal',
      estimate:      input.estimate ?? null,
      time_slot:     input.timeSlot ?? null,
      subtask_count: 0,
      created_at:    now,
      updated_at:    now,
      completed_at:  null,
    };
    await supabase.from('tasks').insert(row);
  }, [user]);

  const updateTask = useCallback(async (id: string, patch: Partial<Task>) => {
    if (!user) return;
    await supabase.from('tasks').update(toDb({ id, ...patch }, user.id)).eq('id', id);
  }, [user]);

  const setTaskStatus = useCallback(async (id: string, status: Task['status']) => {
    if (!user) return;
    const completedAt = status === 'done' ? new Date().toISOString() : null;
    await supabase.from('tasks').update({ status, completed_at: completedAt }).eq('id', id);
  }, [user]);

  const removeTask = useCallback(async (id: string) => {
    if (!user) return;
    await supabase.from('tasks').delete().eq('id', id);
  }, [user]);

  return {
    tasks,
    loading,
    getTasksForDate,
    getTasksForProject,
    addTask,
    updateTask,
    setTaskStatus,
    removeTask,
  };
}
