import { useState } from 'react';
import { TASK_STATUS, TASK_PRIORITY } from '../core/tasks/useTaskEngine';

const PRIORITY_LABELS = { high: '↑ High', normal: '— Normal', low: '↓ Low' };
const STATUS_LABELS = {
  open: 'Open',
  in_progress: 'In Progress',
  done: 'Done',
  cancelled: 'Cancelled',
};

/**
 * TaskEnginePanel
 *
 * Phase 8: task engine UI for the Today page.
 * Shows today's tasks + focus-project tasks.
 * Add, complete, cancel, set priority.
 *
 * Props:
 *   date            — 'YYYY-MM-DD'
 *   tasks           — Task[] for today (from getTasksForDate)
 *   focusProject    — project object | null
 *   focusTasks      — Task[] for the focus project (non-date-scoped)
 *   addTask         — addTask({ projectId, date, title, priority })
 *   setTaskStatus   — setTaskStatus(id, status)
 *   updateTask      — updateTask(id, patch)
 *   removeTask      — removeTask(id)
 */
function TaskEnginePanel({
  date,
  tasks,
  focusProject,
  focusTasks,
  addTask,
  setTaskStatus,
  updateTask,
  removeTask,
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ title: '', priority: TASK_PRIORITY.NORMAL, scope: 'today' });

  const openTasks = tasks.filter((t) => t.status !== TASK_STATUS.DONE && t.status !== TASK_STATUS.CANCELLED);
  const doneTasks = tasks.filter((t) => t.status === TASK_STATUS.DONE);

  const openFocusTasks = (focusTasks || []).filter((t) =>
    t.status !== TASK_STATUS.DONE && t.status !== TASK_STATUS.CANCELLED && !t.date
  );

  const handleAdd = () => {
    const title = draft.title.trim();
    if (!title) return;
    addTask({
      projectId: draft.scope === 'project' && focusProject ? focusProject.id : null,
      date: draft.scope === 'today' ? date : null,
      title,
      priority: draft.priority,
    });
    setDraft({ title: '', priority: TASK_PRIORITY.NORMAL, scope: 'today' });
    setAdding(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd(); }
    if (e.key === 'Escape') setAdding(false);
  };

  return (
    <div className="task-engine-panel">

      {/* Header */}
      <div className="task-engine-header">
        <h3 className="task-engine-title">Tasks</h3>
        {!adding && (
          <button className="project-control-button planner-add-trigger" onClick={() => setAdding(true)}>
            + Add
          </button>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <div className="task-add-form">
          <input
            className="task-title-input"
            type="text"
            autoFocus
            placeholder="Task title… (Enter to add)"
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            onKeyDown={handleKeyDown}
          />
          <div className="task-add-controls">
            <select
              className="constraint-time-input"
              value={draft.priority}
              onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value }))}
            >
              {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            {focusProject && (
              <select
                className="constraint-time-input"
                value={draft.scope}
                onChange={(e) => setDraft((d) => ({ ...d, scope: e.target.value }))}
              >
                <option value="today">Today</option>
                <option value="project">{focusProject.name}</option>
              </select>
            )}
            <button className="primary-action-button planner-action-btn" onClick={handleAdd}>Add</button>
            <button className="secondary-button planner-action-btn" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Today open tasks */}
      {openTasks.length === 0 && !adding && openFocusTasks.length === 0 && (
        <p className="planner-empty">No tasks for today. Add one above.</p>
      )}

      {openTasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          setTaskStatus={setTaskStatus}
          updateTask={updateTask}
          removeTask={removeTask}
        />
      ))}

      {/* Focus project backlog (non-day-scoped) */}
      {focusProject && openFocusTasks.length > 0 && (
        <>
          <div className="task-section-label">
            {focusProject.name} — Backlog
          </div>
          {openFocusTasks.slice(0, 5).map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              setTaskStatus={setTaskStatus}
              updateTask={updateTask}
              removeTask={removeTask}
              dimmed
            />
          ))}
        </>
      )}

      {/* Done today (collapsed) */}
      {doneTasks.length > 0 && (
        <div className="task-done-section">
          <span className="task-section-label">Done today ({doneTasks.length})</span>
          {doneTasks.map((task) => (
            <div key={task.id} className="task-row task-row-done">
              <span className="task-done-check">✓</span>
              <span className="task-title-done">{task.title}</span>
              <button
                className="constraint-toggle"
                title="Reopen"
                onClick={() => setTaskStatus(task.id, TASK_STATUS.OPEN)}
              >↩</button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

function TaskRow({ task, setTaskStatus, updateTask, removeTask, dimmed = false }) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  const saveEdit = () => {
    const t = editTitle.trim();
    if (t) updateTask(task.id, { title: t });
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); saveEdit(); }
    if (e.key === 'Escape') { setEditing(false); setEditTitle(task.title); }
  };

  const priorityClass = `task-priority-dot task-priority-${task.priority}`;
  const isActive = task.status === TASK_STATUS.IN_PROGRESS;

  return (
    <div className={`task-row${dimmed ? ' task-row-dimmed' : ''}${isActive ? ' task-row-active' : ''}`}>
      <button
        className={`task-complete-btn${isActive ? ' is-active' : ''}`}
        title={isActive ? 'Mark done' : 'Start'}
        onClick={() =>
          setTaskStatus(task.id, isActive ? TASK_STATUS.DONE : TASK_STATUS.IN_PROGRESS)
        }
      >
        {isActive ? '●' : '○'}
      </button>
      <span className={priorityClass} title={task.priority} />
      {editing ? (
        <input
          className="task-inline-edit"
          autoFocus
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <span
          className="task-title"
          onDoubleClick={() => { setEditing(true); setEditTitle(task.title); }}
          title="Double-click to edit"
        >
          {task.title}
        </span>
      )}
      <div className="task-row-actions">
        <button
          className="constraint-toggle"
          title="Cancel task"
          onClick={() => setTaskStatus(task.id, TASK_STATUS.CANCELLED)}
        >✕</button>
      </div>
    </div>
  );
}

export default TaskEnginePanel;
