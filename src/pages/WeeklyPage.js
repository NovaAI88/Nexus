import PageContainer from '../components/PageContainer';
import PrimaryActionPanel from '../components/PrimaryActionPanel';
import WeeklyPriorityPanel from '../components/WeeklyPriorityPanel';
import WeekPlanPanel from '../components/WeekPlanPanel';
import PhaseProgressPanel from '../components/PhaseProgressPanel';
import SectionCard from '../components/SectionCard';

function groupWeeklyTasksByDay(weeklyTasks) {
  return weeklyTasks.reduce((accumulator, task) => {
    if (!accumulator[task.plannedDay]) {
      accumulator[task.plannedDay] = [];
    }
    accumulator[task.plannedDay].push(task);
    return accumulator;
  }, {});
}

function WeeklyPage({ page, primaryAction, tracking, date, weeklyTasks }) {
  const groupedTasks = groupWeeklyTasksByDay(weeklyTasks);
  const plannedDays = Object.keys(groupedTasks).sort();

  return (
    <PageContainer
      title={page.title}
      subtitle={page.subtitle}
      date={date}
      primaryAction={<PrimaryActionPanel {...primaryAction} onStartBlock={() => {}} />}
    >
      <div className="page-grid two-column">
        <WeeklyPriorityPanel priority={page.priority} outcomes={page.outcomes} />
        <WeekPlanPanel
          work={page.weekPlan.work}
          gym={page.weekPlan.gym}
          rest={page.weekPlan.rest}
        />
        <SectionCard title="Planned Tasks by Day">
          {plannedDays.length > 0 ? (
            <div className="weekly-groups">
              {plannedDays.map((day) => (
                <div key={day} className="weekly-group">
                  <h3>{day}</h3>
                  <ul>
                    {groupedTasks[day].map((task) => (
                      <li key={task.id}>{task.title} · {task.status}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p>No weekly tasks planned.</p>
          )}
        </SectionCard>
        <PhaseProgressPanel {...tracking.phaseProgress} />
      </div>
    </PageContainer>
  );
}

export default WeeklyPage;
