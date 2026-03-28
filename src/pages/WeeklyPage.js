import { useState, useEffect, useMemo } from 'react';

const DEPT_COLORS = {
  nexus: '#7b8cff',
  hephaestus: '#22d3ee',
  xenon: '#a78bfa',
  aureon: '#34d399',
};

const BLOCK_COLORS = {
  work: 'rgba(123, 140, 255, 0.18)',
  'side-job': 'rgba(245, 158, 11, 0.18)',
  fitness: 'rgba(52, 211, 153, 0.18)',
  gym: 'rgba(52, 211, 153, 0.18)',
  life: 'rgba(167, 139, 250, 0.18)',
  break: 'rgba(255, 255, 255, 0.06)',
  meal: 'rgba(234, 179, 8, 0.14)',
  recovery: 'rgba(167, 139, 250, 0.12)',
  system: 'rgba(255, 255, 255, 0.04)',
  custom: 'rgba(255, 255, 255, 0.08)',
};

function toMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function getWeekDates(todayStr) {
  const today = new Date(todayStr + 'T12:00:00');
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7));
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    days.push({
      date: `${y}-${m}-${day}`,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate(),
      isToday: `${y}-${m}-${day}` === todayStr,
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
    });
  }
  return days;
}

function WeeklyPage({
  date,
  projects,
  focusProjectId,
  departmentQueue = [],
  engineReasoning,
  addPlannerBlock,
  getPlannerBlocks,
  getTasksForDate,
  onNavigate,
}) {
  const [weeklyIntent, setWeeklyIntent] = useState('');

  useEffect(() => {
    setWeeklyIntent(window.localStorage.getItem('nexus:weekly-intent') || '');
  }, []);

  useEffect(() => {
    window.localStorage.setItem('nexus:weekly-intent', weeklyIntent);
  }, [weeklyIntent]);

  const weekDays = useMemo(() => getWeekDates(date), [date]);

  const weekData = useMemo(() => {
    return weekDays.map((day) => {
      const blocks = getPlannerBlocks ? getPlannerBlocks(day.date) : [];
      const tasks = getTasksForDate ? getTasksForDate(day.date) : [];
      const totalMinutes = blocks.reduce((sum, b) => {
        return sum + (toMinutes(b.end) - toMinutes(b.start));
      }, 0);
      return { ...day, blocks, tasks, totalMinutes };
    });
  }, [weekDays, getPlannerBlocks, getTasksForDate]);

  const completedProjects = projects.filter((p) => p.status === 'completed').length;
  const progressPct = projects.length ? Math.round((completedProjects / projects.length) * 100) : 0;

  const handleQuickAdd = (dayDate, dept) => {
    const duration = 60;
    const start = '09:00';
    const endMin = toMinutes(start) + duration;
    const end = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;
    addPlannerBlock(dayDate, {
      type: 'work',
      label: dept.nextAction || dept.name,
      start,
      end,
    });
  };

  return (
    <div className="week-page">
      {/* Header */}
      <header className="week-header">
        <div>
          <h1 className="week-title">Week</h1>
          <p className="week-subtitle">
            {weekDays[0]?.dayName} {weekDays[0]?.dayNum} — {weekDays[6]?.dayName} {weekDays[6]?.dayNum}
          </p>
        </div>
        <div className="week-header-right">
          <div className="week-progress-mini">
            <span className="week-progress-label">{completedProjects}/{projects.length} projects</span>
            <div className="week-progress-track">
              <div className="week-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>
      </header>

      {/* Weekly intent */}
      <div className="week-intent">
        <input
          className="week-intent-input"
          type="text"
          placeholder="This week's focus..."
          value={weeklyIntent}
          onChange={(e) => setWeeklyIntent(e.target.value)}
        />
      </div>

      {/* Engine reasoning */}
      {engineReasoning && (
        <div className="week-reasoning">
          <span className="week-reasoning-dot" />
          <span>{engineReasoning}</span>
        </div>
      )}

      {/* 7-day grid */}
      <div className="week-grid">
        {weekData.map((day) => (
          <div
            key={day.date}
            className={`week-day${day.isToday ? ' is-today' : ''}${day.isWeekend ? ' is-weekend' : ''}`}
          >
            <div className="week-day-header">
              <span className="week-day-name">{day.dayName}</span>
              <span className={`week-day-num${day.isToday ? ' is-today' : ''}`}>{day.dayNum}</span>
            </div>

            {/* Hours summary */}
            <div className="week-day-summary">
              <span className="week-day-hours">
                {day.totalMinutes > 0 ? `${(day.totalMinutes / 60).toFixed(1)}h` : '—'}
              </span>
              <span className="week-day-task-count">
                {day.tasks.length > 0 && `${day.tasks.filter((t) => t.status === 'done').length}/${day.tasks.length}`}
              </span>
            </div>

            {/* Blocks */}
            <div className="week-day-blocks">
              {day.blocks
                .slice()
                .sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
                .map((block) => {
                  const duration = toMinutes(block.end) - toMinutes(block.start);
                  const bg = BLOCK_COLORS[block.type] || BLOCK_COLORS.work;
                  return (
                    <div
                      key={block.id}
                      className="week-block"
                      style={{ '--block-bg': bg }}
                      title={`${block.start}–${block.end} ${block.label}`}
                    >
                      <span className="week-block-time">{block.start}</span>
                      <span className="week-block-label">{block.label}</span>
                      <span className="week-block-duration">{duration}m</span>
                    </div>
                  );
                })}

              {/* Tasks without blocks */}
              {day.tasks
                .filter((t) => !t.blockId && t.status !== 'done')
                .map((task) => (
                  <div key={task.id} className="week-task-chip">
                    <span className="week-task-dot" />
                    <span className="week-task-title">{task.title}</span>
                  </div>
                ))}
            </div>

            {/* Quick-add for today */}
            {day.isToday && day.blocks.length === 0 && (
              <button
                className="week-day-add-btn"
                onClick={() => onNavigate && onNavigate('today')}
              >
                Plan today
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Department queue below the grid */}
      {departmentQueue.length > 0 && (
        <div className="week-depts">
          <h3 className="week-depts-title">Department Queue</h3>
          <div className="week-depts-list">
            {departmentQueue.map((dept) => {
              const color = DEPT_COLORS[dept.id] || '#7b8cff';
              return (
                <div key={dept.id} className="week-dept-card" style={{ '--dept-color': color }}>
                  <div className="week-dept-info">
                    <span className="week-dept-dot" />
                    <span className="week-dept-name">{dept.name}</span>
                    <span className={`urgency-badge urgency-${dept.urgency}`}>
                      {dept.urgency?.toUpperCase()}
                    </span>
                  </div>
                  <p className="week-dept-action">{dept.nextAction}</p>
                  <div className="week-dept-days">
                    {weekDays.filter((d) => !d.isWeekend).map((day) => (
                      <button
                        key={day.date}
                        className="week-dept-day-btn"
                        onClick={() => handleQuickAdd(day.date, dept)}
                        title={`Add to ${day.dayName}`}
                      >
                        {day.dayName.charAt(0)}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default WeeklyPage;
