/**
 * Health Model — Pure functions for health data calculations.
 * Designed to work with both mock data (web) and real HealthKit data (native).
 */

/**
 * Compute recovery score (0-100) from sleep, resting HR, and activity.
 */
export function computeRecoveryScore(sleepHours, restingHR, activeMinutes) {
  // Sleep component (0-40): 8h = perfect
  const sleepScore = Math.min(40, (sleepHours / 8) * 40);

  // HR component (0-30): lower resting HR = better recovery
  // 50-80 bpm range mapped to 30-0
  const hrScore = restingHR <= 50 ? 30 : restingHR >= 80 ? 0 : Math.round(30 * (1 - (restingHR - 50) / 30));

  // Activity component (0-30): 30+ active minutes = good
  const activityScore = Math.min(30, activeMinutes);

  return Math.round(sleepScore + hrScore + activityScore);
}

/**
 * Should we suggest movement based on stand hours and current hour?
 */
export function shouldSuggestMovement(standHours, currentHour) {
  const expectedStandByNow = Math.max(0, currentHour - 7); // From 7am
  return standHours < expectedStandByNow * 0.6; // Behind 60% of expected
}

/**
 * Energy zone adjustment based on sleep and recovery.
 * Returns a multiplier: <1 = reduce intensity, >1 = boost.
 */
export function energyAdjustment(sleepHours, recoveryScore) {
  if (sleepHours < 6) return 0.75;  // Poor sleep: reduce peak by 25%
  if (sleepHours > 8 && recoveryScore > 70) return 1.15; // Great recovery: boost 15%
  if (recoveryScore < 40) return 0.85;
  return 1.0;
}

/**
 * Project end-of-day calorie total.
 */
export function calorieProjection(burnedSoFar, activeMinutes, hoursRemaining) {
  const bmrPerHour = 70; // ~1680 kcal/day basal
  const activeCalPerMin = 5;
  const projectedBMR = bmrPerHour * hoursRemaining;
  const projectedActive = activeMinutes > 0
    ? (activeCalPerMin * (activeMinutes / (24 - hoursRemaining)) * hoursRemaining)
    : 0;
  return Math.round(burnedSoFar + projectedBMR + projectedActive);
}

/**
 * Map heart rate to energy zone name.
 */
export function heartRateToZone(heartRate) {
  if (heartRate < 70) return 'recovery';
  if (heartRate < 100) return 'low';
  if (heartRate < 130) return 'moderate';
  if (heartRate < 150) return 'high';
  return 'peak';
}
