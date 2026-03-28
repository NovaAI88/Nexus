import { useState, useEffect } from 'react';
import PageContainer from '../components/PageContainer';
import SectionCard from '../components/SectionCard';

const DEPT_COLORS = {
  nexus: '#6b7cff',
  hephaestus: '#22d3ee',
  xenon: '#a78bfa',
  aureon: '#34d399',
};

const DEPT_DURATIONS = { nexus: 60, hephaestus: 90, xenon: 45, aureon: 45 };

function WeeklyPage({ date, projects, focusProjectId, departmentQueue = [], engineReasoning, addPlannerBlock }) {
  const [weeklyIntent, setWeeklyIntent] = useState('');
  const [addedDepts, setAddedDepts] = useState(new Set());

  useEffect(() => {
    setWeeklyIntent(window.localStorage.getItem('nexus:weekly-intent') || '');
  }, []);

  useEffect(() => {
    window.localStorage.setItem('nexus:weekly-intent', weeklyIntent);
  }, [weeklyIntent]);

  function handleAddToToday(dept) {
    const duration = DEPT_DURATIONS[dept.id] ?? 60;
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = Math.ceil(nowMinutes / 30) * 30;
    const start = `${String(Math.floor(startMinutes / 60)).padStart(2, '0')}:${String(startMinutes % 60).padStart(2, '0')}`;
    const endMinutes = startMinutes + duration;
    const end = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

    addPlannerBlock(date, {
      type: 'work',
      label: dept.nextAction || dept.name,
      start,
      end,
    });
    setAddedDepts((s) => new Set([...s, dept.id]));
  }

  const urgencyOrder = { critical: 0, high: 1, normal: 2, low: 3 };

  return (
    <PageContainer title="Weekly" subtitle="Plan across all departments" date={date} primaryAction={null}>
      <div className="page-grid weekly-grid">
        <div className="weekly-left">
          {engineReasoning && (
            <div className="weekly-engine-reasoning">
              <span className="label">System Reasoning</span>
              <p>{engineReasoning}</p>
            </div>
          )}

          <SectionCard title="Department Priority" variant="primary">
            <div className="weekly-dept-list">
              {departmentQueue.length === 0 && (
                <p className="weekly-empty">No department data. Configure state in each department page.</p>
              )}
              {[...departmentQueue]
                .sort((a, b) => (urgencyOrder[a.urgency] ?? 2) - (urgencyOrder[b.urgency] ?? 2))
                .map((dept) => {
                  const color = DEPT_COLORS[dept.id] ?? '#6b7cff';
                  const added = addedDepts.has(dept.id);
                  return (
                    <div
                      key={dept.id}
                      className={`weekly-dept-row urgency-${dept.urgency}`}
                      style={{ '--dept-color': color }}
                    >
                      <div className="weekly-dept-identity">
                        <div className="weekly-dept-name-row">
                          <span className="weekly-dept-color-dot" />
                          <strong>{dept.name}</strong>
                          <span className={`urgency-badge urgency-${dept.urgency}`}>
                            {dept.urgency.toUpperCase()}
                          </span>
                          {dept.blockers?.length > 0 && (
                            <span className="blocker-badge">BLOCKED</span>
                          )}
                        </div>
                        <p className="weekly-dept-phase">{dept.phase}</p>
                        <p className="weekly-dept-next">{dept.nextAction}</p>
                        {dept.blockers?.length > 0 && (
                          <p className="weekly-dept-blockers">
                            Blockers: {dept.blockers.join(', ')}
                          </p>
                        )}
                      </div>
                      <button
                        className={`weekly-add-today-btn ${added ? 'is-added' : ''}`}
                        onClick={() => handleAddToToday(dept)}
                        disabled={added}
                      >
                        {added ? 'Added ✓' : 'Add to Today'}
                      </button>
                    </div>
                  );
                })}
            </div>
          </SectionCard>
        </div>

        <div className="weekly-right">
          <SectionCard title="Weekly Intent" variant="primary">
            <textarea
              className="weekly-intent-input"
              placeholder="Define the one intent that should guide this week..."
              value={weeklyIntent}
              onChange={(e) => setWeeklyIntent(e.target.value)}
            />
          </SectionCard>

          <SectionCard title="Project Progress" variant="muted">
            <div className="weekly-progress-row">
              <span>{projects.filter((p) => p.status === 'completed').length} / {projects.length} projects complete</span>
            </div>
            <div className="weekly-progress-bar">
              <div
                className="weekly-progress-fill"
                style={{ width: `${projects.length ? Math.round((projects.filter((p) => p.status === 'completed').length / projects.length) * 100) : 0}%` }}
              />
            </div>
          </SectionCard>
        </div>
      </div>
    </PageContainer>
  );
}

export default WeeklyPage;
