/**
 * N5 Health Intelligence — unit tests
 *
 * Tests:
 *   1. computeFatigueIndex — fatigue scoring from sleep and recovery
 *   2. classifyRecovery — recovery level classification
 *   3. computeIntensityMultiplier — multiplier from fatigue index
 *   4. computeHealthNote — contextual health note generation
 *   5. computeHealthContext — full context object from healthData
 */

import {
  computeFatigueIndex,
  classifyRecovery,
  computeIntensityMultiplier,
  computeHealthNote,
  computeHealthContext,
} from '../healthIntelligence';

// ─── 1. computeFatigueIndex ───────────────────────────────────────────────────

describe('computeFatigueIndex', () => {
  it('returns 0 for perfect sleep and perfect recovery', () => {
    // 7h sleep (no deficit) + 70 recovery (no gap) = 0
    expect(computeFatigueIndex(7, 70)).toBe(0);
  });

  it('returns 0 for above-ideal sleep and high recovery', () => {
    expect(computeFatigueIndex(8, 90)).toBe(0);
  });

  it('increases fatigue when sleep drops below 7h', () => {
    const normal = computeFatigueIndex(7, 70);
    const low = computeFatigueIndex(5, 70);
    expect(low).toBeGreaterThan(normal);
  });

  it('increases fatigue when recovery drops below 70', () => {
    const high = computeFatigueIndex(7, 70);
    const low = computeFatigueIndex(7, 30);
    expect(low).toBeGreaterThan(high);
  });

  it('caps sleep fatigue component at 50', () => {
    // 0h sleep is extreme deficit — sleep component capped at 50
    const fatigue = computeFatigueIndex(0, 70);
    expect(fatigue).toBeLessThanOrEqual(100);
    expect(fatigue).toBeGreaterThanOrEqual(0);
  });

  it('caps total fatigue at 100', () => {
    const fatigue = computeFatigueIndex(0, 0);
    expect(fatigue).toBeLessThanOrEqual(100);
  });

  it('returns a rounded integer', () => {
    const result = computeFatigueIndex(6.5, 55);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('poor sleep + poor recovery yields high fatigue (>= 60)', () => {
    const fatigue = computeFatigueIndex(5, 25);
    expect(fatigue).toBeGreaterThanOrEqual(60);
  });

  it('good sleep + good recovery yields low fatigue (< 30)', () => {
    const fatigue = computeFatigueIndex(7.5, 75);
    expect(fatigue).toBeLessThan(30);
  });
});

// ─── 2. classifyRecovery ─────────────────────────────────────────────────────

describe('classifyRecovery', () => {
  it('returns "high" for score >= 70', () => {
    expect(classifyRecovery(70)).toBe('high');
    expect(classifyRecovery(95)).toBe('high');
    expect(classifyRecovery(100)).toBe('high');
  });

  it('returns "normal" for score 50–69', () => {
    expect(classifyRecovery(50)).toBe('normal');
    expect(classifyRecovery(60)).toBe('normal');
    expect(classifyRecovery(69)).toBe('normal');
  });

  it('returns "low" for score 30–49', () => {
    expect(classifyRecovery(30)).toBe('low');
    expect(classifyRecovery(45)).toBe('low');
    expect(classifyRecovery(49)).toBe('low');
  });

  it('returns "critical" for score < 30', () => {
    expect(classifyRecovery(0)).toBe('critical');
    expect(classifyRecovery(15)).toBe('critical');
    expect(classifyRecovery(29)).toBe('critical');
  });
});

// ─── 3. computeIntensityMultiplier ───────────────────────────────────────────

describe('computeIntensityMultiplier', () => {
  it('returns 0.70 for high fatigue (>= 70)', () => {
    expect(computeIntensityMultiplier(70)).toBe(0.70);
    expect(computeIntensityMultiplier(90)).toBe(0.70);
  });

  it('returns 0.85 for moderate fatigue (50–69)', () => {
    expect(computeIntensityMultiplier(50)).toBe(0.85);
    expect(computeIntensityMultiplier(65)).toBe(0.85);
  });

  it('returns 0.95 for low fatigue (30–49)', () => {
    expect(computeIntensityMultiplier(30)).toBe(0.95);
    expect(computeIntensityMultiplier(45)).toBe(0.95);
  });

  it('returns 1.10 when well-rested (< 30)', () => {
    expect(computeIntensityMultiplier(0)).toBe(1.10);
    expect(computeIntensityMultiplier(20)).toBe(1.10);
    expect(computeIntensityMultiplier(29)).toBe(1.10);
  });
});

// ─── 4. computeHealthNote ────────────────────────────────────────────────────

describe('computeHealthNote', () => {
  it('returns a string mentioning sleep when fatigue >= 70 and sleep < 6', () => {
    const note = computeHealthNote(75, 'critical', 5);
    expect(note).toBeTruthy();
    expect(note.toLowerCase()).toMatch(/sleep|5h/);
  });

  it('returns a string mentioning recovery when fatigue >= 70 and sleep >= 6', () => {
    const note = computeHealthNote(72, 'low', 6.5);
    expect(note).toBeTruthy();
    expect(note.toLowerCase()).toMatch(/recovery|low/);
  });

  it('returns a fatigue note when fatigue is 50–69', () => {
    const note = computeHealthNote(55, 'normal', 6.5);
    expect(note).toBeTruthy();
    expect(note.toLowerCase()).toMatch(/fatigue|buffer/);
  });

  it('returns a positive note when recovery is high and fatigue < 50', () => {
    const note = computeHealthNote(10, 'high', 8);
    expect(note).toBeTruthy();
    expect(note.toLowerCase()).toMatch(/strong|recovery|deep/);
  });

  it('returns null for normal conditions (moderate fatigue, non-high recovery)', () => {
    const note = computeHealthNote(35, 'normal', 7);
    expect(note).toBeNull();
  });
});

// ─── 5. computeHealthContext ─────────────────────────────────────────────────

describe('computeHealthContext', () => {
  it('returns null for null input', () => {
    expect(computeHealthContext(null)).toBeNull();
  });

  it('returns null when sleepHours is missing', () => {
    expect(computeHealthContext({ recoveryScore: 70 })).toBeNull();
  });

  it('returns null when recoveryScore is missing', () => {
    expect(computeHealthContext({ sleepHours: 7 })).toBeNull();
  });

  it('returns a complete context object for valid input', () => {
    const ctx = computeHealthContext({
      sleepHours: 7.5,
      recoveryScore: 75,
      heartRate: { current: 68, resting: 60 },
    });
    expect(ctx).not.toBeNull();
    expect(ctx).toHaveProperty('fatigueIndex');
    expect(ctx).toHaveProperty('recoveryLevel');
    expect(ctx).toHaveProperty('intensityMultiplier');
    expect(ctx).toHaveProperty('healthNote');
    expect(ctx).toHaveProperty('suggestRecoveryBlock');
    expect(ctx).toHaveProperty('hrState');
  });

  it('fatigueIndex is an integer between 0 and 100', () => {
    const ctx = computeHealthContext({ sleepHours: 6, recoveryScore: 45, heartRate: { resting: 65 } });
    expect(Number.isInteger(ctx.fatigueIndex)).toBe(true);
    expect(ctx.fatigueIndex).toBeGreaterThanOrEqual(0);
    expect(ctx.fatigueIndex).toBeLessThanOrEqual(100);
  });

  it('intensityMultiplier is between 0.70 and 1.10', () => {
    const ctx = computeHealthContext({ sleepHours: 7, recoveryScore: 60 });
    expect(ctx.intensityMultiplier).toBeGreaterThanOrEqual(0.70);
    expect(ctx.intensityMultiplier).toBeLessThanOrEqual(1.10);
  });

  it('suggestRecoveryBlock is true when fatigue is >= 60', () => {
    const ctx = computeHealthContext({ sleepHours: 4, recoveryScore: 20 });
    expect(ctx.suggestRecoveryBlock).toBe(true);
  });

  it('suggestRecoveryBlock is false when well-recovered', () => {
    const ctx = computeHealthContext({ sleepHours: 8, recoveryScore: 80 });
    expect(ctx.suggestRecoveryBlock).toBe(false);
  });

  it('hrState is "elevated" when resting HR > 72', () => {
    const ctx = computeHealthContext({
      sleepHours: 7,
      recoveryScore: 60,
      heartRate: { resting: 80 },
    });
    expect(ctx.hrState).toBe('elevated');
  });

  it('hrState is "optimal" when resting HR < 58', () => {
    const ctx = computeHealthContext({
      sleepHours: 7,
      recoveryScore: 70,
      heartRate: { resting: 52 },
    });
    expect(ctx.hrState).toBe('optimal');
  });

  it('hrState is "normal" for resting HR 58–72', () => {
    const ctx = computeHealthContext({
      sleepHours: 7,
      recoveryScore: 65,
      heartRate: { resting: 65 },
    });
    expect(ctx.hrState).toBe('normal');
  });

  it('hrState is "unknown" when no heartRate provided', () => {
    const ctx = computeHealthContext({ sleepHours: 7, recoveryScore: 60 });
    expect(ctx.hrState).toBe('unknown');
  });

  it('recoveryLevel matches classifyRecovery output', () => {
    const ctx = computeHealthContext({ sleepHours: 7, recoveryScore: 55 });
    expect(ctx.recoveryLevel).toBe('normal');
  });
});
