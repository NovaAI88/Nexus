import { useState, useEffect } from 'react';

function getAgeLabel(timestamp) {
  if (!timestamp) return null;
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getFreshnessLevel(timestamp) {
  if (!timestamp) return 'fresh';
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const mins = diffMs / 60000;
  if (mins > 60) return 'critical';
  if (mins > 30) return 'stale';
  return 'fresh';
}

function FreshnessBadge({ lastFetched, onRefresh }) {
  const [, setTick] = useState(0);

  // Re-render every 60s to update the label
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  if (!lastFetched) return null;

  const label = getAgeLabel(lastFetched);
  const level = getFreshnessLevel(lastFetched);

  return (
    <button className="freshness-badge" onClick={onRefresh} title="Click to refresh">
      <span className={`freshness-dot ${level}`} />
      <span>Synced {label}</span>
    </button>
  );
}

export default FreshnessBadge;
