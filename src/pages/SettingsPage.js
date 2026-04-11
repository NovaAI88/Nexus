import { useState, useCallback, useEffect } from 'react';

const API_KEY_STORAGE = 'nexus:anthropic-key';
const REFRESH_INTERVAL_STORAGE = 'nexus:refresh-interval';

function SettingsPage({ theme, toggleTheme }) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(API_KEY_STORAGE) || '');
  const [refreshInterval, setRefreshInterval] = useState(
    () => localStorage.getItem(REFRESH_INTERVAL_STORAGE) || 'manual'
  );
  const [savedFlash, setSavedFlash] = useState(null);

  const showSaved = useCallback((field) => {
    setSavedFlash(field);
    const id = setTimeout(() => setSavedFlash(null), 2000);
    return () => clearTimeout(id);
  }, []);

  const handleApiKeyChange = useCallback((e) => {
    const value = e.target.value;
    setApiKey(value);
    localStorage.setItem(API_KEY_STORAGE, value);
    showSaved('apiKey');
  }, [showSaved]);

  const handleRefreshChange = useCallback((e) => {
    const value = e.target.value;
    setRefreshInterval(value);
    localStorage.setItem(REFRESH_INTERVAL_STORAGE, value);
    showSaved('refresh');
  }, [showSaved]);

  // Auto-refresh based on interval setting
  useEffect(() => {
    if (refreshInterval === 'manual') return;
    const ms = parseInt(refreshInterval, 10) * 60 * 1000;
    if (isNaN(ms) || ms <= 0) return;
    const id = setInterval(() => {
      window.dispatchEvent(new Event('nexus:refresh'));
    }, ms);
    return () => clearInterval(id);
  }, [refreshInterval]);

  let version = 'unknown';
  try {
    const pkg = require('../../package.json');
    version = pkg.version || 'unknown';
  } catch {
    // ignore
  }

  return (
    <div className="settings-page">
      <header className="company-header">
        <div>
          <h1 className="company-title">Settings</h1>
          <p className="company-subtitle">Configuration & preferences</p>
        </div>
      </header>

      {/* Theme */}
      <div className="settings-section">
        <h3 className="settings-section-title">Appearance</h3>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Theme</div>
            <div className="settings-row-desc">Toggle between dark and light mode</div>
          </div>
          <button
            className="error-boundary-reload"
            onClick={toggleTheme}
            style={{ minWidth: 80 }}
          >
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>

      {/* API Keys */}
      <div className="settings-section">
        <h3 className="settings-section-title">API Keys</h3>
        <div>
          <div className="settings-row-label">Anthropic API Key</div>
          <div className="settings-row-desc">
            Used as fallback if REACT_APP_ANTHROPIC_API_KEY env var is not set
          </div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="password"
              className="settings-input"
              value={apiKey}
              onChange={handleApiKeyChange}
              placeholder="sk-ant-..."
              autoComplete="off"
            />
            <span className={`settings-saved${savedFlash === 'apiKey' ? ' visible' : ''}`}>
              Saved
            </span>
          </div>
        </div>
      </div>

      {/* Refresh Interval */}
      <div className="settings-section">
        <h3 className="settings-section-title">Data Refresh</h3>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Auto-refresh interval</div>
            <div className="settings-row-desc">Automatically refresh all data hooks on a schedule</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select
              className="settings-select"
              value={refreshInterval}
              onChange={handleRefreshChange}
            >
              <option value="manual">Manual</option>
              <option value="5">5 min</option>
              <option value="15">15 min</option>
              <option value="30">30 min</option>
            </select>
            <span className={`settings-saved${savedFlash === 'refresh' ? ' visible' : ''}`}>
              Saved
            </span>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="settings-section">
        <h3 className="settings-section-title">About</h3>
        <div className="settings-about">
          <div><strong>NEXUS</strong> — Life & Work OS</div>
          <div>Version {version} &middot; Phase N5.0</div>
          <div style={{ marginTop: 8 }}>OpenClaw Gateway</div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
