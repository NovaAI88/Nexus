/**
 * healthIntelligence.js — Pure functions for health-aware execution guidance.
 * N5: Health Intelligence.
 *
 * Converts raw health data (recovery score, sleep, HR) into actionable
 * execution guidance that influences planning recommendations.
 *
 * Same inputs → same outputs. No React, no hooks, no side effects.
 */

/**
 * Compute fatigue index (0–100). Higher = more fatigued.
 *
 * Factors:
 *   Sleep deficit  (0–50): < 7h contributes fatigue proportionally
 *   Recovery gap   (0–50): < 70 recovery score contributes fatigue proportionally
 */
export function computeFatigueIndex(sleepHours, recoveryScore) {
  const sleepDeficit = Math.max(0, 7 - sleepHours);
  const sleepFatigue = Math.min(50, sleepDeficit * (50 / 3)); // 3h deficit = max 50 pts

  const recoveryGap = Math.max(0, 70 - recoveryScore);
  const recoveryFatigue = Math.min(50, recoveryGap * (50 / 70));

  return Math.round(sleepFatigue + recoveryFatigue);
}

/**
 * Classify recovery level from recovery score.
 * Returns: 'high' | 'normal' | 'low' | 'critical'
 */
export function classifyRecovery(recoveryScore) {
  if (recoveryScore >= 70) return 'high';
  if (recoveryScore >= 50) return 'normal';
  if (recoveryScore >= 30) return 'low';
  return 'critical';
}

/**
 * Compute intensity multiplier for time estimates based on fatigue.
 * Returns 0.70–1.10. Applied to estimated task minutes:
 *   < 1.0 = tasks take longer (fatigue slows throughput)
 *   > 1.0 = well-recovered, higher throughput
 */
export function computeIntensityMultiplier(fatigueIndex) {
  if (fatigueIndex >= 70) return 0.70;  // High fatigue: 30% longer
  if (fatigueIndex >= 50) return 0.85;  // Moderate fatigue: 15% longer
  if (fatigueIndex >= 30) return 0.95;  // Low fatigue: ~5% longer
  return 1.10;                          // Well recovered: slight throughput boost
}

/**
 * Generate a health note for planning guidance.
 * Returns a string when health warrants a note, null otherwise.
 */
export function computeHealthNote(fatigueIndex, recoveryLevel, sleepHours) {
  if (fatigueIndex >= 70) {
    return sleepHours < 6
      ? `Low sleep (${sleepHours}h) — limit deep focus to 60-min blocks with breaks.`
      : `Recovery low (${recoveryLevel}) — space out deep work, avoid back-to-back sessions.`;
  }
  if (fatigueIndex >= 50) {
    return `Moderate fatigue — build buffer time between sessions.`;
  }
  if (recoveryLevel === 'high') {
    return `Strong recovery — good window for sustained deep work.`;
  }
  return null;
}

/**
 * Compute full health context object for the planning engine and UI.
 *
 * @param {Object} healthData — from useHealthData (sleepHours, recoveryScore, heartRate)
 * @returns {Object|null} healthContext, or null if no health data
 */
export function computeHealthContext(healthData) {
  if (!healthData) return null;

  const { sleepHours, recoveryScore, heartRate } = healthData;
  if (sleepHours == null || recoveryScore == null) return null;

  const fatigueIndex = computeFatigueIndex(sleepHours, recoveryScore);
  const recoveryLevel = classifyRecovery(recoveryScore);
  const intensityMultiplier = computeIntensityMultiplier(fatigueIndex);
  const healthNote = computeHealthNote(fatigueIndex, recoveryLevel, sleepHours);

  // Resting HR status — elevated resting HR can compound fatigue
  const restingHR = heartRate?.resting ?? null;
  const hrState =
    restingHR === null ? 'unknown'
    : restingHR < 58   ? 'optimal'
    : restingHR <= 72  ? 'normal'
    : 'elevated';

  // Recommend a recovery block when fatigue is high or sleep is critically low
  const suggestRecoveryBlock = fatigueIndex >= 60 || (sleepHours < 6 && recoveryScore < 50);

  return {
    fatigueIndex,          // 0–100
    recoveryLevel,         // 'high' | 'normal' | 'low' | 'critical'
    intensityMultiplier,   // 0.70–1.10
    healthNote,            // string | null
    suggestRecoveryBlock,  // boolean
    hrState,               // 'optimal' | 'normal' | 'elevated' | 'unknown'
    sleepHours,
    recoveryScore,
  };
}
