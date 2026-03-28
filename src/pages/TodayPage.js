import { useState } from 'react';
import TimelinePanel from '../components/TimelinePanel';
import BlockSummaryPanel from '../components/BlockSummaryPanel';
import PrimaryActionBanner from '../components/PrimaryActionBanner';
import SuggestedTimelineBlock from '../components/SuggestedTimelineBlock';
import SectionCard from '../components/SectionCard';

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
  dismissDept,
  engineReasoning,
}) {
  const [contextExpanded, setContextExpanded] = useState(true);
  const activeNowTitle = activeBlock?.label || 'No active block';
  const activeNowMeta = activeBlock ? `${activeBlock.start}–${activeBlock.end}` : 'No block running';

  const [hours = 0, minutes = 0] = String(currentTime).split(':').map(Number);
  const dayStartMinutes = 7 * 60;
  const dayEndMinutes = 22 * 60;
  const nowMinutes = hours * 60 + minutes;
  const dayDuration = Math.max(dayEndMinutes - dayStartMinutes, 1);
  const dayElapsed = Math.max(0, Math.min(nowMinutes - dayStartMinutes, dayDuration));
  const dayProgress = Math.round((dayElapsed / dayDuration) * 100);

  const onConfirmSuggestion = (block) => {
    onAddBlock(block.date ?? date, {
      type: 'work',
      label: block.label,
      start: block.start,
      end: block.end,
    });
  };

  const onDismissSuggestion = (block) => {
    dismissDept(block.departmentId);
  };

  return (
    <div className="today-workspace-shell">
      {focusProject && (
        <section className="project-context-strip">
          <div className="project-context-main">
            <span className="label">Focus Project</span>
            <div className="project-context-row">
              <strong>{focusProject.name}</strong>
              <span className={`project-context-status project-context-status-${focusProject.status}`}>{focusProject.status}</span>
            </div>
            <p className="project-context-next">{projectContextPreview || 'No next action set.'}</p>
          </div>
          <button className="secondary-button" onClick={() => setContextExpanded((v) => !v)}>
            {contextExpanded ? 'Hide context' : 'Expand context'}
          </button>
          {contextExpanded && (
            <div className="project-context-expanded">
              <p><span className="label">Current State</span>{focusProject.currentState}</p>
              <p><span className="label">Next Action</span>{focusProject.nextAction}</p>
            </div>
          )}
        </section>
      )}

      <div className={`today-three-zone-layout upgraded${focusMode ? ' is-focus-mode' : ''}`}>
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

            {scheduleBlocks.length === 0 && recommendedBlocks.length > 0 && (
              <SectionCard title="Suggested Timeline" variant="primary">
                <div className="timeline-list">
                  {recommendedBlocks.map((block) => (
                    <SuggestedTimelineBlock
                      key={block.id}
                      block={block}
                      onConfirm={() => onConfirmSuggestion(block)}
                      onDismiss={() => onDismissSuggestion(block)}
                    />
                  ))}
                </div>
              </SectionCard>
            )}
          </div>
        </aside>

        <section className="today-zone execution-zone">
          {!focusMode && (
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

          <section className="active-now-panel">
            <div className="active-now-header">
              <span className="label">Active Now</span>
              <div className="active-now-meta">
                <span>{activeNowMeta}</span>
                <strong className="active-now-time">{activeBlock ? timerDisplay : '--:--'}</strong>
              </div>
            </div>
            <h1 className="active-now-title">{activeNowTitle}</h1>
            <p className="active-now-budget">{sessionBudgetText}</p>
            <div className="focus-progress-bar compact">
              <div className="focus-progress-fill" style={{ width: `${activeBlock ? timerProgress : 0}%` }} />
            </div>
            <div className="day-progress-row">
              <span className="label">Day Progress</span>
              <span className="day-progress-value">{dayProgress}%</span>
            </div>
            <div className="day-progress-bar" aria-label="Day progress">
              <div className="day-progress-fill" style={{ width: `${dayProgress}%` }} />
            </div>
            <div className="active-now-controls">
              {focusMode ? (
                <button className="secondary-button" onClick={onExitFocus}>Exit Focus</button>
              ) : (
                <button className="primary-action-button" onClick={onStartBlock}>Start Block</button>
              )}
            </div>
          </section>

          <div className="today-column-scroll center-column-scroll">
            {taskEnginePanel || null}
          </div>
        </section>

        <aside className="today-zone intelligence-zone secondary-zone">
          <div className="today-column-scroll right-column-scroll">
            {quickLogPanel || null}
            <BlockSummaryPanel currentBlock={currentBlock} nextBlock={nextBlock} />
            {aureonPanel || null}
            {dayConstraintsPanel || null}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default TodayPage;
