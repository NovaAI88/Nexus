import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import nexusData from './data/nexusData'; // navigation + department fallback data only

// ── Layout components ────────────────────────────────────────────────────────
import Sidebar from './components/Sidebar';
import ThemeToggle from './components/ThemeToggle';

// ── Pages ────────────────────────────────────────────────────────────────────
import DashboardPage from './pages/DashboardPage';
import TodayPage from './pages/TodayPage';
import WeeklyPage from './pages/WeeklyPage';
import HistoryPage from './pages/HistoryPage';
import DepartmentPage from './pages/DepartmentPage';

// ── Panels passed as props (renderable children) ─────────────────────────────
import PlannerBlocksPanel from './components/PlannerBlocksPanel';
import TaskEnginePanel from './components/TaskEnginePanel';
import QuickLogInput from './components/QuickLogInput';

// ── Core hooks ───────────────────────────────────────────────────────────────
import { useProjects } from './core/projects/useProjects';
import { useDepartments } from './core/departments/useDepartments';
import { useFocusProject } from './core/projects/useFocusProject';
import { usePlannerBlocks } from './core/planner/usePlannerBlocks';
import { useTaskEngine } from './core/tasks/useTaskEngine';
import { useTheme } from './core/theme/useTheme';
import { useActivityLog } from './core/log/useActivityLog';

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function toMinutes(value) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
function formatSeconds(seconds) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const remainder = String(seconds % 60).padStart(2, '0');
  return `${minutes}:${remainder}`;
}
function formatMinutesToTime(totalMinutes) {
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
}
function moveItem(list, fromIndex, toIndex) {
  const next = [...list];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

// ─────────────────────────────────────────────────────────────────────────────
// Contexts
// ─────────────────────────────────────────────────────────────────────────────

export const ProjectsContext = createContext({
  projects: [],
  departments: [],
  updateProject: () => {},
  getProject: () => undefined,
  getDepartment: () => undefined,
  focusProjectId: null,
  setFocusProject: () => {},
  clearFocusProject: () => {},
  tasks: [],
  addTask: () => {},
  updateTask: () => {},
  setTaskStatus: () => {},
  removeTask: () => {},
  getTasksForProject: () => [],
  activityLog: [],
  addLogEntry: () => {},
  getProjectLog: () => [],
});

export const DragDropContext = createContext({
  draggedTaskId: null,
  dragOverMinutes: null,
  canDropTaskAtMinutes: () => false,
  onTaskDragStart: () => {},
  onTaskDragEnd: () => {},
  onTimelineDragOver: () => {},
  onTimelineDragLeave: () => {},
  onTimelineDrop: () => {},
});

// ─────────────────────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────────────────────

function App() {
  // ── Persistent domain state ────────────────────────────────────────────────
  const { projects, updateProject, getProject } = useProjects();
  const { departments, getDepartment } = useDepartments();
  const { focusProjectId, setFocusProject, clearFocusProject } = useFocusProject();
  const { tasks, getTasksForDate, getTasksForProject, addTask, updateTask, setTaskStatus, removeTask } = useTaskEngine();
  const { log: activityLog, addEntry: addLogEntry, getProjectLog } = useActivityLog();
  const { theme, toggleTheme } = useTheme();
  const {
    getPlannerBlocks,
    addBlock: addPlannerBlock,
    updateBlock: updatePlannerBlock,
    removeBlock: removePlannerBlock,
    stopWork,
    setStopWork,
  } = usePlannerBlocks();

  // ── UI state ───────────────────────────────────────────────────────────────
  const [activePage, setActivePage] = useState('dashboard');
  const [now, setNow] = useState(new Date());
  const [timerNow, setTimerNow] = useState(new Date());

  // Timeline/focus state (local — not persisted, resets on reload intentionally)
  const [focusMode, setFocusMode] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState(null);

  // DnD state
  const [draggedBlockId, setDraggedBlockId] = useState(null);
  const [dragOverMinutes, setDragOverMinutes] = useState(null);

  // ── Clock ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => { setTimerNow(now); }, [now]);

  const date = useMemo(() => formatDate(now), [now]);
  const currentTime = useMemo(() => formatTime(now), [now]);
  const currentMinutes = useMemo(() => now.getHours() * 60 + now.getMinutes(), [now]);

  // ── Timeline blocks (planner blocks = source of truth) ────────────────────
  const todayScheduleBlocks = useMemo(() => {
    const plannerBlocks = getPlannerBlocks(date).map((b) => ({
      id: b.id, date: b.date, label: b.label, type: b.type,
      start: b.start, end: b.end, fixed: true, taskId: null,
    }));
    return plannerBlocks.sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  }, [date, getPlannerBlocks]);

  const timelineState = useMemo(() => {
    let currentBlock = null;
    let nextBlock = null;
    const normalizedBlocks = todayScheduleBlocks.map((block) => {
      const startMinutes = toMinutes(block.start);
      const endMinutes = toMinutes(block.end);
      const isPast = currentMinutes > endMinutes;
      const isCurrent = startMinutes <= currentMinutes && currentMinutes <= endMinutes;
      const normalized = { ...block, _startMinutes: startMinutes, _endMinutes: endMinutes, _isPast: isPast };
      if (isCurrent || block.id === activeBlockId) currentBlock = normalized;
      return normalized;
    });
    nextBlock = normalizedBlocks.find((b) => b._startMinutes > currentMinutes) || null;
    if (!currentBlock && activeBlockId) {
      currentBlock = normalizedBlocks.find((b) => b.id === activeBlockId) || null;
    }
    return { normalizedBlocks, currentBlock, nextBlock };
  }, [activeBlockId, currentMinutes, todayScheduleBlocks]);

  // ── Focus timer (only when focus mode + active block) ─────────────────────
  useEffect(() => {
    if (!focusMode || !timelineState.currentBlock) return undefined;
    const id = window.setInterval(() => setTimerNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, [focusMode, timelineState.currentBlock]);

  const focusSecondsRemaining = useMemo(() => {
    if (!timelineState.currentBlock) return 0;
    const [hours, minutes] = timelineState.currentBlock.end.split(':').map(Number);
    const target = new Date(timerNow);
    target.setHours(hours, minutes, 0, 0);
    return Math.max(Math.floor((target.getTime() - timerNow.getTime()) / 1000), 0);
  }, [timelineState.currentBlock, timerNow]);

  const timerState = useMemo(() => {
    if (!timelineState.currentBlock) return { display: '00:00', progress: 0 };
    const startSeconds = toMinutes(timelineState.currentBlock.start) * 60;
    const endSeconds = toMinutes(timelineState.currentBlock.end) * 60;
    const nowSeconds = timerNow.getHours() * 3600 + timerNow.getMinutes() * 60 + timerNow.getSeconds();
    const total = Math.max(endSeconds - startSeconds, 1);
    const elapsed = Math.max(0, Math.min(nowSeconds - startSeconds, total));
    return {
      display: formatSeconds(focusSecondsRemaining),
      progress: Math.max(0, Math.min((elapsed / total) * 100, 100)),
    };
  }, [focusSecondsRemaining, timelineState.currentBlock, timerNow]);

  // ── Free gaps (used by recommendations) ───────────────────────────────────
  const freeGaps = useMemo(() => {
    const plannerSorted = getPlannerBlocks(date).slice().sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
    const dayStart = plannerSorted.length > 0 ? toMinutes(plannerSorted[0].start) : 7 * 60 + 30;
    const dayEnd = stopWork.enabled ? toMinutes(stopWork.time) : 22 * 60;
    const blocks = [...todayScheduleBlocks].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
    const gaps = [];
    let cursor = dayStart;
    blocks.forEach((block) => {
      const start = toMinutes(block.start);
      const end = toMinutes(block.end);
      if (start > cursor) gaps.push({ start: cursor, end: start, duration: start - cursor });
      cursor = Math.max(cursor, end);
    });
    if (cursor < dayEnd) gaps.push({ start: cursor, end: dayEnd, duration: dayEnd - cursor });
    return gaps.filter((g) => g.end > currentMinutes);
  }, [currentMinutes, date, getPlannerBlocks, stopWork, todayScheduleBlocks]);

  const canPlaceDurationAtMinutes = useCallback((startMinutes, duration) => {
    const dayEnd = stopWork.enabled ? toMinutes(stopWork.time) : 22 * 60;
    const endMinutes = startMinutes + duration;
    if (endMinutes > dayEnd) return false;
    return !todayScheduleBlocks.some((b) => startMinutes < toMinutes(b.end) && endMinutes > toMinutes(b.start));
  }, [stopWork, todayScheduleBlocks]);

  const currentGap = useMemo(() =>
    freeGaps.find((g) => g.start <= currentMinutes && currentMinutes < g.end)
    || freeGaps.find((g) => g.start > currentMinutes)
    || null,
    [currentMinutes, freeGaps]
  );

  // ── Project-aware recommendation engine (no legacy nexusData catalog) ──────
  const recommendationCatalog = useMemo(() => {
    const pastStopWork = stopWork.enabled && currentMinutes >= toMinutes(stopWork.time);
    if (pastStopWork) return [];

    const focusProject = focusProjectId ? projects.find((p) => p.id === focusProjectId) : null;
    const items = [];

    if (focusProject && focusProject.status === 'active') {
      items.push({
        id: `rec-${focusProject.id}`,
        projectId: focusProject.id,
        isFocusProject: true,
        title: `Work on ${focusProject.name}`,
        description: focusProject.nextAction,
        duration: 60,
        minDuration: 30,
        maxDuration: 120,
        step: 15,
        actionType: 'schedule',
        group: 'project',
        groupLabel: focusProject.name,
        category: focusProject.name,
      });
    }

    projects
      .filter((p) => p.status === 'active' && p.id !== focusProjectId)
      .forEach((p) => {
        items.push({
          id: `rec-${p.id}`,
          projectId: p.id,
          isFocusProject: false,
          title: `Work on ${p.name}`,
          description: p.nextAction,
          duration: 45,
          minDuration: 20,
          maxDuration: 90,
          step: 15,
          actionType: 'schedule',
          group: 'project',
          groupLabel: p.name,
          category: p.name,
        });
      });

    return items.map((item) => {
      const bestGap = freeGaps.find((g) => g.duration >= item.duration) || currentGap;
      const fitScore = (bestGap ? Math.abs(bestGap.duration - item.duration) : 9999)
        + (item.isFocusProject ? -500 : 0);
      return {
        ...item,
        selectedDuration: item.duration,
        status: 'open',
        suggestedGap: bestGap,
        suggestedLabel: bestGap
          ? `${formatMinutesToTime(bestGap.start)}–${formatMinutesToTime(bestGap.start + item.duration)}`
          : null,
        fitScore,
      };
    }).sort((a, b) => a.fitScore - b.fitScore);
  }, [currentGap, currentMinutes, focusProjectId, freeGaps, projects, stopWork]);

  // ── DnD handlers ──────────────────────────────────────────────────────────
  const handleDragStart = useCallback((blockId) => setDraggedBlockId(blockId), []);
  const handleDragEnd = useCallback(() => { setDraggedBlockId(null); setDragOverMinutes(null); }, []);

  const handleTimelineDragOver = useCallback((slotMinutes) => {
    setDragOverMinutes(slotMinutes);
    return false; // planner blocks are fixed in this model — DnD moves within PlannerBlocksPanel
  }, []);

  const handleTimelineDragLeave = useCallback(() => setDragOverMinutes(null), []);
  const handleTimelineDrop = useCallback(() => { setDraggedBlockId(null); setDragOverMinutes(null); return false; }, []);

  // ── Focus mode controls ───────────────────────────────────────────────────
  const handleStartBlock = useCallback(() => { setActivePage('today'); setFocusMode(true); }, []);
  const handleExitFocus = useCallback(() => { setFocusMode(false); setActiveBlockId(null); }, []);

  // ── Page rendering ─────────────────────────────────────────────────────────
  const focusProject = useMemo(() =>
    focusProjectId ? projects.find((p) => p.id === focusProjectId) ?? null : null,
    [focusProjectId, projects]
  );

  const todayTasks = useMemo(() => getTasksForDate(date), [date, getTasksForDate]);
  const openTodayCount = useMemo(() => todayTasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled').length, [todayTasks]);
  const doneTodayCount = useMemo(() => todayTasks.filter((t) => t.status === 'done').length, [todayTasks]);
  const focusTasks = useMemo(() => focusProjectId ? getTasksForProject(focusProjectId) : [], [focusProjectId, getTasksForProject]);
  const recentLog = useMemo(() =>
    focusProjectId
      ? activityLog.filter((e) => e.projectId === focusProjectId).slice(0, 5)
      : activityLog.slice(0, 5),
    [activityLog, focusProjectId]
  );

  const quickLogPanel = useMemo(() => (
    <QuickLogInput
      focusProject={focusProject}
      addEntry={addLogEntry}
      recentEntries={recentLog}
      compact
    />
  ), [focusProject, addLogEntry, recentLog]);

  const plannerPanel = useMemo(() => (
    <PlannerBlocksPanel
      date={date}
      plannerBlocks={getPlannerBlocks(date)}
      addBlock={addPlannerBlock}
      updateBlock={updatePlannerBlock}
      removeBlock={removePlannerBlock}
      stopWork={stopWork}
      setStopWork={setStopWork}
    />
  ), [date, getPlannerBlocks, addPlannerBlock, updatePlannerBlock, removePlannerBlock, stopWork, setStopWork]);

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
    />
  ), [addTask, date, focusProject, focusTasks, removeTask, setTaskStatus, todayTasks, updateTask]);

  const dashLogPanel = useMemo(() => (
    <QuickLogInput
      focusProject={focusProject}
      addEntry={addLogEntry}
      recentEntries={recentLog}
    />
  ), [addLogEntry, focusProject, recentLog]);

  // ── Route ─────────────────────────────────────────────────────────────────
  const pageContent = useMemo(() => {
    switch (activePage) {
      case 'today':
        return (
          <TodayPage
            date={date}
            currentTime={currentTime}
            currentBlock={timelineState.currentBlock}
            nextBlock={timelineState.nextBlock}
            scheduleBlocks={timelineState.normalizedBlocks}
            focusMode={focusMode}
            activeBlock={timelineState.currentBlock || (activeBlockId ? todayScheduleBlocks.find((b) => b.id === activeBlockId) || null : null)}
            timerDisplay={timerState.display}
            timerProgress={timerState.progress}
            recommendations={recommendationCatalog}
            onStartBlock={handleStartBlock}
            onExitFocus={handleExitFocus}
            onAddBlock={addPlannerBlock}
            onRemoveBlock={(blockId) => removePlannerBlock(date, blockId)}
            draggedBlockId={draggedBlockId}
            dragOverMinutes={dragOverMinutes}
            canDropTaskAtMinutes={canPlaceDurationAtMinutes}
            onTimelineDragOver={handleTimelineDragOver}
            onTimelineDragLeave={handleTimelineDragLeave}
            onTimelineDrop={handleTimelineDrop}
            taskEnginePanel={taskPanel}
            dayConstraintsPanel={plannerPanel}
            quickLogPanel={quickLogPanel}
            focusProjectId={focusProjectId}
          />
        );
      case 'weekly':
        return <WeeklyPage date={date} projects={projects} focusProjectId={focusProjectId} />;
      case 'history':
        return <HistoryPage date={date} activityLog={activityLog} tasks={tasks} />;
      case 'nexus-department':
        return (
          <DepartmentPage
            departmentId="nexus"
            departments={departments}
            projects={projects}
            getDepartment={getDepartment}
            updateProject={updateProject}
            focusProjectId={focusProjectId}
            setFocusProject={setFocusProject}
            date={date}
            fallbackPage={nexusData.pages.departments.nexus}
          />
        );
      case 'hephaestus':
        return (
          <DepartmentPage
            departmentId="hephaestus"
            departments={departments}
            projects={projects}
            getDepartment={getDepartment}
            updateProject={updateProject}
            focusProjectId={focusProjectId}
            setFocusProject={setFocusProject}
            date={date}
            fallbackPage={nexusData.pages.departments.hephaestus}
          />
        );
      case 'xenon':
        return (
          <DepartmentPage
            departmentId="xenon"
            departments={departments}
            projects={projects}
            getDepartment={getDepartment}
            updateProject={updateProject}
            focusProjectId={focusProjectId}
            setFocusProject={setFocusProject}
            date={date}
            fallbackPage={nexusData.pages.departments.xenon}
          />
        );
      case 'dashboard':
      default:
        return (
          <DashboardPage
            date={date}
            projects={projects}
            departments={departments}
            focusProjectId={focusProjectId}
            getDepartment={getDepartment}
            todayTaskCount={openTodayCount}
            doneTodayCount={doneTodayCount}
            onNavigate={setActivePage}
            logPanel={dashLogPanel}
          />
        );
    }
  }, [
    activePage, activityLog, activeBlockId, addPlannerBlock, canPlaceDurationAtMinutes,
    currentTime, date, departments, doneTodayCount, draggedBlockId, dragOverMinutes,
    focusMode, focusProjectId, getDepartment, handleExitFocus, handleStartBlock,
    handleTimelineDragLeave, handleTimelineDragOver, handleTimelineDrop,
    openTodayCount, plannerPanel, projects, quickLogPanel, recommendationCatalog,
    removePlannerBlock, setFocusProject, dashLogPanel, taskPanel, tasks,
    timerState.display, timerState.progress, timelineState.currentBlock,
    timelineState.nextBlock, timelineState.normalizedBlocks, todayScheduleBlocks,
    updateProject,
  ]);

  // ── Context values ─────────────────────────────────────────────────────────
  const projectsContextValue = useMemo(() => ({
    projects, departments, updateProject, getProject, getDepartment,
    focusProjectId, setFocusProject, clearFocusProject,
    tasks, addTask, updateTask, setTaskStatus, removeTask, getTasksForProject,
    activityLog, addLogEntry, getProjectLog,
  }), [
    projects, departments, updateProject, getProject, getDepartment,
    focusProjectId, setFocusProject, clearFocusProject,
    tasks, addTask, updateTask, setTaskStatus, removeTask, getTasksForProject,
    activityLog, addLogEntry, getProjectLog,
  ]);

  const dragDropValue = useMemo(() => ({
    draggedTaskId: draggedBlockId,
    dragOverMinutes,
    canDropTaskAtMinutes: canPlaceDurationAtMinutes,
    onTaskDragStart: handleDragStart,
    onTaskDragEnd: handleDragEnd,
    onTimelineDragOver: handleTimelineDragOver,
    onTimelineDragLeave: handleTimelineDragLeave,
    onTimelineDrop: handleTimelineDrop,
  }), [draggedBlockId, dragOverMinutes, canPlaceDurationAtMinutes, handleDragStart, handleDragEnd, handleTimelineDragOver, handleTimelineDragLeave, handleTimelineDrop]);

  const appClass = ['app-shell', theme].join(' ');

  return (
    <ProjectsContext.Provider value={projectsContextValue}>
      <DragDropContext.Provider value={dragDropValue}>
        <div className={appClass}>
          <Sidebar
            navigation={nexusData.navigation}
            activePage={activePage}
            viewMode="overview"
            onNavigate={setActivePage}
            onViewChange={() => {}}
          />
          <main className="main-shell">
            <div className="app-theme-toggle-wrapper">
              <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            </div>
            {pageContent}
          </main>
        </div>
      </DragDropContext.Provider>
    </ProjectsContext.Provider>
  );
}

export default App;
