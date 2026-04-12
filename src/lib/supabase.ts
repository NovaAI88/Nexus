import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  // In development without credentials, show a clear error rather than silent failures
  console.warn('[NEXUS] Supabase credentials not set. Auth and data sync will be unavailable.');
}

export const supabase = createClient(supabaseUrl || 'http://localhost:54321', supabaseAnonKey || '');

// ── Type definitions ──────────────────────────────────────────────────────────

export type SubscriptionTier = 'free' | 'personal' | 'team';

export interface Profile {
  id: string;
  subscription_tier: SubscriptionTier;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  subscription_status: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbTask {
  id: string;
  user_id: string;
  project_id: string | null;
  date: string | null;
  title: string;
  notes: string;
  status: 'open' | 'in_progress' | 'done' | 'cancelled';
  priority: 'high' | 'normal' | 'low';
  estimate: number | null;
  time_slot: string | null;
  subtask_count: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface DbProject {
  id: string;
  user_id: string;
  name: string;
  department_id: string | null;
  status: 'active' | 'paused' | 'completed';
  phase: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
  current_state: string;
  next_action: string;
  color: string | null;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

export interface DbInboxItem {
  id: string;
  user_id: string;
  title: string;
  archived: boolean;
  created_at: string;
}
