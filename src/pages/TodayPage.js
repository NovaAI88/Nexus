import { useState } from 'react';
import TimelinePanel from '../components/TimelinePanel';
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
  onUpdateBlock,
  taskEnginePanel,
  quickLogPanel,
  focusProject,
  sessionBudgetText,
  projectContextPreview,
  enginePrimaryAction,
  recommendedBlocks = [],
  lifeBlockSuggestions = [],
  dismissDept,
  engineReasoning,
  energyBar,
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
  ]
    .sort((a, b) => {
      const aMin = a.start.split(':').reduce((h, m) => Number(h) * 60 + Number(m));
      const bMin = b.start.split(':').reduce((h, m) => Number(h) * 60 + Number(m));
      return aMin - bMin;
    })
    .slice(0, 3); // max 3 suggestions shown

  const greeting = getGreeting(hours);

  return (
    <div className="today-shell today-shell--focused">
      {/* ── Top bar: greeting + time + energy zone ── */}
      <header className="today-topbar">
        <div className="today-topbar-left">
          <h1 className="today-date-title">{greeting}</h1>
          <span className="today-date-sub">{formatDisplayDate(date)}</span>
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

      {/* ── Day progress bar ── */}
      <div className="today-day-progress">
        <div className="today-day-progress-fill" style={{ width: `${dayProgress}%` }} />
      </div>

      {/* ── Focus project strip ── */}
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

      {/* ── Single column layout ── */}
      <div className={`today-single-col${focusMode ? ' is-focus' : ''}`}>

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

        {/* Active block */}
        <div className={`today-active-block${activeBlock ? ' has-active' : ''}`}>
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

        {/* Energy bar */}
        {energyBar}

        {/* Timeline */}
        <TimelinePanel
          blocks={scheduleBlocks}
          currentTime={currentTime}
          currentBlockId={currentBlock?.id}
          nextBlockId={nextBlock?.id}
          onAddBlock={onAddBlock}
          onRemoveBlock={onRemoveBlock}
          onUpdateBlock={onUpdateBlock}
        />

        {/* Today tasks */}
        <div className="today-tasks-scroll">
          {taskEnginePanel}
        </div>

        {/* Suggested blocks — inline, max 3, no collapsible */}
        {allSuggestions.length > 0 && (
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
        )}

        {/* Quick log */}
        {quickLogPanel}

        {/* Empty state */}
        {!activeBlock && allSuggestions.length === 0 && scheduleBlocks.length === 0 && (
          <div className="empty-state">
            <span className="empty-state-icon">●</span>
            <p className="empty-state-text">No blocks planned. Add one or use the Weekly planner.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting(hour) {
  if (hour < 12) return 'Good morning, Nicholas';
  if (hour < 17) return 'Good afternoon, Nicholas';
  return 'Good evening, Nicholas';
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
