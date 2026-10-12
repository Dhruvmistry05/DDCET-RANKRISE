/**
 * Centralized API configuration for DDCET RankRise.
 * 
 * Dynamically resolves the API base URL based on build environment and runtime hostname:
 * 1. If VITE_API_URL is defined and is a valid remote URL, use it.
 * 2. If running in a browser on any production host (e.g. *.onrender.com),
 *    automatically target the live Render backend: 'https://ddcet-rankrise-backend.onrender.com'.
 * 3. In local development (localhost / 127.0.0.1), fallback to VITE_API_URL or '' (Vite proxy).
 */

export function resolveApiBaseUrl() {
  const envUrl = (import.meta?.env?.VITE_API_URL || '').trim();

  // If a valid production/custom backend URL is provided via env, use it
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  // Runtime browser check: If hosted on Render or any public web domain
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local');
    if (!isLocalhost) {
      return 'https://ddcet-rankrise-backend.onrender.com';
    }
  }

  // If in build mode for production
  if (import.meta?.env?.PROD) {
    return 'https://ddcet-rankrise-backend.onrender.com';
  }

  // Local development fallback
  return envUrl || '';
}

export const API_BASE_URL = resolveApiBaseUrl().replace(/\/$/, '');

/**
 * Helper to construct an absolute or proxy-friendly API endpoint URL.
 * @param {string} path - E.g. '/api/auth/register' or 'api/subjects'
 * @returns {string} Fully qualified URL
 */
export const getApiUrl = (path = '') => {
  const base = resolveApiBaseUrl().replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
};
