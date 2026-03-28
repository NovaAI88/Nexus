import SectionCard from '../components/SectionCard';
import SessionStartPanel from '../components/SessionStartPanel';

const DEPT_COLORS = {
  nexus: '#6b7cff',
  hephaestus: '#22d3ee',
  xenon: '#a78bfa',
  aureon: '#34d399',
};

function DashboardPage({
  projects,
  departments,
  focusProjectId,
  getDepartment,
  todayTaskCount,
  doneTodayCount,
  onNavigate,
  logPanel,
  departmentQueue = [],
  engineReasoning,
}) {
  const focusProject = focusProjectId ? projects.find((p) => p.id === focusProjectId) : null;
  const department = focusProject ? getDepartment(focusProject.departmentId) : null;
  const activeProjects = projects.filter((p) => p.status === 'active');
  const pausedProjects = projects.filter((p) => p.status === 'paused');

  if (focusProject) {
    return (
      <div className="dashboard-shell">
        {departmentQueue.length > 0 && (
          <SectionCard title="Company State" variant="primary">
            <div className="dashboard-engine-reasoning">{engineReasoning}</div>
            <div className="dashboard-dept-grid">
              {departmentQueue.map((dept) => {
                const color = DEPT_COLORS[dept.id] ?? '#6b7cff';
                return (
                  <div
                    key={dept.id}
                    className={`dashboard-dept-card urgency-${dept.urgency}`}
                    style={{ '--dept-color': color }}
                  >
                    <div className="dashboard-dept-header">
                      <span className="dashboard-dept-name">{dept.name}</span>
                      <span className={`urgency-badge urgency-${dept.urgency}`}>{dept.urgency.toUpperCase()}</span>
                    </div>
                    <p className="dashboard-dept-phase">{dept.phase}</p>
                    <p className="dashboard-dept-next">{dept.nextAction}</p>
                    {dept.blockers?.length > 0 && (
                      <div className="dashboard-dept-blockers">
                        {dept.blockers.map((b, i) => <span key={i} className="blocker-tag">{b}</span>)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

        <SessionStartPanel
          focusProject={focusProject}
          department={department}
          todayTaskCount={todayTaskCount}
          doneTodayCount={doneTodayCount}
          onGoToToday={() => onNavigate('today')}
          onChangeFocus={() => {
            const deptPage = focusProject.departmentId === 'nexus'
              ? 'nexus-department'
              : focusProject.departmentId === 'xenon'
                ? 'xenon'
                : focusProject.departmentId === 'aureon'
                  ? 'aureon'
                  : 'hephaestus';
            onNavigate(deptPage);
          }}
          logPanel={logPanel}
        />

        <SectionCard title="Department Status" variant="muted">
          <div className="dashboard-department-strip">
            {departments.map((dept) => (
              <div key={dept.id} className="dashboard-department-chip">
                <span className={`status-dot status-dot-${dept.status}`} />
                <span>{dept.name}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      {departmentQueue.length > 0 && (
        <SectionCard title="Company State" variant="primary">
          <div className="dashboard-engine-reasoning">{engineReasoning}</div>
          <div className="dashboard-dept-grid">
            {departmentQueue.map((dept) => {
              const color = DEPT_COLORS[dept.id] ?? '#6b7cff';
              return (
                <div
                  key={dept.id}
                  className={`dashboard-dept-card urgency-${dept.urgency}`}
                  style={{ '--dept-color': color }}
                >
                  <div className="dashboard-dept-header">
                    <span className="dashboard-dept-name">{dept.name}</span>
                    <span className={`urgency-badge urgency-${dept.urgency}`}>{dept.urgency.toUpperCase()}</span>
                  </div>
                  <p className="dashboard-dept-phase">{dept.phase}</p>
                  <p className="dashboard-dept-next">{dept.nextAction}</p>
                  {dept.blockers?.length > 0 && (
                    <div className="dashboard-dept-blockers">
                      {dept.blockers.map((b, i) => <span key={i} className="blocker-tag">{b}</span>)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      <div className="dashboard-no-focus">
        <h1 className="dashboard-no-focus-title">No focus project set</h1>
        <p className="dashboard-no-focus-sub">
          Set a focus project to see your current state, next action, and session continuity here.
        </p>
      </div>

      {activeProjects.length > 0 && (
        <SectionCard title="Active Projects">
          <div className="dashboard-project-list">
            {activeProjects.map((p) => {
              const dept = getDepartment(p.departmentId);
              return (
                <div key={p.id} className="dashboard-project-row">
                  <div className="dashboard-project-info">
                    <span className="session-dept-label">{dept?.label ?? p.departmentId}</span>
                    <span className="dashboard-project-name">{p.name}</span>
                    <span className="project-status-badge project-status-active">ACTIVE</span>
                  </div>
                  <button
                    className="secondary-button"
                    onClick={() => {
                      const page = p.departmentId === 'nexus' ? 'nexus-department'
                        : p.departmentId === 'xenon' ? 'xenon'
                          : p.departmentId === 'aureon' ? 'aureon' : 'hephaestus';
                      onNavigate(page);
                    }}
                  >
                    View →
                  </button>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {pausedProjects.length > 0 && (
        <SectionCard title="Paused Projects">
          <div className="dashboard-project-list">
            {pausedProjects.map((p) => {
              const dept = getDepartment(p.departmentId);
              return (
                <div key={p.id} className="dashboard-project-row">
                  <div className="dashboard-project-info">
                    <span className="session-dept-label">{dept?.label ?? p.departmentId}</span>
                    <span className="dashboard-project-name">{p.name}</span>
                    <span className="project-status-badge project-status-paused">PAUSED</span>
                  </div>
                  <button
                    className="secondary-button"
                    onClick={() => {
                      const page = p.departmentId === 'nexus' ? 'nexus-department'
                        : p.departmentId === 'xenon' ? 'xenon'
                          : p.departmentId === 'aureon' ? 'aureon' : 'hephaestus';
                      onNavigate(page);
                    }}
                  >
                    View →
                  </button>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

export default DashboardPage;
