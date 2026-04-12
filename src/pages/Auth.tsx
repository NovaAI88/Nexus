import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type Mode = 'signin' | 'signup';

export default function Auth() {
  const { user, signInWithEmail, signUpWithEmail, signInWithGoogle, loading } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) navigate('/', { replace: true });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    if (mode === 'signin') {
      const { error } = await signInWithEmail(email, password);
      if (error) setError(error);
    } else {
      const { error } = await signUpWithEmail(email, password);
      if (error) {
        setError(error);
      } else {
        setMessage('Check your email to confirm your account, then sign in.');
      }
    }
    setSubmitting(false);
  };

  const handleGoogle = async () => {
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) setError(error);
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.spinner} />
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo / Brand */}
        <div style={styles.brand}>
          <span style={styles.brandIcon}>◈</span>
          <span style={styles.brandName}>NEXUS</span>
        </div>

        <h1 style={styles.heading}>
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p style={styles.subheading}>
          {mode === 'signin'
            ? 'Sign in to your workspace'
            : 'Start your 14-day Personal trial free'}
        </p>

        {/* Google OAuth */}
        <button style={styles.googleBtn} onClick={handleGoogle} type="button">
          <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: 8 }}>
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
            <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
            <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"/>
          </svg>
          Continue with Google
        </button>

        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <span style={styles.dividerLine} />
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Email
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </label>

          {error && <p style={styles.error}>{error}</p>}
          {message && <p style={styles.successMsg}>{message}</p>}

          <button style={styles.submitBtn} type="submit" disabled={submitting}>
            {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p style={styles.toggle}>
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            style={styles.toggleBtn}
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setMessage(null); }}
            type="button"
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>

        {mode === 'signup' && (
          <p style={styles.legal}>
            By creating an account you agree to our Terms of Service and Privacy Policy.
          </p>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0a0a',
    padding: '24px',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    background: '#111',
    border: '1px solid #222',
    borderRadius: '12px',
    padding: '40px 36px',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '28px',
  },
  brandIcon: {
    fontSize: '20px',
    color: '#7c3aed',
  },
  brandName: {
    fontSize: '16px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: '#fff',
  },
  heading: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#fff',
    margin: '0 0 6px',
  },
  subheading: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 24px',
  },
  googleBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 16px',
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#e0e0e0',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '20px 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: '#222',
  },
  dividerText: {
    color: '#444',
    fontSize: '12px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '13px',
    color: '#888',
    fontWeight: 500,
  },
  input: {
    padding: '10px 12px',
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    color: '#e0e0e0',
    fontSize: '14px',
    outline: 'none',
  },
  error: {
    color: '#ef4444',
    fontSize: '13px',
    margin: '0',
    padding: '10px 12px',
    background: 'rgba(239,68,68,0.08)',
    borderRadius: '6px',
    border: '1px solid rgba(239,68,68,0.2)',
  },
  successMsg: {
    color: '#22c55e',
    fontSize: '13px',
    margin: '0',
    padding: '10px 12px',
    background: 'rgba(34,197,94,0.08)',
    borderRadius: '6px',
    border: '1px solid rgba(34,197,94,0.2)',
  },
  submitBtn: {
    padding: '11px 16px',
    background: '#7c3aed',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '4px',
  },
  toggle: {
    marginTop: '20px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#666',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: '#7c3aed',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    padding: 0,
  },
  legal: {
    marginTop: '16px',
    fontSize: '11px',
    color: '#444',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  spinner: {
    width: '24px',
    height: '24px',
    border: '2px solid #333',
    borderTop: '2px solid #7c3aed',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};
