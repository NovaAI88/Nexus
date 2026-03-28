import ActivityRings from './ActivityRings';

function HealthDashboardCard({ healthData }) {
  if (!healthData) return null;

  const movePct = Math.round((healthData.calories.burned / healthData.calories.goal) * 100);
  const exercisePct = Math.round((healthData.activeMinutes.current / healthData.activeMinutes.goal) * 100);
  const standPct = Math.round((healthData.standHours.current / healthData.standHours.goal) * 100);

  const recoveryColor = healthData.recoveryScore >= 70 ? '#30D158'
    : healthData.recoveryScore >= 40 ? '#FFD60A'
    : '#FF453A';

  return (
    <div className="health-dashboard-card">
      <div className="health-card-header">
        <h3 className="overview-card-title">Health & Activity</h3>
        <span className="health-sync-label">Mock data</span>
      </div>

      <div className="health-card-body">
        {/* Activity Rings */}
        <div className="health-rings-section">
          <ActivityRings move={movePct} exercise={exercisePct} stand={standPct} size={100} />
          <div className="health-ring-legends">
            <div className="health-legend">
              <span className="health-legend-dot" style={{ background: '#FF3B30' }} />
              <span className="health-legend-label">Move</span>
              <span className="health-legend-value">{healthData.calories.burned} / {healthData.calories.goal} cal</span>
            </div>
            <div className="health-legend">
              <span className="health-legend-dot" style={{ background: '#30D158' }} />
              <span className="health-legend-label">Exercise</span>
              <span className="health-legend-value">{healthData.activeMinutes.current} / {healthData.activeMinutes.goal} min</span>
            </div>
            <div className="health-legend">
              <span className="health-legend-dot" style={{ background: '#5AC8FA' }} />
              <span className="health-legend-label">Stand</span>
              <span className="health-legend-value">{healthData.standHours.current} / {healthData.standHours.goal} hr</span>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="health-stats-grid">
          <div className="health-stat-item">
            <span className="health-stat-icon">♥</span>
            <span className="health-stat-value">{healthData.heartRate.current}</span>
            <span className="health-stat-unit">bpm</span>
          </div>
          <div className="health-stat-item">
            <span className="health-stat-icon">👟</span>
            <span className="health-stat-value">{(healthData.steps.current / 1000).toFixed(1)}k</span>
            <span className="health-stat-unit">steps</span>
          </div>
          <div className="health-stat-item">
            <span className="health-stat-icon">🌙</span>
            <span className="health-stat-value">{healthData.sleepHours}</span>
            <span className="health-stat-unit">hr sleep</span>
          </div>
          <div className="health-stat-item">
            <span className="health-stat-icon" style={{ color: recoveryColor }}>●</span>
            <span className="health-stat-value" style={{ color: recoveryColor }}>{healthData.recoveryScore}</span>
            <span className="health-stat-unit">recovery</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HealthDashboardCard;
