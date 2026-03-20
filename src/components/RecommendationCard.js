function RecommendationCard({ option, feedback, onAdjustDuration, onStartNow, onAccept, onDecline, onPostpone }) {
  return (
    <div className="recommendation-card">
      <div className="recommendation-meta-row">
        <span className="recommendation-type">{option.groupLabel}</span>
        <span className="recommendation-size">{option.size}</span>
      </div>
      <strong>{option.title}</strong>
      <p>{option.description}</p>
      <div className="recommendation-details">
        <span>{option.selectedDuration} min</span>
        <span>{option.suggestedLabel || 'No slot yet'}</span>
      </div>
      <div className="recommendation-feedback">{feedback}</div>
      <div className="recommendation-duration-controls">
        <button className="recommendation-button" onClick={() => onAdjustDuration(option.id, -1)}>
          −
        </button>
        <span>{option.selectedDuration} min</span>
        <button className="recommendation-button" onClick={() => onAdjustDuration(option.id, 1)}>
          +
        </button>
      </div>
      <div className="recommendation-actions">
        <button className="recommendation-button primary" onClick={() => onStartNow(option.id)}>
          Start Now
        </button>
        <button className="recommendation-button accept" onClick={() => onAccept(option.id)}>
          Accept
        </button>
        <button className="recommendation-button" onClick={() => onPostpone(option.id)}>
          Postpone
        </button>
        <button className="recommendation-button decline" onClick={() => onDecline(option.id)}>
          Decline
        </button>
      </div>
    </div>
  );
}

export default RecommendationCard;
