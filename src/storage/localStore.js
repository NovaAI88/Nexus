/**
 * localStore.js
 * Thin, safe wrapper around localStorage.
 * All values are JSON-serialized. Parse failures return the fallback.
 */

export function load(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage quota exceeded or unavailable — fail silently.
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // fail silently
  }
}
