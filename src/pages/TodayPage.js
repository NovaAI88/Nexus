import PageContainer from '../components/PageContainer';
import PrimaryActionPanel from '../components/PrimaryActionPanel';
import TimelinePanel from '../components/TimelinePanel';
import TodayPanel from '../components/TodayPanel';
import DoneTodayPanel from '../components/DoneTodayPanel';
import RecommendationsPanel from '../components/RecommendationsPanel';
import WeeklyPriorityPanel from '../components/WeeklyPriorityPanel';
import PhaseProgressPanel from '../components/PhaseProgressPanel';
import BlockSummaryPanel from '../components/BlockSummaryPanel';

function TodayPage({
  page,
  primaryAction,
  tracking,
  date,
  activeTasks,
  doneTasks,
  onToggleTask,
  onMoveTask,
  onStartNowTask,
  onScheduleTask,
  onCompleteTask,
  taskFeedback,
  scheduleBlocks,
  currentTime,
  currentBlock,
  nextBlock,
  activeBlock,
  recommendationCategories,
  selectedRecommendationCategory,
  recommendationOptions,
  laterRecommendationOptions,
  recommendationFeedback,
  onSelectRecommendationCategory,
  onAdjustRecommendationDuration,
  onStartNowRecommendation,
  onAcceptRecommendation,
  onDeclineRecommendation,
  onPostponeRecommendation,
  focusMode,
  activeTask,
  timerDisplay,
  timerProgress,
  onStartBlock,
  onAddBlock,
  onSelectTask,
  onExitFocus,
  onExtendActiveBlock,
  onCompleteActiveTask,
}) {
  const activeNowTitle = activeTask?.title || activeBlock?.label || 'No active block';
  const activeNowMeta = activeBlock ? `${activeBlock.start}–${activeBlock.end}` : 'Start or schedule a block';
  const activeNowSub = activeTask && activeBlock
    ? `Linked to ${activeBlock.label}`
    : activeBlock && !activeTask
      ? 'Block active without linked task'
      : 'No task or block is active right now';

  return (
    <PageContainer
      title={page.title}
      subtitle={page.subtitle}
      date={date}
      primaryAction={<PrimaryActionPanel {...primaryAction} onStartBlock={onStartBlock} />}
    >
      <div className={focusMode ? 'today-three-zone-layout upgraded is-focus-mode' : 'today-three-zone-layout upgraded'}>
        <div className="today-zone timeline-zone">
          <TimelinePanel
            blocks={scheduleBlocks}
            currentTime={currentTime}
            currentBlockId={currentBlock?.id}
            nextBlockId={nextBlock?.id}
            onAddBlock={onAddBlock}
          />
        </div>

        <div className="today-zone work-zone execution-zone">
          <section className="active-now-panel">
            <span className="label">Active Now</span>
            <div className="active-now-title">{activeNowTitle}</div>
            <div className="active-now-meta">
              <span>{activeNowMeta}</span>
              <span>{activeBlock ? timerDisplay : '--:--'}</span>
            </div>
            <div className="active-now-subtext">{activeNowSub}</div>
            <div className="focus-progress-bar compact">
              <div className="focus-progress-fill" style={{ width: `${activeBlock ? timerProgress : 0}%` }} />
            </div>
            <div className="active-now-controls">
              <button className="secondary-button" onClick={onExitFocus}>Stop / Exit</button>
              <button className="secondary-button" onClick={onExtendActiveBlock} disabled={!activeBlock}>Extend</button>
              <button className="primary-action-button" onClick={onCompleteActiveTask} disabled={!activeTask}>Complete Task</button>
            </div>
          </section>

          {focusMode ? (
            <section className="focus-work-panel">
              <span className="label">Current Block</span>
              <div className="focus-block-line">
                <strong>{currentBlock ? currentBlock.label : 'No active block'}</strong>
                <span>{currentBlock ? `${currentBlock.start}–${currentBlock.end}` : '--:--'}</span>
              </div>
              <div className="focus-timer">{activeBlock ? timerDisplay : '00:00'}</div>
              <div className="focus-progress-bar">
                <div className="focus-progress-fill" style={{ width: `${activeBlock ? timerProgress : 0}%` }} />
              </div>
              <div className="panel-group">
                <h3>Active Task</h3>
                <p>{activeTask ? activeTask.title : activeBlock ? 'No linked task for this block.' : 'No active task selected.'}</p>
              </div>
              <div className="focus-controls">
                <button className="primary-action-button" onClick={onCompleteActiveTask} disabled={!activeTask}>
                  Complete Task
                </button>
                <button className="secondary-button" onClick={onExitFocus}>
                  Exit Focus
                </button>
              </div>
            </section>
          ) : (
            <TodayPanel
              tasks={activeTasks}
              focusBlocks={page.focusBlocks}
              onToggleTask={onToggleTask}
              onMoveTask={onMoveTask}
              onStartNowTask={onStartNowTask}
              onScheduleTask={onScheduleTask}
              onCompleteTask={onCompleteTask}
              taskFeedback={taskFeedback}
              onSelectTask={onSelectTask}
              activeTaskId={activeTask?.id}
            />
          )}
        </div>

        <div className="today-zone intelligence-zone secondary-zone">
          {!focusMode ? (
            <RecommendationsPanel
              categories={recommendationCategories}
              selectedCategory={selectedRecommendationCategory}
              onSelectCategory={onSelectRecommendationCategory}
              options={recommendationOptions}
              laterOptions={laterRecommendationOptions}
              feedbackById={recommendationFeedback}
              onAdjustDuration={onAdjustRecommendationDuration}
              onStartNow={onStartNowRecommendation}
              onAccept={onAcceptRecommendation}
              onDecline={onDeclineRecommendation}
              onPostpone={onPostponeRecommendation}
            />
          ) : null}
          <DoneTodayPanel items={doneTasks} onToggleTask={onToggleTask} />
          {!focusMode ? <WeeklyPriorityPanel priority={primaryAction.weeklyPriority} outcomes={[]} /> : null}
          {!focusMode ? <PhaseProgressPanel {...tracking.phaseProgress} /> : null}
          {!focusMode ? <BlockSummaryPanel currentBlock={currentBlock} nextBlock={nextBlock} /> : null}
        </div>
      </div>
    </PageContainer>
  );
}

export default TodayPage;
