import PageContainer from '../components/PageContainer';
import PrimaryActionPanel from '../components/PrimaryActionPanel';
import DepartmentStatusPanel from '../components/DepartmentStatusPanel';

function NexusDepartmentPage({ page, primaryAction, date }) {
  return (
    <PageContainer
      title={page.title}
      subtitle={page.subtitle}
      date={date}
      primaryAction={<PrimaryActionPanel {...primaryAction} />}
    >
      <div className="page-grid single-column">
        <DepartmentStatusPanel
          focus={page.focus}
          phase={page.phase}
          nextActions={page.nextActions}
          done={page.done}
        />
      </div>
    </PageContainer>
  );
}

export default NexusDepartmentPage;
