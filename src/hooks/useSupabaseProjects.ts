import { useState, useEffect, useCallback } from 'react';
import { supabase, DbProject } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export type Project = {
  id: string;
  name: string;
  departmentId: string | null;
  status: 'active' | 'paused' | 'completed';
  phase: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
  currentState: string;
  nextAction: string;
  color?: string | null;
  lastUpdated: string;
  createdAt: string;
};

function fromDb(row: DbProject): Project {
  return {
    id:           row.id,
    name:         row.name,
    departmentId: row.department_id,
    status:       row.status,
    phase:        row.phase,
    priority:     row.priority,
    currentState: row.current_state,
    nextAction:   row.next_action,
    color:        row.color,
    lastUpdated:  row.last_updated,
    createdAt:    row.created_at,
  };
}

export function useSupabaseProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setProjects([]); setLoading(false); return; }

    const fetch = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (!error && data) setProjects((data as DbProject[]).map(fromDb));
      setLoading(false);
    };

    fetch();

    const channel = supabase
      .channel(`projects:${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'projects',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setProjects((prev) => [...prev, fromDb(payload.new as DbProject)]);
        } else if (payload.eventType === 'UPDATE') {
          setProjects((prev) => prev.map((p) => p.id === payload.new.id ? fromDb(payload.new as DbProject) : p));
        } else if (payload.eventType === 'DELETE') {
          setProjects((prev) => prev.filter((p) => p.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const addProject = useCallback(async (input: {
    name: string;
    departmentId?: string | null;
    priority?: Project['priority'];
    phase?: string;
    color?: string | null;
  }) => {
    if (!user) return;
    const now = new Date().toISOString();
    const id = `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    await supabase.from('projects').insert({
      id,
      user_id:       user.id,
      name:          input.name,
      department_id: input.departmentId ?? null,
      status:        'active',
      phase:         input.phase ?? '',
      priority:      input.priority ?? 'normal',
      current_state: '',
      next_action:   '',
      color:         input.color ?? null,
      last_updated:  now,
    });
    return id;
  }, [user]);

  const updateProject = useCallback(async (id: string, patch: Partial<Project>) => {
    if (!user) return;
    const dbPatch: any = { last_updated: new Date().toISOString() };
    if (patch.name !== undefined)         dbPatch.name = patch.name;
    if (patch.departmentId !== undefined) dbPatch.department_id = patch.departmentId;
    if (patch.status !== undefined)       dbPatch.status = patch.status;
    if (patch.phase !== undefined)        dbPatch.phase = patch.phase;
    if (patch.priority !== undefined)     dbPatch.priority = patch.priority;
    if (patch.currentState !== undefined) dbPatch.current_state = patch.currentState;
    if (patch.nextAction !== undefined)   dbPatch.next_action = patch.nextAction;
    if (patch.color !== undefined)        dbPatch.color = patch.color;
    await supabase.from('projects').update(dbPatch).eq('id', id);
  }, [user]);

  const removeProject = useCallback(async (id: string) => {
    if (!user) return;
    await supabase.from('projects').delete().eq('id', id);
  }, [user]);

  const getProject = useCallback((id: string) =>
    projects.find((p) => p.id === id),
    [projects]
  );

  return { projects, loading, addProject, updateProject, removeProject, getProject };
}
