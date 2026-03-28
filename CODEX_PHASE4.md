# NEXUS — PHASE 4: QUALITY + COMPLETION
Implementation prompt for Codex
Project: /Users/nicholasgeorge/workspace/company/02_NEXUS/PRODUCT/nexus-ui

---

## STEP 0 — PATH VERIFICATION (MANDATORY FIRST)

```bash
cd /Users/nicholasgeorge/workspace/company/02_NEXUS/PRODUCT/nexus-ui && pwd && ls src
```

Expected: `nexus-ui` dir with `src/` containing App.js, App.css, pages/, core/, components/

---

## OPERATING RULES

- No commits
- No fake or demo data — ever
- No backend server
- No redesign from scratch — extend what exists
- Read every file listed before writing anything
- No optional items — everything listed is required
- Safe boundary files listed at the end — do not touch them
- Every change must have a clear justification in this spec

---

## FULL FILE INSPECTION REQUIRED BEFORE ANY IMPLEMENTATION

Read every one of these before writing:

```
src/App.js
src/App.css
src/pages/TodayPage.js
src/pages/DashboardPage.js
src/pages/WeeklyPage.js
src/pages/HistoryPage.js
src/pages/DepartmentPage.js
src/components/Sidebar.js
src/components/TaskEnginePanel.js
src/components/SessionStartPanel.js
src/components/PrimaryActionBanner.js
src/components/SuggestedTimelineBlock.js
src/components/TimelinePanel.js
src/components/TimelineBlock.js
src/components/PageContainer.js
src/components/SectionCard.js
src/components/ProjectCard.js
src/components/NavItem.js
src/core/theme/useTheme.js
src/core/tasks/useTaskEngine.js
src/core/log/useActivityLog.js
src/core/projects/initialState.js
src/core/adapters/initialCompanyState.js
src/data/nexusData.js
```

---

## FIX 1 — DEFAULT THEME: DARK

**File:** `src/core/theme/useTheme.js`

**Problem:** `DEFAULT_THEME` is `'dark'` in code, but the user's localStorage likely has `'light'` set from a prior session. The app is rendering in light mode.

**Fix:** On first load, if no stored value exists, default to dark. Additionally, clear any stale `'light'` value that was set without explicit user intent.

In `useTheme.js`, change the initial state loader:

```javascript
const [theme, setThemeState] = useState(() => {
  const stored = load(THEME_KEY, null);
  // If nothing stored, seed dark as default
  if (!stored) {
    save(THEME_KEY, 'dark');
    return 'dark';
  }
  return stored;
});
```

This is the only change to this file. Do not touch anything else.

---

## FIX 2 — UPDATE PROJECT SEED DATA

**File:** `src/core/projects/initialState.js`

**Problem:** `INITIAL_PROJECTS` contains stale data (Phase 2 NEXUS, V4-P7B VORTEX, paused VORTEX). The real current state is much further along. This data is only used when `nexus:projects` key doesn't exist in localStorage. To force an update for existing users whose localStorage has the old data, we will also update the stored version.

**Replace the entire INITIAL_PROJECTS array** with:

```javascript
export const INITIAL_PROJECTS = [
  {
    id: 'nexus',
    name: 'NEXUS',
    departmentId: 'nexus',
    status: 'active',
    phase: 'Phase 9 — Execution OS',
    priority: 'high',
    currentState:
      'Phase 8.75 complete. Foundation clean. Execution OS (Phase 3) implemented — engine, adapters, Company State board, suggested blocks, Weekly rebuild all live.',
    nextAction:
      'Wire department pages to nexus:company-state. Fix AUREON department page. Integrate suggested blocks inline into Timeline.',
    lastUpdated: '2026-03-27T14:00:00.000Z',
    createdAt: '2026-03-19T00:00:00.000Z',
  },
  {
    id: 'vortex',
    name: 'VORTEX',
    departmentId: 'hephaestus',
    status: 'active',
    phase: 'V4-P7C — RANGE Intelligence Phase 2',
    priority: 'high',
    currentState:
      'Phase 2 implemented and verified. Context-first reversal confirmation live. 10/10 deterministic tests passing. Full suite: 13 files / 30 tests passed.',
    nextAction:
      'Resume with evidence-first verification sequence (path → git state → file presence → tests), then define Phase 3 RANGE plan.',
    lastUpdated: '2026-03-25T00:00:00.000Z',
    createdAt: '2026-03-19T00:00:00.000Z',
  },
  {
    id: 'xenon',
    name: 'XENON',
    departmentId: 'xenon',
    status: 'paused',
    phase: 'Phase 4 — Complete',
    priority: 'normal',
    currentState:
      'Department structure complete. Campaign template and channel tracker ready. Activation pending a channel decision.',
    nextAction:
      'Decide channel (Twitter/X or LinkedIn) and first content format to unblock first campaign.',
    lastUpdated: '2026-03-22T19:00:00.000Z',
    createdAt: '2026-03-20T00:00:00.000Z',
  },
  {
    id: 'aureon',
    name: 'AUREON',
    departmentId: 'aureon',
    status: 'active',
    phase: 'Phase 1 — Active Execution',
    priority: 'critical',
    currentState:
      'System built and operational. Offer: Abandoned Cart Recovery — €500 setup + €150/month. Target: €1,000 within 72 hours.',
    nextAction:
      'Run lead analysis on 10 Shopify stores and send 10 DMs today.',
    lastUpdated: '2026-03-26T00:00:00.000Z',
    createdAt: '2026-03-26T00:00:00.000Z',
  },
];
```

Also add this migration helper at the bottom of the file (after the existing export):

```javascript
/**
 * migrateProjectsIfStale
 * Call once on app startup. If stored projects are from before 2026-03-27,
 * replace with current seed data.
 */
export function migrateProjectsIfStale() {
  try {
    const raw = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) return; // nothing stored — seed will happen naturally
    const stored = JSON.parse(raw);
    if (!Array.isArray(stored)) return;
    const mostRecentUpdate = stored
      .map((p) => new Date(p.lastUpdated || 0).getTime())
      .reduce((max, t) => Math.max(max, t), 0);
    const cutoff = new Date('2026-03-27T00:00:00.000Z').getTime();
    if (mostRecentUpdate < cutoff) {
      window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(INITIAL_PROJECTS));
    }
  } catch {
    // silently fail — non-critical
  }
}
```

**Wire migration into App.js:**

Add import at top of `src/App.js`:
```javascript
import { migrateProjectsIfStale } from './core/projects/initialState';
```

Call it before the first hook, inside the `App` function body (not in an effect — call it synchronously before state initializes):

```javascript
// Run once before hooks — updates stale seed data
migrateProjectsIfStale();
```

---

## FIX 3 — TASK COMPLETE BUTTON: LANDS IN HISTORY

**Problem:** The current `TaskRow` in `TaskEnginePanel.js` uses a two-step flow:
1. Click `○` → sets status to `in_progress` (shows `●`)
2. Click `●` → sets status to `done`

This is confusing. Users want one clear "Complete" button that marks done and automatically creates an activity log entry so the task appears in History with a timestamp.

**Required change to `src/components/TaskEnginePanel.js`:**

In `TaskRow`, replace the existing `task-complete-btn` with a single-click complete button. Also add the log entry on completion.

**New props for TaskRow:** add `addLogEntry` (passed down from TaskEnginePanel).

**Updated `TaskRow` component:**

```javascript
function TaskRow({ task, setTaskStatus, updateTask, removeTask, onTaskDone, addLogEntry, dimmed = false }) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  const saveEdit = () => {
    const t = editTitle.trim();
    if (t) updateTask(task.id, { title: t });
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); saveEdit(); }
    if (e.key === 'Escape') { setEditing(false); setEditTitle(task.title); }
  };

  const handleComplete = () => {
    setTaskStatus(task.id, TASK_STATUS.DONE);
    // Log completion to activity log → appears in History
    if (addLogEntry) {
      addLogEntry(`Completed: ${task.title}`, task.projectId ?? null);
    }
    onTaskDone?.(task);
  };

  const priorityClass = `task-priority-dot task-priority-${task.priority}`;

  return (
    <div className={`task-row${dimmed ? ' task-row-dimmed' : ''}`}>
      <button
        className="task-complete-btn"
        title="Mark complete"
        onClick={handleComplete}
        aria-label="Complete task"
      >
        ○
      </button>
      <span className={priorityClass} title={task.priority} />
      {editing ? (
        <input
          className="task-inline-edit"
          autoFocus
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <span
          className="task-title"
          onDoubleClick={() => { setEditing(true); setEditTitle(task.title); }}
          title="Double-click to edit"
        >
          {task.title}
        </span>
      )}
      <div className="task-row-actions">
        <button
          className="constraint-toggle"
          title="Cancel task"
          onClick={() => setTaskStatus(task.id, TASK_STATUS.CANCELLED)}
        >✕</button>
      </div>
    </div>
  );
}
```

**Pass `addLogEntry` down through TaskEnginePanel:**

Add `addLogEntry` to `TaskEnginePanel` props and pass it to every `TaskRow`:

```javascript
function TaskEnginePanel({
  date,
  tasks,
  focusProject,
  focusTasks,
  addTask,
  setTaskStatus,
  updateTask,
  removeTask,
  updateProject,
  getProject,
  addLogEntry,   // ← add this
}) {
```

Pass `addLogEntry` to all `<TaskRow>` renders:

```jsx
<TaskRow
  key={task.id}
  task={task}
  setTaskStatus={setTaskStatus}
  updateTask={updateTask}
  removeTask={removeTask}
  onTaskDone={handleTaskDone}
  addLogEntry={addLogEntry}
/>
```

Do this for EVERY TaskRow in the component (today tasks, focus backlog tasks, and done tasks re-open row is not a TaskRow — leave it as is).

**Wire `addLogEntry` from App.js into the task panel:**

In `App.js`, find the `taskPanel` useMemo and add `addLogEntry`:

```javascript
const taskPanel = useMemo(() => (
  <TaskEnginePanel
    date={date}
    tasks={todayTasks}
    focusProject={focusProject}
    focusTasks={focusTasks}
    addTask={addTask}
    setTaskStatus={setTaskStatus}
    updateTask={updateTask}
    removeTask={removeTask}
    updateProject={updateProject}
    getProject={getProject}
    addLogEntry={addLogEntry}   // ← add this
  />
), [addTask, addLogEntry, date, focusProject, focusTasks, getProject, removeTask, setTaskStatus, todayTasks, updateProject, updateTask]);
```

Add `addLogEntry` to the dependency array of the useMemo.

**History page verification:**
The completed task will appear in History in two ways:
1. In "Completed Tasks" (already working — reads `tasks.filter(t => t.status === 'done')`)
2. In "Activity Log" as a `progress` type entry (new — because "Completed: X" matches the `inferType` regex for `progress`)

No changes needed to HistoryPage.

---

## FIX 4 — DEPARTMENT PAGE: REAL LAYOUT

**File:** `src/pages/DepartmentPage.js`

**Problem:** The "Department" section card renders a raw table of Label / Status / Projects with no visual design. It looks like a debug readout, not a premium page header.

**Replace the entire `DepartmentPage` component** with:

```javascript
import PageContainer from '../components/PageContainer';
import SectionCard from '../components/SectionCard';
import ProjectCard from '../components/ProjectCard';

const DEPT_COLORS = {
  nexus: '#6b7cff',
  hephaestus: '#22d3ee',
  xenon: '#a78bfa',
  aureon: '#34d399',
};

function DepartmentPage({
  departmentId,
  departments,
  projects,
  getDepartment,
  updateProject,
  focusProjectId,
  setFocusProject,
  date,
  fallbackPage,
}) {
  const department = getDepartment(departmentId);
  const deptProjects = projects.filter((p) => p.departmentId === departmentId);
  const color = DEPT_COLORS[departmentId] ?? '#6b7cff';

  const title = department?.name ?? fallbackPage?.title ?? departmentId;
  const subtitle = department?.description ?? fallbackPage?.subtitle ?? '';

  return (
    <PageContainer title={title} subtitle={subtitle} date={date} primaryAction={null}>
      <div className="page-grid single-column">

        {/* Department header card */}
        <div className="dept-header-card" style={{ '--dept-color': color }}>
          <div className="dept-header-identity">
            <div className="dept-header-color-bar" />
            <div className="dept-header-text">
              <h1 className="dept-header-name">{title}</h1>
              {subtitle && <p className="dept-header-subtitle">{subtitle}</p>}
            </div>
          </div>
          <div className="dept-header-meta">
            {department?.status && (
              <span className={`project-status-badge project-status-${department.status}`}>
                {department.status.toUpperCase()}
              </span>
            )}
            <span className="dept-header-project-count">
              {deptProjects.length} project{deptProjects.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Live project cards — editable */}
        {deptProjects.length > 0 ? (
          deptProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              departmentLabel={department?.label ?? title}
              updateProject={updateProject}
              isFocus={focusProjectId === project.id}
              setFocusProject={setFocusProject}
            />
          ))
        ) : (
          <SectionCard title="Status">
            <div className="status-list">
              <div><span className="label">Focus</span><strong>{fallbackPage?.focus ?? '—'}</strong></div>
              <div><span className="label">Phase</span><strong>{fallbackPage?.phase ?? '—'}</strong></div>
            </div>
            {fallbackPage?.nextActions?.length > 0 && (
              <div className="panel-group">
                <h3>Next Actions</h3>
                <ul>{fallbackPage.nextActions.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            )}
          </SectionCard>
        )}

      </div>
    </PageContainer>
  );
}

export default DepartmentPage;
```

---

## FIX 5 — SIDEBAR UPGRADE

**File:** `src/components/Sidebar.js`

Replace with:

```javascript
import NavSection from './NavSection';

function Sidebar({ navigation, activePage, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-top">

        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-wordmark">
            <span className="sidebar-brand-dot" />
            <strong>NEXUS</strong>
          </div>
          <span className="sidebar-brand-subtitle">Execution OS</span>
        </div>

        {/* Main nav */}
        <NavSection
          title="Main"
          items={navigation.main}
          activePage={activePage}
          onNavigate={onNavigate}
        />

        {/* Departments nav */}
        <NavSection
          title="Departments"
          items={navigation.departments}
          activePage={activePage}
          onNavigate={onNavigate}
        />

      </div>

      <div className="sidebar-footer">
        <div className="sidebar-status-pill">
          <span className="sidebar-status-dot" />
          <span className="sidebar-status-text">All systems operational</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
```

Note: `viewMode` and `onViewChange` props are removed — the ViewToggle added noise and was not functional. `nexusData.navigation.viewModes` still exists in nexusData but is no longer used in the sidebar. Do not modify nexusData.

---

## FIX 6 — HISTORY PAGE: COMPLETED TASKS UPGRADE

**File:** `src/pages/HistoryPage.js`

The Completed Tasks section currently shows a raw list with no visual treatment. Update the completed task entries to show a clean row with checkmark, timestamp, and title.

Find this block in HistoryPage:

```javascript
{doneTasks.length > 0 && (
  <SectionCard title={`Completed Tasks (${doneTasks.length})`} variant="muted">
    <div className="status-list">
      {doneTasks.slice(0, 30).map((t) => (
        <div key={t.id}>
          <span className="label">{t.completedAt ? formatTime(t.completedAt) : '—'}</span>
          <strong>{t.title}</strong>
        </div>
      ))}
    </div>
  </SectionCard>
)}
```

Replace with:

```javascript
{doneTasks.length > 0 && (
  <SectionCard title={`Completed Tasks (${doneTasks.length})`} variant="muted">
    <div className="history-done-list">
      {doneTasks.slice(0, 30).map((t) => (
        <div key={t.id} className="history-done-row">
          <span className="history-done-check">✓</span>
          <span className="history-done-title">{t.title}</span>
          <span className="history-done-time">
            {t.completedAt ? formatTime(t.completedAt) : '—'}
          </span>
        </div>
      ))}
    </div>
  </SectionCard>
)}
```

Also add missing CSS classes (see CSS section below).

---

## FIX 7 — CSS: ALL MISSING + UPGRADED STYLES

**File:** `src/App.css`

**IMPORTANT:** Read the existing App.css fully before editing. Only add or replace — do not delete existing rules unless they are being directly replaced by a rule listed here.

### 7A — Sidebar brand upgrade

Find and replace the existing `.sidebar-brand` block:

```css
.sidebar-brand {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding-bottom: var(--space-16);
  border-bottom: 1px solid var(--color-border-subtle);
  margin-bottom: var(--space-8);
}

.sidebar-brand-wordmark {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.sidebar-brand-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-accent);
  box-shadow: 0 0 8px rgba(107, 124, 255, 0.6);
  flex-shrink: 0;
}

.sidebar-brand strong {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--color-text-strong);
}

.sidebar-brand-subtitle {
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-meta);
  margin-left: 16px;
}
```

### 7B — Sidebar footer status pill

Add after the existing sidebar footer styles:

```css
.sidebar-status-pill {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  padding: var(--space-8) var(--space-12);
  background: rgba(111, 207, 151, 0.08);
  border: 1px solid rgba(111, 207, 151, 0.18);
  border-radius: 999px;
  margin-top: var(--space-8);
}

.sidebar-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #6fcf97;
  box-shadow: 0 0 6px rgba(111, 207, 151, 0.5);
  flex-shrink: 0;
}

.sidebar-status-text {
  font-size: 11px;
  color: #6fcf97;
  letter-spacing: 0.04em;
}
```

### 7C — Department page header card

Add these new rules:

```css
/* ─── Department Header Card ──────────────────────────────────────────────── */

.dept-header-card {
  background: linear-gradient(135deg,
    rgba(107, 124, 255, 0.08) 0%,
    transparent 60%
  );
  border: 1px solid var(--color-border-strong);
  border-left: 4px solid var(--dept-color, var(--color-accent));
  border-radius: var(--radius-16);
  padding: var(--space-24) var(--space-24);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-16);
  box-shadow: var(--shadow-2);
}

.dept-header-identity {
  display: flex;
  align-items: center;
  gap: var(--space-16);
}

.dept-header-color-bar {
  width: 4px;
  height: 40px;
  border-radius: 2px;
  background: var(--dept-color, var(--color-accent));
  box-shadow: 0 0 12px var(--dept-color, var(--color-accent));
  flex-shrink: 0;
}

.dept-header-text {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.dept-header-name {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: var(--color-text-strong);
  line-height: 1;
}

.dept-header-subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-meta);
  line-height: 1.4;
}

.dept-header-meta {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  flex-shrink: 0;
}

.dept-header-project-count {
  font-size: 12px;
  color: var(--color-text-meta);
  letter-spacing: 0.04em;
}
```

### 7D — History completed tasks

Add:

```css
/* ─── History — Completed Tasks ───────────────────────────────────────────── */

.history-done-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.history-done-row {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  padding: var(--space-8) var(--space-12);
  background: var(--color-surface-2);
  border-radius: var(--radius-8);
  border: 1px solid var(--color-border-subtle);
}

.history-done-check {
  font-size: 12px;
  color: #6fcf97;
  flex-shrink: 0;
  font-weight: 700;
  width: 16px;
}

.history-done-title {
  flex: 1;
  font-size: 13px;
  color: var(--color-text-body);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-done-time {
  font-size: 11px;
  color: var(--color-text-meta);
  flex-shrink: 0;
  white-space: nowrap;
}
```

### 7E — History date group header

Add:

```css
.history-date-group + .history-date-group {
  margin-top: var(--space-16);
}

.history-date-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-meta);
  margin-bottom: var(--space-8);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border-subtle);
}

.history-filters-row {
  display: flex;
  align-items: center;
  gap: var(--space-12);
}

.history-project-filter {
  background: var(--color-surface-2);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-8);
  color: var(--color-text-body);
  padding: var(--space-4) var(--space-12);
  font-size: 13px;
  font-family: inherit;
  outline: none;
}
```

### 7F — Page content spacing

Find or add `.page-content`:

```css
.page-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-24);
  margin-top: var(--space-24);
}
```

### 7G — Task complete button — single-click style

Find the existing `.task-complete-btn` rules and replace:

```css
.task-complete-btn {
  background: transparent;
  border: 1.5px solid var(--color-border-strong);
  color: var(--color-text-meta);
  font-size: 12px;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  line-height: 1;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    border-color var(--transition-fast),
    color var(--transition-fast),
    background var(--transition-fast);
}

.task-complete-btn:hover:not(:disabled) {
  border-color: #6fcf97;
  color: #6fcf97;
  background: rgba(111, 207, 151, 0.08);
  transform: none;
  filter: none;
}
```

### 7H — Light mode dark theme override

In the `body.light` block, the app should NEVER default to light mode unless user explicitly chose it. No changes needed to CSS here — the fix is in useTheme.js (Fix 1 above).

---

## VERIFICATION CHECKLIST

Run this after implementation. Report every item.

### THEME
- [ ] App opens in dark mode by default (dark background, not grey)
- [ ] Theme toggle still works — clicking switches to light and back
- [ ] Dark mode shows the correct dark surfaces and accent colors

### DATA
- [ ] Dashboard Session Start Panel shows "Phase 9 — Execution OS" for NEXUS (not Phase 2)
- [ ] Dashboard Session Start Panel shows "VORTEX — V4-P7C" phase for Hephaestus (not V4-P7B)
- [ ] Hephaestus department page shows VORTEX project with Phase 2 complete state
- [ ] AUREON department page shows a project card (not STATUS: — and PROJECTS: —)

### TASK COMPLETION
- [ ] Each task row has a single round ○ button on the left
- [ ] Clicking ○ immediately marks the task done (no two-step ○ → ● → done)
- [ ] Completed task moves to "Done today (N)" section in TaskEnginePanel
- [ ] Completed task appears in History → Activity Log as "Completed: [title]" with progress icon
- [ ] Completed task appears in History → Completed Tasks section
- [ ] Reopen button (↩) still works from the Done section

### DEPARTMENT PAGES
- [ ] Nexus department page: large "NEXUS" heading with blue left bar, status badge, project count
- [ ] Hephaestus page: large "HEPHAESTUS" heading with cyan left bar
- [ ] Xenon page: large "XENON" heading with purple left bar
- [ ] AUREON page: large "AUREON" heading with green left bar + project card
- [ ] No raw "LABEL / STATUS / PROJECTS" table visible on any department page

### SIDEBAR
- [ ] Sidebar shows "NEXUS" in uppercase bold with accent dot
- [ ] Subtitle shows "Execution OS"
- [ ] Footer shows green status pill "All systems operational" (not emoji)
- [ ] Active nav item has accent tint background

### HISTORY
- [ ] Completed tasks show checkmark + title + timestamp in clean rows
- [ ] Date group headers visible and styled
- [ ] Activity log entries show type icon, text, and time

---

## FILES SUMMARY

### Modify (targeted changes only):
```
src/core/theme/useTheme.js — dark default fix
src/core/projects/initialState.js — seed data update + migration helper
src/App.js — wire migrateProjectsIfStale + addLogEntry to taskPanel
src/components/TaskEnginePanel.js — complete button single-click + log on complete
src/pages/DepartmentPage.js — replace dept overview card with premium header
src/pages/HistoryPage.js — completed tasks visual upgrade
src/components/Sidebar.js — brand + footer upgrade, remove ViewToggle
src/App.css — add missing styles (7A–7H)
```

### Create:
None.

---

## SAFE BOUNDARIES — DO NOT TOUCH

```
src/storage/localStore.js
src/core/tasks/useTaskEngine.js
src/core/planner/usePlannerBlocks.js
src/core/log/useActivityLog.js
src/core/projects/useProjects.js
src/core/projects/useFocusProject.js
src/core/departments/useDepartments.js
src/core/departments/initialState.js
src/core/adapters/useCompanyState.js
src/core/adapters/initialCompanyState.js
src/core/engine/executionEngine.js
src/core/engine/useExecutionEngine.js
src/data/nexusData.js
```

---

## OUTPUT AFTER COMPLETION

Stop and report:
1. All files modified (with what changed)
2. Verification checklist — every item with result
3. Any deviations from spec and why

Do not continue past the verification report.
