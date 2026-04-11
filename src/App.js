import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import './App.css';
import nexusData from './data/nexusData';

import Sidebar from './components/Sidebar';
import ThemeToggle from './components/ThemeToggle';

import TodayPage from './pages/TodayPage';
import WeeklyPage from './pages/WeeklyPage';
import HistoryPage from './pages/HistoryPage';
import CompanyPage from './pages/CompanyPage';
import OverviewPage from './pages/OverviewPage';
import RevenuePage from './pages/RevenuePage';
import AgentsPage from './pages/AgentsPage';
import SettingsPage from './pages/SettingsPage';

import TaskEnginePanel from './components/TaskEnginePanel';
import QuickLogInput from './components/QuickLogInput';

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
import { usePlanningEngine } from './core/planning/usePlanningEngine';
import { useReviewEngine } from './core/planning/useReviewEngine';
import { useEnergyProfile } from './core/energy/useEnergyProfile';
import { useHealthData } from './core/health/useHealthData';

import ErrorBoundary from './components/ErrorBoundary';
import EnergyBar from './components/EnergyBar';
import LifeBlockPicker from './components/LifeBlockPicker';

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
  dragPayload: null,
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
  const { isConnected: aureonConnected, pipelineEntries, stats: aureonStats, primaryAction: aureonPrimaryAction, lastFetched: aureonLastFetched } = useAureon();
  const { theme, toggleTheme } = useTheme();
  const {
    getPlannerBlocks,
    addBlock: addPlannerBlock,
    updateBlock: updatePlannerBlock,
    removeBlock: removePlannerBlock,
    stopWork,
  } = usePlannerBlocks();

  const { departments: companyDepts, lastFetched: companyLastFetched } = useCompanyState();

  const navigate = useNavigate();
  const location = useLocation();
  const currentPage = location.pathname === '/' ? 'home' : (location.pathname.slice(1).split('/')[0] || 'home');
  const navigateTo = useCallback((id) => navigate(id === 'home' ? '/' : `/${id}`), [navigate]);

  const [now, setNow] = useState(new Date());
  const [timerNow, setTimerNow] = useState(new Date());
  const [focusMode, setFocusMode] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState(null);
  const [draggedBlockId, setDraggedBlockId] = useState(null);
  const [dragOverMinutes, setDragOverMinutes] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    // Tick every 1s when active block exists, 60s otherwise
    const interval = activeBlockId ? 1000 : 60000;
    const id = window.setInterval(() => setNow(new Date()), interval);
    return () => window.clearInterval(id);
  }, [activeBlockId]);
  useEffect(() => { setTimerNow(now); }, [now]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      // Skip if user is typing in an input/textarea
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;

      // Cmd+R / Ctrl+R — global data refresh
      if (e.key === 'r' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        window.dispatchEvent(new Event('nexus:refresh'));
        return;
      }

      if (e.key === 'n' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        window.dispatchEvent(new Event('nexus:new-task'));
      }
      if (e.key === ' ' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (focusMode) {
          setFocusMode(false);
          setActiveBlockId(null);
        } else {
          navigate('/today');
          setFocusMode(true);
        }
      }
      // Navigation shortcuts
      const navMap = { t: 'today', w: 'week', c: 'company', a: 'agents', r: 'revenue' };
      if (!e.metaKey && !e.ctrlKey && navMap[e.key]) {
        e.preventDefault();
        navigateTo(navMap[e.key]);
      }
      // ? — toggle shortcut hints
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        setShowShortcuts((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focusMode, navigate, navigateTo]);

  const date = useMemo(() => formatDate(now), [now]);
  const currentTime = useMemo(() => formatTime(now), [now]);
  const currentMinutes = useMemo(() => now.getHours() * 60 + now.getMinutes(), [now]);

  const { effectiveZoneMap, currentZone } = useEnergyProfile(currentMinutes);
  const healthData = useHealthData(currentMinutes);

  const todayScheduleBlocks = useMemo(() => {
    const plannerBlocks = getPlannerBlocks(date).map((b) => ({
      id: b.id,
      date: b.date,
      label: b.label,
      type: b.type,
      start: b.start,
      end: b.end,
      fixed: false,
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
  const energyContextForEngine = useMemo(() => ({
    currentZone,
    zoneMap: effectiveZoneMap,
    plannerBlocks: getPlannerBlocks(date),
    dayEnd: stopWork.enabled ? toMinutes(stopWork.time) : 22 * 60,
  }), [currentZone, effectiveZoneMap, date, getPlannerBlocks, stopWork]);

  const {
    primaryAction: enginePrimaryAction,
    recommendedBlocks,
    lifeBlockSuggestions,
    departmentQueue,
    reasoning: engineReasoning,
    dismissDept,
  } = useExecutionEngine(companyStateForEngine, timeContextForEngine, energyContextForEngine);

  const planningOutput = usePlanningEngine(date, healthData.healthIntelligence ?? null);
  const reviewOutput = useReviewEngine(date, tasks, activityLog);

  const canPlaceDurationAtMinutes = useCallback((startMinutes, duration) => {
    const dayEnd = stopWork.enabled ? toMinutes(stopWork.time) : 22 * 60;
    const endMinutes = startMinutes + duration;
    if (endMinutes > dayEnd) return false;
    return !todayScheduleBlocks.some((b) => startMinutes < toMinutes(b.end) && endMinutes > toMinutes(b.start));
  }, [stopWork, todayScheduleBlocks]);

  // Drag state stores the dragged item's info (task or block)
  const [dragPayload, setDragPayload] = useState(null);

  const handleDragStart = useCallback((id, payload) => {
    setDraggedBlockId(id);
    setDragPayload(payload || null);
  }, []);
  const handleDragEnd = useCallback(() => {
    setDraggedBlockId(null);
    setDragOverMinutes(null);
    setDragPayload(null);
  }, []);
  const handleTimelineDragOver = useCallback((slotMinutes) => { setDragOverMinutes(slotMinutes); return false; }, []);
  const handleTimelineDragLeave = useCallback(() => setDragOverMinutes(null), []);

  const handleTimelineDrop = useCallback((slotMinutes) => {
    if (!dragPayload) {
      setDraggedBlockId(null);
      setDragOverMinutes(null);
      setDragPayload(null);
      return;
    }

    const duration = dragPayload.duration || 30;
    const snapMinutes = Math.round(slotMinutes / 15) * 15;

    if (canPlaceDurationAtMinutes(snapMinutes, duration)) {
      const startHH = `${String(Math.floor(snapMinutes / 60)).padStart(2, '0')}:${String(snapMinutes % 60).padStart(2, '0')}`;
      const endMin = snapMinutes + duration;
      const endHH = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;

      if (dragPayload.type === 'task') {
        addPlannerBlock(date, {
          type: 'work',
          label: dragPayload.title,
          start: startHH,
          end: endHH,
        });
      } else if (dragPayload.type === 'block-move') {
        // Reorder: remove old block, add at new position
        removePlannerBlock(date, dragPayload.blockId);
        addPlannerBlock(date, {
          type: dragPayload.blockType || 'work',
          label: dragPayload.title,
          start: startHH,
          end: endHH,
        });
      }
    }

    setDraggedBlockId(null);
    setDragOverMinutes(null);
    setDragPayload(null);
  }, [addPlannerBlock, canPlaceDurationAtMinutes, date, dragPayload, removePlannerBlock]);

  const handleStartBlock = useCallback(() => { navigate('/today'); setFocusMode(true); }, [navigate]);
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

  const handleSelectLifeActivity = useCallback((activity) => {
    const duration = activity.defaultDuration;
    // Find next free slot from current time
    for (const gap of freeGaps) {
      const effectiveStart = Math.max(gap.start, currentMinutes);
      const snapStart = Math.ceil(effectiveStart / 15) * 15;
      if (snapStart + duration <= gap.end) {
        const startHH = `${String(Math.floor(snapStart / 60)).padStart(2, '0')}:${String(snapStart % 60).padStart(2, '0')}`;
        const endMin = snapStart + duration;
        const endHH = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;
        const blockType = activity.category === 'fitness' ? 'fitness' : 'life';
        addPlannerBlock(date, { type: blockType, label: `${activity.icon} ${activity.label}`, start: startHH, end: endHH });
        return;
      }
    }
  }, [addPlannerBlock, currentMinutes, date, freeGaps]);

  const energyBarPanel = useMemo(() => (
    <EnergyBar zoneMap={effectiveZoneMap} currentMinutes={currentMinutes} />
  ), [effectiveZoneMap, currentMinutes]);

  const lifeBlockPickerPanel = useMemo(() => (
    <LifeBlockPicker
      currentZone={currentZone}
      onSelectActivity={handleSelectLifeActivity}
    />
  ), [currentZone, handleSelectLifeActivity]);

  // Overview data
  const weekHoursData = useMemo(() => {
    const today = new Date(date + 'T12:00:00');
    const dow = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dow + 6) % 7));
    let totalMin = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const blocks = getPlannerBlocks ? getPlannerBlocks(ds) : [];
      for (const b of blocks) {
        const [sh, sm] = b.start.split(':').map(Number);
        const [eh, em] = b.end.split(':').map(Number);
        totalMin += (eh * 60 + em) - (sh * 60 + sm);
      }
    }
    return { worked: totalMin / 60, target: 40 };
  }, [date, getPlannerBlocks]);

  const pipelineStats = useMemo(() => {
    try {
      const gen = require('./data/companyData.generated.json');
      if (!gen?.pipeline?.length) return null;
      const today = date;
      return {
        total: gen.pipeline.length,
        contacted: gen.pipeline.filter((l) => l.status?.includes('DM sent') || l.status?.includes('replied')).length,
        responses: gen.pipeline.filter((l) => l.response && l.response !== 'None' && l.response !== '—').length,
        followUpsDue: gen.pipeline.filter((l) => l.fu1_due <= today || l.fu2_due <= today).length,
      };
    } catch { return null; }
  }, [date]);

  const generatedPipeline = useMemo(() => {
    try {
      const gen = require('./data/companyData.generated.json');
      if (!gen?.pipeline?.length) return [];
      return gen.pipeline.filter((e) => e.score && !isNaN(parseInt(e.score, 10)));
    } catch { return []; }
  }, []);

  const generatedAureonDrafts = useMemo(() => {
    try {
      const gen = require('./data/companyData.generated.json');
      return Array.isArray(gen?.aureonDrafts) ? gen.aureonDrafts : [];
    } catch { return []; }
  }, []);

  // N1: truth-layer data from generated JSON
  const companyIntelligence = useMemo(() => {
    try {
      const gen = require('./data/companyData.generated.json');
      return {
        nextActions: gen.nextActions || [],
        revenueMilestones: gen.revenueMilestones || [],
        phaseDeadlines: gen.phaseDeadlines || {},
        products: gen.products || [],
      };
    } catch { return { nextActions: [], revenueMilestones: [], phaseDeadlines: {}, products: [] }; }
  }, []);


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
    dragPayload,
    dragOverMinutes,
    canDropTaskAtMinutes: canPlaceDurationAtMinutes,
    onTaskDragStart: handleDragStart,
    onTaskDragEnd: handleDragEnd,
    onTimelineDragOver: handleTimelineDragOver,
    onTimelineDragLeave: handleTimelineDragLeave,
    onTimelineDrop: handleTimelineDrop,
  }), [draggedBlockId, dragPayload, dragOverMinutes, canPlaceDurationAtMinutes, handleDragStart, handleDragEnd, handleTimelineDragOver, handleTimelineDragLeave, handleTimelineDrop]);

  const appClass = ['app-shell', theme].join(' ');

  return (
    <ProjectsContext.Provider value={projectsContextValue}>
      <DragDropContext.Provider value={dragDropValue}>
        <div className={appClass}>
          <Sidebar
            navigation={nexusData.navigation}
            activePage={currentPage}
            onNavigate={navigateTo}
          />
          <main className="main-shell">
            <div className="app-theme-toggle-wrapper">
              <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            </div>
            <Routes>
              <Route path="/" element={
                <ErrorBoundary pageName="Overview">
                <OverviewPage
                  date={date}
                  currentTime={currentTime}
                  currentZone={currentZone}
                  scheduleBlocks={timelineState.normalizedBlocks}
                  todayTasks={todayTasks}
                  doneTodayCount={doneTodayCount}
                  openTodayCount={openTodayCount}
                  sessionBudgetText={sessionBudgetText}
                  departmentQueue={departmentQueue}
                  engineReasoning={engineReasoning}
                  weekHoursWorked={weekHoursData.worked}
                  weekHoursTarget={weekHoursData.target}
                  pipelineStats={pipelineStats}
                  healthData={healthData}
                  nextActions={companyIntelligence.nextActions}
                  revenueMilestones={companyIntelligence.revenueMilestones}
                  phaseDeadlines={companyIntelligence.phaseDeadlines}
                  planningOutput={planningOutput}
                  reviewOutput={reviewOutput}
                  onNavigate={navigateTo}
                />
                </ErrorBoundary>
              } />
              <Route path="/today" element={
                <ErrorBoundary pageName="Today">
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
                  onUpdateBlock={(blockId, patch) => updatePlannerBlock(date, blockId, patch)}
                  taskEnginePanel={taskPanel}
                  quickLogPanel={quickLogPanel}
                  focusProject={focusProject}
                  sessionBudgetText={sessionBudgetText}
                  projectContextPreview={truncateText(focusProject?.nextAction || '', 96)}
                  enginePrimaryAction={enginePrimaryAction}
                  recommendedBlocks={recommendedBlocks}
                  lifeBlockSuggestions={lifeBlockSuggestions}
                  dismissDept={dismissDept}
                  engineReasoning={engineReasoning}
                  energyBar={energyBarPanel}
                  currentZone={currentZone}
                />
                </ErrorBoundary>
              } />
              <Route path="/week" element={
                <ErrorBoundary pageName="Weekly">
                <WeeklyPage
                  date={date}
                  projects={projects}
                  engineReasoning={engineReasoning}
                  addPlannerBlock={addPlannerBlock}
                  removePlannerBlock={removePlannerBlock}
                  getPlannerBlocks={getPlannerBlocks}
                  getTasksForDate={getTasksForDate}
                  setTaskStatus={setTaskStatus}
                  onNavigate={navigateTo}
                  aureonConnected={aureonConnected}
                  aureonStats={aureonStats}
                  currentZone={currentZone}
                  lifeBlockPicker={lifeBlockPickerPanel}
                  freeGaps={freeGaps}
                />
                </ErrorBoundary>
              } />
              <Route path="/revenue" element={
                <ErrorBoundary pageName="Revenue">
                <RevenuePage
                  date={date}
                  pipelineStats={pipelineStats}
                  revenueMilestones={companyIntelligence.revenueMilestones}
                  aureonConnected={aureonConnected}
                  pipelineEntries={pipelineEntries}
                  aureonStats={aureonStats}
                  aureonPrimaryAction={aureonPrimaryAction}
                  generatedPipeline={generatedPipeline}
                  generatedAureonDrafts={generatedAureonDrafts}
                  lastFetched={aureonLastFetched}
                />
                </ErrorBoundary>
              } />
              <Route path="/company" element={
                <ErrorBoundary pageName="Company">
                <CompanyPage
                  projects={projects}
                  departments={departments}
                  getDepartment={getDepartment}
                  updateProject={updateProject}
                  focusProjectId={focusProjectId}
                  setFocusProject={setFocusProject}
                  departmentQueue={departmentQueue}
                  engineReasoning={engineReasoning}
                  onNavigate={navigateTo}
                  date={date}
                  lastFetched={companyLastFetched}
                />
                </ErrorBoundary>
              } />
              <Route path="/agents" element={<ErrorBoundary pageName="Agents"><AgentsPage date={date} /></ErrorBoundary>} />
              <Route path="/history" element={<ErrorBoundary pageName="History"><HistoryPage date={date} activityLog={activityLog} tasks={tasks} /></ErrorBoundary>} />
              <Route path="/settings" element={<ErrorBoundary pageName="Settings"><SettingsPage theme={theme} toggleTheme={toggleTheme} /></ErrorBoundary>} />
            </Routes>
          </main>
          {showShortcuts && (
            <div className="shortcut-hints-overlay">
              <div className="shortcut-hints-title">Keyboard Shortcuts</div>
              <div className="shortcut-hints-grid">
                <span className="shortcut-key">T</span><span className="shortcut-desc">Today</span>
                <span className="shortcut-key">W</span><span className="shortcut-desc">Weekly</span>
                <span className="shortcut-key">C</span><span className="shortcut-desc">Company</span>
                <span className="shortcut-key">A</span><span className="shortcut-desc">Agents</span>
                <span className="shortcut-key">R</span><span className="shortcut-desc">Revenue</span>
                <span className="shortcut-key">N</span><span className="shortcut-desc">New task</span>
                <span className="shortcut-key">Space</span><span className="shortcut-desc">Focus mode</span>
                <span className="shortcut-key">Cmd+R</span><span className="shortcut-desc">Refresh data</span>
                <span className="shortcut-key">?</span><span className="shortcut-desc">Toggle this help</span>
              </div>
            </div>
          )}
          <nav className="mobile-tab-bar" aria-label="Navigation">
            {nexusData.navigation.main.map((item) => (
              <button
                key={item.id}
                className={currentPage === item.id ? 'mobile-tab-item active' : 'mobile-tab-item'}
                onClick={() => navigateTo(item.id)}
                aria-label={item.label}
                aria-current={currentPage === item.id ? 'page' : undefined}
              >
                <span className="mobile-tab-icon" aria-hidden="true">{item.icon}</span>
                <span className="mobile-tab-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </DragDropContext.Provider>
    </ProjectsContext.Provider>
  );
}

export default App;
