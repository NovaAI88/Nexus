import { useState } from 'react';
import { LIFE_CATEGORIES, getActivitiesByCategory, getActivitiesForZone } from '../core/life/lifeCategories';

/**
 * LifeBlockPicker — Quick-add panel for life activities.
 *
 * Props:
 *   currentZone       — Current energy zone object { id, label, color }
 *   onSelectActivity  — (activity) => void — called when user picks an activity
 */
function LifeBlockPicker({ currentZone, onSelectActivity }) {
  const [activeTab, setActiveTab] = useState('suggested');

  const suggestedActivities = currentZone
    ? getActivitiesForZone(currentZone.id).slice(0, 6)
    : [];

  const tabs = [
    { id: 'suggested', label: 'For You' },
    ...LIFE_CATEGORIES,
  ];

  const activities = activeTab === 'suggested'
    ? suggestedActivities
    : getActivitiesByCategory(activeTab);

  return (
    <div className="life-picker">
      <div className="life-picker-header">
        <h3 className="life-picker-title">Life Blocks</h3>
        {currentZone && (
          <span className="life-picker-zone-badge" style={{ '--zone-color': currentZone.color }}>
            {currentZone.label} Energy
          </span>
        )}
      </div>

      <div className="life-picker-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`life-picker-tab${activeTab === tab.id ? ' is-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon ? `${tab.icon} ` : ''}{tab.label}
          </button>
        ))}
      </div>

      <div className="life-picker-grid">
        {activities.map((activity) => (
          <button
            key={activity.id}
            className="life-picker-activity"
            onClick={() => onSelectActivity(activity)}
            title={`${activity.label} · ${activity.defaultDuration} min`}
          >
            <span className="life-picker-activity-icon">{activity.icon}</span>
            <span className="life-picker-activity-label">{activity.label}</span>
            <span className="life-picker-activity-duration">{activity.defaultDuration}m</span>
          </button>
        ))}
        {activities.length === 0 && (
          <p className="life-picker-empty">No activities in this category yet.</p>
        )}
      </div>
    </div>
  );
}

export default LifeBlockPicker;
