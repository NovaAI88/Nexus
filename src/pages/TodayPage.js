import PageContainer from '../components/PageContainer';
import TimelinePanel from '../components/TimelinePanel';
import BlockSummaryPanel from '../components/BlockSummaryPanel';

/**
 * TodayPage — Phase 8.75
 *
 * Props provided by App.js (new clean surface):
 *   date, currentTime, currentBlock, nextBlock, scheduleBlocks
 *   focusMode, activeBlock, timerDisplay, timerProgress
 *   recommendations             — project-aware rec array
 *   onStartBlock, onExitFocus
 *   onAddBlock, onRemoveBlock   — planner block controls
 *   draggedBlockId, dragOverMinutes, canDropTaskAtMinutes
 *   onTimelineDragOver, onTimelineDragLeave, onTimelineDrop
 *   taskEnginePanel             — <TaskEnginePanel />
 *   dayConstraintsPanel         — <PlannerBlocksPanel />
 *   quickLogPanel               — <QuickLogInput compact />
 *   focusProjectId
 */
function TodayPage({
  date,
  currentTime,
  currentBlock,
  nextBlock,
  scheduleBlocks,
  focusMode,
  activeBlock,
  timerDisplay,
  timerProgress,
  recommendations,
  onStartBlock,
  onExitFocus,
  onAddBlock,
  onRemoveBlock,
  draggedBlockId,
  dragOverMinutes,
  canDropTaskAtMinutes,
  onTimelineDragOver,
  onTimelineDragLeave,
  onTimelineDrop,
  taskEnginePanel,
  dayConstraintsPanel,
  quickLogPanel,
  focusProjectId,
}) {
  const activeNowTitle = activeBlock?.label || 'No active block';
  const activeNowMeta = activeBlock ? `${activeBlock.start}–${activeBlock.end}` : 'No block running';
  const topRec = recommendations?.[0] ?? null;

  return (
    <div className="today-workspace-shell">
      <div className={`today-three-zone-layout upgraded${focusMode ? ' is-focus-mode' : ''}`}>

        {/* ── Left: Timeline ─────────────────────────────────────────────── */}
        <aside className="today-zone timeline-zone">
          <div className="today-column-scroll timeline-column-scroll">
            <TimelinePanel
              blocks={scheduleBlocks}
              currentTime={currentTime}
              currentBlockId={currentBlock?.id}
              nextBlockId={nextBlock?.id}
              onAddBlock={onAddBlock}
              onRemoveBlock={onRemoveBlock}
            />
          </div>
        </aside>

        {/* ── Center: Active Now + Tasks ──────────────────────────────────── */}
        <section className="today-zone execution-zone">
          {/* Active Now panel */}
          <section className="active-now-panel">
            <div className="active-now-header">
              <span className="label">Active Now</span>
              <div className="active-now-meta">
                <span>{activeNowMeta}</span>
                <strong className="active-now-time">{activeBlock ? timerDisplay : '--:--'}</strong>
              </div>
            </div>
            <h1 className="active-now-title">{activeNowTitle}</h1>
            <div className="focus-progress-bar compact">
              <div className="focus-progress-fill" style={{ width: `${activeBlock ? timerProgress : 0}%` }} />
            </div>
            <div className="active-now-controls">
              {focusMode ? (
                <button className="secondary-button" onClick={onExitFocus}>Exit Focus</button>
              ) : (
                <button className="primary-action-button" onClick={onStartBlock}>Start Block</button>
              )}
            </div>
          </section>

          {/* Task engine panel */}
          <div className="today-column-scroll center-column-scroll">
            {taskEnginePanel || null}

            {/* Top recommendation (single-item push) */}
            {!focusMode && topRec && (
              <div className="today-rec-nudge">
                <span className="label">Suggested</span>
                <p className="today-rec-title">{topRec.title}</p>
                {topRec.description && (
                  <p className="today-rec-desc">{topRec.description}</p>
                )}
                {topRec.suggestedLabel && (
                  <span className="today-rec-slot">{topRec.suggestedLabel}</span>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── Right: Quick Log + Planner + Block summary ──────────────────── */}
        <aside className="today-zone intelligence-zone secondary-zone">
          <div className="today-column-scroll right-column-scroll">
            {quickLogPanel || null}
            {dayConstraintsPanel || null}
            <BlockSummaryPanel currentBlock={currentBlock} nextBlock={nextBlock} />
          </div>
        </aside>

      </div>
    </div>
  );
}

export default TodayPage;
