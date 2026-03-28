import { useState, useEffect, useMemo } from 'react';
import { computeRecoveryScore, calorieProjection } from './healthModel';

const STORAGE_KEY = 'nexus:health';

/**
 * useHealthData — Provides health/fitness data for the UI.
 *
 * On web: generates realistic mock data that accumulates through the day.
 * On native (future): would read from HealthKit via a Swift bridge.
 *
 * @param {number} currentMinutes - current time in minutes since midnight
 */
export function useHealthData(currentMinutes) {
  const [sleepInput, setSleepInput] = useState(() => {
    try {
      return parseFloat(localStorage.getItem(STORAGE_KEY + ':sleep') || '7.5');
    } catch { return 7.5; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + ':sleep', String(sleepInput));
  }, [sleepInput]);

  const data = useMemo(() => {
    const hourOfDay = currentMinutes / 60;
    const wakeHours = Math.max(0, hourOfDay - 7); // Hours since 7am
    const dayProgress = Math.min(wakeHours / 15, 1); // 7am to 10pm

    // Calories: BMR accumulates, active adds on top
    const bmrSoFar = Math.round(70 * hourOfDay); // ~70 kcal/hr basal
    const activeCalories = Math.round(dayProgress * 350 * (0.7 + Math.random() * 0.3));
    const totalCalories = bmrSoFar + activeCalories;
    const calorieGoal = 2200;

    // Steps: accumulate through the day with some randomness
    const baseSteps = Math.round(dayProgress * 8000);
    const steps = Math.round(baseSteps * (0.85 + Math.sin(hourOfDay) * 0.15));
    const stepsGoal = 10000;

    // Active minutes: roughly proportional to day progress
    const activeMinutes = Math.round(dayProgress * 45);
    const activeGoal = 30;

    // Stand hours: one per hour if awake
    const standHours = Math.min(Math.round(wakeHours * 0.75), 12);

    // Heart rate: varies by time of day
    const baseHR = 68;
    const hrVariation = Math.sin((hourOfDay - 6) * 0.5) * 15;
    const currentHR = Math.round(baseHR + hrVariation + (Math.random() * 6 - 3));
    const restingHR = 62;

    // Recovery score
    const recoveryScore = computeRecoveryScore(sleepInput, restingHR, activeMinutes);

    // Calorie projection
    const hoursRemaining = Math.max(0, 22 - hourOfDay);
    const projectedCalories = calorieProjection(totalCalories, activeMinutes, hoursRemaining);

    return {
      calories: { burned: totalCalories, active: activeCalories, goal: calorieGoal, projected: projectedCalories },
      activeMinutes: { current: activeMinutes, goal: activeGoal },
      steps: { current: steps, goal: stepsGoal },
      standHours: { current: standHours, goal: 12 },
      heartRate: { current: currentHR, resting: restingHR },
      sleepHours: sleepInput,
      recoveryScore,
      workouts: [], // No mock workouts for now
      lastSynced: new Date().toISOString(),
    };
  }, [currentMinutes, sleepInput]);

  return { ...data, setSleepInput };
}
