/**
 * ActivityRings — Apple Watch-style activity rings (Move, Exercise, Stand).
 * Pure SVG, no dependencies.
 */
function ActivityRings({ move, exercise, stand, size = 120 }) {
  const rings = [
    { pct: move, color: '#FF3B30', bg: 'rgba(255, 59, 48, 0.2)', radius: 0.38, label: 'Move' },
    { pct: exercise, color: '#30D158', bg: 'rgba(48, 209, 88, 0.2)', radius: 0.29, label: 'Exercise' },
    { pct: stand, color: '#5AC8FA', bg: 'rgba(90, 200, 250, 0.2)', radius: 0.20, label: 'Stand' },
  ];

  const strokeWidth = size * 0.065;
  const center = size / 2;

  return (
    <div className="activity-rings-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {rings.map(({ pct, color, bg, radius, label }) => {
          const r = size * radius;
          const circumference = 2 * Math.PI * r;
          const clampedPct = Math.min(Math.max(pct || 0, 0), 100);
          const offset = circumference * (1 - clampedPct / 100);

          return (
            <g key={label}>
              {/* Background ring */}
              <circle
                cx={center}
                cy={center}
                r={r}
                fill="none"
                stroke={bg}
                strokeWidth={strokeWidth}
              />
              {/* Progress ring */}
              <circle
                cx={center}
                cy={center}
                r={r}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform={`rotate(-90 ${center} ${center})`}
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default ActivityRings;
