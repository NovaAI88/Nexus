import PageContainer from '../components/PageContainer';
import PrimaryActionPanel from '../components/PrimaryActionPanel';
import SectionCard from '../components/SectionCard';
import BlockSummaryPanel from '../components/BlockSummaryPanel';

function DashboardPage({ dashboard, primaryAction, date, viewMode, currentBlock, nextBlock, openRecommendation, weeklyGoal, keyStatus }) {
  return (
    <PageContainer
      title="Dashboard"
      subtitle={`Executive overview · ${viewMode === 'focus' ? 'Focus Mode' : 'Full Overview'}`}
      date={date}
      primaryAction={<PrimaryActionPanel {...primaryAction} onStartBlock={() => {}} />}
    >
      <div className="page-grid two-column dashboard-summary-grid">
        <BlockSummaryPanel currentBlock={currentBlock} nextBlock={nextBlock} />
        <SectionCard title="Energy / Load Snapshot">
          <p>{dashboard.energyLoad}</p>
        </SectionCard>
        <SectionCard title="Top Recommendation">
          <p>{openRecommendation ? `${openRecommendation.title} · ${openRecommendation.selectedDuration} min` : 'No recommendation right now.'}</p>
        </SectionCard>
        <SectionCard title="Weekly Goal">
          <p>{weeklyGoal}</p>
        </SectionCard>
        <SectionCard title="Key Status">
          <p>{keyStatus}</p>
        </SectionCard>
      </div>
    </PageContainer>
  );
}

export default DashboardPage;
