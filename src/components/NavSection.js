import NavItem from './NavItem';

function NavSection({ title, items, activePage, onNavigate }) {
  return (
    <div className="nav-section">
      <div className="nav-section-title">{title}</div>
      <div className="nav-items">
        {items.map((item) => (
          <NavItem
            key={item.id}
            label={item.label}
            icon={item.icon}
            isActive={activePage === item.id}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default NavSection;
