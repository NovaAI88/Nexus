function NavItem({ label, icon, isActive, onClick }) {
  return (
    <button className={isActive ? 'nav-item active' : 'nav-item'} onClick={onClick}>
      <span className="nav-item-icon" aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

export default NavItem;
