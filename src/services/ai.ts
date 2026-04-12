/**
 * src/services/ai.ts
 * Frontend service that calls the NEXUS AI proxy server.
 * The API key never touches the frontend — all calls go through /api/ai/*.
 */

// ── Payload types ──────────────────────────────────────────────────────────────

export interface MorningBriefPayload {
  todayTasks: { title: string; status: string }[];
  overdueKTasks: { title: string; dueDate: string }[];
  deadlines: { title: string; dueDate: string }[];
}

export interface DailyPlannerPayload {
  unscheduledTasks: { title: string; estimate?: number }[];
  date: string;
}

export interface DailyPlannerSuggestion {
  taskIndex: number;
  start: string;
  end: string;
}

export interface ProjectPlanPayload {
  name: string;
  goal: string;
}

export interface ProjectPlanTask {
  title: string;
  estimate?: number;
  dueOffsetDays?: number;
}

export interface ProjectPlan {
  tasks: ProjectPlanTask[];
  timeline: string;
}

export interface WeeklyReviewPayload {
  weekTasks: { title: string; status: string; projectId: string | null }[];
  weekStart: string;
  projects: { id: string; name: string }[];
}

// ── Internal helper ────────────────────────────────────────────────────────────

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `AI server returned ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch { /* ignore */ }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Generate a 2–3 sentence morning brief from today's tasks, overdue items, and deadlines.
 * Throws on network or server error — callers should handle gracefully.
 */
export async function generateMorningBrief(payload: MorningBriefPayload): Promise<string> {
  const data = await post<{ brief: string }>('/api/ai/morning-brief', payload);
  return data.brief;
}

/**
 * Get time-block suggestions for unscheduled tasks.
 * Returns an empty array if the server is unavailable.
 */
export async function getDailyPlannerSuggestions(
  payload: DailyPlannerPayload,
): Promise<DailyPlannerSuggestion[]> {
  const data = await post<{ suggestions: DailyPlannerSuggestion[] }>(
    '/api/ai/daily-planner',
    payload,
  );
  return Array.isArray(data.suggestions) ? data.suggestions : [];
}

/**
 * Generate a project task list and timeline from name + goal.
 * Returns a plan object with tasks and a timeline string.
 */
export async function generateProjectPlan(payload: ProjectPlanPayload): Promise<ProjectPlan> {
  return post<ProjectPlan>('/api/ai/generate-project', payload);
}

/**
 * Generate a weekly review summary.
 * Returns the review text string.
 */
export async function generateWeeklyReview(payload: WeeklyReviewPayload): Promise<string> {
  const data = await post<{ review: string }>('/api/ai/weekly-review', payload);
  return data.review;
}
