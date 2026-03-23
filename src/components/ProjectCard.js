import { useState, useCallback } from 'react';

/**
 * ProjectCard
 *
 * Displays a single project with full operational controls:
 *
 * Phase 4:
 *   - name, department label, status, phase, priority, lastUpdated (read)
 *   - currentState and nextAction (inline editable)
 *
 * Phase 5:
 *   - status controls: active | paused | blocked | completed
 *   - priority controls: critical | high | normal
 *   - focus project: set this project as the active focus (persisted)
 *
 * Props:
 *   project          — project object from useProjects
 *   departmentLabel  — human label for the owning department
 *   updateProject    — updateProject(id, updates) from useProjects
 *   isFocus          — boolean: is this the current focus project?
 *   setFocusProject  — setFocusProject(id) from useFocusProject (via context)
 */

const STATUS_OPTIONS = ['active', 'paused', 'blocked', 'completed'];
const PRIORITY_OPTIONS = ['critical', 'high', 'normal'];

function ProjectCard({ project, departmentLabel, updateProject, isFocus, setFocusProject }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    currentState: project.currentState,
    nextAction: project.nextAction,
  });
  const [saved, setSaved] = useState(false);

  // ── Text field editing ──────────────────────────────────────────────────────

  const handleCancel = useCallback(() => {
    setDraft({
      currentState: project.currentState,
      nextAction: project.nextAction,
    });
    setEditing(false);
    setSaved(false);
  }, [project.currentState, project.nextAction]);

  const handleSave = useCallback(() => {
    const trimmed = {
      currentState: draft.currentState.trim(),
      nextAction: draft.nextAction.trim(),
    };
    if (!trimmed.currentState || !trimmed.nextAction) return;
    updateProject(project.id, trimmed);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [draft, project.id, updateProject]);

  // ── Status control ──────────────────────────────────────────────────────────

  const handleStatusChange = useCallback((status) => {
    updateProject(project.id, { status });
  }, [project.id, updateProject]);

  // ── Priority control ────────────────────────────────────────────────────────

  const handlePriorityChange = useCallback((priority) => {
    updateProject(project.id, { priority });
  }, [project.id, updateProject]);

  // ── Focus project ───────────────────────────────────────────────────────────

  const handleSetFocus = useCallback(() => {
    setFocusProject(project.id);
  }, [project.id, setFocusProject]);

  // ── Render ──────────────────────────────────────────────────────────────────

  const statusBadgeClass = `project-status-badge project-status-${project.status}`;

  return (
    <div className={`project-card${isFocus ? ' project-card-is-focus' : ''}`}>

      {/* Header — name, status badge, focus indicator, edit button */}
      <div className="project-card-header">
        <div className="project-card-title-group">
          <span className="project-card-name">{project.name}</span>
          <span className={statusBadgeClass}>{project.status.toUpperCase()}</span>
          {isFocus && (
            <span className="project-focus-indicator">● FOCUS</span>
          )}
        </div>
        <div className="project-card-header-actions">
          {!isFocus && (
            <button
              className="secondary-button project-card-focus-button"
              onClick={handleSetFocus}
              title="Set as active focus project"
            >
              Set Focus
            </button>
          )}
          {!editing && (
            <button
              className="secondary-button project-card-edit-button"
              onClick={() => { setEditing(true); setSaved(false); }}
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Meta — department / phase / priority / last updated */}
      <div className="project-card-meta">
        <span className="label">Department</span>
        <span className="project-meta-value">{departmentLabel}</span>

        <span className="label">Phase</span>
        <span className="project-meta-value">{project.phase}</span>

        <span className="label">Priority</span>
        <span className="project-meta-value">{project.priority}</span>

        <span className="label">Last Updated</span>
        <span className="project-meta-value">
          {new Date(project.lastUpdated).toLocaleString()}
        </span>
      </div>

      {/* Status controls */}
      <div className="panel-group">
        <h3>Status</h3>
        <div className="project-control-row">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              className={`project-control-button project-control-status-${s}${project.status === s ? ' is-active' : ''}`}
              onClick={() => handleStatusChange(s)}
              disabled={project.status === s}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Priority controls */}
      <div className="panel-group">
        <h3>Priority</h3>
        <div className="project-control-row">
          {PRIORITY_OPTIONS.map((p) => (
            <button
              key={p}
              className={`project-control-button project-control-priority-${p}${project.priority === p ? ' is-active' : ''}`}
              onClick={() => handlePriorityChange(p)}
              disabled={project.priority === p}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Current State */}
      <div className="panel-group">
        <h3>Current State</h3>
        {editing ? (
          <textarea
            className="project-card-textarea"
            value={draft.currentState}
            rows={4}
            onChange={(e) => setDraft((d) => ({ ...d, currentState: e.target.value }))}
            placeholder="Describe the current state of this project…"
          />
        ) : (
          <p className="project-card-text">{project.currentState}</p>
        )}
      </div>

      {/* Next Action */}
      <div className="panel-group">
        <h3>Next Action</h3>
        {editing ? (
          <textarea
            className="project-card-textarea"
            value={draft.nextAction}
            rows={3}
            onChange={(e) => setDraft((d) => ({ ...d, nextAction: e.target.value }))}
            placeholder="What is the single concrete next step?"
          />
        ) : (
          <p className="project-card-text project-card-next-action">{project.nextAction}</p>
        )}
      </div>

      {/* Edit save/cancel */}
      {editing && (
        <div className="project-card-actions">
          <button className="primary-action-button" onClick={handleSave}>Save</button>
          <button className="secondary-button" onClick={handleCancel}>Cancel</button>
        </div>
      )}

      {saved && !editing && (
        <div className="project-card-saved-indicator">✓ Saved</div>
      )}

    </div>
  );
}

export default ProjectCard;
