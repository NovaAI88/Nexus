import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  CalendarCheck,
  CalendarDays,
  FolderKanban,
  Inbox,
  LogOut,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { useSupabaseInbox } from '../../hooks/useSupabaseInbox';

// Plan badge colours
const TIER_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  free:     { label: 'Free',     color: '#666',    bg: '#1a1a1a' },
  personal: { label: 'Personal', color: '#7c3aed', bg: 'rgba(124,58,237,0.15)' },
  team:     { label: 'Team',     color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' },
};

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  badge?: number;
}

const BASE_NAV_ITEMS: Omit<NavItem, 'badge'>[] = [
  { to: '/',         label: 'Home',     icon: Home },
  { to: '/today',    label: 'Today',    icon: CalendarCheck },
  { to: '/week',     label: 'Week',     icon: CalendarDays },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/inbox',    label: 'Inbox',    icon: Inbox },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { tier } = useSubscription();
  const { items } = useSupabaseInbox();
  const inboxBadge = items.filter((i) => !i.archived).length;

  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems: NavItem[] = BASE_NAV_ITEMS.map((item) =>
    item.to === '/inbox' && inboxBadge > 0
      ? { ...item, badge: inboxBadge }
      : item
  );

  const tierStyle = TIER_STYLE[tier] ?? TIER_STYLE.free;
  const userEmail = user?.email ?? '';
  const userInitial = userEmail.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

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

      {/* Footer — user + plan */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border-subtle)' }}>
        {/* Upgrade prompt for free users */}
        {tier === 'free' && (
          <button
            onClick={() => navigate('/pricing')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              padding: '8px 12px',
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 'var(--radius-md)',
              color: '#f59e0b',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '6px',
              textAlign: 'left',
            }}
          >
            <Zap size={14} />
            Upgrade to Personal
          </button>
        )}

        {/* User row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            position: 'relative',
          }}
          onClick={() => setShowUserMenu((v) => !v)}
        >
          {/* Avatar */}
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 700,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            {userInitial}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {userEmail}
            </div>
            {/* Plan badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '1px 6px',
                background: tierStyle.bg,
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 600,
                color: tierStyle.color,
                marginTop: '2px',
              }}
            >
              {tier !== 'free' && <Zap size={9} />}
              {tierStyle.label}
            </div>
          </div>

          {/* User menu */}
          {showUserMenu && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '8px',
                right: '8px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '4px',
                zIndex: 200,
                marginBottom: '4px',
              }}
            >
              <button
                onClick={handleSignOut}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 10px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
