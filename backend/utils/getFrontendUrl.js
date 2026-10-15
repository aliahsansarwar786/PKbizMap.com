/**
 * Resolves the active frontend URL safely for links in transactional emails.
 * Uses request Origin / Referer, falls back to FRONTEND_URL env var, then production URL.
 *
 * @param {Object} [req] - Express request object
 * @returns {string} URL without trailing slash
 */
const getFrontendUrl = (req) => {
  // 1. Prefer request Origin header if provided by browser
  try {
    const origin = req?.headers?.origin || (req?.headers?.referer ? new URL(req.headers.referer).origin : null);
    if (origin && !origin.includes('pkbizmap-com.vercel.app')) {
      return origin.replace(/\/$/, '');
    }
  } catch (e) {}

  // 2. Use FRONTEND_URL environment variable (ignore stale deleted deployment)
  const envUrl = process.env.FRONTEND_URL;
  if (envUrl && !envUrl.includes('pkbizmap-com.vercel.app')) {
    return envUrl.replace(/\/$/, '');
  }

  // 3. Fallback to active live frontend
  return 'https://bizprimehub.vercel.app';
};

module.exports = getFrontendUrl;
