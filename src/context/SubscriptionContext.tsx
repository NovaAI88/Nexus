import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { SubscriptionTier } from '../lib/supabase';

export type FeatureKey =
  | 'ai_morning_brief'
  | 'ai_daily_planner'
  | 'ai_project_plan'
  | 'ai_weekly_review'
  | 'team_workspaces';

const FEATURE_TIERS: Record<FeatureKey, SubscriptionTier[]> = {
  ai_morning_brief:  ['personal', 'team'],
  ai_daily_planner:  ['personal', 'team'],
  ai_project_plan:   ['personal', 'team'],
  ai_weekly_review:  ['personal', 'team'],
  team_workspaces:   ['team'],
};

const TIER_RANK: Record<SubscriptionTier, number> = {
  free:     0,
  personal: 1,
  team:     2,
};

interface SubscriptionContextValue {
  tier: SubscriptionTier;
  canAccess: (feature: FeatureKey) => boolean;
  requiredTierFor: (feature: FeatureKey) => SubscriptionTier;
  isPersonalOrAbove: boolean;
  isTeam: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const tier: SubscriptionTier = profile?.subscription_tier ?? 'free';

  const canAccess = (feature: FeatureKey): boolean => {
    const allowed = FEATURE_TIERS[feature];
    return allowed.some((t) => TIER_RANK[tier] >= TIER_RANK[t]);
  };

  const requiredTierFor = (feature: FeatureKey): SubscriptionTier => {
    return FEATURE_TIERS[feature][0];
  };

  return (
    <SubscriptionContext.Provider value={{
      tier,
      canAccess,
      requiredTierFor,
      isPersonalOrAbove: TIER_RANK[tier] >= TIER_RANK['personal'],
      isTeam: tier === 'team',
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used inside SubscriptionProvider');
  return ctx;
}
