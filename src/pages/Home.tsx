import React from 'react';
import { Sparkles, Plus } from 'lucide-react';

export default function Home() {
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
          Home
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            marginTop: '4px',
          }}
        >
          Your command center.
        </p>
      </header>

      <EmptyState
        icon={<Sparkles size={32} style={{ color: 'var(--accent)' }} />}
        title="Nothing here yet"
        description="Your dashboard will show today's AI brief, active projects, and key metrics once you have tasks and projects set up."
        action={{ label: 'Create your first project', href: '/projects' }}
      />
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 32px',
        textAlign: 'center',
        gap: '16px',
      }}
    >
      {icon}
      <h2
        style={{
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: 0,
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          maxWidth: '400px',
          margin: 0,
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>
      {action && (
        <a
          href={action.href}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '8px',
            padding: '8px 16px',
            background: 'var(--accent)',
            color: 'white',
            borderRadius: 'var(--radius-md)',
            fontSize: '14px',
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = 'var(--accent-hover)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = 'var(--accent)';
          }}
        >
          <Plus size={16} />
          {action.label}
        </a>
      )}
    </div>
  );
}
