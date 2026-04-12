import React from 'react';
import { CalendarDays, Plus } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Week() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const monday = new Date(now);
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  monday.setDate(now.getDate() + diff);

  const weekRange = (() => {
    const end = new Date(monday);
    end.setDate(monday.getDate() + 6);
    const fmt = (d: Date) =>
      d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    return `${fmt(monday)} – ${fmt(end)}`;
  })();

  return (
    <div>
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '32px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            Week
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {weekRange}
          </p>
        </div>
        <button
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            background: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-hover)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)';
          }}
        >
          <Plus size={16} />
          Add task
        </button>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr) 200px',
          gap: '8px',
          height: 'calc(100vh - 180px)',
        }}
      >
        {DAYS.map((day, i) => {
          const date = new Date(monday);
          date.setDate(monday.getDate() + i);
          const isToday = date.toDateString() === now.toDateString();

          return (
            <div
              key={day}
              style={{
                background: 'var(--bg-card)',
                border: `1px solid ${isToday ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  padding: '12px 12px 8px',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: isToday ? 'var(--accent)' : 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {day}
                </div>
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: isToday ? 'var(--accent)' : 'var(--text-primary)',
                    marginTop: '2px',
                  }}
                >
                  {date.getDate()}
                </div>
              </div>
              <div style={{ flex: 1, padding: '8px' }}>
                {/* Empty state — tasks will render here */}
              </div>
            </div>
          );
        })}

        {/* Waiting list */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: '12px 12px 8px',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Waiting
            </div>
          </div>
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              gap: '8px',
            }}
          >
            <CalendarDays size={20} style={{ color: 'var(--text-muted)' }} />
            <p
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                margin: 0,
                textAlign: 'center',
              }}
            >
              No unscheduled tasks
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
