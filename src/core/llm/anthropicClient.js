/**
 * anthropicClient.js — Thin wrapper for the Anthropic Messages API.
 *
 * Model: claude-haiku-4-5 (Claude Haiku — fast, cost-effective)
 * Auth:  REACT_APP_ANTHROPIC_API_KEY in .env
 *
 * CORS NOTE:
 * Direct browser → Anthropic API calls are blocked by CORS in standard dev environments.
 * To enable in development, either:
 *   1. Run a lightweight local CORS proxy (e.g. `npx cors-anywhere`) and point requests to it.
 *   2. Use a browser extension that disables CORS for localhost (dev only — never in production).
 *   3. Deploy this app to a domain added to Anthropic's CORS allowlist.
 *
 * For a local operator tool (NEXUS), option 2 is acceptable during development.
 * The API key is stored client-side — this is acceptable for a local, single-user tool
 * not exposed publicly. Nicholas creates a key at console.anthropic.com.
 */

const API_KEY = process.env.REACT_APP_ANTHROPIC_API_KEY;
const ENDPOINT = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-haiku-4-5';

/**
 * Returns true if the Anthropic API key is configured.
 */
export function hasApiKey() {
  return Boolean(API_KEY);
}

/**
 * Calls the Anthropic Messages API.
 *
 * @param {object} opts
 * @param {string} opts.system        — System prompt
 * @param {string} opts.userMessage   — User message
 * @param {string} [opts.model]       — Model ID (default: claude-haiku-4-5)
 * @param {number} [opts.maxTokens]   — Max tokens (default: 2048)
 * @returns {Promise<string>}         — The assistant's text response
 */
export async function callClaude({ system, userMessage, model = DEFAULT_MODEL, maxTokens = 2048 }) {
  if (!API_KEY) {
    throw new Error('REACT_APP_ANTHROPIC_API_KEY is not configured. Add it to your .env file.');
  }

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    let errorText = `HTTP ${response.status}`;
    try { errorText = await response.text(); } catch { /* ignore */ }
    throw new Error(`Anthropic API error: ${errorText}`);
  }

  const data = await response.json();
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error('Anthropic API returned empty response');
  return text;
}
