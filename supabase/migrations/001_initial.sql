-- ============================================================
-- NEXUS N8.0 — Initial Schema
-- Run this in Supabase Studio (SQL Editor) or via Supabase CLI.
-- ============================================================

-- ── profiles ──────────────────────────────────────────────────────────────────
-- One row per user; extends auth.users with subscription data.

CREATE TABLE IF NOT EXISTS public.profiles (
  id                      UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_tier       TEXT        NOT NULL DEFAULT 'free'
                            CHECK (subscription_tier IN ('free', 'personal', 'team')),
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT,
  stripe_price_id         TEXT,
  subscription_status     TEXT        DEFAULT 'inactive',
  onboarding_completed    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: users manage own row"
  ON public.profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── tasks ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tasks (
  id            TEXT        PRIMARY KEY,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id    TEXT,
  date          TEXT,         -- 'YYYY-MM-DD' or null
  title         TEXT        NOT NULL DEFAULT '',
  notes         TEXT        NOT NULL DEFAULT '',
  status        TEXT        NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open', 'in_progress', 'done', 'cancelled')),
  priority      TEXT        NOT NULL DEFAULT 'normal'
                  CHECK (priority IN ('high', 'normal', 'low')),
  estimate      INTEGER,      -- minutes
  time_slot     TEXT,         -- 'HH:00'
  subtask_count INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks: users manage own rows"
  ON public.tasks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS tasks_user_date ON public.tasks(user_id, date);
CREATE INDEX IF NOT EXISTS tasks_user_project ON public.tasks(user_id, project_id);

-- ── projects ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.projects (
  id              TEXT        PRIMARY KEY,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL DEFAULT '',
  department_id   TEXT,
  status          TEXT        NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'paused', 'completed')),
  phase           TEXT        NOT NULL DEFAULT '',
  priority        TEXT        NOT NULL DEFAULT 'normal'
                    CHECK (priority IN ('critical', 'high', 'normal', 'low')),
  current_state   TEXT        NOT NULL DEFAULT '',
  next_action     TEXT        NOT NULL DEFAULT '',
  color           TEXT,
  last_updated    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects: users manage own rows"
  ON public.projects FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS projects_user_id ON public.projects(user_id);

-- ── inbox_items ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.inbox_items (
  id          TEXT        PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL DEFAULT '',
  archived    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.inbox_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inbox_items: users manage own rows"
  ON public.inbox_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS inbox_items_user_id ON public.inbox_items(user_id);

-- ── updated_at trigger ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
