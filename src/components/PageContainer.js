import HeaderBar from './HeaderBar';

function PageContainer({ title, subtitle, date, primaryAction, headerExtra, children }) {
  return (
    <div className="page-container">
      <HeaderBar title={title} subtitle={subtitle} date={date} extra={headerExtra} />
      {primaryAction}
      <div className="page-content">{children}</div>
    </div>
  );
}

export default PageContainer;
