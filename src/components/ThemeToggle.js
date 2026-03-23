/**
 * ThemeToggle
 *
 * Phase 8.5: simple dark/light mode toggle button.
 * Placed in the app header area.
 *
 * Props:
 *   theme        — 'dark' | 'light'
 *   toggleTheme  — fn
 */
function ThemeToggle({ theme, toggleTheme }) {
  return (
    <button
      className="theme-toggle-button"
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? '☀' : '🌙'}
    </button>
  );
}

export default ThemeToggle;
