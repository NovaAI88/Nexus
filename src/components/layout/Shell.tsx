import React from 'react';
import Sidebar from './Sidebar';
import OnboardingModal from '../OnboardingModal';
import { useAuth } from '../../context/AuthContext';
import { useMigration } from '../../hooks/useMigration';

interface ShellProps {
  children: React.ReactNode;
}

export default function Shell({ children }: ShellProps) {
  const { profile } = useAuth();
  const { runMigration } = useMigration();

  // Trigger migration + show onboarding for new users
  const needsOnboarding = profile !== null && profile.onboarding_completed === false;

  // Run migration when profile is loaded
  React.useEffect(() => {
    if (profile) runMigration();
  }, [profile, runMigration]);

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        background: 'var(--bg-base)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-primary)',
        overflow: 'hidden',
      }}
    >
      <Sidebar />
      <main
        style={{
          marginLeft: 'var(--sidebar-width)',
          flex: 1,
          height: '100vh',
          overflowY: 'auto',
          padding: 'var(--content-padding)',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--max-content-width)',
            margin: '0 auto',
            animation: 'fadeSlideIn 200ms ease forwards',
          }}
        >
          {children}
        </div>
      </main>

      {/* Onboarding modal for first-time users */}
      {needsOnboarding && (
        <OnboardingModal onComplete={() => {}} />
      )}
    </div>
  );
}
