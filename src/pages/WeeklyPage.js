import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import TypewriterText from '../components/TypewriterText';
import WeekChatPlanner from '../components/WeekChatPlanner';

// ─── Constants ───────────────────────────────────────────────────────────────

const GRID_START_HOUR = 7;
const GRID_END_HOUR = 22;
const PX_PER_HOUR = 60; // 1px per minute
const CANVAS_HEIGHT = (GRID_END_HOUR - GRID_START_HOUR) * PX_PER_HOUR; // 900px

// Block type → { bg, border } colors
const BLOCK_COLORS = {
  work:       { bg: 'rgba(91,107,255,0.15)',  border: '#5B6BFF' },
  'side-job': { bg: 'rgba(245,158,11,0.15)',  border: '#f59e0b' },
  fitness:    { bg: 'rgba(34,197,94,0.15)',   border: '#22c55e' },
  gym:        { bg: 'rgba(34,197,94,0.15)',   border: '#22c55e' },
  life:       { bg: 'rgba(168,85,247,0.15)',  border: '#a855f7' },
  meal:       { bg: 'rgba(245,158,11,0.15)',  border: '#f59e0b' },
  break:      { bg: 'rgba(148,163,184,0.15)', border: '#94a3b8' },
  recovery:   { bg: 'rgba(6,182,212,0.15)',   border: '#06b6d4' },
  system:     { bg: 'rgba(100,116,139,0.15)', border: '#64748b' },
  custom:     { bg: 'rgba(123,140,255,0.15)', border: '#7b8cff' },
};
const BLOCK_COLOR_DEFAULT = { bg: 'rgba(91,107,255,0.15)', border: '#5B6BFF' };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeToMins(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minsToTime(totalMins) {
  const h = Math.floor(totalMins / 60).toString().padStart(2, '0');
  const m = (totalMins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function snapToQuarterHour(totalMins) {
  const snapped = Math.round(totalMins / 15) * 15;
  return minsToTime(snapped);
}

function blockTopPx(start) {
  const [h, m] = start.split(':').map(Number);
  return (h + m / 60 - GRID_START_HOUR) * PX_PER_HOUR;
}

function blockHeightPx(start, end) {
  return Math.max(28, timeToMins(end) - timeToMins(start));
}

function computeNowPx() {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  return (mins - GRID_START_HOUR * 60);
}

function formatHHMM(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function getTwoWeekDates(todayStr) {
  const today = new Date(todayStr + 'T12:00:00');
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7));
  const days = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    days.push({
      date: `${y}-${mo}-${day}`,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate(),
      isToday: `${y}-${mo}-${day}` === todayStr,
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
      week: i < 7 ? 0 : 1,
    });
  }
  return days;
}

function getDaysToDeadline(deadlineStr) {
  if (!deadlineStr) return null;
  const now = new Date();
  const deadline = new Date(deadlineStr + 'T23:59:59');
  const diff = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
  return diff;
}

// ─── WeekTimeAxis ────────────────────────────────────────────────────────────

function WeekTimeAxis() {
  const hours = [];
  for (let h = GRID_START_HOUR; h <= GRID_END_HOUR; h++) hours.push(h);
  return (
    <div className="week-time-axis">
      <div className="week-time-axis-spacer" />
      {hours.map((h) => (
        <div key={h} className="week-time-axis-row">
          <span className="week-time-axis-label">
            {String(h).padStart(2, '0')}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── WeeklyPage ──────────────────────────────────────────────────────────────

function WeeklyPage({
  date,
  projects,
  engineReasoning,
  addPlannerBlock,
  removePlannerBlock,
  getPlannerBlocks,
  getTasksForDate,
  setTaskStatus,
  onNavigate,
  aureonConnected,
  aureonStats,
  lifeBlockPicker,
  currentZone,
  freeGaps,
}) {
  const [weeklyIntent, setWeeklyIntent] = useState('');
  const [intentEditing, setIntentEditing] = useState(false);
  const intentInputRef = useRef(null);
  const [dragOverDay, setDragOverDay] = useState(null);
  const [viewMode, setViewMode] = useState(() =>
    localStorage.getItem('nexus:week-view-mode') || 'both'
  );
  const [expandedWeekends, setExpandedWeekends] = useState(new Set());
  const [lastSynced, setLastSynced] = useState(null);
  const [syncKey, setSyncKey] = useState(0);
  const [weeklyProposedBlocks, setWeeklyProposedBlocks] = useState({});
  const [dropIndicator, setDropIndicator] = useState(null); // { date, y, time }
  const [nowPx, setNowPx] = useState(computeNowPx);

  const lastDragOverTime = useRef(0);

  // ── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    setWeeklyIntent(window.localStorage.getItem('nexus:weekly-intent') || '');
  }, []);

  useEffect(() => {
    window.localStorage.setItem('nexus:weekly-intent', weeklyIntent);
  }, [weeklyIntent]);

  useEffect(() => {
    localStorage.setItem('nexus:week-view-mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (intentEditing && intentInputRef.current) {
      intentInputRef.current.focus();
    }
  }, [intentEditing]);

  // Update now-line every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setNowPx(computeNowPx());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // ── Derived data ─────────────────────────────────────────────────────────────

  const allDays = useMemo(() => getTwoWeekDates(date), [date]);

  const visibleDays = useMemo(() => {
    if (viewMode === 'this') return allDays.filter((d) => d.week === 0);
    if (viewMode === 'next') return allDays.filter((d) => d.week === 1);
    return allDays;
  }, [allDays, viewMode]);

  const weekData = useMemo(() => {
    void syncKey;
    return visibleDays.map((day) => {
      const blocks = getPlannerBlocks ? getPlannerBlocks(day.date) : [];
      const tasks = getTasksForDate ? getTasksForDate(day.date) : [];
      const totalMinutes = blocks.reduce((sum, b) => {
        return sum + (timeToMins(b.end) - timeToMins(b.start));
      }, 0);
      return { ...day, blocks, tasks, totalMinutes };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleDays, getPlannerBlocks, getTasksForDate, syncKey]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleSync = useCallback(() => {
    setSyncKey((k) => k + 1);
    setLastSynced(new Date());
  }, []);

  const syncStale = lastSynced
    ? (Date.now() - lastSynced.getTime()) > 60 * 60 * 1000
    : false;

  const handleBlockDragStart = useCallback((e, block, sourceDate) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({
      blockId: block.id,
      sourceDate,
      label: block.label,
      type: block.type,
      start: block.start,
      end: block.end,
      duration: timeToMins(block.end) - timeToMins(block.start),
      isLifeBlock: false,
    }));
  }, []);

  const handleLifeBlockDragStart = useCallback((e, activity) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify({
      isLifeBlock: true,
      label: `${activity.icon} ${activity.label}`,
      type: activity.category === 'fitness' ? 'fitness' : 'life',
      duration: activity.defaultDuration,
    }));
  }, []);

  const handleDayDragOver = useCallback((e, dayDate, canvasEl) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDay(dayDate);

    if (!canvasEl) return;
    const now = Date.now();
    if (now - lastDragOverTime.current < 50) return;
    lastDragOverTime.current = now;

    const canvasRect = canvasEl.getBoundingClientRect();
    const relY = e.clientY - canvasRect.top;
    const rawMins = (relY / PX_PER_HOUR) * 60 + GRID_START_HOUR * 60;
    const clampedMins = Math.max(GRID_START_HOUR * 60, Math.min(21.5 * 60, rawMins));
    const snappedTime = snapToQuarterHour(clampedMins);
    const snappedY = timeToMins(snappedTime) - GRID_START_HOUR * 60;

    setDropIndicator({ date: dayDate, y: snappedY, time: snappedTime });
  }, []);

  const handleDayDragLeave = useCallback(() => {
    setDragOverDay(null);
    setDropIndicator(null);
  }, []);

  const handleDayDrop = useCallback((e, targetDate, canvasEl) => {
    e.preventDefault();
    setDragOverDay(null);
    setDropIndicator(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));

      let start, end;
      if (canvasEl) {
        const canvasRect = canvasEl.getBoundingClientRect();
        const relY = e.clientY - canvasRect.top;
        const rawMins = (relY / PX_PER_HOUR) * 60 + GRID_START_HOUR * 60;
        const clampedMins = Math.max(GRID_START_HOUR * 60, Math.min(21.5 * 60, rawMins));
        start = snapToQuarterHour(clampedMins);
        const durationMins = data.duration || 30;
        const endMins = timeToMins(start) + durationMins;
        end = minsToTime(Math.min(endMins, GRID_END_HOUR * 60));
      } else {
        start = '09:00';
        end = '09:30';
      }

      if (data.isLifeBlock) {
        addPlannerBlock(targetDate, {
          type: data.type || 'life',
          label: data.label,
          start,
          end,
        });
        return;
      }

      if (!data.blockId || !data.sourceDate) return;
      removePlannerBlock(data.sourceDate, data.blockId);
      addPlannerBlock(targetDate, {
        type: data.type,
        label: data.label,
        start,
        end,
      });
    } catch { /* ignore */ }
  }, [addPlannerBlock, removePlannerBlock]);

  const handleTaskToggle = useCallback((taskId, currentStatus) => {
    if (!setTaskStatus) return;
    setTaskStatus(taskId, currentStatus === 'done' ? 'open' : 'done');
  }, [setTaskStatus]);

  const toggleWeekend = useCallback((date) => {
    setExpandedWeekends((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }, []);

  const handleApplyProposed = useCallback(() => {
    Object.entries(weeklyProposedBlocks).forEach(([dayDate, blocks]) => {
      blocks.forEach((block) => {
        addPlannerBlock(dayDate, {
          type: block.type,
          label: block.label,
          start: block.start,
          end: block.end,
        });
      });
    });
    setWeeklyProposedBlocks({});
  }, [addPlannerBlock, weeklyProposedBlocks]);

  const handleClearProposed = useCallback(() => {
    setWeeklyProposedBlocks({});
  }, []);

  const handleAddBlock = useCallback((dayDate, blockData) => {
    addPlannerBlock(dayDate, blockData);
  }, [addPlannerBlock]);

  // ── Labels ──────────────────────────────────────────────────────────────────

  const week1Label = allDays[0] ? `${allDays[0].dayName} ${allDays[0].dayNum}` : '';
  const week1End = allDays[6] ? `${allDays[6].dayName} ${allDays[6].dayNum}` : '';
  const week2Label = allDays[7] ? `${allDays[7].dayName} ${allDays[7].dayNum}` : '';
  const week2End = allDays[13] ? `${allDays[13].dayName} ${allDays[13].dayNum}` : '';

  const dateRange = viewMode === 'next' ? `${week2Label} — ${week2End}` :
    viewMode === 'this' ? `${week1Label} — ${week1End}` :
    `${week1Label} — ${week2End}`;

  const daysToDeadline = getDaysToDeadline('2026-04-14');
  const deadlineUrgency = daysToDeadline !== null && daysToDeadline <= 1 ? 'red' :
    daysToDeadline !== null && daysToDeadline <= 3 ? 'amber' : 'normal';

  const totalProposed = Object.values(weeklyProposedBlocks).reduce((s, arr) => s + arr.length, 0);

  const dayColumnProps = {
    dragOverDay,
    onDragOver: handleDayDragOver,
    onDragLeave: handleDayDragLeave,
    onDrop: handleDayDrop,
    onBlockDragStart: handleBlockDragStart,
    onRemoveBlock: removePlannerBlock,
    onTaskToggle: handleTaskToggle,
    onNavigate,
    weeklyIntent,
    expandedWeekends,
    onToggleWeekend: toggleWeekend,
    nowPx,
    dropIndicator,
    onAddBlock: handleAddBlock,
  };

  function renderWeekGrid(days) {
    return (
      <div className="week-time-scroll-area">
        <div className="week-time-inner">
          <WeekTimeAxis />
          <div className="week-grid--timed">
            {days.map((day) => (
              <WeekDayColumn
                key={day.date}
                day={day}
                proposedBlocks={weeklyProposedBlocks[day.date] || []}
                {...dayColumnProps}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="week-page">
      {/* ── Header ── */}
      <header className="week-header">
        <div>
          <h1 className="week-title">Planner</h1>
          <p className="week-subtitle">{dateRange}</p>
        </div>
        <div className="week-header-right">
          <div className="week-view-toggle">
            {['this', 'both', 'next'].map((mode) => (
              <button
                key={mode}
                className={`week-view-btn${viewMode === mode ? ' is-active' : ''}`}
                onClick={() => setViewMode(mode)}
              >
                {mode === 'this' ? 'This Week' : mode === 'next' ? 'Next Week' : '2 Weeks'}
              </button>
            ))}
          </div>
          <button
            className={`week-sync-btn${syncStale ? ' is-stale' : ''}`}
            onClick={handleSync}
            title="Refresh data"
          >
            {syncStale && <span className="week-sync-stale-dot" />}
            ↻ Sync
          </button>
          {lastSynced && (
            <span className="week-synced-time">Synced {formatHHMM(lastSynced)}</span>
          )}
        </div>
      </header>

      {/* ── AUREON strip ── */}
      {aureonConnected && aureonStats && (
        <div className={`week-aureon-strip week-aureon-strip--${deadlineUrgency}`}>
          <span className="week-aureon-dot" />
          <span>{aureonStats.leads} leads active</span>
          <span className="week-aureon-sep">·</span>
          {daysToDeadline !== null && (
            <>
              <span>{daysToDeadline} days to Apr 14</span>
              <span className="week-aureon-sep">·</span>
            </>
          )}
          <span>{aureonStats.callsBooked} calls booked</span>
          {lastSynced && (
            <>
              <span className="week-aureon-sep">·</span>
              <span>Synced {formatHHMM(lastSynced)}</span>
            </>
          )}
        </div>
      )}

      {/* ── Intent banner ── */}
      <div className="week-intent-banner">
        {intentEditing ? (
          <input
            ref={intentInputRef}
            className="week-intent-input"
            type="text"
            placeholder="Set your focus for this week..."
            value={weeklyIntent}
            onChange={(e) => setWeeklyIntent(e.target.value)}
            onBlur={() => setIntentEditing(false)}
            onKeyDown={(e) => { if (e.key === 'Enter') setIntentEditing(false); }}
          />
        ) : (
          <button
            className="week-intent-pill"
            onClick={() => setIntentEditing(true)}
          >
            {weeklyIntent || 'Set your focus for this week...'}
          </button>
        )}
      </div>

      {/* ── Engine reasoning ── */}
      {engineReasoning && (
        <div className="week-reasoning">
          <span className="week-reasoning-dot" />
          <TypewriterText text={engineReasoning} speed={25} />
        </div>
      )}

      {/* ── Week grids ── */}
      {viewMode === 'both' && (
        <div className="week-row-label">This Week</div>
      )}
      {renderWeekGrid(weekData.slice(0, viewMode === 'both' ? 7 : weekData.length))}

      {viewMode === 'both' && weekData.length > 7 && (
        <>
          <div className="week-row-label">Next Week</div>
          {renderWeekGrid(weekData.slice(7))}
        </>
      )}

      {/* ── Life Blocks panel ── */}
      <div className="week-life-blocks-panel">
        <LifeBlockPickerDraggable
          lifeBlockPicker={lifeBlockPicker}
          onDragStart={handleLifeBlockDragStart}
          currentZone={currentZone}
        />
      </div>

      {/* ── AI Chat Planner ── */}
      <WeekChatPlanner
        date={date}
        projects={projects}
        weekDates={visibleDays.map((d) => d.date)}
        weeklyProposedBlocks={weeklyProposedBlocks}
        onSetProposedBlocks={setWeeklyProposedBlocks}
        onApplyAll={handleApplyProposed}
        onClearProposed={handleClearProposed}
        totalProposed={totalProposed}
      />
    </div>
  );
}

// ─── LifeBlockPickerDraggable (unchanged) ────────────────────────────────────

function LifeBlockPickerDraggable({ lifeBlockPicker, onDragStart, currentZone }) {
  const { LIFE_CATEGORIES, getActivitiesByCategory, getActivitiesForZone } = require('../core/life/lifeCategories');
  const [activeTab, setActiveTab] = useState('suggested');

  const suggestedActivities = currentZone
    ? getActivitiesForZone(currentZone.id).slice(0, 6)
    : [];

  const tabs = [{ id: 'suggested', label: 'For You' }, ...LIFE_CATEGORIES];
  const activities = activeTab === 'suggested' ? suggestedActivities : getActivitiesByCategory(activeTab);

  return (
    <div className="week-life-blocks">
      <div className="week-life-blocks-header">
        <span className="week-life-blocks-title">Life Blocks</span>
        {currentZone && (
          <span className="life-picker-zone-badge" style={{ '--zone-color': currentZone.color }}>
            {currentZone.label} Energy
          </span>
        )}
        <span className="week-life-blocks-hint">Drag onto a day column</span>
      </div>
      <div className="life-picker-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`life-picker-tab${activeTab === tab.id ? ' is-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon ? `${tab.icon} ` : ''}{tab.label}
          </button>
        ))}
      </div>
      <div className="life-picker-grid">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="life-picker-activity"
            draggable
            onDragStart={(e) => onDragStart(e, activity)}
            title={`Drag to schedule · ${activity.label} · ${activity.defaultDuration}m`}
            style={{ cursor: 'grab' }}
          >
            <span className="life-picker-activity-icon">{activity.icon}</span>
            <span className="life-picker-activity-label">{activity.label}</span>
            <span className="life-picker-activity-duration">{activity.defaultDuration}m</span>
          </div>
        ))}
        {activities.length === 0 && (
          <p className="life-picker-empty">No activities in this category yet.</p>
        )}
      </div>
    </div>
  );
}

// ─── WeekDayColumn ────────────────────────────────────────────────────────────

function WeekDayColumn({
  day,
  dragOverDay,
  onDragOver,
  onDragLeave,
  onDrop,
  onBlockDragStart,
  onRemoveBlock,
  onTaskToggle,
  onNavigate,
  weeklyIntent,
  expandedWeekends,
  onToggleWeekend,
  proposedBlocks,
  nowPx,
  dropIndicator,
  onAddBlock,
}) {
  const canvasRef = useRef(null);
  const [showAddPopover, setShowAddPopover] = useState(false);
  const [addForm, setAddForm] = useState({ type: 'work', label: '', start: '09:00', end: '10:00' });

  // Collapsed weekend
  if (day.isWeekend && !expandedWeekends.has(day.date)) {
    return (
      <div
        className="week-day week-day--weekend-collapsed"
        onClick={() => onToggleWeekend(day.date)}
        title={`${day.dayName} ${day.dayNum} — click to expand`}
      >
        <span className="week-day-weekend-init">{day.dayName.charAt(0)}</span>
        <span className="week-day-weekend-num">{day.dayNum}</span>
      </div>
    );
  }

  const sortedBlocks = day.blocks
    .slice()
    .sort((a, b) => timeToMins(a.start) - timeToMins(b.start));

  const showNowLine = nowPx >= 0 && nowPx <= CANVAS_HEIGHT;
  const showDropIndicator = dropIndicator?.date === day.date;
  const isDragOver = dragOverDay === day.date;
  const isEmpty = day.blocks.length === 0 && day.tasks.length === 0 && proposedBlocks.length === 0;

  function handleAddSubmit(e) {
    e.preventDefault();
    if (addForm.label.trim()) {
      onAddBlock(day.date, {
        type: addForm.type,
        label: addForm.label.trim(),
        start: addForm.start,
        end: addForm.end,
      });
      setShowAddPopover(false);
      setAddForm({ type: 'work', label: '', start: '09:00', end: '10:00' });
    }
  }

  return (
    <div
      className={[
        'week-day week-day--timed',
        day.isToday && 'is-today',
        day.isWeekend && 'is-weekend',
      ].filter(Boolean).join(' ')}
    >
      {/* ── Header ── */}
      <div className={`week-day-header--timed${day.isToday ? ' is-today-header' : ''}`}>
        <div className="week-day-header-name">{day.dayName.toUpperCase()}</div>
        <div className={`week-day-header-num${day.isToday ? ' is-today-num' : ''}`}>
          {day.dayNum}
        </div>
        {day.totalMinutes > 0 && (
          <div className="week-day-hours-badge">{(day.totalMinutes / 60).toFixed(1)}h</div>
        )}
        {day.isWeekend && (
          <button
            className="week-day-collapse-btn"
            onClick={() => onToggleWeekend(day.date)}
            title="Collapse weekend"
          >
            ×
          </button>
        )}
      </div>

      {/* ── Time canvas ── */}
      <div
        ref={canvasRef}
        className={`week-day-canvas${isDragOver ? ' is-drag-over' : ''}`}
        onDragOver={(e) => onDragOver(e, day.date, canvasRef.current)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, day.date, canvasRef.current)}
      >
        {/* Hour grid lines */}
        {Array.from({ length: GRID_END_HOUR - GRID_START_HOUR + 1 }, (_, i) => (
          <div
            key={`h${i}`}
            className="week-canvas-hour-line"
            style={{ top: i * PX_PER_HOUR }}
          />
        ))}

        {/* Half-hour dashed lines */}
        {Array.from({ length: GRID_END_HOUR - GRID_START_HOUR }, (_, i) => (
          <div
            key={`hh${i}`}
            className="week-canvas-half-line"
            style={{ top: i * PX_PER_HOUR + 30 }}
          />
        ))}

        {/* Now line (across all columns) */}
        {showNowLine && (
          <div className="week-now-line" style={{ top: nowPx }}>
            <span className="week-now-dot" />
          </div>
        )}

        {/* Drop indicator */}
        {showDropIndicator && (
          <div className="week-drop-indicator" style={{ top: dropIndicator.y }}>
            <span className="week-drop-indicator-time">{dropIndicator.time}</span>
          </div>
        )}

        {/* Placed blocks */}
        {sortedBlocks.map((block) => {
          const top = blockTopPx(block.start);
          const height = blockHeightPx(block.start, block.end);
          const colors = BLOCK_COLORS[block.type] || BLOCK_COLOR_DEFAULT;
          return (
            <div
              key={block.id}
              className="week-block-timed"
              style={{
                top,
                height,
                background: colors.bg,
                borderLeft: `3px solid ${colors.border}`,
              }}
              draggable
              onDragStart={(e) => onBlockDragStart(e, block, day.date)}
              title={`${block.start}–${block.end} ${block.label}`}
            >
              <span className="week-block-timed-label">{block.label}</span>
              {height >= 44 && (
                <span className="week-block-timed-time">{block.start}–{block.end}</span>
              )}
              {height >= 90 && (
                <span className="week-block-timed-type">{block.type}</span>
              )}
              <button
                className="week-block-timed-delete"
                onClick={(e) => { e.stopPropagation(); onRemoveBlock(day.date, block.id); }}
                title="Remove block"
              >
                ×
              </button>
            </div>
          );
        })}

        {/* Proposed (ghost) blocks */}
        {proposedBlocks.map((block, i) => {
          const top = blockTopPx(block.start);
          const height = blockHeightPx(block.start, block.end);
          const colors = BLOCK_COLORS[block.type] || BLOCK_COLOR_DEFAULT;
          return (
            <div
              key={`proposed-${i}`}
              className="week-block-timed week-block-timed--proposed"
              style={{
                top,
                height,
                border: `2px dashed ${colors.border}`,
              }}
              title={`Proposed: ${block.start}–${block.end} ${block.label}`}
            >
              <span className="week-block-timed-label">{block.label}</span>
              {height >= 44 && (
                <span className="week-block-timed-time">{block.start}–{block.end}</span>
              )}
            </div>
          );
        })}

        {/* Empty state */}
        {isEmpty && (
          <div className="week-canvas-empty">
            {showAddPopover ? (
              <form className="week-canvas-add-popover" onSubmit={handleAddSubmit}>
                <select
                  className="week-canvas-add-type"
                  value={addForm.type}
                  onChange={(e) => setAddForm((f) => ({ ...f, type: e.target.value }))}
                >
                  {['work', 'fitness', 'life', 'meal', 'break', 'recovery', 'custom'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <input
                  className="week-canvas-add-label"
                  type="text"
                  placeholder="Block label..."
                  value={addForm.label}
                  onChange={(e) => setAddForm((f) => ({ ...f, label: e.target.value }))}
                  autoFocus
                />
                <div className="week-canvas-add-times">
                  <input
                    type="time"
                    value={addForm.start}
                    onChange={(e) => setAddForm((f) => ({ ...f, start: e.target.value }))}
                  />
                  <span>–</span>
                  <input
                    type="time"
                    value={addForm.end}
                    onChange={(e) => setAddForm((f) => ({ ...f, end: e.target.value }))}
                  />
                </div>
                <div className="week-canvas-add-actions">
                  <button type="submit" className="week-canvas-add-confirm">Add</button>
                  <button
                    type="button"
                    className="week-canvas-add-cancel"
                    onClick={() => setShowAddPopover(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                className="week-canvas-add-btn"
                onClick={() => setShowAddPopover(true)}
                title="Add a block"
              >
                +
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Tasks list (below canvas) ── */}
      {day.tasks.filter((t) => t.status !== 'cancelled').length > 0 && (
        <div className="week-day-tasks">
          {day.tasks
            .filter((t) => t.status !== 'cancelled')
            .map((task) => (
              <div key={task.id} className={`week-task-chip${task.status === 'done' ? ' is-done' : ''}`}>
                <button
                  className="week-task-checkbox"
                  onClick={() => onTaskToggle(task.id, task.status)}
                  title={task.status === 'done' ? 'Mark open' : 'Mark done'}
                >
                  {task.status === 'done' ? '✓' : '○'}
                </button>
                <span className="week-task-title">{task.title}</span>
              </div>
            ))}
        </div>
      )}

      {/* Navigate to Today for empty today column */}
      {isEmpty && day.isToday && !showAddPopover && (
        <div className="week-day-today-nav">
          <button
            className="week-day-add-btn"
            onClick={() => onNavigate && onNavigate('today')}
          >
            Plan today
          </button>
        </div>
      )}
    </div>
  );
}

export default WeeklyPage;
