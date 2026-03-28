import NavSection from './NavSection';

function Sidebar({ navigation, activePage, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-top">

        <div className="sidebar-brand">
          <div className="sidebar-brand-wordmark">
            <span className="sidebar-brand-dot" />
            <strong>NEXUS</strong>
          </div>
          <span className="sidebar-brand-subtitle">Life & Work OS</span>
        </div>

        <NavSection
          items={navigation.main}
          activePage={activePage}
          onNavigate={onNavigate}
        />

      </div>

      <div className="sidebar-footer">
        <div className="sidebar-status-pill">
          <span className="sidebar-status-dot" />
          <span className="sidebar-status-text">All systems operational</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
