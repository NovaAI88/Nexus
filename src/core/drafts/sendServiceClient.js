/**
 * Client for the AUREON send-service backend.
 *
 * The send-service runs locally at http://127.0.0.1:4100 and proxies
 * draft approvals into real email sends via Proton Bridge SMTP.
 *
 * All errors are returned as structured objects (never thrown) so the UI
 * can render a clear message when the backend is unreachable instead of
 * silently falling back to the wrong sender.
 */

const SEND_SERVICE_BASE = 'http://127.0.0.1:4100';

async function post(path) {
  try {
    const res = await fetch(`${SEND_SERVICE_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, status: res.status, error: data.error || 'unknown', detail: data.detail || '', hint: data.hint || '' };
    }
    return { ok: true, data };
  } catch (err) {
    // Network error — backend is not running or unreachable.
    return {
      ok: false,
      status: 0,
      error: 'service_unreachable',
      detail: err.message,
      hint: 'Start the send-service: cd 06_AUREON/send-service && node server.js',
    };
  }
}

export function approveDraft(draftId) {
  return post(`/api/drafts/${encodeURIComponent(draftId)}/approve`);
}

export function rejectDraft(draftId) {
  return post(`/api/drafts/${encodeURIComponent(draftId)}/reject`);
}

export async function checkSendServiceHealth() {
  try {
    const res = await fetch(`${SEND_SERVICE_BASE}/health`);
    if (!res.ok) return { ok: false, status: res.status };
    const data = await res.json();
    return { ok: true, data };
  } catch (err) {
    return { ok: false, status: 0, error: err.message };
  }
}
