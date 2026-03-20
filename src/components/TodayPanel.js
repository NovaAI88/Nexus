import SectionCard from './SectionCard';

function TodayPanel({
  tasks,
  focusBlocks,
  onToggleTask,
  onSelectTask,
  onMoveTask,
  onStartNowTask,
  onScheduleTask,
  onCompleteTask,
  activeTaskId,
  taskFeedback,
}) {
  return (
    <SectionCard title="Today Tasks">
      <div className="panel-group">
        <h3>Tasks</h3>
        {tasks.length > 0 ? (
          <ul className="task-list">
            {tasks.map((task, index) => (
              <li
                key={task.id}
                className={task.id === activeTaskId ? 'task-item active-task-item' : 'task-item'}
              >
                <div className="task-row">
                  <div className="task-main">
                    <label className="task-checkbox-row">
                      <input
                        type="checkbox"
                        checked={task.status === 'done'}
                        onChange={() => onToggleTask(task.id)}
                      />
                      <span>{task.title}</span>
                    </label>
                    <div className="task-meta">
                      {task.blockLabel ? <span>{task.blockLabel}</span> : <span>Unscheduled</span>}
                      {taskFeedback[task.id] ? <span>{taskFeedback[task.id]}</span> : null}
                    </div>
                  </div>
                  <div className="task-controls">
                    <button className="task-focus-button primary" onClick={() => onStartNowTask(task.id)}>
                      Start Now
                    </button>
                    <button className="task-focus-button" onClick={() => onScheduleTask(task.id)}>
                      Schedule
                    </button>
                    <button className="task-focus-button" onClick={() => onCompleteTask(task.id)}>
                      Complete
                    </button>
                    <button className="task-focus-button" onClick={() => onMoveTask(task.id, -1)} disabled={index === 0}>
                      ↑
                    </button>
                    <button className="task-focus-button" onClick={() => onMoveTask(task.id, 1)} disabled={index === tasks.length - 1}>
                      ↓
                    </button>
                    <button className="task-focus-button" onClick={() => onSelectTask(task.id)}>
                      Focus
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>All active tasks completed.</p>
        )}
      </div>
      <div className="panel-group">
        <h3>Focus Blocks</h3>
        <ul>{focusBlocks.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
    </SectionCard>
  );
}

export default TodayPanel;
