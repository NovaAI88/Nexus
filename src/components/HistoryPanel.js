import SectionCard from './SectionCard';

function HistoryPanel({ historyByDate }) {
  const dates = Object.keys(historyByDate).sort((a, b) => (a < b ? 1 : -1));

  return (
    <SectionCard title="Completed History">
      {dates.length > 0 ? (
        <div className="history-groups">
          {dates.map((date) => (
            <div key={date} className="history-group">
              <h3>{date}</h3>
              <ul>
                {historyByDate[date].map((entry) => (
                  <li key={entry.id}>
                    <strong>{entry.title}</strong>
                    <span className="history-meta">
                      {entry.startedAt || '--:--'} → {entry.completedAt || '--:--'}
                      {entry.durationMinutes ? ` · ${entry.durationMinutes} min` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p>No completed history yet.</p>
      )}
    </SectionCard>
  );
}

export default HistoryPanel;
