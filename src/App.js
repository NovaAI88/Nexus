import { createContext, useEffect, useMemo, useState } from 'react';
import './App.css';
import nexusData from './data/nexusData';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import TodayPage from './pages/TodayPage';
import WeeklyPage from './pages/WeeklyPage';
import HistoryPage from './pages/HistoryPage';
import SystemPage from './pages/SystemPage';
import NexusDepartmentPage from './pages/NexusDepartmentPage';
import HephaestusPage from './pages/HephaestusPage';
import XenonPage from './pages/XenonPage';
import DepartmentPage from './pages/DepartmentPage';
import { useProjects } from './core/projects/useProjects';
import { useDepartments } from './core/departments/useDepartments';
import { useFocusProject } from './core/projects/useFocusProject';

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
function createDailyTaskFromWeekly(weeklyTask, date) {
  return {
    id: `daily-${weeklyTask.id}`,
    date,
    title: weeklyTask.title,
    status: 'active',
    blockId: null,
    sourceWeeklyTaskId: weeklyTask.id,
    startedAt: null,
    completedAt: null,
    durationMinutes: null,
  };
}
function moveItem(list, fromIndex, toIndex) {
  const next = [...list];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}
function getTimeBucket(minutes) {
  if (minutes < 11 * 60) return 'morning';
  if (minutes < 14 * 60) return 'midday';
  if (minutes < 18 * 60) return 'afternoon';
  return 'evening';
}

// ProjectsContext — provides live project + department state to any descendant.
// Consumers: DepartmentPage, DashboardPage (future), Today, planner, checkpoints.
export const ProjectsContext = createContext({
  projects: [],
  departments: [],
  updateProject: () => {},
  getProject: () => undefined,
  getDepartment: () => undefined,
  focusProjectId: null,
  setFocusProject: () => {},
  clearFocusProject: () => {},
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
  // Phase 1/2 — live project + department state (persisted via localStorage)
  const { projects, updateProject, getProject } = useProjects();
  const { departments, getDepartment } = useDepartments();
  // Phase 5 — active focus project (persisted)
  const { focusProjectId, setFocusProject, clearFocusProject } = useFocusProject();

  const [activePage, setActivePage] = useState('dashboard');
  const [viewMode, setViewMode] = useState('overview');
  const [now, setNow] = useState(new Date());
  const [timerNow, setTimerNow] = useState(new Date());
  const [scheduleBlocks, setScheduleBlocks] = useState(nexusData.scheduleBlocks);
  const [dailyTasks, setDailyTasks] = useState(nexusData.dailyTasks);
  const [weeklyTasks, setWeeklyTasks] = useState(nexusData.weeklyTasks);
  const [completedHistory, setCompletedHistory] = useState(nexusData.completedHistory);
  const [focusMode, setFocusMode] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [activeBlockId, setActiveBlockId] = useState(null);
  const [selectedRecommendationCategory, setSelectedRecommendationCategory] = useState('Pause');
  const [recommendationState, setRecommendationState] = useState({});
  const [taskFeedback, setTaskFeedback] = useState({});
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverMinutes, setDragOverMinutes] = useState(null);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(intervalId);
  }, []);
  useEffect(() => { setTimerNow(now); }, [now]);

  const date = useMemo(() => formatDate(now), [now]);
  const currentTime = useMemo(() => formatTime(now), [now]);
  const currentMinutes = useMemo(() => now.getHours() * 60 + now.getMinutes(), [now]);

  useEffect(() => {
    setWeeklyTasks((currentWeeklyTasks) => {
      const promotableTasks = currentWeeklyTasks.filter((task) => task.plannedDay === date && task.status === 'planned');
      if (promotableTasks.length === 0) return currentWeeklyTasks;
      setDailyTasks((currentDailyTasks) => {
        const existingSourceIds = new Set(currentDailyTasks.map((task) => task.sourceWeeklyTaskId).filter(Boolean));
        const newDailyTasks = promotableTasks.filter((task) => !existingSourceIds.has(task.id)).map((task) => createDailyTaskFromWeekly(task, date));
        return newDailyTasks.length > 0 ? [...currentDailyTasks, ...newDailyTasks] : currentDailyTasks;
      });
      return currentWeeklyTasks.map((task) => task.plannedDay === date && task.status === 'planned' ? { ...task, status: 'moved-to-today' } : task);
    });
  }, [date]);

  const todayScheduleBlocks = useMemo(() => {
    const wakeBlock = { id: 'fixed-wake-generated', date, label: 'Wake / Setup', type: 'system', start: nexusData.inputs.wakeTime, end: '08:00', fixed: true, taskId: null };
    const sideJobBlocks = nexusData.inputs.sideJobBlocks.map((block) => ({ ...block, date, fixed: true, taskId: null }));
    const sourceBlocks = scheduleBlocks.filter((block) => block.date === date && block.id !== 'fixed-wake');
    const merged = [wakeBlock, ...sideJobBlocks, ...sourceBlocks.filter((block) => block.id !== 'fixed-side-job')];
    const uniqueMap = new Map();
    merged.forEach((block) => uniqueMap.set(block.id, block));
    return [...uniqueMap.values()].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  }, [date, scheduleBlocks]);

  const todayDailyTasks = useMemo(() => dailyTasks.filter((task) => task.date === date), [dailyTasks, date]);
  const activeTasks = useMemo(() => todayDailyTasks.filter((task) => task.status === 'active'), [todayDailyTasks]);
  const doneTasks = useMemo(() => todayDailyTasks.filter((task) => task.status === 'done'), [todayDailyTasks]);

  const tasksWithBlockMeta = useMemo(() => activeTasks.map((task) => {
    const block = todayScheduleBlocks.find((item) => item.id === task.blockId);
    return { ...task, blockLabel: block ? `${block.start}–${block.end} · ${block.label}` : null };
  }), [activeTasks, todayScheduleBlocks]);

  const timelineState = useMemo(() => {
    let currentBlock = null;
    let nextBlock = null;
    const normalizedBlocks = todayScheduleBlocks.map((block) => {
      const startMinutes = toMinutes(block.start);
      const endMinutes = toMinutes(block.end);
      const isPast = currentMinutes > endMinutes;
      const isCurrent = startMinutes <= currentMinutes && currentMinutes <= endMinutes;
      const linkedTask = todayDailyTasks.find((task) => task.id === block.taskId) || null;
      const normalized = { ...block, taskTitle: linkedTask?.title || null, _startMinutes: startMinutes, _endMinutes: endMinutes, _isPast: isPast };
      if (isCurrent || block.id === activeBlockId) currentBlock = normalized;
      return normalized;
    });
    nextBlock = normalizedBlocks.find((block) => block._startMinutes > currentMinutes) || null;
    if (!currentBlock && activeBlockId) currentBlock = normalizedBlocks.find((block) => block.id === activeBlockId) || null;
    return { normalizedBlocks, currentBlock, nextBlock };
  }, [activeBlockId, currentMinutes, todayDailyTasks, todayScheduleBlocks]);

  const activeTask = useMemo(() => tasksWithBlockMeta.find((task) => task.id === activeTaskId)
    || tasksWithBlockMeta.find((task) => task.blockId === activeBlockId)
    || null, [activeBlockId, activeTaskId, tasksWithBlockMeta]);

  useEffect(() => {
    if (!focusMode || !timelineState.currentBlock) return undefined;
    const intervalId = window.setInterval(() => setTimerNow(new Date()), 1000);
    return () => window.clearInterval(intervalId);
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
    return { display: formatSeconds(focusSecondsRemaining), progress: Math.max(0, Math.min((elapsed / total) * 100, 100)) };
  }, [focusSecondsRemaining, timelineState.currentBlock, timerNow]);

  const freeGaps = useMemo(() => {
    const dayStart = toMinutes(nexusData.inputs.wakeTime);
    const dayEnd = 22 * 60;
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
    return gaps.filter((gap) => gap.end > currentMinutes);
  }, [currentMinutes, todayScheduleBlocks]);

  const canPlaceDurationAtMinutes = (startMinutes, duration) => {
    const dayStart = toMinutes(nexusData.inputs.wakeTime);
    const dayEnd = 22 * 60;
    const endMinutes = startMinutes + duration;
    if (startMinutes < dayStart || endMinutes > dayEnd) return false;
    return !todayScheduleBlocks.some((block) => startMinutes < toMinutes(block.end) && endMinutes > toMinutes(block.start));
  };

  const currentGap = useMemo(() => freeGaps.find((gap) => gap.start <= currentMinutes && currentMinutes < gap.end)
      || freeGaps.find((gap) => gap.start > currentMinutes)
      || null, [currentMinutes, freeGaps]);
  const currentTimeBucket = useMemo(() => getTimeBucket(currentMinutes), [currentMinutes]);

  const recommendationCatalog = useMemo(() => {
    const options = [];
    Object.entries(nexusData.lifeOptions).forEach(([category, items]) => {
      items.forEach((item) => {
        const state = recommendationState[item.id] || {};
        if (state.status === 'declined' || state.status === 'accepted') return;
        if (item.validTime && !item.validTime.includes(currentTimeBucket)) return;
        const duration = state.selectedDuration || item.defaultDuration;
        const suggestedGap = freeGaps.find((gap) => gap.duration >= duration) || null;
        options.push({ ...item, group: 'life', groupLabel: 'Life / Schedule', category, selectedDuration: duration, status: state.status || 'open', suggestedGap, suggestedLabel: suggestedGap ? `${formatMinutesToTime(suggestedGap.start)}–${formatMinutesToTime(suggestedGap.start + duration)}` : null });
      });
    });
    Object.entries(nexusData.departmentQueues).forEach(([category, items]) => {
      const ranked = [...items].map((item) => {
        const state = recommendationState[item.id] || {};
        const duration = state.selectedDuration || item.duration;
        const bestGap = freeGaps.find((gap) => gap.duration >= duration) || currentGap;
        const gapFit = bestGap ? Math.abs(bestGap.duration - duration) : 9999;
        return { ...item, group: 'department', groupLabel: 'Department', category, defaultDuration: item.duration, minDuration: Math.max(10, item.duration - 10), maxDuration: item.duration + 15, step: 5, actionType: 'both', selectedDuration: duration, status: state.status || 'open', suggestedGap: bestGap, suggestedLabel: bestGap ? `${formatMinutesToTime(bestGap.start)}–${formatMinutesToTime(bestGap.start + duration)}` : null, fitScore: gapFit };
      }).filter((item) => item.status !== 'declined' && item.status !== 'accepted').sort((a, b) => a.fitScore - b.fitScore).slice(0, 5);
      options.push(...ranked);
    });
    return options;
  }, [currentGap, currentTimeBucket, freeGaps, recommendationState]);

  const selectedCategoryOptions = useMemo(() => recommendationCatalog.filter((option) => option.category === selectedRecommendationCategory && option.status === 'open'), [recommendationCatalog, selectedRecommendationCategory]);
  const laterOptions = useMemo(() => recommendationCatalog.filter((option) => option.category === selectedRecommendationCategory && option.status === 'postponed'), [recommendationCatalog, selectedRecommendationCategory]);
  const recommendationFeedback = useMemo(() => {
    const feedback = {};
    recommendationCatalog.forEach((option) => {
      if (option.actionType === 'task') feedback[option.id] = 'Will be added as a Today task';
      else if (option.suggestedGap && option.suggestedGap.duration >= option.selectedDuration) feedback[option.id] = `Will be scheduled at ${formatMinutesToTime(option.suggestedGap.start)}–${formatMinutesToTime(option.suggestedGap.start + option.selectedDuration)}`;
      else if (option.actionType === 'both') feedback[option.id] = 'No valid slot → will be added as task only';
      else feedback[option.id] = 'No valid slot → will stay in Later';
    });
    return feedback;
  }, [recommendationCatalog]);

  const topRecommendation = useMemo(() => recommendationCatalog.find((option) => option.status === 'open') || null, [recommendationCatalog]);
  const keyStatus = `${activeTasks.length} active tasks · ${doneTasks.length} done today`;

  const writeHistoryEntry = (task, completedAt) => {
    setCompletedHistory((currentHistory) => {
      const entriesForDate = currentHistory[task.date] || [];
      if (entriesForDate.some((entry) => entry.taskId === task.id)) return currentHistory;
      const durationMinutes = task.startedAt ? Math.max(toMinutes(completedAt) - toMinutes(task.startedAt), 0) : null;
      return { ...currentHistory, [task.date]: [...entriesForDate, { id: `history-${task.id}`, taskId: task.id, title: task.title, startedAt: task.startedAt, completedAt, durationMinutes, blockId: task.blockId }] };
    });
  };
  const removeHistoryEntry = (task) => setCompletedHistory((currentHistory) => ({ ...currentHistory, [task.date]: (currentHistory[task.date] || []).filter((entry) => entry.taskId !== task.id) }));

  const findSlotForDuration = (duration, fromNow = false) => {
    const candidateGaps = freeGaps.map((gap) => {
      if (!fromNow || currentMinutes < gap.start) return gap;
      if (gap.start <= currentMinutes && currentMinutes < gap.end) return { start: currentMinutes, end: gap.end, duration: gap.end - currentMinutes };
      return gap;
    });
    const gap = candidateGaps.find((item) => item.duration >= duration);
    if (!gap) return null;
    return { start: formatMinutesToTime(gap.start), end: formatMinutesToTime(gap.start + duration) };
  };

  const createScheduledBlock = ({ id, label, type, duration, taskId, forceNow = false, slotMinutes = null }) => {
    const slot = slotMinutes !== null
      ? (canPlaceDurationAtMinutes(slotMinutes, duration)
          ? { start: formatMinutesToTime(slotMinutes), end: formatMinutesToTime(slotMinutes + duration) }
          : null)
      : forceNow
        ? (() => {
            const end = currentMinutes + duration;
            const overlaps = todayScheduleBlocks.some((block) => currentMinutes < toMinutes(block.end) && end > toMinutes(block.start));
            if (overlaps) return null;
            return { start: formatMinutesToTime(currentMinutes), end: formatMinutesToTime(end) };
          })()
        : findSlotForDuration(duration);
    if (!slot) return null;
    const block = { id, date, label, type, start: slot.start, end: slot.end, fixed: false, taskId: taskId || null };
    setScheduleBlocks((currentBlocks) => currentBlocks.some((item) => item.id === id) ? currentBlocks : [...currentBlocks, block].sort((a, b) => `${a.date}-${a.start}`.localeCompare(`${b.date}-${b.start}`)));
    return block;
  };

  const markRecommendationStatus = (optionId, status) => {
    setRecommendationState((current) => ({ ...current, [optionId]: { ...(current[optionId] || {}), selectedDuration: current[optionId]?.selectedDuration || recommendationCatalog.find((item) => item.id === optionId)?.selectedDuration, status } }));
  };

  const completeTaskById = (taskId) => {
    const completionTime = currentTime;
    setDailyTasks((currentTasks) => currentTasks.map((task) => {
      if (task.id !== taskId) return task;
      const updatedTask = { ...task, status: 'done', completedAt: completionTime };
      writeHistoryEntry(updatedTask, completionTime);
      return updatedTask;
    }));
    if (activeTaskId === taskId) setActiveTaskId(null);
  };

  const handleToggleTask = (taskId) => {
    const task = dailyTasks.find((item) => item.id === taskId);
    if (!task) return;
    if (task.status === 'done') {
      setDailyTasks((currentTasks) => currentTasks.map((item) => item.id === taskId ? { ...item, status: 'active', completedAt: null } : item));
      removeHistoryEntry(task);
    } else completeTaskById(taskId);
  };

  const handleMoveTask = (taskId, direction) => {
    setDailyTasks((currentTasks) => {
      const todayIndexes = currentTasks.map((task, index) => ({ task, index })).filter(({ task }) => task.date === date && task.status === 'active');
      const currentPosition = todayIndexes.findIndex(({ task }) => task.id === taskId);
      const nextPosition = currentPosition + direction;
      if (currentPosition < 0 || nextPosition < 0 || nextPosition >= todayIndexes.length) return currentTasks;
      return moveItem(currentTasks, todayIndexes[currentPosition].index, todayIndexes[nextPosition].index);
    });
  };

  const handleSelectTask = (taskId) => {
    setActiveTaskId(taskId);
    const task = dailyTasks.find((item) => item.id === taskId);
    if (task?.blockId) setActiveBlockId(task.blockId);
    setFocusMode(true);
    setDailyTasks((currentTasks) => currentTasks.map((taskItem) => taskItem.id === taskId && taskItem.startedAt === null ? { ...taskItem, startedAt: currentTime } : taskItem));
  };

  const handleStartNowTask = (taskId) => {
    const task = dailyTasks.find((item) => item.id === taskId);
    if (!task) return;
    const duration = task.durationMinutes || 30;
    const blockId = task.blockId || `task-block-${taskId}`;
    const block = createScheduledBlock({ id: blockId, label: task.title, type: 'work', duration, taskId, forceNow: true });
    if (!block) { setTaskFeedback((current) => ({ ...current, [taskId]: 'No free slot right now' })); return; }
    setDailyTasks((currentTasks) => currentTasks.map((item) => item.id === taskId ? { ...item, blockId, startedAt: item.startedAt || currentTime, durationMinutes: duration } : item));
    setTaskFeedback((current) => ({ ...current, [taskId]: `Started now · ${block.start}–${block.end}` }));
    setActiveTaskId(taskId);
    setActiveBlockId(blockId);
    setFocusMode(true);
  };

  const handleScheduleTask = (taskId, slotMinutes = null) => {
    const task = dailyTasks.find((item) => item.id === taskId);
    if (!task) return false;
    const duration = task.durationMinutes || 30;
    const blockId = task.blockId || `task-block-${taskId}`;
    const block = createScheduledBlock({ id: blockId, label: task.title, type: 'work', duration, taskId, forceNow: false, slotMinutes });
    if (!block) {
      setTaskFeedback((current) => ({ ...current, [taskId]: slotMinutes !== null ? 'Invalid drop target' : 'No valid free gap available' }));
      return false;
    }
    setDailyTasks((currentTasks) => currentTasks.map((item) => item.id === taskId ? { ...item, blockId, durationMinutes: duration } : item));
    setTaskFeedback((current) => ({ ...current, [taskId]: `Scheduled at ${block.start}–${block.end}` }));
    return true;
  };

  const handleStartBlock = () => {
    setActivePage('today');
    const duration = 30;
    const block = createScheduledBlock({ id: `manual-block-${Date.now()}`, label: 'Focused Work', type: 'work', duration, forceNow: true });
    if (!block) return;
    setActiveBlockId(block.id);
    setActiveTaskId(null);
    setFocusMode(true);
  };

  const handleAddBlock = () => {
    const block = createScheduledBlock({ id: `manual-block-${Date.now()}`, label: 'Manual Block', type: 'work', duration: 30, forceNow: false });
    if (!block) return;
    setActiveBlockId(block.id);
    setTaskFeedback((current) => ({ ...current, __global: `Added block ${block.start}–${block.end}` }));
  };

  const handleRemoveBlock = (blockId) => {
    setScheduleBlocks((currentBlocks) => currentBlocks.filter((block) => block.id !== blockId));
    setDailyTasks((currentTasks) => currentTasks.map((task) => task.blockId === blockId ? { ...task, blockId: null } : task));
    if (activeBlockId === blockId) setActiveBlockId(null);
  };

  const handleExitFocus = () => {
    setFocusMode(false);
    setActiveBlockId(null);
    setActiveTaskId(null);
  };

  const handleExtendActiveBlock = () => {
    if (!activeBlockId) return;
    setScheduleBlocks((currentBlocks) => currentBlocks.map((block) => {
      if (block.id !== activeBlockId) return block;
      const proposedEnd = toMinutes(block.end) + 10;
      const overlaps = currentBlocks.some((other) => other.id !== block.id && block.date === other.date && toMinutes(other.start) < proposedEnd && toMinutes(other.end) > toMinutes(block.end));
      if (overlaps) return block;
      return { ...block, end: formatMinutesToTime(proposedEnd) };
    }));
  };

  const handleCompleteActiveTask = () => {
    if (activeTask) completeTaskById(activeTask.id);
  };

  const handleAdjustRecommendationDuration = (optionId, direction) => {
    const option = recommendationCatalog.find((item) => item.id === optionId);
    if (!option) return;
    setRecommendationState((current) => {
      const previous = current[optionId] || {};
      const currentDuration = previous.selectedDuration || option.selectedDuration;
      const nextDuration = Math.max(option.minDuration, Math.min(option.maxDuration, currentDuration + direction * option.step));
      return { ...current, [optionId]: { ...previous, selectedDuration: nextDuration, status: previous.status || 'open' } };
    });
  };

  const createTaskFromOption = (option, blockId = null, started = null) => {
    const taskId = `accepted-task-${option.id}`;
    setDailyTasks((currentTasks) => currentTasks.some((task) => task.id === taskId) ? currentTasks : [...currentTasks, { id: taskId, date, title: option.title, status: 'active', blockId, sourceWeeklyTaskId: null, startedAt: started, completedAt: null, durationMinutes: option.selectedDuration }]);
    return taskId;
  };

  const handleAcceptRecommendation = (optionId) => {
    const option = recommendationCatalog.find((item) => item.id === optionId);
    if (!option) return;
    let block = null;
    let taskId = null;
    if (option.actionType === 'task' || option.actionType === 'both') taskId = createTaskFromOption(option, null, null);
    if (option.actionType === 'schedule' || option.actionType === 'both') block = createScheduledBlock({ id: `accepted-block-${option.id}`, label: option.title, type: option.group === 'department' ? 'work' : option.blockType, duration: option.selectedDuration, taskId, forceNow: false });
    if (block && taskId) setDailyTasks((currentTasks) => currentTasks.map((task) => task.id === taskId ? { ...task, blockId: block.id } : task));
    if (option.actionType === 'schedule' && !block) { markRecommendationStatus(optionId, 'postponed'); return; }
    if (option.actionType === 'both' && !block && !taskId) { markRecommendationStatus(optionId, 'postponed'); return; }
    markRecommendationStatus(optionId, 'accepted');
  };

  const handleStartNowRecommendation = (optionId) => {
    const option = recommendationCatalog.find((item) => item.id === optionId);
    if (!option) return;
    const maybeTaskId = option.actionType === 'task' || option.actionType === 'both' ? `accepted-task-${option.id}` : null;
    const block = createScheduledBlock({ id: `accepted-block-${option.id}`, label: option.title, type: option.group === 'department' ? 'work' : option.blockType, duration: option.selectedDuration, taskId: maybeTaskId, forceNow: true });
    if (!block && option.actionType === 'schedule') { markRecommendationStatus(optionId, 'postponed'); return; }
    let taskId = null;
    if (option.actionType === 'task' || option.actionType === 'both') taskId = createTaskFromOption(option, block?.id || null, currentTime);
    if (block && taskId) setScheduleBlocks((currentBlocks) => currentBlocks.map((item) => item.id === block.id ? { ...item, taskId } : item));
    setActiveTaskId(taskId);
    setActiveBlockId(block?.id || null);
    setFocusMode(true);
    markRecommendationStatus(optionId, 'accepted');
  };

  const handleDeclineRecommendation = (optionId) => markRecommendationStatus(optionId, 'declined');
  const handlePostponeRecommendation = (optionId) => markRecommendationStatus(optionId, 'postponed');

  const handleTaskDragStart = (taskId) => setDraggedTaskId(taskId);
  const handleTaskDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverMinutes(null);
  };

  const canDropTaskAtMinutes = (taskId, slotMinutes) => {
    const task = dailyTasks.find((item) => item.id === taskId);
    if (!task) return false;
    const duration = task.durationMinutes || 30;
    return canPlaceDurationAtMinutes(slotMinutes, duration);
  };

  const handleTimelineDragOver = (slotMinutes) => {
    if (!draggedTaskId) return false;
    setDragOverMinutes(slotMinutes);
    return canDropTaskAtMinutes(draggedTaskId, slotMinutes);
  };

  const handleTimelineDragLeave = () => setDragOverMinutes(null);

  const handleTimelineDrop = (slotMinutes) => {
    if (!draggedTaskId) return false;
    const didSchedule = handleScheduleTask(draggedTaskId, slotMinutes);
    setDraggedTaskId(null);
    setDragOverMinutes(null);
    return didSchedule;
  };

  const pageContent = useMemo(() => {
    const commonProps = { primaryAction: nexusData.primaryAction, tracking: nexusData.tracking, date, viewMode, activePage, currentBlock: timelineState.currentBlock, nextBlock: timelineState.nextBlock };
    switch (activePage) {
      case 'today':
        return <TodayPage page={nexusData.pages.today} activeTasks={tasksWithBlockMeta} doneTasks={doneTasks} onToggleTask={handleToggleTask} onMoveTask={handleMoveTask} onStartNowTask={handleStartNowTask} onScheduleTask={handleScheduleTask} onCompleteTask={completeTaskById} taskFeedback={taskFeedback} onSelectTask={handleSelectTask} scheduleBlocks={timelineState.normalizedBlocks} currentTime={currentTime} currentBlock={timelineState.currentBlock} nextBlock={timelineState.nextBlock} activeBlock={timelineState.currentBlock || todayScheduleBlocks.find((block) => block.id === activeBlockId) || null} recommendationCategories={nexusData.recommendationCategories} selectedRecommendationCategory={selectedRecommendationCategory} recommendationOptions={selectedCategoryOptions} laterRecommendationOptions={laterOptions} recommendationFeedback={recommendationFeedback} onSelectRecommendationCategory={setSelectedRecommendationCategory} onAdjustRecommendationDuration={handleAdjustRecommendationDuration} onStartNowRecommendation={handleStartNowRecommendation} onAcceptRecommendation={handleAcceptRecommendation} onDeclineRecommendation={handleDeclineRecommendation} onPostponeRecommendation={handlePostponeRecommendation} focusMode={focusMode} activeTask={activeTask} timerDisplay={timerState.display} timerProgress={timerState.progress} onStartBlock={handleStartBlock} onAddBlock={handleAddBlock} onRemoveBlock={handleRemoveBlock} onExitFocus={handleExitFocus} onExtendActiveBlock={handleExtendActiveBlock} onCompleteActiveTask={handleCompleteActiveTask} draggedTaskId={draggedTaskId} dragOverMinutes={dragOverMinutes} canDropTaskAtMinutes={canDropTaskAtMinutes} onTaskDragStart={handleTaskDragStart} onTaskDragEnd={handleTaskDragEnd} onTimelineDragOver={handleTimelineDragOver} onTimelineDragLeave={handleTimelineDragLeave} onTimelineDrop={handleTimelineDrop} {...commonProps} />;
      case 'weekly':
        return <WeeklyPage page={nexusData.pages.weekly} weeklyTasks={weeklyTasks} {...commonProps} />;
      case 'history':
        return <HistoryPage page={nexusData.pages.history} date={date} completedHistory={completedHistory} />;
      case 'system':
        return <SystemPage page={nexusData.pages.system} {...commonProps} />;
      case 'nexus-department':
        return <DepartmentPage
          departmentId="nexus"
          departments={departments}
          projects={projects}
          getDepartment={getDepartment}
          updateProject={updateProject}
          focusProjectId={focusProjectId}
          setFocusProject={setFocusProject}
          date={date}
          fallbackPage={nexusData.pages.departments.nexus}
        />;
      case 'hephaestus':
        return <DepartmentPage
          departmentId="hephaestus"
          departments={departments}
          projects={projects}
          getDepartment={getDepartment}
          updateProject={updateProject}
          focusProjectId={focusProjectId}
          setFocusProject={setFocusProject}
          date={date}
          fallbackPage={nexusData.pages.departments.hephaestus}
        />;
      case 'xenon':
        return <DepartmentPage
          departmentId="xenon"
          departments={departments}
          projects={projects}
          getDepartment={getDepartment}
          updateProject={updateProject}
          focusProjectId={focusProjectId}
          setFocusProject={setFocusProject}
          date={date}
          fallbackPage={nexusData.pages.departments.xenon}
        />;
      case 'dashboard':
      default:
        return <DashboardPage dashboard={nexusData.dashboard} openRecommendation={topRecommendation} weeklyGoal={nexusData.pages.weekly.priority} keyStatus={keyStatus} {...commonProps} />;
    }
  }, [activePage, activeBlockId, activeTask, clearFocusProject, currentTime, date, departments, doneTasks, focusMode, focusProjectId, getDepartment, keyStatus, laterOptions, projects, recommendationFeedback, selectedCategoryOptions, selectedRecommendationCategory, setFocusProject, taskFeedback, timerState.display, timerState.progress, timelineState.currentBlock, timelineState.nextBlock, timelineState.normalizedBlocks, todayScheduleBlocks, topRecommendation, tasksWithBlockMeta, updateProject, viewMode, weeklyTasks, completedHistory]);

  const appClassName = [viewMode === 'focus' ? 'app-shell focus-mode' : 'app-shell'];
  if (focusMode) appClassName.push('today-focus-active');

  const dragDropValue = {
    draggedTaskId,
    dragOverMinutes,
    canDropTaskAtMinutes,
    onTaskDragStart: handleTaskDragStart,
    onTaskDragEnd: handleTaskDragEnd,
    onTimelineDragOver: handleTimelineDragOver,
    onTimelineDragLeave: handleTimelineDragLeave,
    onTimelineDrop: handleTimelineDrop,
  };

  const projectsContextValue = useMemo(() => ({
    projects,
    departments,
    updateProject,
    getProject,
    getDepartment,
    focusProjectId,
    setFocusProject,
    clearFocusProject,
  }), [projects, departments, updateProject, getProject, getDepartment, focusProjectId, setFocusProject, clearFocusProject]);

  return (
    <ProjectsContext.Provider value={projectsContextValue}>
      <DragDropContext.Provider value={dragDropValue}>
        <div className={appClassName.join(' ')}>
          <Sidebar navigation={nexusData.navigation} activePage={activePage} viewMode={viewMode} onNavigate={setActivePage} onViewChange={setViewMode} />
          <main className="main-shell">{pageContent}</main>
        </div>
      </DragDropContext.Provider>
    </ProjectsContext.Provider>
  );
}

export default App;
