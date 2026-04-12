import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, LayoutGrid, BarChart2, Sparkles, X, Calendar, Clock, Check, Trash2, Loader } from 'lucide-react';
import { load, save } from '../storage/localStore';
import { generateProjectPlan, ProjectPlanTask } from '../services/ai';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface KProject {
  id: string;
  name: string;
  goal: string;
  color: string;
  createdAt: string;
}

type KanbanStatus = 'not_started' | 'in_progress' | 'review' | 'done';
type TaskPriority = 'high' | 'normal' | 'low';

interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

interface KTask {
  id: string;
  projectId: string;
  title: string;
  status: KanbanStatus;
  priority: TaskPriority;
  dueDate: string | null;
  estimate: number | null;
  subtasks: Subtask[];
  createdAt: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const PROJECT_COLORS = [
  { hex: '#6B6BF0', label: 'Indigo' },
  { hex: '#9B5FE0', label: 'Violet' },
  { hex: '#E05F7E', label: 'Rose' },
  { hex: '#E0A040', label: 'Amber' },
  { hex: '#40C9A2', label: 'Teal' },
  { hex: '#4097E0', label: 'Sky' },
];

const KANBAN_COLUMNS: { status: KanbanStatus; label: string; accent: string }[] = [
  { status: 'not_started', label: 'Not Started', accent: '#6B6B78' },
  { status: 'in_progress', label: 'In Progress', accent: '#6B6BF0' },
  { status: 'review',      label: 'Review',      accent: '#FBBF24' },
  { status: 'done',        label: 'Done',        accent: '#34D399' },
];

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  high:   '#F87171',
  normal: '#60A5FA',
  low:    '#6B6B78',
};

const KPROJECTS_KEY = 'nexus:kprojects';
const KTASKS_KEY    = 'nexus:ktasks';
const WEEK_PX       = 80;
const GANTT_WEEKS   = 13; // 1 week past + 12 weeks ahead

// ─── Helpers ───────────────────────────────────────────────────────────────────

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function healthPct(tasks: KTask[]): number {
  if (tasks.length === 0) return 0;
  return Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100);
}

function formatDue(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function addDaysToStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ─── Shared styles ─────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
};

const primaryBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 16px',
  background: 'var(--accent)',
  color: 'white',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
};

const secondaryBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 16px',
  background: 'var(--bg-surface)',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
};

// ─── GanttView ─────────────────────────────────────────────────────────────────

function GanttView({
  projects,
  tasks,
  onShiftDates,
}: {
  projects: KProject[];
  tasks: KTask[];
  onShiftDates: (projectId: string, days: number) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Timeline starts 1 week before today
  const timelineStart = new Date(today);
  timelineStart.setDate(timelineStart.getDate() - 7);

  const totalPx = GANTT_WEEKS * WEEK_PX;

  const weeks = Array.from({ length: GANTT_WEEKS }, (_, i) => {
    const d = new Date(timelineStart);
    d.setDate(d.getDate() + i * 7);
    return d;
  });

  const dateToX = useCallback((d: Date): number => {
    const diffMs = d.getTime() - timelineStart.getTime();
    return (diffMs / (7 * 86400000)) * WEEK_PX;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timelineStart.getTime()]);

  const getProjectBar = useCallback((projectId: string) => {
    const ptasks = tasks.filter(t => t.projectId === projectId && t.dueDate);
    if (ptasks.length === 0) return null;
    const dates = ptasks.map(t => new Date(t.dueDate! + 'T00:00:00'));
    const startMs = Math.min(...dates.map(d => d.getTime()));
    const endMs   = Math.max(...dates.map(d => d.getTime()));
    return { start: new Date(startMs), end: new Date(endMs), hasDates: true };
  }, [tasks]);

  const [dragging, setDragging] = useState<{
    projectId: string;
    startX: number;
    deltaX: number;
  } | null>(null);

  const onShiftRef = useRef(onShiftDates);
  onShiftRef.current = onShiftDates;

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      setDragging(d => d ? { ...d, deltaX: e.clientX - d.startX } : null);
    };
    const onUp = (e: MouseEvent) => {
      if (dragging) {
        const days = Math.round((e.clientX - dragging.startX) / (WEEK_PX / 7));
        if (days !== 0) onShiftRef.current(dragging.projectId, days);
      }
      setDragging(null);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [dragging]);

  const todayX = dateToX(today);

  return (
    <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
      <div style={{ minWidth: totalPx + 200 }}>

        {/* Timeline header */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          <div style={{ width: 200, flexShrink: 0, padding: '8px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Project
          </div>
          <div style={{ flex: 1, display: 'flex', borderLeft: '1px solid var(--border)' }}>
            {weeks.map((w, i) => (
              <div
                key={i}
                style={{
                  width: WEEK_PX,
                  flexShrink: 0,
                  padding: '8px 6px',
                  borderLeft: i > 0 ? '1px solid var(--border-subtle)' : 'none',
                  background: i === 1 ? 'rgba(107,107,240,0.04)' : undefined,
                }}
              >
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {w.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Project rows */}
        {projects.map(proj => {
          const ptasks = tasks.filter(t => t.projectId === proj.id);
          const health = healthPct(ptasks);
          const bar = getProjectBar(proj.id);
          const isDragging = dragging?.projectId === proj.id;
          const deltaX = isDragging ? dragging!.deltaX : 0;

          let barLeft = 0;
          let barWidth = 0;
          let canDrag = false;

          if (bar) {
            barLeft = dateToX(bar.start) + deltaX;
            barWidth = Math.max(WEEK_PX, dateToX(bar.end) - dateToX(bar.start) + WEEK_PX / 7);
            canDrag = true;
          }

          return (
            <div
              key={proj.id}
              style={{ display: 'flex', alignItems: 'center', borderTop: '1px solid var(--border)' }}
            >
              {/* Row label */}
              <div style={{ width: 200, flexShrink: 0, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: proj.color, flexShrink: 0 }} />
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {proj.name}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>{health}%</span>
              </div>

              {/* Timeline track */}
              <div style={{ flex: 1, height: '48px', position: 'relative', background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)', overflow: 'hidden' }}>
                {/* Week grid lines */}
                {weeks.map((_, i) => (
                  <div
                    key={i}
                    style={{ position: 'absolute', left: i * WEEK_PX, top: 0, bottom: 0, borderLeft: i > 0 ? '1px solid var(--border-subtle)' : 'none' }}
                  />
                ))}

                {/* Today line */}
                <div style={{ position: 'absolute', left: todayX, top: 0, bottom: 0, width: 1, background: 'var(--accent)', opacity: 0.6, zIndex: 1 }} />

                {/* Project bar */}
                {canDrag ? (
                  <div
                    onMouseDown={e => { e.preventDefault(); setDragging({ projectId: proj.id, startX: e.clientX, deltaX: 0 }); }}
                    style={{
                      position: 'absolute',
                      left: barLeft,
                      top: '10px',
                      height: '28px',
                      width: barWidth,
                      background: proj.color,
                      borderRadius: '6px',
                      opacity: isDragging ? 0.75 : 0.9,
                      cursor: isDragging ? 'grabbing' : 'grab',
                      transition: isDragging ? 'none' : 'opacity 150ms',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 8px',
                      fontSize: '11px',
                      color: 'white',
                      fontWeight: 600,
                      zIndex: 2,
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      boxShadow: isDragging ? 'var(--shadow-drag)' : 'none',
                    }}
                  >
                    {ptasks.length} task{ptasks.length !== 1 ? 's' : ''}
                  </div>
                ) : (
                  <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: Math.max(8, todayX + 4), fontSize: '11px', color: 'var(--text-muted)' }}>
                    No due dates set
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ProjectGeneratorModal ────────────────────────────────────────────────────

interface GeneratedTask extends ProjectPlanTask {
  accepted: boolean;
}

function ProjectGeneratorModal({
  onClose,
  onAccept,
}: {
  onClose: () => void;
  onAccept: (name: string, goal: string, color: string, tasks: ProjectPlanTask[]) => void;
}) {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0].hex);
  type GenStatus = 'idle' | 'loading' | 'done' | 'error';
  const [status, setStatus] = useState<GenStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([]);
  const [timeline, setTimeline] = useState('');

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !goal.trim()) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const plan = await generateProjectPlan({ name: name.trim(), goal: goal.trim() });
      setGeneratedTasks(plan.tasks.map((t) => ({ ...t, accepted: true })));
      setTimeline(plan.timeline);
      setStatus('done');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'AI generation failed');
      setStatus('error');
    }
  }

  function handleAccept() {
    const accepted = generatedTasks.filter((t) => t.accepted);
    onAccept(name.trim(), goal.trim(), color, accepted);
  }

  function toggleTask(i: number) {
    setGeneratedTasks((prev) =>
      prev.map((t, idx) => (idx === i ? { ...t, accepted: !t.accepted } : t)),
    );
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '24px', width: '500px', maxWidth: '92vw', maxHeight: '85vh', overflowY: 'auto', boxShadow: 'var(--shadow-modal)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} style={{ color: 'var(--accent)' }} />
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>AI Project Builder</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '2px' }}>
            <X size={18} />
          </button>
        </div>

        {status !== 'done' ? (
          /* ── Input form ── */
          <form onSubmit={handleGenerate}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Project Name <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Landing Page Redesign"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Goal <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="What should this project accomplish? Be specific."
                rows={3}
                style={{ ...inputStyle, resize: 'none' }}
              />
            </div>

            {/* Color */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Colour</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {PROJECT_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    title={c.label}
                    style={{
                      width: '26px', height: '26px',
                      borderRadius: '50%',
                      background: c.hex,
                      border: color === c.hex ? '2px solid white' : '2px solid transparent',
                      cursor: 'pointer',
                      outline: color === c.hex ? `2px solid ${c.hex}` : 'none',
                      outlineOffset: '2px',
                    }}
                  />
                ))}
              </div>
            </div>

            {status === 'error' && (
              <p style={{ fontSize: '12px', color: 'var(--error)', marginBottom: '12px', margin: '0 0 12px' }}>
                {errorMsg || 'Generation failed. Is the AI server running?'}
              </p>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="submit"
                disabled={!name.trim() || !goal.trim() || status === 'loading'}
                style={{
                  ...primaryBtnStyle,
                  opacity: !name.trim() || !goal.trim() || status === 'loading' ? 0.5 : 1,
                  cursor: !name.trim() || !goal.trim() || status === 'loading' ? 'not-allowed' : 'pointer',
                }}
              >
                {status === 'loading'
                  ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
                  : <><Sparkles size={14} /> Generate plan</>
                }
              </button>
              <button type="button" onClick={onClose} style={secondaryBtnStyle}>Cancel</button>
            </div>
          </form>
        ) : (
          /* ── Review generated plan ── */
          <div>
            {timeline && (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5, padding: '10px 12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
                {timeline}
              </p>
            )}

            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
              {generatedTasks.filter((t) => t.accepted).length} of {generatedTasks.length} tasks selected
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
              {generatedTasks.map((task, i) => (
                <div
                  key={i}
                  onClick={() => toggleTask(i)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    background: task.accepted ? 'var(--bg-surface)' : 'transparent',
                    border: `1px solid ${task.accepted ? 'var(--border)' : 'var(--border-subtle, var(--border))'}`,
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    opacity: task.accepted ? 1 : 0.45,
                    transition: 'all 120ms',
                  }}
                >
                  <div
                    style={{
                      width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
                      background: task.accepted ? 'var(--accent)' : 'transparent',
                      border: `1.5px solid ${task.accepted ? 'var(--accent)' : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {task.accepted && <Check size={10} style={{ color: 'white' }} />}
                  </div>
                  <span style={{ flex: 1, fontSize: '13px', color: 'var(--text-primary)' }}>{task.title}</span>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    {task.estimate && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={10} />{task.estimate}m
                      </span>
                    )}
                    {task.dueOffsetDays != null && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Calendar size={10} />+{task.dueOffsetDays}d
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleAccept}
                disabled={generatedTasks.filter((t) => t.accepted).length === 0}
                style={{
                  ...primaryBtnStyle,
                  opacity: generatedTasks.filter((t) => t.accepted).length === 0 ? 0.4 : 1,
                  cursor: generatedTasks.filter((t) => t.accepted).length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                <Check size={14} /> Create project
              </button>
              <button onClick={() => setStatus('idle')} style={secondaryBtnStyle}>Back</button>
              <button onClick={onClose} style={{ ...secondaryBtnStyle, marginLeft: 'auto' }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CreateProjectModal ────────────────────────────────────────────────────────

function CreateProjectModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, goal: string, color: string) => void;
}) {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0].hex);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name, goal, color);
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '24px', width: '440px', maxWidth: '90vw', boxShadow: 'var(--shadow-modal)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>New Project</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '2px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Project Name <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. App Redesign"
              autoFocus
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Goal
            </label>
            <textarea
              value={goal}
              onChange={e => setGoal(e.target.value)}
              placeholder="What does this project achieve?"
              rows={2}
              style={{ ...inputStyle, resize: 'none' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              Color
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {PROJECT_COLORS.map(c => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setColor(c.hex)}
                  title={c.label}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: c.hex,
                    border: color === c.hex ? `3px solid white` : '3px solid transparent',
                    outline: color === c.hex ? `2px solid ${c.hex}` : 'none',
                    cursor: 'pointer',
                    transition: 'all 150ms',
                    padding: 0,
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={secondaryBtnStyle}>Cancel</button>
            <button
              type="submit"
              style={{ ...primaryBtnStyle, opacity: name.trim() ? 1 : 0.5, cursor: name.trim() ? 'pointer' : 'not-allowed' }}
              disabled={!name.trim()}
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── TaskModal ─────────────────────────────────────────────────────────────────

function TaskModal({
  task,
  defaultStatus,
  onClose,
  onSave,
  onDelete,
}: {
  task: KTask | null;
  defaultStatus: KanbanStatus;
  onClose: () => void;
  onSave: (
    title: string,
    status: KanbanStatus,
    priority: TaskPriority,
    dueDate: string | null,
    estimate: number | null,
    subtasks: Subtask[],
  ) => void;
  onDelete?: () => void;
}) {
  const [title, setTitle]       = useState(task?.title ?? '');
  const [status, setStatus]     = useState<KanbanStatus>(task?.status ?? defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'normal');
  const [dueDate, setDueDate]   = useState(task?.dueDate ?? '');
  const [estimate, setEstimate] = useState(task?.estimate?.toString() ?? '');
  const [subtasks, setSubtasks] = useState<Subtask[]>(task?.subtasks ?? []);
  const [newSubtask, setNewSubtask] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(
      title.trim(),
      status,
      priority,
      dueDate || null,
      estimate ? parseFloat(estimate) : null,
      subtasks,
    );
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks(prev => [...prev, { id: makeId(), title: newSubtask.trim(), done: false }]);
    setNewSubtask('');
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '24px', width: '480px', maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto', boxShadow: 'var(--shadow-modal)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '2px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          {/* Title */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Title <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Task title"
              autoFocus
              style={inputStyle}
            />
          </div>

          {/* Status + Priority row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as KanbanStatus)}
                style={{ ...inputStyle, appearance: 'none' }}
              >
                {KANBAN_COLUMNS.map(col => (
                  <option key={col.status} value={col.status}>{col.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                style={{ ...inputStyle, appearance: 'none' }}
              >
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Due date + Estimate row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> Due Date</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> Estimate (hrs)</span>
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={estimate}
                onChange={e => setEstimate(e.target.value)}
                placeholder="e.g. 2"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Subtasks */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              Subtasks
            </label>
            {subtasks.length > 0 && (
              <div style={{ marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {subtasks.map(s => (
                  <div
                    key={s.id}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                  >
                    <button
                      type="button"
                      onClick={() => setSubtasks(prev => prev.map(x => x.id === s.id ? { ...x, done: !x.done } : x))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: s.done ? 'var(--success)' : 'var(--text-muted)', flexShrink: 0 }}
                    >
                      {s.done ? <Check size={14} /> : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid var(--border)' }} />}
                    </button>
                    <span style={{ flex: 1, fontSize: '13px', color: s.done ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: s.done ? 'line-through' : 'none' }}>
                      {s.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSubtasks(prev => prev.filter(x => x.id !== s.id))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-muted)', display: 'flex' }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                value={newSubtask}
                onChange={e => setNewSubtask(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubtask(); } }}
                placeholder="Add a subtask…"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                type="button"
                onClick={addSubtask}
                style={{ ...secondaryBtnStyle, padding: '8px 12px', flexShrink: 0 }}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  style={{ ...secondaryBtnStyle, color: 'var(--error)', borderColor: 'transparent', background: 'transparent', padding: '8px 4px' }}
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={onClose} style={secondaryBtnStyle}>Cancel</button>
              <button
                type="submit"
                style={{ ...primaryBtnStyle, opacity: title.trim() ? 1 : 0.5, cursor: title.trim() ? 'pointer' : 'not-allowed' }}
                disabled={!title.trim()}
              >
                {task ? 'Save Changes' : 'Add Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Projects page ─────────────────────────────────────────────────────────────

export default function Projects() {
  const [projects, setProjectsState] = useState<KProject[]>(() => load(KPROJECTS_KEY, []));
  const [tasks, setTasksState]       = useState<KTask[]>(() => load(KTASKS_KEY, []));
  const [view, setView]              = useState<'board' | 'gantt'>('board');
  const [selectedId, setSelectedId]  = useState<string | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showAiBuilder, setShowAiBuilder] = useState(false);
  const [taskModal, setTaskModal]    = useState<{
    open: boolean;
    projectId: string;
    defaultStatus: KanbanStatus;
    task: KTask | null;
  }>({ open: false, projectId: '', defaultStatus: 'not_started', task: null });

  const [dragOverCol, setDragOverCol] = useState<KanbanStatus | null>(null);
  const dragTaskId = useRef<string | null>(null);

  // ── Persistence ──

  const persistProjects = useCallback((next: KProject[]) => {
    setProjectsState(next);
    save(KPROJECTS_KEY, next);
  }, []);

  const persistTasks = useCallback((next: KTask[]) => {
    setTasksState(next);
    save(KTASKS_KEY, next);
  }, []);

  // ── Computed ──

  const selectedProject = projects.find(p => p.id === selectedId) ?? projects[0] ?? null;
  const projectTasks    = selectedProject ? tasks.filter(t => t.projectId === selectedProject.id) : [];
  const health          = healthPct(projectTasks);

  // ── Handlers ──

  const createProject = useCallback((name: string, goal: string, color: string) => {
    const proj: KProject = { id: makeId(), name: name.trim(), goal: goal.trim(), color, createdAt: new Date().toISOString() };
    const next = [...projects, proj];
    persistProjects(next);
    setSelectedId(proj.id);
    setShowCreateProject(false);
  }, [projects, persistProjects]);

  const createProjectFromAI = useCallback(
    (name: string, goal: string, color: string, aiTasks: ProjectPlanTask[]) => {
      const proj: KProject = { id: makeId(), name: name.trim(), goal: goal.trim(), color, createdAt: new Date().toISOString() };
      persistProjects([...projects, proj]);
      setSelectedId(proj.id);
      setShowAiBuilder(false);

      const todayStr = new Date().toISOString().slice(0, 10);
      const newTasks: KTask[] = aiTasks.map((t) => ({
        id: makeId(),
        projectId: proj.id,
        title: t.title,
        status: 'not_started' as KanbanStatus,
        priority: 'normal' as TaskPriority,
        dueDate: t.dueOffsetDays != null ? addDaysToStr(todayStr, t.dueOffsetDays) : null,
        estimate: t.estimate ?? null,
        subtasks: [],
        createdAt: new Date().toISOString(),
      }));
      persistTasks([...tasks, ...newTasks]);
    },
    [projects, tasks, persistProjects, persistTasks],
  );

  const createTask = useCallback((
    projectId: string, title: string, status: KanbanStatus,
    priority: TaskPriority, dueDate: string | null, estimate: number | null, subtasks: Subtask[],
  ) => {
    const task: KTask = {
      id: makeId(), projectId, title, status, priority, dueDate, estimate, subtasks,
      createdAt: new Date().toISOString(),
    };
    persistTasks([...tasks, task]);
  }, [tasks, persistTasks]);

  const updateTask = useCallback((id: string, patch: Partial<KTask>) => {
    persistTasks(tasks.map(t => t.id === id ? { ...t, ...patch } : t));
  }, [tasks, persistTasks]);

  const deleteTask = useCallback((id: string) => {
    persistTasks(tasks.filter(t => t.id !== id));
  }, [tasks, persistTasks]);

  const moveTask = useCallback((taskId: string, newStatus: KanbanStatus) => {
    persistTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  }, [tasks, persistTasks]);

  const shiftProjectDates = useCallback((projectId: string, days: number) => {
    persistTasks(tasks.map(t => {
      if (t.projectId !== projectId || !t.dueDate) return t;
      return { ...t, dueDate: addDaysToStr(t.dueDate, days) };
    }));
  }, [tasks, persistTasks]);

  // ── Drag (kanban) ──

  const handleDragStart = useCallback((taskId: string) => {
    dragTaskId.current = taskId;
  }, []);

  const handleDrop = useCallback((status: KanbanStatus) => {
    if (dragTaskId.current) {
      moveTask(dragTaskId.current, status);
      dragTaskId.current = null;
    }
    setDragOverCol(null);
  }, [moveTask]);

  const openCreateTask = useCallback((projectId: string, status: KanbanStatus) => {
    setTaskModal({ open: true, projectId, defaultStatus: status, task: null });
  }, []);

  const openEditTask = useCallback((task: KTask) => {
    setTaskModal({ open: true, projectId: task.projectId, defaultStatus: task.status, task });
  }, []);

  const closeTaskModal = useCallback(() => {
    setTaskModal({ open: false, projectId: '', defaultStatus: 'not_started', task: null });
  }, []);

  // ── Render ──

  return (
    <div>

      {/* ── AI Builder modal ── */}
      {showAiBuilder && (
        <ProjectGeneratorModal
          onClose={() => setShowAiBuilder(false)}
          onAccept={createProjectFromAI}
        />
      )}

      {/* ── Header ── */}
      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Projects
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px', margin: '4px 0 0' }}>
            {projects.length === 0
              ? 'Create and manage your projects.'
              : projects.length === 1
                ? `1 project${projectTasks.length > 0 ? ` · ${health}% complete` : ''}`
                : `${projects.length} projects${selectedProject && projectTasks.length > 0 ? ` · ${selectedProject.name}: ${health}% complete` : ''}`
            }
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* AI Project Builder */}
          <button
            onClick={() => setShowAiBuilder(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px',
              background: 'var(--bg-card)',
              color: 'var(--accent)',
              border: '1px solid var(--accent)',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px', fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 150ms',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(107,107,240,0.08)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)'; }}
          >
            <Sparkles size={14} />
            AI Project Builder
          </button>

          {/* View toggle */}
          {projects.length > 0 && (
            <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              {(['board', 'gantt'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '7px 12px',
                    background: view === v ? 'var(--accent)' : 'transparent',
                    color: view === v ? 'white' : 'var(--text-secondary)',
                    border: 'none', cursor: 'pointer',
                    fontSize: '13px', fontWeight: 500,
                    transition: 'all 150ms',
                  }}
                >
                  {v === 'board' ? <LayoutGrid size={13} /> : <BarChart2 size={13} />}
                  {v === 'board' ? 'Board' : 'Gantt'}
                </button>
              ))}
            </div>
          )}

          {/* New project */}
          <button
            onClick={() => setShowCreateProject(true)}
            style={{
              ...primaryBtnStyle,
              transition: 'background 150ms',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent)'}
          >
            <Plus size={14} />
            New project
          </button>
        </div>
      </header>

      {/* ── Empty state ── */}
      {projects.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 32px', gap: '16px', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-lg)', background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LayoutGrid size={26} style={{ color: 'var(--accent)' }} />
          </div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>No projects yet</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '360px', margin: 0, lineHeight: 1.6 }}>
            Create your first project to start organizing tasks in a Kanban board or Gantt timeline.
          </p>
          <button
            onClick={() => setShowCreateProject(true)}
            style={{ ...primaryBtnStyle, marginTop: '8px' }}
          >
            <Plus size={14} />
            Create project
          </button>
        </div>
      )}

      {/* ── Project tabs ── */}
      {projects.length > 0 && (
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {projects.map(p => {
            const isSelected = selectedProject?.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '7px',
                  padding: '6px 12px',
                  background: isSelected ? 'var(--bg-card)' : 'transparent',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: `1px solid ${isSelected ? 'var(--border)' : 'transparent'}`,
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px', fontWeight: isSelected ? 500 : 400,
                  cursor: 'pointer', transition: 'all 150ms',
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                {p.name}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Board view ── */}
      {projects.length > 0 && view === 'board' && selectedProject && (
        <div style={{ overflowX: 'auto', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', minWidth: 'max-content' }}>
            {KANBAN_COLUMNS.map(col => {
              const colTasks = projectTasks.filter(t => t.status === col.status);
              const isOver   = dragOverCol === col.status;
              return (
                <div
                  key={col.status}
                  style={{
                    width: '272px',
                    flexShrink: 0,
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-lg)',
                    border: `1px solid ${isOver ? col.accent : 'var(--border)'}`,
                    transition: 'border-color 150ms',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onDragOver={e => { e.preventDefault(); setDragOverCol(col.status); }}
                  onDrop={() => handleDrop(col.status)}
                >
                  {/* Column header */}
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: col.accent, flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{col.label}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '1px 6px', borderRadius: '10px', lineHeight: 1.6 }}>
                        {colTasks.length}
                      </span>
                    </div>
                    <button
                      onClick={() => openCreateTask(selectedProject.id, col.status)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', borderRadius: 'var(--radius-sm)', transition: 'color 150ms' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}
                    >
                      <Plus size={15} />
                    </button>
                  </div>

                  {/* Task cards */}
                  <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '120px', flex: 1 }}>
                    {colTasks.map(task => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => handleDragStart(task.id)}
                        onDragEnd={() => { dragTaskId.current = null; setDragOverCol(null); }}
                        onClick={() => openEditTask(task)}
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                          padding: '10px 12px',
                          cursor: 'grab',
                          transition: 'border-color 150ms',
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = col.accent + '80'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
                      >
                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: '8px' }}>
                          {task.title}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                          {/* Priority badge */}
                          <span style={{
                            fontSize: '10px', fontWeight: 700,
                            color: PRIORITY_COLORS[task.priority],
                            background: PRIORITY_COLORS[task.priority] + '1A',
                            padding: '1px 5px', borderRadius: '4px',
                            textTransform: 'uppercase', letterSpacing: '0.03em',
                          }}>
                            {task.priority}
                          </span>
                          {/* Due date */}
                          {task.dueDate && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--bg-hover)', padding: '1px 5px', borderRadius: '4px' }}>
                              <Calendar size={10} />
                              {formatDue(task.dueDate)}
                            </span>
                          )}
                          {/* Estimate */}
                          {task.estimate !== null && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: 'var(--text-muted)' }}>
                              <Clock size={10} />
                              {task.estimate}h
                            </span>
                          )}
                          {/* Subtask count */}
                          {task.subtasks.length > 0 && (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                              {task.subtasks.filter(s => s.done).length}/{task.subtasks.length}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {colTasks.length === 0 && (
                      <div
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '13px' }}
                      >
                        No tasks
                      </div>
                    )}
                  </div>

                  {/* Add task footer */}
                  <button
                    onClick={() => openCreateTask(selectedProject.id, col.status)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      width: '100%', padding: '10px 14px',
                      background: 'none', border: 'none', borderTop: '1px solid var(--border)',
                      color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer',
                      borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
                      transition: 'color 150ms, background 150ms',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.background = 'none'; }}
                  >
                    <Plus size={13} />
                    Add task
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Gantt view ── */}
      {projects.length > 0 && view === 'gantt' && (
        <GanttView
          projects={projects}
          tasks={tasks}
          onShiftDates={shiftProjectDates}
        />
      )}

      {/* ── Modals ── */}
      {showCreateProject && (
        <CreateProjectModal
          onClose={() => setShowCreateProject(false)}
          onCreate={createProject}
        />
      )}

      {taskModal.open && (
        <TaskModal
          task={taskModal.task}
          defaultStatus={taskModal.defaultStatus}
          onClose={closeTaskModal}
          onSave={(title, status, priority, dueDate, estimate, subtasks) => {
            if (taskModal.task) {
              updateTask(taskModal.task.id, { title, status, priority, dueDate, estimate, subtasks });
            } else {
              createTask(taskModal.projectId, title, status, priority, dueDate, estimate, subtasks);
            }
            closeTaskModal();
          }}
          onDelete={taskModal.task ? () => { deleteTask(taskModal.task!.id); closeTaskModal(); } : undefined}
        />
      )}
    </div>
  );
}
