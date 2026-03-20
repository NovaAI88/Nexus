function HeaderBar({ title, subtitle, date }) {
  return (
    <header className="header-bar">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="header-date">{date}</div>
    </header>
  );
}

export default HeaderBar;
