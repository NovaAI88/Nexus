/**
 * Shared Claude/Anthropic helper for Vercel serverless functions.
 * All AI endpoints import from here so the key and model are configured once.
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';

/**
 * callClaude — low-level wrapper around the Anthropic Messages API.
 */
async function callClaude({ system, userMessage, maxTokens = 512 }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured on the server.');

  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try { detail = await res.text(); } catch { /* ignore */ }
    throw new Error(`Anthropic API error: ${detail}`);
  }

  const data = await res.json();
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error('Anthropic API returned empty response');
  return text;
}

/**
 * checkAiAccess — verify the user has Personal+ via Supabase.
 * Returns true if the user's subscription_tier is 'personal' or 'team'.
 */
async function checkAiAccess(authHeader) {
  if (!authHeader) return false;
  const token = authHeader.replace('Bearer ', '');

  // Verify with Supabase
  const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // If Supabase isn't configured, allow access (dev mode)
    return true;
  }

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/profiles?select=subscription_tier`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) return false;
    const rows = await res.json();
    const tier = rows?.[0]?.subscription_tier;
    return tier === 'personal' || tier === 'team';
  } catch {
    return false;
  }
}

module.exports = { callClaude, checkAiAccess };
