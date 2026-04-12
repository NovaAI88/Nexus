import React from 'react';
import { Inbox as InboxIcon } from 'lucide-react';

export default function Inbox() {
  return (
    <div>
      <header style={{ marginBottom: '32px' }}>
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          Inbox
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Capture and triage everything here.
        </p>
      </header>

      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        {/* Input bar */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <input
            type="text"
            placeholder="Capture a task, idea, or note..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-primary)',
            }}
          />
        </div>

        {/* Empty state */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '64px 32px',
            gap: '12px',
            textAlign: 'center',
          }}
        >
          <InboxIcon size={28} style={{ color: 'var(--text-muted)' }} />
          <h2
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              margin: 0,
            }}
          >
            Inbox zero
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-muted)',
              maxWidth: '320px',
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            Everything captured here is ready to be triaged into a project or scheduled for a day.
          </p>
        </div>
      </div>
    </div>
  );
}
