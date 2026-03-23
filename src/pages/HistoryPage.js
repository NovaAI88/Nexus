import PageContainer from '../components/PageContainer';
import SectionCard from '../components/SectionCard';

const TYPE_ICONS = { experiment: '⚗', decision: '◆', progress: '✓', note: '·' };

/**
 * HistoryPage — Phase 8.75 (live activity log + tasks)
 *
 * Props:
 *   date         — 'YYYY-MM-DD'
 *   activityLog  — LogEntry[] from useActivityLog
 *   tasks        — Task[] from useTaskEngine
 */
function HistoryPage({ date, activityLog, tasks }) {
  const doneTasks = tasks.filter((t) => t.status === 'done');
  const recentLog = activityLog.slice(0, 50);

  const formatTime = (iso) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <PageContainer title="History" subtitle="Activity log + completed tasks" date={date} primaryAction={null}>
      <div className="page-grid single-column">

        {recentLog.length > 0 && (
          <SectionCard title="Activity Log (recent 50)">
            <div className="history-log-list">
              {recentLog.map((entry) => (
                <div key={entry.id} className={`history-log-entry history-log-${entry.type}`}>
                  <span className="history-log-icon">{TYPE_ICONS[entry.type] ?? '·'}</span>
                  <span className="history-log-text">{entry.text}</span>
                  <span className="history-log-time">{formatTime(entry.timestamp)}</span>
                  {entry.projectId && (
                    <span className="history-log-project">{entry.projectId}</span>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {doneTasks.length > 0 && (
          <SectionCard title={`Completed Tasks (${doneTasks.length})`}>
            <div className="status-list">
              {doneTasks.slice(0, 30).map((t) => (
                <div key={t.id}>
                  <span className="label">{t.completedAt ? formatTime(t.completedAt) : '—'}</span>
                  <strong>{t.title}</strong>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {recentLog.length === 0 && doneTasks.length === 0 && (
          <SectionCard title="Nothing yet">
            <p>Log something or complete a task to see history here.</p>
          </SectionCard>
        )}

      </div>
    </PageContainer>
  );
}

export default HistoryPage;
