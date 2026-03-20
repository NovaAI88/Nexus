import HeaderBar from './HeaderBar';

function PageContainer({ title, subtitle, date, primaryAction, children }) {
  return (
    <div className="page-container">
      <HeaderBar title={title} subtitle={subtitle} date={date} />
      {primaryAction}
      <div className="page-content">{children}</div>
    </div>
  );
}

export default PageContainer;
