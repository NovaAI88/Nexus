import React, { useState, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Circle,
  Layers,
  Users,
  CalendarDays,
  Lock,
  Brain,
  Loader,
  X,
} from 'lucide-react';
import { useTaskEngine } from '../core/tasks/useTaskEngine';
import { useProjects } from '../core/projects/useProjects';
import { load } from '../storage/localStore';
import { generateWeeklyReview } from '../services/ai';

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

// ── Date utils ───────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getMondayOfWeek(d: Date): Date {
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function addWeeks(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n * 7);
  return next;
}

function formatWeekRange(monday: Date): string {
  const end = new Date(monday);
  end.setDate(monday.getDate() + 6);
  const fmt = (date: Date) =>
    date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${fmt(monday)} – ${fmt(end)}`;
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const OVERLOAD_MINUTES = 8 * 60; // 480 min = 8h

// ── Types ────────────────────────────────────────────────────────────────────

interface Task {
  id: string;
  projectId: string | null;
  date: string | null;
  title: string;
  status: string;
  estimate?: number;
  subtaskCount?: number;
  [key: string]: unknown;
}

// ── Task card ────────────────────────────────────────────────────────────────

interface WeekTaskCardProps {
  task: Task;
  color: string;
  projectName: string;
  onToggle: () => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
}

function WeekTaskCard({ task, color, projectName, onToggle, onDragStart }: WeekTaskCardProps) {
  const done = task.status === 'done';

  return (
    <div
      draggable
      onDragStart={onDragStart}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '7px',
        padding: '7px 9px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        cursor: 'grab',
        opacity: done ? 0.5 : 1,
        userSelect: 'none',
        transition: 'border-color 120ms ease, opacity 120ms ease',
        marginBottom: '5px',
      }}
      onMouseEnter={(e) => {
        if (!done) (e.currentTarget as HTMLDivElement).style.borderColor = color;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
      }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
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
        {done ? <CheckCircle2 size={13} /> : <Circle size={13} />}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '12px',
            color: 'var(--text-primary)',
            textDecoration: done ? 'line-through' : 'none',
            lineHeight: 1.4,
            wordBreak: 'break-word',
          }}
        >
          {task.title}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px', flexWrap: 'wrap' }}>
          {projectName && (
            <span
              style={{
                fontSize: '9px',
                fontWeight: 600,
                padding: '1px 5px',
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
          {task.estimate != null && task.estimate > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '9px', color: 'var(--text-muted)' }}>
              <Clock size={8} />
              {task.estimate}m
            </span>
          )}
          {task.subtaskCount != null && task.subtaskCount > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '9px', color: 'var(--text-muted)' }}>
              <Layers size={8} />
              {task.subtaskCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Team Week upgrade modal ──────────────────────────────────────────────────

function TeamWeekModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '36px 32px',
          maxWidth: '380px',
          width: '90%',
          textAlign: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(107, 107, 240, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <Users size={20} style={{ color: 'var(--accent)' }} />
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 10px' }}>
          Team Week — Coming Soon
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 24px', lineHeight: 1.6 }}>
          See your whole team's week at a glance. Spot overload, balance workloads,
          and coordinate without meetings. Available in NEXUS Pro.
        </p>
        <button
          onClick={onClose}
          style={{
            padding: '10px 28px',
            background: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-hover)')
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)')
          }
        >
          Got it
        </button>
      </div>
    </div>
  );
}

// ── Week page ────────────────────────────────────────────────────────────────

export default function Week() {
  const todayMidnight = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();

  const [weekStart, setWeekStart] = useState(() => getMondayOfWeek(new Date()));
  const [dropTarget, setDropTarget] = useState<string | null>(null); // YYYY-MM-DD or 'waiting'
  const [showTeamModal, setShowTeamModal] = useState(false);
  const dragTaskId = useRef<string | null>(null);

  // ── Weekly Review state ──────────────────────────────────────────────────
  type ReviewStatus = 'idle' | 'loading' | 'done' | 'error';
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('idle');
  const [reviewText, setReviewText] = useState('');
  const [showReviewPanel, setShowReviewPanel] = useState(false);

  const { tasks, updateTask, setTaskStatus } = useTaskEngine();
  const { getProject } = useProjects();

  const isCurrentWeek =
    toDateStr(weekStart) === toDateStr(getMondayOfWeek(new Date()));

  // 7 day dates for this week
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  // ── Helpers ──────────────────────────────────────────────────────────────

  function getProjectMeta(projectId: string | null) {
    if (!projectId) return { name: '', color: '#6B6B78' };
    const p = getProject(projectId);
    return { name: p?.name ?? projectId, color: projectColor(projectId) };
  }

  function toggleDone(task: Task) {
    setTaskStatus(task.id, task.status === 'done' ? 'open' : 'done');
  }

  // ── Weekly Review handler ─────────────────────────────────────────────────

  const handleWeeklyReview = useCallback(async () => {
    if (reviewStatus === 'loading') return;
    setShowReviewPanel(true);
    setReviewStatus('loading');

    const weekDateStrs = weekDays.map((d) => toDateStr(d));
    const weekTaskList = (tasks as Task[]).filter(
      (t) => t.date !== null && weekDateStrs.includes(t.date) && t.status !== 'cancelled',
    );

    const kprojects: { id: string; name: string }[] = load('nexus:kprojects', []);

    try {
      const text = await generateWeeklyReview({
        weekTasks: weekTaskList.map((t) => ({
          title: t.title,
          status: t.status,
          projectId: t.projectId,
        })),
        weekStart: toDateStr(weekStart),
        projects: kprojects,
      });
      setReviewText(text);
      setReviewStatus('done');
    } catch {
      setReviewStatus('error');
    }
  }, [reviewStatus, tasks, weekDays, weekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeTasks = (tasks as Task[]).filter((t) => t.status !== 'cancelled');

  // Waiting = active tasks with no date
  const waitingTasks = activeTasks.filter((t) => !t.date);

  function tasksForDay(dateStr: string): Task[] {
    const dayT = activeTasks.filter((t) => t.date === dateStr);
    return [
      ...dayT.filter((t) => t.status !== 'done'),
      ...dayT.filter((t) => t.status === 'done'),
    ];
  }

  // Total estimated minutes for a day
  function minutesForDay(dateStr: string): number {
    return activeTasks
      .filter((t) => t.date === dateStr)
      .reduce((sum, t) => sum + (t.estimate ?? 0), 0);
  }

  function formatHours(minutes: number): string {
    const h = minutes / 60;
    if (h === 0) return '';
    if (h % 1 === 0) return `${h}h`;
    return `${h.toFixed(1)}h`;
  }

  // ── Drag handlers ────────────────────────────────────────────────────────

  function handleDragStart(e: React.DragEvent<HTMLDivElement>, taskId: string) {
    dragTaskId.current = taskId;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
    (e.currentTarget as HTMLDivElement).style.opacity = '0.4';
    setTimeout(() => {
      if (e.currentTarget) (e.currentTarget as HTMLDivElement).style.opacity = '';
    }, 0);
  }

  function handleDropOnDay(e: React.DragEvent, dateStr: string) {
    e.preventDefault();
    setDropTarget(null);
    const id = dragTaskId.current ?? e.dataTransfer.getData('text/plain');
    if (!id) return;
    updateTask(id, { date: dateStr });
    dragTaskId.current = null;
  }

  function handleDropOnWaiting(e: React.DragEvent) {
    e.preventDefault();
    setDropTarget(null);
    const id = dragTaskId.current ?? e.dataTransfer.getData('text/plain');
    if (!id) return;
    updateTask(id, { date: null });
    dragTaskId.current = null;
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      {showTeamModal && <TeamWeekModal onClose={() => setShowTeamModal(false)} />}

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
        {/* Week navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setWeekStart((d) => addWeeks(d, -1))}
            style={navBtnStyle}
            title="Previous week"
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
              {isCurrentWeek ? 'This Week' : 'Week'}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              {formatWeekRange(weekStart)}
            </p>
          </div>

          <button
            onClick={() => setWeekStart((d) => addWeeks(d, 1))}
            style={navBtnStyle}
            title="Next week"
          >
            <ChevronRight size={16} />
          </button>

          {!isCurrentWeek && (
            <button
              onClick={() => setWeekStart(getMondayOfWeek(new Date()))}
              style={{
                ...navBtnStyle,
                fontSize: '12px',
                padding: '5px 12px',
                width: 'auto',
                color: 'var(--accent)',
                borderColor: 'var(--accent)',
              }}
            >
              Current
            </button>
          )}
        </div>

        {/* Right-side buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Weekly Review */}
          <button
            onClick={handleWeeklyReview}
            disabled={reviewStatus === 'loading'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              background: 'var(--bg-surface)',
              color: reviewStatus === 'loading' ? 'var(--text-muted)' : 'var(--accent)',
              border: '1px solid var(--accent)',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: reviewStatus === 'loading' ? 'not-allowed' : 'pointer',
              transition: 'background 150ms ease',
            }}
            onMouseEnter={(e) => { if (reviewStatus !== 'loading') (e.currentTarget as HTMLButtonElement).style.background = 'rgba(107,107,240,0.08)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-surface)'; }}
          >
            {reviewStatus === 'loading'
              ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
              : <Brain size={14} />
            }
            Weekly Review
          </button>

          {/* Team Week toggle stub */}
          <button
            onClick={() => setShowTeamModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              background: 'var(--bg-surface)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: 500,
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
            <Users size={14} />
            Team Week
            <Lock size={11} style={{ opacity: 0.5 }} />
          </button>
        </div>
      </header>

      {/* ── Weekly Review panel ────────────────────────────────────────── */}
      {showReviewPanel && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '14px 16px',
            background: 'rgba(107, 107, 240, 0.07)',
            border: '1px solid rgba(107, 107, 240, 0.2)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '16px',
            flexShrink: 0,
          }}
        >
          {reviewStatus === 'loading'
            ? <Loader size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px', animation: 'spin 1s linear infinite' }} />
            : <Brain size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
          }
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
              Weekly Review — {toDateStr(weekStart)}
            </div>
            {reviewStatus === 'loading' && (
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Generating your review…</p>
            )}
            {reviewStatus === 'done' && (
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{reviewText}</p>
            )}
            {reviewStatus === 'error' && (
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--error)' }}>
                Failed to generate review. Is the AI server running?
                <button
                  onClick={() => { setReviewStatus('idle'); handleWeeklyReview(); }}
                  style={{ marginLeft: '8px', background: 'none', border: 'none', color: 'var(--accent)', fontSize: '12px', cursor: 'pointer', padding: 0 }}
                >
                  Retry
                </button>
              </p>
            )}
          </div>
          <button
            onClick={() => setShowReviewPanel(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0, padding: '2px' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Week grid ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr) 180px',
          gap: '8px',
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Day columns */}
        {weekDays.map((date, i) => {
          const dateStr = toDateStr(date);
          const isToday = date.getTime() === todayMidnight.getTime();
          const colTasks = tasksForDay(dateStr);
          const minutes = minutesForDay(dateStr);
          const isOverload = minutes > OVERLOAD_MINUTES;
          const isOver = dropTarget === dateStr;
          const hoursLabel = formatHours(minutes);

          return (
            <div
              key={dateStr}
              style={{
                background: 'var(--bg-card)',
                border: `1px solid ${isOver ? 'var(--accent)' : isToday ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: 'border-color 150ms ease',
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDropTarget(dateStr);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDropTarget(null);
                }
              }}
              onDrop={(e) => handleDropOnDay(e, dateStr)}
            >
              {/* Column header */}
              <div
                style={{
                  padding: '10px 10px 8px',
                  borderBottom: '1px solid var(--border-subtle)',
                  flexShrink: 0,
                  background: isOverload
                    ? 'rgba(251, 191, 36, 0.07)'
                    : 'transparent',
                  transition: 'background 200ms ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: isOverload
                          ? '#FBBF24'
                          : isToday
                          ? 'var(--accent)'
                          : 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        transition: 'color 200ms ease',
                      }}
                    >
                      {DAY_NAMES[i]}
                    </div>
                    <div
                      style={{
                        fontSize: '18px',
                        fontWeight: 600,
                        color: isOverload
                          ? '#FBBF24'
                          : isToday
                          ? 'var(--accent)'
                          : 'var(--text-primary)',
                        marginTop: '1px',
                        lineHeight: 1,
                        transition: 'color 200ms ease',
                      }}
                    >
                      {date.getDate()}
                    </div>
                  </div>

                  {/* Hours-loaded badge */}
                  {hoursLabel && (
                    <div
                      style={{
                        fontSize: '9px',
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-full)',
                        background: isOverload
                          ? 'rgba(251, 191, 36, 0.18)'
                          : 'rgba(107, 107, 240, 0.12)',
                        color: isOverload ? '#FBBF24' : 'var(--accent)',
                        fontVariantNumeric: 'tabular-nums',
                        marginTop: '2px',
                        whiteSpace: 'nowrap',
                        transition: 'background 200ms ease, color 200ms ease',
                      }}
                    >
                      {hoursLabel}
                      {isOverload && ' ⚠'}
                    </div>
                  )}
                </div>
              </div>

              {/* Task body */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '8px',
                  background: isOver ? 'rgba(107, 107, 240, 0.04)' : 'transparent',
                  transition: 'background 150ms ease',
                }}
              >
                {colTasks.length === 0 ? (
                  <div
                    style={{
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isOver ? 'var(--accent)' : 'var(--text-muted)',
                      fontSize: '11px',
                      opacity: isOver ? 0.9 : 0.5,
                      transition: 'color 150ms ease, opacity 150ms ease',
                    }}
                  >
                    {isOver ? 'Drop here' : '—'}
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const { name, color } = getProjectMeta(task.projectId);
                    return (
                      <WeekTaskCard
                        key={task.id}
                        task={task}
                        color={color}
                        projectName={name}
                        onToggle={() => toggleDone(task)}
                        onDragStart={(e) => handleDragStart(e, task.id)}
                      />
                    );
                  })
                )}
              </div>
            </div>
          );
        })}

        {/* ── Waiting list column ────────────────────────────────────── */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: `1px solid ${dropTarget === 'waiting' ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            transition: 'border-color 150ms ease',
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDropTarget('waiting');
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setDropTarget(null);
            }
          }}
          onDrop={handleDropOnWaiting}
        >
          {/* Header */}
          <div
            style={{
              padding: '10px 10px 8px',
              borderBottom: '1px solid var(--border-subtle)',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Waiting
            </div>
            {waitingTasks.length > 0 && (
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  marginTop: '2px',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {waitingTasks.length} unscheduled
              </div>
            )}
          </div>

          {/* Task body */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '8px',
              background: dropTarget === 'waiting' ? 'rgba(107, 107, 240, 0.04)' : 'transparent',
              transition: 'background 150ms ease',
            }}
          >
            {waitingTasks.length === 0 ? (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  color: dropTarget === 'waiting' ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: '11px',
                  textAlign: 'center',
                  transition: 'color 150ms ease',
                }}
              >
                <CalendarDays size={18} style={{ opacity: 0.5 }} />
                <span>
                  {dropTarget === 'waiting'
                    ? 'Drop to unschedule'
                    : 'No unscheduled tasks'}
                </span>
              </div>
            ) : (
              waitingTasks.map((task) => {
                const { name, color } = getProjectMeta(task.projectId);
                return (
                  <WeekTaskCard
                    key={task.id}
                    task={task}
                    color={color}
                    projectName={name}
                    onToggle={() => toggleDone(task)}
                    onDragStart={(e) => handleDragStart(e, task.id)}
                  />
                );
              })
            )}
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
