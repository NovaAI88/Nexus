import { useState, useCallback, useMemo } from 'react';
import { load, save } from '../../storage/localStore';
import {
  DEFAULT_ZONE_MAP,
  WORK_STYLE_PRESETS,
  applyWorkStyleShift,
  getZoneAtTime,
} from './energyModel';

const PROFILE_KEY = 'nexus:energyProfile';

const DEFAULT_PROFILE = {
  workStyle: 'default',        // 'default' | 'earlyBird' | 'nightOwl'
  breakFrequency: 'normal',   // 'frequent' | 'normal' | 'minimal'
  preferredGymTime: '17:00',
  zoneOverrides: [],           // future: user can override specific zone slots
};

/**
 * useEnergyProfile
 *
 * Persistent energy profile. Computes the effective zone map
 * from defaults + work-style shifts + user overrides.
 *
 * @param {number} currentMinutes - Minutes from midnight (from App.js)
 */
export function useEnergyProfile(currentMinutes) {
  const [profile, setProfile] = useState(() => load(PROFILE_KEY, DEFAULT_PROFILE));

  const updateEnergyProfile = useCallback((patch) => {
    setProfile((current) => {
      const next = { ...current, ...patch };
      save(PROFILE_KEY, next);
      return next;
    });
  }, []);

  const effectiveZoneMap = useMemo(() => {
    const preset = WORK_STYLE_PRESETS[profile.workStyle] ?? WORK_STYLE_PRESETS.default;
    return applyWorkStyleShift(DEFAULT_ZONE_MAP, preset.shiftMinutes);
  }, [profile.workStyle]);

  const currentZone = useMemo(
    () => getZoneAtTime(currentMinutes, effectiveZoneMap),
    [currentMinutes, effectiveZoneMap]
  );

  return {
    energyProfile: profile,
    updateEnergyProfile,
    effectiveZoneMap,
    currentZone,
  };
}
