/**
 * useFeatureGate
 *
 * Convenience hook for checking feature access at the component level.
 * Wraps SubscriptionContext so components don't need to import it directly.
 */
import { useSubscription, FeatureKey } from '../context/SubscriptionContext';

export function useFeatureGate(feature: FeatureKey) {
  const { canAccess, requiredTierFor, tier } = useSubscription();

  return {
    allowed:      canAccess(feature),
    currentTier:  tier,
    requiredTier: requiredTierFor(feature),
  };
}
