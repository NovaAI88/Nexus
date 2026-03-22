import PageContainer from '../components/PageContainer';
import SectionCard from '../components/SectionCard';
import ProjectCard from '../components/ProjectCard';

/**
 * DepartmentPage
 *
 * Live replacement for the three static department pages
 * (NexusDepartmentPage, HephaestusPage, XenonPage).
 *
 * Phase 3: reads live project + department state.
 * Phase 4: projects are editable via ProjectCard (currentState + nextAction).
 * Phase 5: status controls, priority controls, focus project selection.
 *
 * Falls back to nexusData static page props if live data is unavailable.
 *
 * Props:
 *   departmentId     — id matching a Department in useDepartments
 *   departments      — live department array from useDepartments
 *   projects         — live project array from useProjects
 *   getDepartment    — getDepartment(id) helper from useDepartments
 *   updateProject    — updateProject(id, updates) helper from useProjects
 *   focusProjectId   — currently focused project id (or null)
 *   setFocusProject  — setFocusProject(id) from useFocusProject
 *   date             — current date string
 *   fallbackPage     — static nexusData.pages.departments.* object (legacy fallback)
 */
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

  const title = department?.name ?? fallbackPage?.title ?? departmentId;
  const subtitle = department?.description ?? fallbackPage?.subtitle ?? '';
  const departmentLabel = department?.label ?? title;

  return (
    <PageContainer title={title} subtitle={subtitle} date={date} primaryAction={null}>
      <div className="page-grid single-column">

        {/* Department overview */}
        <SectionCard title="Department">
          <div className="status-list">
            <div>
              <span className="label">Label</span>
              <strong>{departmentLabel}</strong>
            </div>
            <div>
              <span className="label">Status</span>
              <strong>{department?.status ?? '—'}</strong>
            </div>
            <div>
              <span className="label">Projects</span>
              <strong>{deptProjects.length > 0 ? deptProjects.map((p) => p.name).join(', ') : '—'}</strong>
            </div>
          </div>
        </SectionCard>

        {/* Live project cards — editable */}
        {deptProjects.length > 0 ? (
          deptProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              departmentLabel={departmentLabel}
              updateProject={updateProject}
              isFocus={focusProjectId === project.id}
              setFocusProject={setFocusProject}
            />
          ))
        ) : (
          /* No live projects — fall back to legacy static content */
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
            {fallbackPage?.done?.length > 0 && (
              <div className="panel-group">
                <h3>Done</h3>
                <ul>{fallbackPage.done.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            )}
          </SectionCard>
        )}

      </div>
    </PageContainer>
  );
}

export default DepartmentPage;
