import SectionCard from '../components/SectionCard';
import SessionStartPanel from '../components/SessionStartPanel';

/**
 * DashboardPage
 *
 * Improvement #1: live session start screen.
 * If a focus project is set: show SessionStartPanel (project state + next action + quick log).
 * If no focus project: show project cards as entry point to set one.
 *
 * Props:
 *   date              — 'YYYY-MM-DD'
 *   projects          — live project array
 *   departments       — live department array
 *   focusProjectId    — string | null
 *   getDepartment     — getDepartment(id) fn
 *   todayTaskCount    — number
 *   doneTodayCount    — number
 *   onNavigate        — navigate to page fn
 *   logPanel          — <QuickLogInput /> (rendered by App.js)
 */
function DashboardPage({
  date,
  projects,
  departments,
  focusProjectId,
  getDepartment,
  todayTaskCount,
  doneTodayCount,
  onNavigate,
  logPanel,
}) {
  const focusProject = focusProjectId ? projects.find((p) => p.id === focusProjectId) : null;
  const department = focusProject ? getDepartment(focusProject.departmentId) : null;

  // Projects by status for the "no focus" fallback
  const activeProjects = projects.filter((p) => p.status === 'active');
  const pausedProjects = projects.filter((p) => p.status === 'paused');

  if (focusProject) {
    return (
      <div className="dashboard-shell">
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
              : 'hephaestus';
            onNavigate(deptPage);
          }}
          logPanel={logPanel}
        />
      </div>
    );
  }

  // No focus project — show overview and nudge to set one
  return (
    <div className="dashboard-shell">
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
                        : p.departmentId === 'xenon' ? 'xenon' : 'hephaestus';
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
                        : p.departmentId === 'xenon' ? 'xenon' : 'hephaestus';
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

      {projects.length === 0 && (
        <SectionCard title="No Projects">
          <p>Navigate to a department to create your first project.</p>
        </SectionCard>
      )}
    </div>
  );
}

export default DashboardPage;
