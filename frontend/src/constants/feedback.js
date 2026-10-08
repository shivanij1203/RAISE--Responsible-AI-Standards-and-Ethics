// Optional feedback link shown in the prototype banner. Set VITE_FEEDBACK_URL
// (for example, a survey form). Anything that is not an http(s) URL is ignored.
function safeHttpUrl(raw) {
  if (!raw) return '';
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch {
    return '';
  }
}

export const FEEDBACK_URL = safeHttpUrl((import.meta.env.VITE_FEEDBACK_URL || '').trim());
