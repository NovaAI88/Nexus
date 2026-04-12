/**
 * useMigration
 *
 * One-time migration of localStorage data → Supabase on first login.
 * Runs once per user (tracked via localStorage flag `nexus:migrated:{userId}`).
 * After migration, the localStorage data is cleared.
 */
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { load, remove } from '../storage/localStore';

const MIGRATION_FLAG_PREFIX = 'nexus:migrated:';

// LocalStorage keys used by the old hooks
const TASKS_KEY        = 'nexus:tasks';
const PROJECTS_KEY     = 'nexus:projects';
const INBOX_KEY        = 'nexus:inbox';
const KTASKS_KEY       = 'nexus:ktasks'; // Kanban tasks — migrate as tasks

export type MigrationState = 'idle' | 'running' | 'done' | 'error';

export function useMigration() {
  const { user } = useAuth();
  const [state, setState] = useState<MigrationState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [migrated, setMigrated] = useState(false);

  useEffect(() => {
    if (!user) return;
    const flag = load(`${MIGRATION_FLAG_PREFIX}${user.id}`, false);
    setMigrated(!!flag);
  }, [user]);

  const runMigration = useCallback(async () => {
    if (!user || migrated) return;
    setState('running');
    setError(null);

    try {
      const now = new Date().toISOString();

      // ── Tasks ──────────────────────────────────────────────────────────────
      const localTasks: any[] = load(TASKS_KEY, []);
      if (localTasks.length > 0) {
        const rows = localTasks.map((t: any) => ({
          id:            t.id || `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          user_id:       user.id,
          project_id:    t.projectId ?? null,
          date:          t.date ?? null,
          title:         t.title || '',
          notes:         t.notes || '',
          status:        t.status || 'open',
          priority:      t.priority || 'normal',
          estimate:      t.estimate ?? null,
          time_slot:     t.timeSlot ?? null,
          subtask_count: t.subtaskCount ?? 0,
          created_at:    t.createdAt || now,
          updated_at:    t.updatedAt || now,
          completed_at:  t.completedAt ?? null,
        }));
        // upsert so re-running is safe
        await supabase.from('tasks').upsert(rows, { onConflict: 'id' });
      }

      // ── Projects ───────────────────────────────────────────────────────────
      const localProjects: any[] = load(PROJECTS_KEY, []);
      if (localProjects.length > 0) {
        const rows = localProjects.map((p: any) => ({
          id:            p.id || `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          user_id:       user.id,
          name:          p.name || 'Untitled',
          department_id: p.departmentId ?? null,
          status:        p.status || 'active',
          phase:         p.phase || '',
          priority:      p.priority || 'normal',
          current_state: p.currentState || '',
          next_action:   p.nextAction || '',
          color:         p.color ?? null,
          last_updated:  p.lastUpdated || now,
          created_at:    p.createdAt || now,
          updated_at:    now,
        }));
        await supabase.from('projects').upsert(rows, { onConflict: 'id' });
      }

      // ── Inbox ──────────────────────────────────────────────────────────────
      const localInbox: any[] = load(INBOX_KEY, []);
      if (localInbox.length > 0) {
        const rows = localInbox.map((item: any) => ({
          id:         item.id || `inbox-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          user_id:    user.id,
          title:      item.title || '',
          archived:   item.archived ?? false,
          created_at: item.createdAt || now,
        }));
        await supabase.from('inbox_items').upsert(rows, { onConflict: 'id' });
      }

      // ── Mark done + clear localStorage ───────────────────────────────────
      localStorage.setItem(`${MIGRATION_FLAG_PREFIX}${user.id}`, 'true');
      remove(TASKS_KEY);
      remove(PROJECTS_KEY);
      remove(INBOX_KEY);
      remove(KTASKS_KEY);

      setMigrated(true);
      setState('done');
    } catch (err: any) {
      console.error('[useMigration]', err);
      setError(err.message ?? 'Migration failed');
      setState('error');
    }
  }, [user, migrated]);

  return { state, error, migrated, runMigration };
}
