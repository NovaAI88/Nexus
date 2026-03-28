import { useState, useCallback, useEffect } from 'react';
import { load, save } from '../../storage/localStore';

const THEME_KEY = 'nexus:theme';

/**
 * useTheme
 *
 * Phase 8.5: global theme state.
 * Persists to localStorage. Applies theme class to <body>.
 *
 * Returns:
 *   theme        — 'dark' | 'light'
 *   setTheme     — set explicitly
 *   toggleTheme  — flip between dark / light
 */
export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    const stored = load(THEME_KEY, null);
    if (!stored) {
      save(THEME_KEY, 'dark');
      return 'dark';
    }
    return stored;
  });

  // Apply theme class to <body> on every change.
  useEffect(() => {
    document.body.classList.remove('dark', 'light');
    document.body.classList.add(theme);
  }, [theme]);

  const setTheme = useCallback((next) => {
    setThemeState(next);
    save(THEME_KEY, next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      save(THEME_KEY, next);
      return next;
    });
  }, []);

  return { theme, setTheme, toggleTheme };
}
