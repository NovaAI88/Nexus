import NavSection from './NavSection';
import ViewToggle from './ViewToggle';

function Sidebar({ navigation, activePage, viewMode, onNavigate, onViewChange }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <strong>Nexus</strong>
          <span>Command Center</span>
        </div>
        <NavSection
          title="Main"
          items={navigation.main}
          activePage={activePage}
          onNavigate={onNavigate}
        />
        <NavSection
          title="Departments"
          items={navigation.departments}
          activePage={activePage}
          onNavigate={onNavigate}
        />
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-footer-title">View</div>
        <ViewToggle
          options={navigation.viewModes}
          activeView={viewMode}
          onChange={onViewChange}
        />
      </div>
    </aside>
  );
}

export default Sidebar;
