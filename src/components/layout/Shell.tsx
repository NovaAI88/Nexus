import React from 'react';
import Sidebar from './Sidebar';

interface ShellProps {
  children: React.ReactNode;
}

export default function Shell({ children }: ShellProps) {
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
    </div>
  );
}
