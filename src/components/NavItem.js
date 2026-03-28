function NavItem({ label, icon, isActive, active, onClick }) {
  const isCurrent = typeof active === 'boolean' ? active : isActive;
  return (
    <button className={isCurrent ? 'nav-item active' : 'nav-item'} onClick={onClick}>
      <span className="nav-item-icon" aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

export default NavItem;
