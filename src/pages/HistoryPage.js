import PageContainer from '../components/PageContainer';
import HistoryPanel from '../components/HistoryPanel';

function HistoryPage({ page, date, completedHistory }) {
  return (
    <PageContainer title={page.title} subtitle={page.subtitle} date={date} primaryAction={null}>
      <div className="page-grid single-column">
        <HistoryPanel historyByDate={completedHistory} />
      </div>
    </PageContainer>
  );
}

export default HistoryPage;
