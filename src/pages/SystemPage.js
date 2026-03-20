import PageContainer from '../components/PageContainer';
import SectionCard from '../components/SectionCard';
import ControlStatusPanel from '../components/ControlStatusPanel';
import PhaseProgressPanel from '../components/PhaseProgressPanel';

function SystemPage({ page, tracking, primaryAction, date, activePage, viewMode }) {
  return (
    <PageContainer
      title={page.title}
      subtitle={page.subtitle}
      date={date}
      primaryAction={null}
    >
      <div className="page-grid two-column">
        <SectionCard title="System State">
          <div className="status-list">
            <div><span className="label">Current Mode</span><strong>{primaryAction.mode}</strong></div>
            <div><span className="label">View Mode</span><strong>{viewMode === 'focus' ? 'Focus Mode' : 'Full Overview'}</strong></div>
            <div><span className="label">Active Page</span><strong>{activePage}</strong></div>
            <div><span className="label">Health</span><strong>{page.health}</strong></div>
            <div><span className="label">Sync</span><strong>{page.sync}</strong></div>
          </div>
        </SectionCard>
        <PhaseProgressPanel {...tracking.phaseProgress} />
        <ControlStatusPanel {...tracking.controlStatus} />
      </div>
    </PageContainer>
  );
}

export default SystemPage;
