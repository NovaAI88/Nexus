import { useState } from 'react';
import ProjectCard from '../components/ProjectCard';

const DEPT_COLORS = {
  nexus: '#6b7cff',
  hephaestus: '#22d3ee',
  xenon: '#a78bfa',
  aureon: '#34d399',
};

/**
 * CompanyPage — Unified intelligence hub.
 *
 * Replaces Dashboard + all 4 department pages.
 * Shows every department, its projects, status, and what to work on next.
 */
function CompanyPage({
  projects,
  departments,
  getDepartment,
  updateProject,
  focusProjectId,
  setFocusProject,
  departmentQueue = [],
  engineReasoning,
  onNavigate,
  date,
}) {
  const [expandedDept, setExpandedDept] = useState(null);

  const toggleDept = (id) => setExpandedDept((cur) => (cur === id ? null : id));

  return (
    <div className="company-page">
      <header className="company-header">
        <div>
          <h1 className="company-title">Company</h1>
          <p className="company-subtitle">All departments at a glance</p>
        </div>
        <span className="company-date">{date}</span>
      </header>

      {engineReasoning && (
        <div className="company-reasoning">
          <span className="company-reasoning-dot" />
          <span>{engineReasoning}</span>
        </div>
      )}

      <div className="company-dept-list">
        {departmentQueue.map((dept) => {
          const color = DEPT_COLORS[dept.id] ?? '#6b7cff';
          const deptProjects = projects.filter((p) => p.departmentId === dept.id);
          const isExpanded = expandedDept === dept.id;

          return (
            <div
              key={dept.id}
              className={`company-dept${isExpanded ? ' is-expanded' : ''}`}
              style={{ '--dept-color': color }}
            >
              <button
                className="company-dept-row"
                onClick={() => toggleDept(dept.id)}
              >
                <div className="company-dept-identity">
                  <span className="company-dept-color-dot" />
                  <span className="company-dept-name">{dept.name}</span>
                  <span className={`urgency-badge urgency-${dept.urgency}`}>
                    {dept.urgency?.toUpperCase()}
                  </span>
                </div>
                <div className="company-dept-summary">
                  <span className="company-dept-phase">{dept.phase}</span>
                  <span className="company-dept-chevron">{isExpanded ? '−' : '+'}</span>
                </div>
              </button>

              <p className="company-dept-next">{dept.nextAction}</p>

              {dept.blockers?.length > 0 && (
                <div className="company-dept-blockers">
                  {dept.blockers.map((b, i) => (
                    <span key={i} className="blocker-tag">{b}</span>
                  ))}
                </div>
              )}

              {isExpanded && (
                <div className="company-dept-projects">
                  {deptProjects.length > 0 ? (
                    deptProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        departmentLabel={getDepartment(project.departmentId)?.label ?? dept.name}
                        updateProject={updateProject}
                        isFocus={focusProjectId === project.id}
                        setFocusProject={setFocusProject}
                      />
                    ))
                  ) : (
                    <p className="company-dept-empty">No projects in this department.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {departmentQueue.length === 0 && (
          <div className="company-empty">
            <p>No department data available. Company state will appear here once initialized.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CompanyPage;
