/**
 * Resolves the active frontend URL safely for links in transactional emails.
 * Build email links ONLY from the FRONTEND_URL env var; never from request headers.
 *
 * @returns {string} URL without trailing slash
 */
const getFrontendUrl = () => {
  // Use FRONTEND_URL environment variable (ignore stale deleted deployment)
  const envUrl = process.env.FRONTEND_URL;
  if (envUrl && !envUrl.includes('pkbizmap-com.vercel.app')) {
    return envUrl.replace(/\/$/, '');
  }

  // Fallback to active live frontend
  return 'https://bizprimehub.vercel.app';
};

module.exports = getFrontendUrl;
