import PageContainer from '../components/PageContainer';
import SectionCard from '../components/SectionCard';

/**
 * WeeklyPage — Phase 8.75 (minimal update, live data)
 *
 * Props:
 *   date           — 'YYYY-MM-DD'
 *   projects       — live project array
 *   focusProjectId — string | null
 */
function WeeklyPage({ date, projects, focusProjectId }) {
  const focusProject = focusProjectId ? projects.find((p) => p.id === focusProjectId) : null;
  const activeProjects = projects.filter((p) => p.status === 'active');

  return (
    <PageContainer title="Weekly" subtitle="Project focus for the week" date={date} primaryAction={null}>
      <div className="page-grid single-column">

        {focusProject && (
          <SectionCard title="Focus This Week">
            <div className="status-list">
              <div>
                <span className="label">Project</span>
                <strong>{focusProject.name} — {focusProject.phase}</strong>
              </div>
              <div>
                <span className="label">Next Action</span>
                <strong>{focusProject.nextAction}</strong>
              </div>
            </div>
          </SectionCard>
        )}

        {activeProjects.length > 0 && (
          <SectionCard title="Active Projects">
            <div className="status-list">
              {activeProjects.map((p) => (
                <div key={p.id}>
                  <span className="label">{p.name}</span>
                  <strong>{p.nextAction}</strong>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {!focusProject && activeProjects.length === 0 && (
          <SectionCard title="No active projects">
            <p>Set a project to active on its department page.</p>
          </SectionCard>
        )}

      </div>
    </PageContainer>
  );
}

export default WeeklyPage;
