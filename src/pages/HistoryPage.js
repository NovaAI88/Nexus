import { useMemo, useState } from 'react';
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
  const [projectFilter, setProjectFilter] = useState('all');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  const formatTime = (iso) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const projectOptions = useMemo(() => {
    const ids = new Set();
    activityLog.forEach((entry) => {
      if (entry.projectId) ids.add(entry.projectId);
    });
    doneTasks.forEach((task) => {
      if (task.projectId) ids.add(task.projectId);
    });
    return ['all', ...Array.from(ids)];
  }, [activityLog, doneTasks]);

  const filteredLog = useMemo(() => {
    const base = activityLog.slice(0, 100);
    if (projectFilter === 'all') return base;
    return base.filter((entry) => entry.projectId === projectFilter);
  }, [activityLog, projectFilter]);

  const groupedLog = useMemo(() => {
    return filteredLog.reduce((acc, entry) => {
      const day = String(entry.timestamp).slice(0, 10);
      if (!acc[day]) acc[day] = [];
      acc[day].push(entry);
      return acc;
    }, {});
  }, [filteredLog]);

  const groupedDays = Object.keys(groupedLog).sort((a, b) => (a < b ? 1 : -1));

  return (
    <PageContainer title="History" subtitle="Activity log + completed tasks" date={date} primaryAction={null}>
      <div className="page-grid single-column">

        <SectionCard title="Filters" variant="muted">
          <div className="history-filters-row">
            <label className="label" htmlFor="history-project-filter">Project</label>
            <select
              id="history-project-filter"
              className="history-project-filter"
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
            >
              {projectOptions.map((projectId) => (
                <option key={projectId} value={projectId}>
                  {projectId === 'all' ? 'All projects' : projectId}
                </option>
              ))}
            </select>
          </div>
        </SectionCard>

        {groupedDays.length > 0 && (
          <SectionCard title={`Activity Log (${filteredLog.length})`}>
            <div className="history-log-list">
              {groupedDays.map((day) => (
                <div key={day} className="history-date-group">
                  <div className="history-date-title">{day}</div>
                  {groupedLog[day].map((entry) => (
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
              ))}
            </div>
          </SectionCard>
        )}

        {doneTasks.length > 0 && (
          <SectionCard title={`Completed Tasks (${doneTasks.length})`} variant="muted">
            <div className="history-done-list">
              {doneTasks.slice(0, 30).map((t) => (
                <div key={t.id} className="history-done-row">
                  <span className="history-done-check">✓</span>
                  <span className="history-done-title">{t.title}</span>
                  <span className="history-done-time">
                    {t.completedAt ? formatTime(t.completedAt) : '—'}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {groupedDays.length === 0 && doneTasks.length === 0 && (
          <SectionCard title="Nothing yet">
            <p>Log something or complete a task to see history here.</p>
          </SectionCard>
        )}

      </div>
    </PageContainer>
  );
}

export default HistoryPage;
