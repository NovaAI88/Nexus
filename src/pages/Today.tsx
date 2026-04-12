import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Brain,
  Clock,
  CheckCircle2,
  Circle,
  Layers,
  Loader,
  Calendar,
} from 'lucide-react';
import { useTaskEngine } from '../core/tasks/useTaskEngine';
import { useProjects } from '../core/projects/useProjects';
import { load } from '../storage/localStore';
import {
  generateMorningBrief,
  getDailyPlannerSuggestions,
} from '../services/ai';

// ── Project color palette ────────────────────────────────────────────────────

const PROJECT_COLORS: Record<string, string> = {
  nexus: '#6B6BF0',
  vortex: '#9B5FE0',
  xenon: '#40C9A2',
  aureon: '#FBBF24',
  pawly: '#E05F7E',
};

function projectColor(projectId: string | null): string {
  if (!projectId) return '#6B6B78';
  return PROJECT_COLORS[projectId] ?? '#6B6B78';
}

// ── Timeline config ──────────────────────────────────────────────────────────

// 6 AM to 10 PM inclusive → hours 6..22
const TIMELINE_HOURS = Array.from({ length: 17 }, (_, i) => i + 6);

function hourLabel(h: number): string {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

function slotKey(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

// ── Date utils ───────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  // Local YYYY-MM-DD
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

function formatDisplayDate(d: Date): string {
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

// ── Task card ────────────────────────────────────────────────────────────────

interface Task {
  id: string;
  projectId: string | null;
  date: string | null;
  title: string;
  status: string;
  estimate?: number;
  subtaskCount?: number;
  timeSlot?: string | null;
  [key: string]: unknown;
}

interface TaskCardProps {
  task: Task;
  color: string;
  projectName: string;
  onToggle: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  compact?: boolean;
}

function TaskCard({
  task,
  color,
  projectName,
  onToggle,
  draggable,
  onDragStart,
  compact,
}: TaskCardProps) {
  const done = task.status === 'done';

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: compact ? '8px 10px' : '10px 12px',
        background: 'var(--bg-card)',
        border: `1px solid var(--border)`,
        borderRadius: 'var(--radius-md)',
        cursor: draggable ? 'grab' : 'default',
        opacity: done ? 0.5 : 1,
        userSelect: 'none',
        transition: 'border-color 120ms ease, opacity 120ms ease',
      }}
      onMouseEnter={(e) => {
        if (!done)
          (e.currentTarget as HTMLDivElement).style.borderColor = color;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor =
          'var(--border)';
      }}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        style={{
          flexShrink: 0,
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: done ? 'var(--success)' : 'var(--text-muted)',
          lineHeight: 0,
          marginTop: '1px',
        }}
      >
        {done ? <CheckCircle2 size={15} /> : <Circle size={15} />}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '13px',
            color: 'var(--text-primary)',
            textDecoration: done ? 'line-through' : 'none',
            lineHeight: 1.4,
            wordBreak: 'break-word',
          }}
        >
          {task.title}
        </div>

        {/* Meta */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '5px',
            flexWrap: 'wrap',
          }}
        >
          {/* Project pill */}
          {projectName && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: 'var(--radius-full)',
                background: color + '22',
                color: color,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {projectName}
            </span>
          )}

          {/* Estimate badge */}
          {task.estimate != null && task.estimate > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '10px',
                color: 'var(--text-muted)',
              }}
            >
              <Clock size={9} />
              {task.estimate}m
            </span>
          )}

          {/* Subtask count */}
          {task.subtaskCount != null && task.subtaskCount > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '10px',
                color: 'var(--text-muted)',
              }}
            >
              <Layers size={9} />
              {task.subtaskCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Inline add-task form ─────────────────────────────────────────────────────

function AddTaskForm({
  onAdd,
  onCancel,
}: {
  onAdd: (title: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');

  return (
    <div style={{ padding: '8px 12px 4px' }}>
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && title.trim()) {
            onAdd(title.trim());
          }
          if (e.key === 'Escape') onCancel();
        }}
        placeholder="Task title…"
        style={{
          width: '100%',
          padding: '8px 10px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--accent)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-primary)',
          fontSize: '13px',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <button
          onClick={() => {
            if (title.trim()) onAdd(title.trim());
          }}
          style={{
            padding: '5px 14px',
            background: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Add
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: '5px 14px',
            background: 'var(--bg-hover)',
            color: 'var(--text-secondary)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Today page ───────────────────────────────────────────────────────────────

// ── Storage keys ─────────────────────────────────────────────────────────────

const KTASKS_KEY = 'nexus:ktasks';

// ── KTask type (for deadlines / overdue) ─────────────────────────────────────

interface KTask {
  id: string;
  projectId: string;
  title: string;
  status: string;
  dueDate: string | null;
}

export default function Today() {
  const today = new Date();
  const [searchParams] = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(() => {
    const dateParam = searchParams.get('date');
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      const d = new Date(dateParam + 'T00:00:00');
      if (!isNaN(d.getTime())) return d;
    }
    return today;
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [inboxDragOver, setInboxDragOver] = useState(false);
  const [slotDragOver, setSlotDragOver] = useState<string | null>(null);
  const dragTaskId = useRef<string | null>(null);

  // ── Morning Brief state ──────────────────────────────────────────────────
  type BriefStatus = 'idle' | 'loading' | 'done' | 'error';
  const [briefText, setBriefText] = useState<string>('');
  const [briefStatus, setBriefStatus] = useState<BriefStatus>('idle');
  const briefFetchedFor = useRef<string | null>(null);

  // ── Daily Planner state ──────────────────────────────────────────────────
  type PlanStatus = 'idle' | 'loading' | 'done' | 'error';
  const [planStatus, setPlanStatus] = useState<PlanStatus>('idle');

  const { tasks, addTask, updateTask, setTaskStatus } = useTaskEngine();
  const { getProject } = useProjects();

  const dateStr = toDateStr(selectedDate);
  const isToday = toDateStr(today) === dateStr;

  // ── Fetch Morning Brief (once per isToday date) ──────────────────────────

  const fetchBrief = useCallback(async (currentDateStr: string, currentTasks: Task[]) => {
    if (briefFetchedFor.current === currentDateStr) return;
    briefFetchedFor.current = currentDateStr;
    setBriefStatus('loading');

    const ktasks: KTask[] = load(KTASKS_KEY, []);
    const todayDate = new Date(currentDateStr + 'T00:00:00');
    const in7 = new Date(todayDate);
    in7.setDate(in7.getDate() + 7);

    const todayPayload = currentTasks
      .filter((t) => t.date === currentDateStr && t.status !== 'cancelled')
      .map((t) => ({ title: t.title, status: t.status }));

    const overduePayload = ktasks
      .filter((t) => {
        if (!t.dueDate || t.status === 'done') return false;
        return new Date(t.dueDate + 'T00:00:00') < todayDate;
      })
      .map((t) => ({ title: t.title, dueDate: t.dueDate! }));

    const deadlinePayload = ktasks
      .filter((t) => {
        if (!t.dueDate || t.status === 'done') return false;
        const d = new Date(t.dueDate + 'T00:00:00');
        return d >= todayDate && d <= in7;
      })
      .map((t) => ({ title: t.title, dueDate: t.dueDate! }));

    try {
      const text = await generateMorningBrief({
        todayTasks: todayPayload,
        overdueKTasks: overduePayload,
        deadlines: deadlinePayload,
      });
      setBriefText(text);
      setBriefStatus('done');
    } catch {
      briefFetchedFor.current = null; // allow retry
      setBriefStatus('error');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isToday && briefStatus === 'idle') {
      fetchBrief(dateStr, tasks as Task[]);
    }
  }, [isToday, dateStr, briefStatus, fetchBrief, tasks]);

  // ── Plan My Day (on-demand) ───────────────────────────────────────────────

  const handlePlanDay = useCallback(async () => {
    if (planStatus === 'loading') return;
    setPlanStatus('loading');

    const unscheduled = (tasks as Task[])
      .filter((t) => t.date === dateStr && !t.timeSlot && t.status !== 'done' && t.status !== 'cancelled')
      .map((t) => ({ title: t.title, estimate: t.estimate }));

    if (unscheduled.length === 0) {
      setPlanStatus('done');
      return;
    }

    try {
      const suggestions = await getDailyPlannerSuggestions({
        unscheduledTasks: unscheduled,
        date: dateStr,
      });

      // Apply each suggestion — map taskIndex back to unscheduled task array
      suggestions.forEach((s) => {
        const target = unscheduled[s.taskIndex];
        if (!target) return;
        const match = (tasks as Task[]).find(
          (t) => t.date === dateStr && t.title === target.title && !t.timeSlot,
        );
        if (match) updateTask(match.id, { timeSlot: s.start });
      });

      setPlanStatus('done');
    } catch {
      setPlanStatus('error');
    }
  }, [planStatus, tasks, dateStr, updateTask]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  function getProjectMeta(projectId: string | null) {
    if (!projectId) return { name: '', color: '#6B6B78' };
    const p = getProject(projectId);
    return {
      name: p?.name ?? projectId,
      color: projectColor(projectId),
    };
  }

  function toggleDone(task: Task) {
    if (task.status === 'done') {
      setTaskStatus(task.id, 'open');
    } else {
      setTaskStatus(task.id, 'done');
    }
  }

  // Tasks for the selected date (excluding cancelled)
  const dateTasks = tasks.filter(
    (t: Task) => t.date === dateStr && t.status !== 'cancelled'
  );

  // Inbox: no timeSlot — incomplete first, done at bottom
  const inboxTasks = [
    ...dateTasks.filter((t: Task) => !t.timeSlot && t.status !== 'done'),
    ...dateTasks.filter((t: Task) => !t.timeSlot && t.status === 'done'),
  ];

  // Timeline: has timeSlot
  const scheduledTasks = dateTasks.filter((t: Task) => !!t.timeSlot);

  // Tasks per hour slot
  function tasksForSlot(hour: number): Task[] {
    const key = slotKey(hour);
    const slot = scheduledTasks.filter((t: Task) => t.timeSlot === key);
    return [
      ...slot.filter((t) => t.status !== 'done'),
      ...slot.filter((t) => t.status === 'done'),
    ];
  }

  // ── Drag handlers ────────────────────────────────────────────────────────

  function handleDragStart(e: React.DragEvent<HTMLDivElement>, taskId: string) {
    dragTaskId.current = taskId;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
    (e.currentTarget as HTMLDivElement).style.opacity = '0.4';
    setTimeout(() => {
      if (e.currentTarget)
        (e.currentTarget as HTMLDivElement).style.opacity = '';
    }, 0);
  }

  function handleDropOnSlot(e: React.DragEvent, hour: number) {
    e.preventDefault();
    setSlotDragOver(null);
    const id = dragTaskId.current ?? e.dataTransfer.getData('text/plain');
    if (!id) return;
    updateTask(id, { timeSlot: slotKey(hour) });
    dragTaskId.current = null;
  }

  function handleDropOnInbox(e: React.DragEvent) {
    e.preventDefault();
    setInboxDragOver(false);
    const id = dragTaskId.current ?? e.dataTransfer.getData('text/plain');
    if (!id) return;
    updateTask(id, { timeSlot: null });
    dragTaskId.current = null;
  }

  // ── Add task ─────────────────────────────────────────────────────────────

  function handleAddTask(title: string) {
    const task = addTask({ title, date: dateStr });
    // Set default estimate after creation
    if (task?.id) updateTask(task.id, { estimate: 30 });
    setShowAddForm(false);
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          flexShrink: 0,
        }}
      >
        {/* Date nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setSelectedDate((d) => addDays(d, -1))}
            style={navBtnStyle}
            title="Previous day"
          >
            <ChevronLeft size={16} />
          </button>

          <div>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {isToday ? 'Today' : formatDisplayDate(selectedDate).split(',')[0]}
            </h1>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                margin: '2px 0 0',
              }}
            >
              {formatDisplayDate(selectedDate)}
            </p>
          </div>

          <button
            onClick={() => setSelectedDate((d) => addDays(d, 1))}
            style={navBtnStyle}
            title="Next day"
          >
            <ChevronRight size={16} />
          </button>

          {!isToday && (
            <button
              onClick={() => setSelectedDate(today)}
              style={{
                ...navBtnStyle,
                fontSize: '12px',
                padding: '5px 12px',
                width: 'auto',
                color: 'var(--accent)',
                borderColor: 'var(--accent)',
              }}
            >
              Today
            </button>
          )}
        </div>

        {/* Add task */}
        <button
          onClick={() => {
            setShowAddForm(true);
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            background: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 150ms ease',
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background =
              'var(--accent-hover)')
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background =
              'var(--accent)')
          }
        >
          <Plus size={14} />
          Add task
        </button>
      </header>

      {/* ── AI Morning Brief ─────────────────────────────────────────── */}
      {isToday && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '12px 16px',
            background: 'rgba(107, 107, 240, 0.07)',
            border: '1px solid rgba(107, 107, 240, 0.2)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '16px',
            flexShrink: 0,
          }}
        >
          {briefStatus === 'loading'
            ? <Loader size={16} style={{ color: 'var(--accent)', marginTop: '2px', flexShrink: 0, animation: 'spin 1s linear infinite' }} />
            : <Brain size={16} style={{ color: 'var(--accent)', marginTop: '2px', flexShrink: 0 }} />
          }
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--accent)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              Morning Brief
            </div>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {briefStatus === 'loading' && 'Generating your brief…'}
              {briefStatus === 'done' && briefText}
              {briefStatus === 'error' && (
                <span>
                  {inboxTasks.filter((t: Task) => t.status !== 'done').length === 0 && scheduledTasks.length === 0
                    ? 'No tasks scheduled for today.'
                    : `${inboxTasks.filter((t: Task) => t.status !== 'done').length} task${inboxTasks.filter((t: Task) => t.status !== 'done').length !== 1 ? 's' : ''} in queue${scheduledTasks.length > 0 ? `, ${scheduledTasks.length} on timeline` : ''}.`
                  }
                  <button
                    onClick={() => { briefFetchedFor.current = null; setBriefStatus('idle'); }}
                    style={{ marginLeft: '8px', background: 'none', border: 'none', color: 'var(--accent)', fontSize: '12px', cursor: 'pointer', padding: 0 }}
                  >
                    Retry
                  </button>
                </span>
              )}
              {briefStatus === 'idle' && 'Loading…'}
            </p>
          </div>

          {/* Plan my day button */}
          <button
            onClick={handlePlanDay}
            disabled={planStatus === 'loading'}
            title="Let AI suggest time blocks for your unscheduled tasks"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 10px',
              background: planStatus === 'loading' ? 'var(--bg-surface)' : 'rgba(107,107,240,0.12)',
              border: '1px solid rgba(107,107,240,0.3)',
              borderRadius: 'var(--radius-md)',
              color: planStatus === 'done' ? 'var(--success)' : 'var(--accent)',
              fontSize: '11px',
              fontWeight: 500,
              cursor: planStatus === 'loading' ? 'not-allowed' : 'pointer',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            {planStatus === 'loading'
              ? <><Loader size={11} style={{ animation: 'spin 1s linear infinite' }} /> Planning…</>
              : planStatus === 'done'
              ? <><Calendar size={11} /> Planned</>
              : <><Calendar size={11} /> Plan day</>
            }
          </button>
        </div>
      )}

      {/* ── Panels ────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: '20px',
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* ── Left: Inbox / Queue (40%) ──────────────────────────────── */}
        <div
          style={{
            flex: '0 0 40%',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-card)',
            border: inboxDragOver
              ? '1px solid var(--accent)'
              : '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            transition: 'border-color 150ms ease',
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setInboxDragOver(true);
          }}
          onDragLeave={() => setInboxDragOver(false)}
          onDrop={handleDropOnInbox}
        >
          {/* Panel header */}
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
              }}
            >
              Inbox
            </span>
            <span
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {inboxTasks.filter((t: Task) => t.status !== 'done').length} remaining
            </span>
          </div>

          {/* Add form */}
          {showAddForm && (
            <div style={{ borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <AddTaskForm
                onAdd={handleAddTask}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          )}

          {/* Task list */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {inboxTasks.length === 0 && !showAddForm ? (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  textAlign: 'center',
                  padding: '32px',
                }}
              >
                <div style={{ fontSize: '24px', opacity: 0.4 }}>☑</div>
                <p style={{ margin: 0 }}>
                  {inboxDragOver
                    ? 'Drop to unschedule'
                    : 'No tasks in queue.\nAdd a task or drag from the timeline.'}
                </p>
              </div>
            ) : (
              inboxTasks.map((task: Task) => {
                const { name, color } = getProjectMeta(task.projectId);
                return (
                  <TaskCard
                    key={task.id}
                    task={task}
                    color={color}
                    projectName={name}
                    onToggle={() => toggleDone(task)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* ── Right: Timeline (60%) ───────────────────────────────────── */}
        <div
          style={{
            flex: '0 0 calc(60% - 20px)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}
        >
          {/* Panel header */}
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
              }}
            >
              Timeline
            </span>
            <span
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              6 AM – 10 PM
            </span>
          </div>

          {/* Hourly rows */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {TIMELINE_HOURS.map((hour) => {
              const key = slotKey(hour);
              const slotTasks = tasksForSlot(hour);
              const isOver = slotDragOver === key;
              const isCurrentHour =
                isToday && new Date().getHours() === hour;

              return (
                <div
                  key={hour}
                  style={{
                    display: 'flex',
                    minHeight: '60px',
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'background 150ms ease',
                    background: isOver
                      ? 'rgba(107, 107, 240, 0.06)'
                      : isCurrentHour
                      ? 'rgba(107, 107, 240, 0.03)'
                      : 'transparent',
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setSlotDragOver(key);
                  }}
                  onDragLeave={(e) => {
                    // Only clear if leaving the row entirely
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setSlotDragOver(null);
                    }
                  }}
                  onDrop={(e) => handleDropOnSlot(e, hour)}
                >
                  {/* Hour label */}
                  <div
                    style={{
                      width: '64px',
                      flexShrink: 0,
                      padding: '10px 12px 0',
                      fontSize: '11px',
                      color: isCurrentHour
                        ? 'var(--accent)'
                        : 'var(--text-muted)',
                      fontWeight: isCurrentHour ? 600 : 400,
                      fontVariantNumeric: 'tabular-nums',
                      borderRight: '1px solid var(--border-subtle)',
                      userSelect: 'none',
                    }}
                  >
                    {hourLabel(hour)}
                  </div>

                  {/* Drop zone + tasks */}
                  <div
                    style={{
                      flex: 1,
                      padding: slotTasks.length > 0 ? '6px 10px' : '0 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px',
                      justifyContent: slotTasks.length === 0 ? 'center' : 'flex-start',
                    }}
                  >
                    {slotTasks.length === 0 && isOver && (
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--accent)',
                          opacity: 0.8,
                        }}
                      >
                        Drop here
                      </div>
                    )}
                    {slotTasks.map((task: Task) => {
                      const { name, color } = getProjectMeta(task.projectId);
                      return (
                        <TaskCard
                          key={task.id}
                          task={task}
                          color={color}
                          projectName={name}
                          onToggle={() => toggleDone(task)}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          compact
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Shared nav button style ──────────────────────────────────────────────────

const navBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '30px',
  height: '30px',
  background: 'none',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  fontSize: '13px',
  transition: 'border-color 150ms ease, color 150ms ease',
};
