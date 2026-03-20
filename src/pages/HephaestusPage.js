import PageContainer from '../components/PageContainer';
import DepartmentStatusPanel from '../components/DepartmentStatusPanel';

function HephaestusPage({ page, date }) {
  return (
    <PageContainer title={page.title} subtitle={page.subtitle} date={date} primaryAction={null}>
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

export default HephaestusPage;
