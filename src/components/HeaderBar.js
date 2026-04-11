function HeaderBar({ title, subtitle, date, extra }) {
  return (
    <header className="header-bar">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {extra}
        <div className="header-date">{date}</div>
      </div>
    </header>
  );
}

export default HeaderBar;
