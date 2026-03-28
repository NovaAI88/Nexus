import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import nexusData from './data/nexusData';

import Sidebar from './components/Sidebar';
import ThemeToggle from './components/ThemeToggle';

import DashboardPage from './pages/DashboardPage';
import TodayPage from './pages/TodayPage';
import WeeklyPage from './pages/WeeklyPage';
import HistoryPage from './pages/HistoryPage';
import DepartmentPage from './pages/DepartmentPage';

import PlannerBlocksPanel from './components/PlannerBlocksPanel';
import TaskEnginePanel from './components/TaskEnginePanel';
import QuickLogInput from './components/QuickLogInput';
import AureonTodayPanel from './components/AureonTodayPanel';

import { useProjects } from './core/projects/useProjects';
import { migrateProjectsIfStale } from './core/projects/initialState';
import { useDepartments } from './core/departments/useDepartments';
import { useFocusProject } from './core/projects/useFocusProject';
import { usePlannerBlocks } from './core/planner/usePlannerBlocks';
import { useTaskEngine } from './core/tasks/useTaskEngine';
import { useTheme } from './core/theme/useTheme';
import { useActivityLog } from './core/log/useActivityLog';
import { useAureon } from './core/aureon/useAureon';
import { useCompanyState } from './core/adapters/useCompanyState';
import { useExecutionEngine } from './core/engine/useExecutionEngine';

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
function truncateText(text, max = 92) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

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

function App() {
  migrateProjectsIfStale();
  const { projects, updateProject, getProject } = useProjects();
  const { departments, getDepartment } = useDepartments();
  const { focusProjectId, setFocusProject, clearFocusProject } = useFocusProject();
  const { tasks, getTasksForDate, getTasksForProject, addTask, updateTask, setTaskStatus, removeTask } = useTaskEngine();
  const { log: activityLog, addEntry: addLogEntry, getProjectLog } = useActivityLog();
  const { isConnected: aureonConnected, pipelineEntries, stats: aureonStats, primaryAction: aureonPrimaryAction } = useAureon();
  const { theme, toggleTheme } = useTheme();
  const {
    getPlannerBlocks,
    addBlock: addPlannerBlock,
    updateBlock: updatePlannerBlock,
    removeBlock: removePlannerBlock,
    stopWork,
    setStopWork,
  } = usePlannerBlocks();

  const { departments: companyDepts } = useCompanyState();

  const [activePage, setActivePage] = useState('dashboard');
  const [now, setNow] = useState(new Date());
  const [timerNow, setTimerNow] = useState(new Date());
  const [focusMode, setFocusMode] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState(null);
  const [draggedBlockId, setDraggedBlockId] = useState(null);
  const [dragOverMinutes, setDragOverMinutes] = useState(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => { setTimerNow(now); }, [now]);

  const date = useMemo(() => formatDate(now), [now]);
  const currentTime = useMemo(() => formatTime(now), [now]);
  const currentMinutes = useMemo(() => now.getHours() * 60 + now.getMinutes(), [now]);

  const todayScheduleBlocks = useMemo(() => {
    const plannerBlocks = getPlannerBlocks(date).map((b) => ({
      id: b.id,
      date: b.date,
      label: b.label,
      type: b.type,
      start: b.start,
      end: b.end,
      fixed: true,
      taskId: null,
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

  const companyStateForEngine = useMemo(() => ({ departments: companyDepts }), [companyDepts]);
  const timeContextForEngine = useMemo(() => ({ currentMinutes, freeGaps, stopWork }), [currentMinutes, freeGaps, stopWork]);

  const {
    primaryAction: enginePrimaryAction,
    recommendedBlocks,
    departmentQueue,
    reasoning: engineReasoning,
    dismissDept,
  } = useExecutionEngine(companyStateForEngine, timeContextForEngine);

  const canPlaceDurationAtMinutes = useCallback((startMinutes, duration) => {
    const dayEnd = stopWork.enabled ? toMinutes(stopWork.time) : 22 * 60;
    const endMinutes = startMinutes + duration;
    if (endMinutes > dayEnd) return false;
    return !todayScheduleBlocks.some((b) => startMinutes < toMinutes(b.end) && endMinutes > toMinutes(b.start));
  }, [stopWork, todayScheduleBlocks]);

  const handleDragStart = useCallback((blockId) => setDraggedBlockId(blockId), []);
  const handleDragEnd = useCallback(() => { setDraggedBlockId(null); setDragOverMinutes(null); }, []);
  const handleTimelineDragOver = useCallback((slotMinutes) => { setDragOverMinutes(slotMinutes); return false; }, []);
  const handleTimelineDragLeave = useCallback(() => setDragOverMinutes(null), []);
  const handleTimelineDrop = useCallback(() => { setDraggedBlockId(null); setDragOverMinutes(null); return false; }, []);

  const handleStartBlock = useCallback(() => { setActivePage('today'); setFocusMode(true); }, []);
  const handleExitFocus = useCallback(() => { setFocusMode(false); setActiveBlockId(null); }, []);

  const focusProject = useMemo(() =>
    (focusProjectId ? projects.find((p) => p.id === focusProjectId) ?? null : null),
  [focusProjectId, projects]);

  const todayTasks = useMemo(() => getTasksForDate(date), [date, getTasksForDate]);
  const openTodayCount = useMemo(() => todayTasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled').length, [todayTasks]);
  const doneTodayCount = useMemo(() => todayTasks.filter((t) => t.status === 'done').length, [todayTasks]);
  const sessionBudgetText = useMemo(() => {
    const availableMinutes = freeGaps.reduce((sum, gap) => {
      const effectiveStart = Math.max(gap.start, currentMinutes);
      return sum + Math.max(gap.end - effectiveStart, 0);
    }, 0);
    const availableHours = (availableMinutes / 60).toFixed(1);
    return `${availableHours}h available · ${openTodayCount} tasks open`;
  }, [currentMinutes, freeGaps, openTodayCount]);

  const focusTasks = useMemo(() => (focusProjectId ? getTasksForProject(focusProjectId) : []), [focusProjectId, getTasksForProject]);
  const recentLog = useMemo(() =>
    (focusProjectId
      ? activityLog.filter((e) => e.projectId === focusProjectId).slice(0, 5)
      : activityLog.slice(0, 5)),
  [activityLog, focusProjectId]);

  const quickLogPanel = useMemo(() => (
    <QuickLogInput focusProject={focusProject} addEntry={addLogEntry} recentEntries={recentLog} compact />
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

  const aureonPanel = useMemo(() => (
    <AureonTodayPanel
      isConnected={aureonConnected}
      pipelineEntries={pipelineEntries}
      stats={aureonStats}
      primaryAction={aureonPrimaryAction}
    />
  ), [aureonConnected, pipelineEntries, aureonPrimaryAction, aureonStats]);

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
      addLogEntry={addLogEntry}
    />
  ), [addLogEntry, addTask, date, focusProject, focusTasks, getProject, removeTask, setTaskStatus, todayTasks, updateProject, updateTask]);

  const dashLogPanel = useMemo(() => (
    <QuickLogInput focusProject={focusProject} addEntry={addLogEntry} recentEntries={recentLog} />
  ), [addLogEntry, focusProject, recentLog]);

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
            aureonPanel={aureonPanel}
            focusProjectId={focusProjectId}
            focusProject={focusProject}
            sessionBudgetText={sessionBudgetText}
            projectContextPreview={truncateText(focusProject?.nextAction || '', 96)}
            enginePrimaryAction={enginePrimaryAction}
            recommendedBlocks={recommendedBlocks}
            dismissDept={dismissDept}
            engineReasoning={engineReasoning}
          />
        );
      case 'weekly':
        return (
          <WeeklyPage
            date={date}
            projects={projects}
            focusProjectId={focusProjectId}
            departmentQueue={departmentQueue}
            engineReasoning={engineReasoning}
            addPlannerBlock={addPlannerBlock}
          />
        );
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
      case 'aureon':
        return (
          <DepartmentPage
            departmentId="aureon"
            departments={departments}
            projects={projects}
            getDepartment={getDepartment}
            updateProject={updateProject}
            focusProjectId={focusProjectId}
            setFocusProject={setFocusProject}
            date={date}
            fallbackPage={nexusData.pages.departments.aureon}
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
            departmentQueue={departmentQueue}
            engineReasoning={engineReasoning}
            enginePrimaryAction={enginePrimaryAction}
          />
        );
    }
  }, [
    activePage,
    activityLog,
    activeBlockId,
    addPlannerBlock,
    aureonPanel,
    canPlaceDurationAtMinutes,
    currentTime,
    date,
    departments,
    departmentQueue,
    dismissDept,
    doneTodayCount,
    draggedBlockId,
    dragOverMinutes,
    enginePrimaryAction,
    engineReasoning,
    focusMode,
    focusProject,
    focusProjectId,
    getDepartment,
    handleExitFocus,
    handleStartBlock,
    handleTimelineDragLeave,
    handleTimelineDragOver,
    handleTimelineDrop,
    openTodayCount,
    plannerPanel,
    projects,
    quickLogPanel,
    recommendedBlocks,
    removePlannerBlock,
    sessionBudgetText,
    setFocusProject,
    dashLogPanel,
    taskPanel,
    tasks,
    timerState.display,
    timerState.progress,
    timelineState.currentBlock,
    timelineState.nextBlock,
    timelineState.normalizedBlocks,
    todayScheduleBlocks,
    updateProject,
  ]);

  const projectsContextValue = useMemo(() => ({
    projects,
    departments,
    updateProject,
    getProject,
    getDepartment,
    focusProjectId,
    setFocusProject,
    clearFocusProject,
    tasks,
    addTask,
    updateTask,
    setTaskStatus,
    removeTask,
    getTasksForProject,
    activityLog,
    addLogEntry,
    getProjectLog,
  }), [
    projects,
    departments,
    updateProject,
    getProject,
    getDepartment,
    focusProjectId,
    setFocusProject,
    clearFocusProject,
    tasks,
    addTask,
    updateTask,
    setTaskStatus,
    removeTask,
    getTasksForProject,
    activityLog,
    addLogEntry,
    getProjectLog,
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
            onNavigate={setActivePage}
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
