import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { SubscriptionTier } from '../lib/supabase';

interface Props {
  feature: string;
  requiredTier: SubscriptionTier;
  inline?: boolean;   // true = compact inline banner, false = full overlay
}

const TIER_LABELS: Record<SubscriptionTier, string> = {
  free:     'Free',
  personal: 'Personal',
  team:     'Team',
};

const TIER_PRICES: Record<SubscriptionTier, string> = {
  free:     '',
  personal: '€8/month',
  team:     '€20/user/month',
};

export default function UpgradePrompt({ feature, requiredTier, inline = false }: Props) {
  const navigate = useNavigate();

  if (inline) {
    return (
      <div style={styles.inline}>
        <Zap size={14} color="#f59e0b" />
        <span style={styles.inlineText}>
          {feature} requires{' '}
          <strong style={styles.tierName}>{TIER_LABELS[requiredTier]}</strong>
          {TIER_PRICES[requiredTier] && ` (${TIER_PRICES[requiredTier]})`}
        </span>
        <button
          style={styles.inlineBtn}
          onClick={() => navigate('/pricing')}
        >
          Upgrade
        </button>
      </div>
    );
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.icon}>
          <Zap size={28} color="#f59e0b" />
        </div>
        <h3 style={styles.heading}>{TIER_LABELS[requiredTier]} feature</h3>
        <p style={styles.body}>
          <strong>{feature}</strong> is available on the{' '}
          <strong>{TIER_LABELS[requiredTier]}</strong> plan
          {TIER_PRICES[requiredTier] && ` — ${TIER_PRICES[requiredTier]}`}.
        </p>
        <button
          style={styles.upgradeBtn}
          onClick={() => navigate('/pricing')}
        >
          Upgrade to {TIER_LABELS[requiredTier]}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  // Inline (banner)
  inline: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    background: 'rgba(245,158,11,0.08)',
    border: '1px solid rgba(245,158,11,0.2)',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#aaa',
  },
  inlineText: {
    flex: 1,
    lineHeight: 1.4,
  },
  tierName: {
    color: '#f59e0b',
  },
  inlineBtn: {
    padding: '5px 12px',
    background: '#f59e0b',
    border: 'none',
    borderRadius: '6px',
    color: '#000',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },

  // Full overlay
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(4px)',
    borderRadius: 'inherit',
    zIndex: 10,
  },
  card: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    padding: '32px 28px',
    maxWidth: '320px',
    textAlign: 'center',
  },
  icon: {
    marginBottom: '12px',
  },
  heading: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#fff',
    margin: '0 0 8px',
  },
  body: {
    fontSize: '14px',
    color: '#888',
    lineHeight: 1.6,
    margin: '0 0 20px',
  },
  upgradeBtn: {
    padding: '10px 20px',
    background: '#f59e0b',
    border: 'none',
    borderRadius: '8px',
    color: '#000',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    width: '100%',
  },
};
