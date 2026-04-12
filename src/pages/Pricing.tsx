import React, { useState } from 'react';
import { Check, Zap, Users } from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';

interface Plan {
  id: string;
  name: string;
  price: string;
  priceNote: string;
  icon: React.ReactNode;
  color: string;
  features: string[];
  cta: string;
  priceId: string; // Stripe price ID — set via env
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '€0',
    priceNote: 'forever',
    icon: null,
    color: '#666',
    features: [
      'Unlimited tasks',
      'Project management',
      'Inbox capture',
      'Weekly planner',
      'Daily timeline',
    ],
    cta: 'Current plan',
    priceId: '',
  },
  {
    id: 'personal',
    name: 'Personal',
    price: '€8',
    priceNote: 'per month',
    icon: <Zap size={16} />,
    color: '#7c3aed',
    features: [
      'Everything in Free',
      'AI Morning Brief',
      'AI Daily Planner',
      'AI Project Plans',
      'AI Weekly Review',
      'Priority support',
    ],
    cta: 'Upgrade to Personal',
    priceId: process.env.REACT_APP_STRIPE_PERSONAL_PRICE_ID ?? '',
  },
  {
    id: 'team',
    name: 'Team',
    price: '€20',
    priceNote: 'per user / month',
    icon: <Users size={16} />,
    color: '#06b6d4',
    features: [
      'Everything in Personal',
      'Shared workspaces',
      'Team project boards',
      'Member management',
      'Admin controls',
      'Dedicated support',
    ],
    cta: 'Upgrade to Team',
    priceId: process.env.REACT_APP_STRIPE_TEAM_PRICE_ID ?? '',
  },
];

export default function Pricing() {
  const { tier } = useSubscription();
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async (plan: Plan) => {
    if (!plan.priceId || !user) return;
    setLoading(plan.id);
    setError(null);

    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId:    plan.priceId,
          userId:     user.id,
          userEmail:  user.email,
          successUrl: `${window.location.origin}/?upgraded=1`,
          cancelUrl:  `${window.location.origin}/pricing`,
        }),
      });

      if (!res.ok) throw new Error('Failed to create checkout session');
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.heading}>Choose your plan</h1>
        <p style={styles.subheading}>
          Start free. Upgrade when you're ready for AI-powered productivity.
        </p>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <div style={styles.grid}>
        {PLANS.map((plan) => {
          const isCurrent = tier === plan.id;
          const isUpgrade = PLANS.findIndex((p) => p.id === tier) < PLANS.findIndex((p) => p.id === plan.id);

          return (
            <div
              key={plan.id}
              style={{
                ...styles.card,
                border: `1px solid ${plan.id === 'personal' ? '#7c3aed' : '#222'}`,
                background: plan.id === 'personal' ? 'rgba(124,58,237,0.05)' : '#111',
              }}
            >
              {plan.id === 'personal' && (
                <div style={styles.popular}>Most popular</div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                {plan.icon && (
                  <span style={{ color: plan.color }}>{plan.icon}</span>
                )}
                <h3 style={{ ...styles.planName, color: plan.color }}>{plan.name}</h3>
              </div>

              <div style={styles.priceRow}>
                <span style={styles.price}>{plan.price}</span>
                <span style={styles.priceNote}>{plan.priceNote}</span>
              </div>

              <ul style={styles.features}>
                {plan.features.map((f) => (
                  <li key={f} style={styles.feature}>
                    <Check size={14} color="#22c55e" style={{ flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                style={{
                  ...styles.cta,
                  background: isCurrent ? '#1a1a1a' : plan.color,
                  color: isCurrent ? '#555' : '#fff',
                  cursor: isCurrent ? 'default' : 'pointer',
                  opacity: loading && loading !== plan.id ? 0.5 : 1,
                }}
                onClick={() => isUpgrade && handleUpgrade(plan)}
                disabled={isCurrent || !isUpgrade || !!loading}
              >
                {loading === plan.id
                  ? 'Redirecting…'
                  : isCurrent
                  ? '✓ Current plan'
                  : plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      <p style={styles.footer}>
        Prices in EUR. Cancel anytime. All plans include a 14-day free trial.
      </p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '40px 0',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  heading: {
    fontSize: '28px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: '0 0 8px',
  },
  subheading: {
    fontSize: '15px',
    color: 'var(--text-secondary)',
    margin: 0,
  },
  error: {
    color: '#ef4444',
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '14px',
    textAlign: 'center',
    marginBottom: '24px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
  },
  card: {
    borderRadius: '12px',
    padding: '28px 24px',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  popular: {
    position: 'absolute',
    top: '-12px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#7c3aed',
    color: '#fff',
    fontSize: '11px',
    fontWeight: 700,
    padding: '3px 12px',
    borderRadius: '20px',
    whiteSpace: 'nowrap',
  },
  planName: {
    fontSize: '16px',
    fontWeight: 700,
    margin: 0,
  },
  priceRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
    marginBottom: '20px',
  },
  price: {
    fontSize: '32px',
    fontWeight: 800,
    color: 'var(--text-primary)',
  },
  priceNote: {
    fontSize: '13px',
    color: 'var(--text-muted)',
  },
  features: {
    flex: 1,
    listStyle: 'none',
    padding: 0,
    margin: '0 0 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  cta: {
    display: 'block',
    width: '100%',
    padding: '11px 16px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    textAlign: 'center',
    transition: 'opacity 0.15s',
  },
  footer: {
    textAlign: 'center',
    marginTop: '32px',
    fontSize: '13px',
    color: 'var(--text-muted)',
  },
};
