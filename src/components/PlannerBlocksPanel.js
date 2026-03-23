import { useState } from 'react';
import { BLOCK_TYPES } from '../core/planner/usePlannerBlocks';

/**
 * PlannerBlocksPanel
 *
 * Phase 7: flexible block editor for the Today page right column.
 * Replaces DayConstraintsPanel (Phase 6).
 *
 * Shows:
 *   - today's flexible blocks (editable, removable)
 *   - "Add block" form (inline, minimal)
 *   - stop-work rule (toggle + time)
 *
 * Props:
 *   date             — 'YYYY-MM-DD' string
 *   plannerBlocks    — PlannerBlock[] for today (from usePlannerBlocks.getPlannerBlocks)
 *   addBlock         — addBlock(date, { type, label, start, end })
 *   updateBlock      — updateBlock(date, blockId, patch)
 *   removeBlock      — removeBlock(date, blockId)
 *   stopWork         — { enabled, time }
 *   setStopWork      — setStopWork({ enabled?, time? })
 */
function PlannerBlocksPanel({
  date,
  plannerBlocks,
  addBlock,
  updateBlock,
  removeBlock,
  stopWork,
  setStopWork,
}) {
  const [adding, setAdding] = useState(false);
  const [newBlock, setNewBlock] = useState({ type: 'job', label: '', start: '18:00', end: '21:00' });
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);

  // ── Add form ─────────────────────────────────────────────────────────────

  const handleAdd = () => {
    if (!newBlock.start || !newBlock.end) return;
    addBlock(date, {
      type: newBlock.type,
      label: newBlock.label || BLOCK_TYPES.find((t) => t.id === newBlock.type)?.label || newBlock.type,
      start: newBlock.start,
      end: newBlock.end,
    });
    setAdding(false);
    setNewBlock({ type: 'job', label: '', start: '18:00', end: '21:00' });
  };

  // ── Inline edit ──────────────────────────────────────────────────────────

  const startEdit = (block) => {
    setEditingId(block.id);
    setEditDraft({ type: block.type, label: block.label, start: block.start, end: block.end });
  };

  const saveEdit = (blockId) => {
    if (!editDraft.start || !editDraft.end) return;
    updateBlock(date, blockId, editDraft);
    setEditingId(null);
    setEditDraft(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(null);
  };

  return (
    <div className="planner-blocks-panel">

      {/* Header */}
      <div className="planner-blocks-header">
        <h3 className="planner-blocks-title">Day Blocks</h3>
        {!adding && (
          <button
            className="project-control-button planner-add-trigger"
            onClick={() => setAdding(true)}
          >
            + Add
          </button>
        )}
      </div>

      {/* Existing blocks */}
      {plannerBlocks.length === 0 && !adding && (
        <p className="planner-empty">No blocks yet. Add one above.</p>
      )}

      {plannerBlocks
        .slice()
        .sort((a, b) => a.start.localeCompare(b.start))
        .map((block) =>
          editingId === block.id ? (
            /* Edit mode */
            <div key={block.id} className="planner-block-row is-editing">
              <select
                className="constraint-time-input planner-type-select"
                value={editDraft.type}
                onChange={(e) => setEditDraft((d) => ({ ...d, type: e.target.value }))}
              >
                {BLOCK_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
              <input
                type="text"
                className="constraint-time-input planner-label-input"
                value={editDraft.label}
                placeholder="Label"
                onChange={(e) => setEditDraft((d) => ({ ...d, label: e.target.value }))}
              />
              <div className="constraint-time-range">
                <input
                  type="time"
                  className="constraint-time-input"
                  value={editDraft.start}
                  onChange={(e) => setEditDraft((d) => ({ ...d, start: e.target.value }))}
                />
                <span className="constraint-range-sep">–</span>
                <input
                  type="time"
                  className="constraint-time-input"
                  value={editDraft.end}
                  onChange={(e) => setEditDraft((d) => ({ ...d, end: e.target.value }))}
                />
              </div>
              <div className="planner-block-actions">
                <button className="primary-action-button planner-action-btn" onClick={() => saveEdit(block.id)}>Save</button>
                <button className="secondary-button planner-action-btn" onClick={cancelEdit}>Cancel</button>
              </div>
            </div>
          ) : (
            /* View mode */
            <div key={block.id} className={`planner-block-row planner-block-type-${block.type}`}>
              <div className="planner-block-info">
                <span className={`planner-type-dot planner-dot-${block.type}`} />
                <span className="planner-block-label">{block.label}</span>
                <span className="planner-block-time">{block.start}–{block.end}</span>
              </div>
              <div className="planner-block-controls">
                <button className="constraint-toggle" onClick={() => startEdit(block)} title="Edit">✎</button>
                <button className="constraint-toggle" onClick={() => removeBlock(date, block.id)} title="Remove">✕</button>
              </div>
            </div>
          )
        )}

      {/* Add block form */}
      {adding && (
        <div className="planner-add-form">
          <div className="planner-add-row">
            <select
              className="constraint-time-input planner-type-select"
              value={newBlock.type}
              onChange={(e) => setNewBlock((d) => ({
                ...d,
                type: e.target.value,
                label: BLOCK_TYPES.find((t) => t.id === e.target.value)?.label || '',
              }))}
            >
              {BLOCK_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <input
              type="text"
              className="constraint-time-input planner-label-input"
              value={newBlock.label}
              placeholder="Label (optional)"
              onChange={(e) => setNewBlock((d) => ({ ...d, label: e.target.value }))}
            />
          </div>
          <div className="planner-add-row">
            <div className="constraint-time-range">
              <input
                type="time"
                className="constraint-time-input"
                value={newBlock.start}
                onChange={(e) => setNewBlock((d) => ({ ...d, start: e.target.value }))}
              />
              <span className="constraint-range-sep">–</span>
              <input
                type="time"
                className="constraint-time-input"
                value={newBlock.end}
                onChange={(e) => setNewBlock((d) => ({ ...d, end: e.target.value }))}
              />
            </div>
          </div>
          <div className="planner-block-actions">
            <button className="primary-action-button planner-action-btn" onClick={handleAdd}>Add</button>
            <button className="secondary-button planner-action-btn" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Stop-work rule */}
      <div className="planner-stop-work">
        <div className="constraint-row">
          <div className="constraint-row-label">
            <button
              className={`constraint-toggle${stopWork.enabled ? ' is-on' : ''}`}
              onClick={() => setStopWork({ enabled: !stopWork.enabled })}
            >
              {stopWork.enabled ? '●' : '○'}
            </button>
            <span className={stopWork.enabled ? '' : 'constraint-disabled'}>Stop Work</span>
          </div>
          <input
            type="time"
            className="constraint-time-input"
            value={stopWork.time}
            disabled={!stopWork.enabled}
            onChange={(e) => setStopWork({ time: e.target.value })}
          />
        </div>
        {stopWork.enabled && (
          <p className="constraint-note">No new work after {stopWork.time}.</p>
        )}
      </div>

    </div>
  );
}

export default PlannerBlocksPanel;
