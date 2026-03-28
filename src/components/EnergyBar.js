import { ENERGY_ZONES } from '../core/energy/energyModel';

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/**
 * EnergyBar — Horizontal bar showing energy zones across the day.
 *
 * Props:
 *   zoneMap        — Array of { start, end, zone } entries
 *   currentMinutes — Minutes from midnight
 */
function EnergyBar({ zoneMap, currentMinutes }) {
  if (!zoneMap || zoneMap.length === 0) return null;

  const dayStart = toMinutes(zoneMap[0].start);
  const dayEnd = toMinutes(zoneMap[zoneMap.length - 1].end);
  const totalDuration = Math.max(dayEnd - dayStart, 1);
  const markerPct = Math.max(0, Math.min(((currentMinutes - dayStart) / totalDuration) * 100, 100));

  const zoneColors = {};
  ENERGY_ZONES.forEach((z) => { zoneColors[z.id] = z.color; });

  return (
    <div className="energy-bar">
      <div className="energy-bar-track">
        {zoneMap.map((entry, i) => {
          const start = toMinutes(entry.start);
          const end = toMinutes(entry.end);
          const widthPct = ((end - start) / totalDuration) * 100;
          const color = zoneColors[entry.zone] ?? '#a78bfa';
          const isCurrent = currentMinutes >= start && currentMinutes < end;

          return (
            <div
              key={i}
              className={`energy-bar-segment${isCurrent ? ' is-current' : ''}`}
              style={{ width: `${widthPct}%`, background: color }}
              title={`${entry.start}–${entry.end} · ${entry.zone}`}
            >
              <span className="energy-bar-label">{entry.zone[0].toUpperCase()}</span>
            </div>
          );
        })}
        <div className="energy-bar-marker" style={{ left: `${markerPct}%` }} />
      </div>
      <div className="energy-bar-legend">
        {ENERGY_ZONES.map((z) => (
          <span key={z.id} className="energy-bar-legend-item">
            <span className="energy-bar-legend-dot" style={{ background: z.color }} />
            {z.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default EnergyBar;
