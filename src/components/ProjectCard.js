import { useState, useCallback } from 'react';

/**
 * ProjectCard
 *
 * Displays a single project with:
 *   - name, department label, status, phase, priority, lastUpdated (read-only)
 *   - currentState and nextAction (inline editable, persisted via updateProject)
 *
 * Editing is local-first: changes live in component state until the user
 * saves explicitly (Save button). This avoids persisting every keystroke
 * and keeps the hook call surface small.
 *
 * Props:
 *   project         — project object from useProjects
 *   departmentLabel — human label for the owning department (e.g. "03_HEPHAESTUS")
 *   updateProject   — updateProject(id, updates) from useProjects
 */
function ProjectCard({ project, departmentLabel, updateProject }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    currentState: project.currentState,
    nextAction: project.nextAction,
  });
  const [saved, setSaved] = useState(false);

  // Reset draft to current persisted values and exit editing mode.
  const handleCancel = useCallback(() => {
    setDraft({
      currentState: project.currentState,
      nextAction: project.nextAction,
    });
    setEditing(false);
    setSaved(false);
  }, [project.currentState, project.nextAction]);

  // Persist draft to localStorage via updateProject hook.
  const handleSave = useCallback(() => {
    const trimmed = {
      currentState: draft.currentState.trim(),
      nextAction: draft.nextAction.trim(),
    };
    if (!trimmed.currentState || !trimmed.nextAction) return;
    updateProject(project.id, trimmed);
    setEditing(false);
    setSaved(true);
    // Clear the saved indicator after 2 seconds.
    setTimeout(() => setSaved(false), 2000);
  }, [draft, project.id, updateProject]);

  const statusClass = `project-status-badge project-status-${project.status}`;

  return (
    <div className="project-card">

      {/* Header row — name + status badge */}
      <div className="project-card-header">
        <div className="project-card-title-group">
          <span className="project-card-name">{project.name}</span>
          <span className={statusClass}>{project.status.toUpperCase()}</span>
        </div>
        {!editing && (
          <button
            className="secondary-button project-card-edit-button"
            onClick={() => { setEditing(true); setSaved(false); }}
          >
            Edit
          </button>
        )}
      </div>

      {/* Meta row — department / phase / priority / last updated */}
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

      {/* Edit controls */}
      {editing && (
        <div className="project-card-actions">
          <button className="primary-action-button" onClick={handleSave}>
            Save
          </button>
          <button className="secondary-button" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      )}

      {/* Saved confirmation */}
      {saved && !editing && (
        <div className="project-card-saved-indicator">
          ✓ Saved
        </div>
      )}

    </div>
  );
}

export default ProjectCard;
