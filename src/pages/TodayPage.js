import { useState } from 'react';
import TimelinePanel from '../components/TimelinePanel';
import BlockSummaryPanel from '../components/BlockSummaryPanel';
import PrimaryActionBanner from '../components/PrimaryActionBanner';
import SuggestedTimelineBlock from '../components/SuggestedTimelineBlock';

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
  onStartBlock,
  onExitFocus,
  onAddBlock,
  onRemoveBlock,
  taskEnginePanel,
  dayConstraintsPanel,
  quickLogPanel,
  aureonPanel,
  focusProject,
  sessionBudgetText,
  projectContextPreview,
  enginePrimaryAction,
  recommendedBlocks = [],
  lifeBlockSuggestions = [],
  dismissDept,
  engineReasoning,
  energyBar,
  lifeBlockPicker,
  currentZone,
}) {
  const [contextExpanded, setContextExpanded] = useState(false);
  const activeNowTitle = activeBlock?.label || 'No active block';
  const activeNowMeta = activeBlock ? `${activeBlock.start}–${activeBlock.end}` : 'Start a block to begin';

  const [hours = 0, minutes = 0] = String(currentTime).split(':').map(Number);
  const dayStartMinutes = 7 * 60;
  const dayEndMinutes = 22 * 60;
  const nowMinutes = hours * 60 + minutes;
  const dayDuration = Math.max(dayEndMinutes - dayStartMinutes, 1);
  const dayElapsed = Math.max(0, Math.min(nowMinutes - dayStartMinutes, dayDuration));
  const dayProgress = Math.round((dayElapsed / dayDuration) * 100);

  const onConfirmSuggestion = (block) => {
    const blockType = block.source === 'life-engine' ? (block.type || 'life') : 'work';
    onAddBlock(block.date ?? date, {
      type: blockType,
      label: block.label,
      start: block.start,
      end: block.end,
    });
  };

  const onDismissSuggestion = (block) => {
    if (block.departmentId) dismissDept(block.departmentId);
  };

  const allSuggestions = [
    ...recommendedBlocks.map((b) => ({ ...b, source: b.source || 'engine' })),
    ...lifeBlockSuggestions.map((b) => ({ ...b, source: 'life-engine' })),
  ].sort((a, b) => {
    const aMin = a.start.split(':').reduce((h, m) => Number(h) * 60 + Number(m));
    const bMin = b.start.split(':').reduce((h, m) => Number(h) * 60 + Number(m));
    return aMin - bMin;
  });

  return (
    <div className="today-shell">
      {/* ── Top bar: date + session budget ── */}
      <header className="today-topbar">
        <div className="today-topbar-left">
          <h1 className="today-date-title">{formatDisplayDate(date)}</h1>
          <span className="today-budget-pill">{sessionBudgetText}</span>
        </div>
        <div className="today-topbar-right">
          {currentZone && (
            <span className="today-zone-pill" style={{ '--zone-color': currentZone.color }}>
              <span className="today-zone-dot" />
              {currentZone.label}
            </span>
          )}
          <span className="today-time">{currentTime}</span>
        </div>
      </header>

      {/* ── Day progress ── */}
      <div className="today-day-progress">
        <div className="today-day-progress-fill" style={{ width: `${dayProgress}%` }} />
      </div>

      {/* ── Focus project strip (collapsed by default) ── */}
      {focusProject && (
        <button
          className={`today-project-strip${contextExpanded ? ' is-expanded' : ''}`}
          onClick={() => setContextExpanded((v) => !v)}
        >
          <span className="today-project-dot" />
          <span className="today-project-name">{focusProject.name}</span>
          <span className={`today-project-status today-project-status-${focusProject.status}`}>
            {focusProject.status}
          </span>
          {contextExpanded && (
            <span className="today-project-detail">{projectContextPreview}</span>
          )}
        </button>
      )}

      {/* ── Two-panel layout ── */}
      <div className={`today-two-panel${focusMode ? ' is-focus' : ''}`}>

        {/* ──── LEFT: Tasks & Execution ──── */}
        <div className="today-panel today-panel-tasks">
          {/* Primary action from engine */}
          {!focusMode && enginePrimaryAction && (
            <PrimaryActionBanner
              action={enginePrimaryAction}
              reasoning={engineReasoning}
              onSchedule={() => {
                const first = recommendedBlocks[0];
                if (first) onConfirmSuggestion(first);
              }}
              onSkip={() => {
                if (enginePrimaryAction?.departmentId) dismissDept(enginePrimaryAction.departmentId);
              }}
            />
          )}

          {/* Active block status */}
          <div className="today-active-block">
            <div className="today-active-header">
              <div>
                <span className="today-active-label">Active Now</span>
                <h2 className="today-active-title">{activeNowTitle}</h2>
                <span className="today-active-meta">{activeNowMeta}</span>
              </div>
              <div className="today-active-timer">
                <span className="today-active-timer-display">
                  {activeBlock ? timerDisplay : '--:--'}
                </span>
              </div>
            </div>
            <div className="today-active-progress">
              <div
                className="today-active-progress-fill"
                style={{ width: `${activeBlock ? timerProgress : 0}%` }}
              />
            </div>
            <div className="today-active-controls">
              {focusMode ? (
                <button className="today-btn today-btn-secondary" onClick={onExitFocus}>
                  Exit Focus
                </button>
              ) : (
                <button className="today-btn today-btn-primary" onClick={onStartBlock}>
                  Start Block
                </button>
              )}
            </div>
          </div>

          {/* Task list */}
          <div className="today-tasks-scroll">
            {taskEnginePanel}
          </div>

          {/* Quick log */}
          {quickLogPanel}
        </div>

        {/* ──── RIGHT: Timeline & Scheduling ──── */}
        <div className="today-panel today-panel-timeline">
          {energyBar}

          <TimelinePanel
            blocks={scheduleBlocks}
            currentTime={currentTime}
            currentBlockId={currentBlock?.id}
            nextBlockId={nextBlock?.id}
            onAddBlock={onAddBlock}
            onRemoveBlock={onRemoveBlock}
          />

          {allSuggestions.length > 0 && (
            <div className="today-suggestions">
              <h3 className="today-suggestions-title">Suggested</h3>
              <div className="today-suggestions-list">
                {allSuggestions.map((block) => (
                  <SuggestedTimelineBlock
                    key={block.id}
                    block={{
                      ...block,
                      departmentId: block.departmentId || block.category || 'life',
                    }}
                    onConfirm={() => onConfirmSuggestion(block)}
                    onDismiss={() => onDismissSuggestion(block)}
                  />
                ))}
              </div>
            </div>
          )}

          {lifeBlockPicker}

          <BlockSummaryPanel currentBlock={currentBlock} nextBlock={nextBlock} />

          {dayConstraintsPanel}

          {aureonPanel}
        </div>
      </div>
    </div>
  );
}

function formatDisplayDate(dateStr) {
  try {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default TodayPage;
