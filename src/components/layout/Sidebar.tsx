import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  CalendarCheck,
  CalendarDays,
  FolderKanban,
  Inbox,
  Settings,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  badge?: number;
}

const navItems: NavItem[] = [
  { to: '/',        label: 'Home',     icon: Home },
  { to: '/today',   label: 'Today',    icon: CalendarCheck },
  { to: '/week',    label: 'Week',     icon: CalendarDays },
  { to: '/projects',label: 'Projects', icon: FolderKanban },
  { to: '/inbox',   label: 'Inbox',    icon: Inbox },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        minWidth: 'var(--sidebar-width)',
        height: '100vh',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <span
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.5px',
          }}
        >
          NEXUS
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {navItems.map(({ to, label, icon: Icon, badge }) => {
          const isActive =
            to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(to);

          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={{ textDecoration: 'none' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'var(--accent-subtle)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  transition: 'all 150ms ease',
                  cursor: 'pointer',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-hover)';
                    (e.currentTarget as HTMLDivElement).style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                    (e.currentTarget as HTMLDivElement).style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <Icon size={18} strokeWidth={isActive ? 2 : 1.75} />
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: isActive ? 500 : 400,
                    flex: 1,
                  }}
                >
                  {label}
                </span>
                {badge != null && badge > 0 && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      background: isActive ? 'var(--accent)' : 'var(--bg-hover)',
                      color: isActive ? 'white' : 'var(--text-secondary)',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-full)',
                      minWidth: '18px',
                      textAlign: 'center',
                    }}
                  >
                    {badge}
                  </span>
                )}
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: '12px 8px',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <NavLink to="/settings" style={{ textDecoration: 'none' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-muted)',
              transition: 'all 150ms ease',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-hover)';
              (e.currentTarget as HTMLDivElement).style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = 'transparent';
              (e.currentTarget as HTMLDivElement).style.color = 'var(--text-muted)';
            }}
          >
            <Settings size={18} strokeWidth={1.75} />
            <span style={{ fontSize: '14px', fontWeight: 400 }}>Settings</span>
          </div>
        </NavLink>
      </div>
    </aside>
  );
}
