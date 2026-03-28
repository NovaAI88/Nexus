import PageContainer from '../components/PageContainer';
import SectionCard from '../components/SectionCard';
import ProjectCard from '../components/ProjectCard';

const DEPT_COLORS = {
  nexus: '#6b7cff',
  hephaestus: '#22d3ee',
  xenon: '#a78bfa',
  aureon: '#34d399',
};

function DepartmentPage({
  departmentId,
  departments,
  projects,
  getDepartment,
  updateProject,
  focusProjectId,
  setFocusProject,
  date,
  fallbackPage,
}) {
  const department = getDepartment(departmentId);
  const deptProjects = projects.filter((p) => p.departmentId === departmentId);
  const color = DEPT_COLORS[departmentId] ?? '#6b7cff';

  const title = department?.name ?? fallbackPage?.title ?? departmentId;
  const subtitle = department?.description ?? fallbackPage?.subtitle ?? '';

  return (
    <PageContainer title="" subtitle="" date={date} primaryAction={null}>
      <div className="page-grid single-column">

        {/* Premium department header */}
        <div className="dept-header-card" style={{ '--dept-color': color }}>
          <div className="dept-header-identity">
            <div className="dept-header-color-bar" />
            <div className="dept-header-text">
              <h1 className="dept-header-name">{title}</h1>
              {subtitle && <p className="dept-header-subtitle">{subtitle}</p>}
            </div>
          </div>
          <div className="dept-header-meta">
            {department?.status && (
              <span className={`project-status-badge project-status-${department.status}`}>
                {department.status.toUpperCase()}
              </span>
            )}
            <span className="dept-header-project-count">
              {deptProjects.length} project{deptProjects.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Live project cards — editable */}
        {deptProjects.length > 0 ? (
          deptProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              departmentLabel={department?.label ?? title}
              updateProject={updateProject}
              isFocus={focusProjectId === project.id}
              setFocusProject={setFocusProject}
            />
          ))
        ) : (
          <SectionCard title="Status">
            <div className="status-list">
              <div><span className="label">Focus</span><strong>{fallbackPage?.focus ?? '—'}</strong></div>
              <div><span className="label">Phase</span><strong>{fallbackPage?.phase ?? '—'}</strong></div>
            </div>
            {fallbackPage?.nextActions?.length > 0 && (
              <div className="panel-group">
                <h3>Next Actions</h3>
                <ul>{fallbackPage.nextActions.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            )}
          </SectionCard>
        )}

      </div>
    </PageContainer>
  );
}

export default DepartmentPage;
