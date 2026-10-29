/**
 * Normalizes and validates a stored user URL to ensure it safely uses http: or https:
 * Prevents javascript:, data:, vbscript:, and raw protocol-relative schemes.
 *
 * @param {string|null|undefined} raw
 * @returns {string|null} - Normalized URL string or null if invalid/unsafe
 */
export function normalizeHttpUrl(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const schemeMatch = trimmed.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:/);

  if (schemeMatch) {
    const scheme = schemeMatch[0].toLowerCase();
    if (scheme !== 'http:' && scheme !== 'https:') {
      return null;
    }
    try {
      const parsed = new URL(trimmed);
      if (parsed.username || parsed.password) {
        return null;
      }
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.href;
      }
      return null;
    } catch {
      return null;
    }
  }

  const withoutLeadingSlashes = trimmed.replace(/^\/+/, '');
  if (!withoutLeadingSlashes) return null;

  try {
    const parsed = new URL(`https://${withoutLeadingSlashes}`);
    if (parsed.username || parsed.password) {
      return null;
    }
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
    return null;
  } catch {
    return null;
  }
}

export default normalizeHttpUrl;

