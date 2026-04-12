import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { cssVariables } from './design/tokens';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import Shell from './components/layout/Shell';
import Home from './pages/Home';
import Today from './pages/Today';
import Week from './pages/Week';
import Projects from './pages/Projects';
import Inbox from './pages/Inbox';
import Auth from './pages/Auth';
import Pricing from './pages/Pricing';
import { supabase } from './lib/supabase';

// Inject CSS variables once on mount
function GlobalStyles() {
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'nexus-tokens';
    style.textContent = cssVariables;
    document.head.appendChild(style);
    return () => {
      document.getElementById('nexus-tokens')?.remove();
    };
  }, []);
  return null;
}

// OAuth callback handler — Supabase exchanges the code for a session
function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/', { replace: true });
      } else {
        navigate('/auth', { replace: true });
      }
    });
  }, [navigate]);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#666', fontSize: '14px' }}>Completing sign in…</div>
    </div>
  );
}

// Protected route — redirects to /auth if not authenticated
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#444', fontSize: '14px' }}>Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/auth" element={<Auth />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Protected routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Shell>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/today" element={<Today />} />
                <Route path="/week" element={<Week />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/inbox" element={<Inbox />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Shell>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <>
      <GlobalStyles />
      <AuthProvider>
        <SubscriptionProvider>
          <AppRoutes />
        </SubscriptionProvider>
      </AuthProvider>
    </>
  );
}
