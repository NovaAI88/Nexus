import React, { useState } from 'react';
import {
  CheckCircle2,
  Target,
  Inbox as InboxIcon,
  CalendarDays,
  TrendingUp,
  Plus,
  X,
} from 'lucide-react';
import { load, save } from '../storage/localStore';

// ── Storage keys ─────────────────────────────────────────────────────────────

const TASKS_KEY     = 'nexus:tasks';
const KTASKS_KEY    = 'nexus:ktasks';
const KPROJECTS_KEY = 'nexus:kprojects';
const PROJECTS_KEY  = 'nexus:projects';
const KPI_KEY       = 'nexus:kpis';
const INBOX_KEY     = 'nexus:inbox';

// ── Project color palette (mirrors Today.tsx / Week.tsx) ─────────────────────

const PROJECT_COLORS: Record<string, string> = {
  nexus:  '#6B6BF0',
  vortex: '#9B5FE0',
  xenon:  '#40C9A2',
  aureon: '#FBBF24',
  pawly:  '#E05F7E',
};

function projectColor(id: string | null): string {
  if (!id) return '#6B6B78';
  return PROJECT_COLORS[id] ?? '#6B6BF0';
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Task {
  id: string;
  projectId: string | null;
  date: string | null;
  title: string;
  status: string;
  estimate?: number;
  [key: string]: unknown;
}

interface KTask {
  id: string;
  projectId: string;
  title: string;
  status: string;
  dueDate: string | null;
}

interface KProject {
  id: string;
  name: string;
  color: string;
}

interface Project {
  id: string;
  name: string;
}

interface KPI {
  id: string;
  label: string;
  value: string;
  target: string;
}

interface InboxItem {
  id: string;
  title: string;
  createdAt: string;
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function getMondayOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// ── Shared card shell ─────────────────────────────────────────────────────────

function DashCard({
  icon,
  title,
  children,
  gridColumn,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  gridColumn?: string;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gridColumn,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '13px 16px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <span style={{ color: 'var(--accent)', lineHeight: 0 }}>{icon}</span>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
          }}
        >
          {title}
        </span>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function CardEmpty({ message }: { message: string }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 8px',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: '13px',
          color: 'var(--text-muted)',
          lineHeight: 1.6,
        }}
      >
        {message}
      </p>
    </div>
  );
}

// ── Card 1: Today ─────────────────────────────────────────────────────────────

function TodayCard() {
  const tasks: Task[] = load(TASKS_KEY, []);
  const todayStr = toDateStr(new Date());
  const todayTasks = tasks.filter(
    (t) => t.date === todayStr && t.status !== 'cancelled'
  );
  const total = todayTasks.length;
  const done = todayTasks.filter((t) => t.status === 'done').length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const totalMin = todayTasks.reduce((sum, t) => sum + (t.estimate ?? 0), 0);

  return (
    <DashCard icon={<CheckCircle2 size={14} />} title="Today">
      {total === 0 ? (
        <CardEmpty message="No tasks for today. Add some from the Today view." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Stats row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              textAlign: 'center',
            }}
          >
            <StatCell label="Tasks" value={String(total)} />
            <StatCell label="Done" value={String(done)} highlight />
            <StatCell
              label="Hours"
              value={totalMin > 0 ? (totalMin / 60).toFixed(1) : '—'}
            />
          </div>

          {/* Progress bar */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px',
              }}
            >
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {total - done > 0 ? `${total - done} remaining` : 'All done!'}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color:
                    pct === 100 ? 'var(--success)' : 'var(--accent)',
                }}
              >
                {pct}%
              </span>
            </div>
            <div
              style={{
                height: '4px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-hover)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  background:
                    pct === 100 ? 'var(--success)' : 'var(--accent)',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 500ms ease',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </DashCard>
  );
}

function StatCell({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      <span
        style={{
          fontSize: '24px',
          fontWeight: 700,
          color: highlight ? 'var(--success)' : 'var(--text-primary)',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: '10px',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ── Card 2: This Week ─────────────────────────────────────────────────────────

function WeekCard() {
  const tasks: Task[] = load(TASKS_KEY, []);
  const projects: Project[] = load(PROJECTS_KEY, []);

  const monday = getMondayOfWeek(new Date());
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toDateStr(d);
  });

  const weekTasks = tasks.filter(
    (t) =>
      t.date !== null &&
      weekDates.includes(t.date) &&
      t.status !== 'cancelled'
  );

  // Group by project
  const byProject = new Map<string, Task[]>();
  weekTasks.forEach((t) => {
    const key = t.projectId ?? '__none__';
    if (!byProject.has(key)) byProject.set(key, []);
    byProject.get(key)!.push(t);
  });

  const rows = Array.from(byProject.entries());

  function getProjectName(id: string): string {
    if (id === '__none__') return 'Unassigned';
    const p = projects.find((p) => p.id === id);
    return p?.name ?? id;
  }

  return (
    <DashCard icon={<TrendingUp size={14} />} title="This Week">
      {rows.length === 0 ? (
        <CardEmpty message="No tasks scheduled this week." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {rows.map(([projectId, ptasks]) => {
            const done = ptasks.filter((t) => t.status === 'done').length;
            const total = ptasks.length;
            const pct = Math.round((done / total) * 100);
            const color =
              projectId === '__none__' ? '#6B6B78' : projectColor(projectId);

            return (
              <div key={projectId}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '5px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {getProjectName(projectId)}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      fontVariantNumeric: 'tabular-nums',
                      flexShrink: 0,
                      marginLeft: '8px',
                    }}
                  >
                    {done}/{total}
                  </span>
                </div>
                <div
                  style={{
                    height: '3px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-hover)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: color,
                      borderRadius: 'var(--radius-full)',
                      transition: 'width 500ms ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashCard>
  );
}

// ── Card 3: Upcoming Deadlines ────────────────────────────────────────────────

function DeadlinesCard() {
  const ktasks: KTask[] = load(KTASKS_KEY, []);
  const kprojects: KProject[] = load(KPROJECTS_KEY, []);

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const in7 = new Date(todayDate);
  in7.setDate(todayDate.getDate() + 7);

  const upcoming = ktasks
    .filter((t) => {
      if (!t.dueDate || t.status === 'done') return false;
      const d = new Date(t.dueDate + 'T00:00:00');
      return d >= todayDate && d <= in7;
    })
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''));

  function getProject(projectId: string): KProject | undefined {
    return kprojects.find((p) => p.id === projectId);
  }

  function formatDueDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    const todayStr = toDateStr(new Date());
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = toDateStr(tomorrowDate);
    const s = toDateStr(d);
    if (s === todayStr) return 'Today';
    if (s === tomorrowStr) return 'Tomorrow';
    return d.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }

  function isToday(dateStr: string): boolean {
    return dateStr === toDateStr(new Date());
  }

  return (
    <DashCard icon={<CalendarDays size={14} />} title="Upcoming Deadlines">
      {upcoming.length === 0 ? (
        <CardEmpty message="No deadlines in the next 7 days." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {upcoming.map((task) => {
            const proj = getProject(task.projectId);
            const color = proj?.color ?? '#6B6BF0';
            return (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px 8px 12px',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: `3px solid ${color}`,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {task.title}
                  </div>
                  {proj && (
                    <div
                      style={{
                        fontSize: '10px',
                        color: 'var(--text-muted)',
                        marginTop: '2px',
                      }}
                    >
                      {proj.name}
                    </div>
                  )}
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: isToday(task.dueDate!) ? 'var(--warning)' : 'var(--text-muted)',
                    flexShrink: 0,
                  }}
                >
                  {formatDueDate(task.dueDate!)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </DashCard>
  );
}

// ── Card 4: KPI Widget ────────────────────────────────────────────────────────

function KPICard() {
  const [kpis, setKpis] = useState<KPI[]>(() => load(KPI_KEY, []));
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ label: string; value: string; target: string }>({
    label: '',
    value: '',
    target: '',
  });

  function persistKpis(next: KPI[]) {
    setKpis(next);
    save(KPI_KEY, next);
  }

  function addKpi() {
    const id = `kpi-${Date.now()}`;
    const newKpi: KPI = { id, label: 'New KPI', value: '0', target: '100' };
    persistKpis([...kpis, newKpi]);
    setEditId(id);
    setDraft({ label: newKpi.label, value: newKpi.value, target: newKpi.target });
  }

  function startEdit(kpi: KPI) {
    setEditId(kpi.id);
    setDraft({ label: kpi.label, value: kpi.value, target: kpi.target });
  }

  function commitEdit() {
    if (!editId) return;
    persistKpis(kpis.map((k) => (k.id === editId ? { ...k, ...draft } : k)));
    setEditId(null);
  }

  function deleteKpi(id: string) {
    persistKpis(kpis.filter((k) => k.id !== id));
    if (editId === id) setEditId(null);
  }

  return (
    <DashCard icon={<Target size={14} />} title="KPIs">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {kpis.length === 0 && editId === null && (
          <CardEmpty message="No KPIs yet. Click + to add one." />
        )}

        {kpis.map((kpi) =>
          editId === kpi.id ? (
            <div
              key={kpi.id}
              style={{
                padding: '10px',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--accent)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <input
                autoFocus
                value={draft.label}
                onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                placeholder="Label"
                style={kpiInputStyle}
              />
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  value={draft.value}
                  onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                  placeholder="Value"
                  style={{ ...kpiInputStyle, flex: 1 }}
                />
                <input
                  value={draft.target}
                  onChange={(e) => setDraft((d) => ({ ...d, target: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                  placeholder="Target"
                  style={{ ...kpiInputStyle, flex: 1 }}
                />
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button onClick={commitEdit} style={kpiSaveBtnStyle}>Save</button>
                <button onClick={() => setEditId(null)} style={kpiCancelBtnStyle}>
                  Cancel
                </button>
                <button
                  onClick={() => deleteKpi(kpi.id)}
                  style={{
                    ...kpiCancelBtnStyle,
                    marginLeft: 'auto',
                    color: 'var(--error)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <X size={11} /> Delete
                </button>
              </div>
            </div>
          ) : (
            <div
              key={kpi.id}
              onClick={() => startEdit(kpi)}
              title="Click to edit"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'background 150ms ease',
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLDivElement).style.background =
                  'var(--bg-hover)')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLDivElement).style.background =
                  'var(--bg-surface)')
              }
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    marginBottom: '3px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {kpi.label}
                </div>
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1,
                  }}
                >
                  {kpi.value}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div
                  style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '2px' }}
                >
                  TARGET
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--accent)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {kpi.target}
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {/* Add KPI button */}
      <button
        onClick={addKpi}
        style={{
          marginTop: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '5px',
          padding: '7px',
          background: 'transparent',
          border: '1px dashed var(--border)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-muted)',
          fontSize: '12px',
          cursor: 'pointer',
          transition: 'border-color 150ms ease, color 150ms ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
        }}
      >
        <Plus size={12} /> Add KPI
      </button>
    </DashCard>
  );
}

const kpiInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '5px 8px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  fontSize: '12px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'var(--font-primary)',
};

const kpiSaveBtnStyle: React.CSSProperties = {
  padding: '4px 12px',
  background: 'var(--accent)',
  color: 'white',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontSize: '11px',
  fontWeight: 600,
  cursor: 'pointer',
};

const kpiCancelBtnStyle: React.CSSProperties = {
  padding: '4px 12px',
  background: 'var(--bg-hover)',
  color: 'var(--text-secondary)',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontSize: '11px',
  cursor: 'pointer',
};

// ── Card 5: Quick Capture ─────────────────────────────────────────────────────

function QuickCaptureCard() {
  const [value, setValue] = useState('');
  const [items, setItems] = useState<InboxItem[]>(() => load(INBOX_KEY, []));
  const [flash, setFlash] = useState(false);

  function handleCapture() {
    const trimmed = value.trim();
    if (!trimmed) return;
    const item: InboxItem = {
      id: `inbox-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: trimmed,
      createdAt: new Date().toISOString(),
    };
    const next = [item, ...items];
    setItems(next);
    save(INBOX_KEY, next);
    window.dispatchEvent(new CustomEvent('nexus:inbox:updated'));
    setValue('');
    setFlash(true);
    setTimeout(() => setFlash(false), 1200);
  }

  return (
    <DashCard icon={<InboxIcon size={14} />} title="Quick Capture" gridColumn="span 2">
      {/* Input row */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCapture();
          }}
          placeholder="Capture a task, idea, or note — press Enter"
          style={{
            flex: 1,
            padding: '9px 12px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            outline: 'none',
            fontFamily: 'var(--font-primary)',
            transition: 'border-color 150ms ease',
          }}
          onFocus={(e) =>
            ((e.currentTarget as HTMLInputElement).style.borderColor =
              'var(--accent)')
          }
          onBlur={(e) =>
            ((e.currentTarget as HTMLInputElement).style.borderColor =
              'var(--border)')
          }
        />
        <button
          onClick={handleCapture}
          style={{
            padding: '9px 18px',
            background: flash ? 'var(--success)' : 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 200ms ease',
            flexShrink: 0,
            minWidth: '60px',
          }}
        >
          {flash ? '✓' : 'Add'}
        </button>
      </div>

      {/* Recent items */}
      {items.length === 0 ? (
        <CardEmpty message="Nothing captured yet. Type above and press Enter to add to Inbox." />
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            maxHeight: '130px',
            overflowY: 'auto',
          }}
        >
          {items.slice(0, 6).map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <span
                style={{ color: 'var(--text-muted)', fontSize: '10px', lineHeight: 1 }}
              >
                ◦
              </span>
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.title}
              </span>
            </div>
          ))}
          {items.length > 6 && (
            <a
              href="/inbox"
              style={{
                fontSize: '11px',
                color: 'var(--accent)',
                textDecoration: 'none',
                padding: '4px 10px',
              }}
            >
              +{items.length - 6} more — view Inbox
            </a>
          )}
        </div>
      )}
    </DashCard>
  );
}

// ── Home page ─────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div>
      <header style={{ marginBottom: '24px' }}>
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          Home
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            marginTop: '4px',
          }}
        >
          Your command center.
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
        }}
      >
        <TodayCard />
        <WeekCard />
        <DeadlinesCard />
        <KPICard />
        <QuickCaptureCard />
      </div>
    </div>
  );
}
