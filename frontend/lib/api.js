/**
 * Centralized API client for the Business Directory frontend.
 * - Always sends cookies (credentials: 'include')
 * - Handles JSON automatically
 * - Returns consistent response structure
 * - Handles auth failures globally
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pkbizmap-backend.vercel.app/api';

class ApiError extends Error {
  constructor(message, status, errors = []) {
    super(message);
    this.status = status;
    this.errors = errors;
    this.name = 'ApiError';
  }
}

let cachedCsrfToken = null;

const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
};

/**
 * Ensures a fresh CSRF token is fetched and cached before state-changing auth calls
 */
async function ensureFreshCsrfToken() {
  try {
    const csrfRes = await fetch(`${API_URL}/auth/csrf-token`, { credentials: 'include' });
    const csrfData = await csrfRes.json().catch(() => ({}));
    const headerToken = csrfRes.headers.get('X-CSRF-Token') || csrfRes.headers.get('x-csrf-token');
    const fresh = csrfData?.csrfToken || headerToken || getCookie('XSRF-TOKEN');
    if (fresh) {
      cachedCsrfToken = fresh;
    }
    return cachedCsrfToken;
  } catch (e) {
    return cachedCsrfToken;
  }
}

/**
 * Core fetch wrapper
 */
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;

  const defaultOptions = {
    credentials: 'include', // Send cookies automatically
    cache: 'no-store',
    headers: {},
  };

  // If body is FormData, don't set Content-Type (browser handles boundary)
  if (options.body && !(options.body instanceof FormData)) {
    defaultOptions.headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {}),
    },
  };

  const method = (config.method || 'GET').toUpperCase();
  const isStateChanging = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method);

  if (isStateChanging) {
    if (!cachedCsrfToken) {
      cachedCsrfToken = getCookie('XSRF-TOKEN') || getCookie('csrfToken');
    }

    if (!cachedCsrfToken && !endpoint.includes('/auth/csrf-token')) {
      try {
        const csrfRes = await fetch(`${API_URL}/auth/csrf-token`, { credentials: 'include' });
        const csrfData = await csrfRes.json();
        const headerToken = csrfRes.headers.get('X-CSRF-Token') || csrfRes.headers.get('x-csrf-token');
        cachedCsrfToken = csrfData?.csrfToken || headerToken || getCookie('XSRF-TOKEN');
      } catch (e) {}
    }

    if (cachedCsrfToken) {
      config.headers['X-CSRF-Token'] = cachedCsrfToken;
    }
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    const csrfHeader = response.headers.get('X-CSRF-Token') || response.headers.get('x-csrf-token');
    if (csrfHeader) {
      cachedCsrfToken = csrfHeader;
    } else if (data?.csrfToken || data?.data?.csrfToken) {
      cachedCsrfToken = data.csrfToken || data.data?.csrfToken;
    }

    if (!response.ok) {
      // FIX 7: on 403 from a state-changing request, fetch a fresh CSRF token and retry ONCE
      if (
        response.status === 403 &&
        isStateChanging &&
        !options._retryCsrf &&
        !endpoint.includes('/auth/csrf-token')
      ) {
        try {
          const csrfRes = await fetch(`${API_URL}/auth/csrf-token`, { credentials: 'include' });
          const csrfData = await csrfRes.json().catch(() => ({}));
          const headerToken = csrfRes.headers.get('X-CSRF-Token') || csrfRes.headers.get('x-csrf-token');
          const freshToken = csrfData?.csrfToken || headerToken || getCookie('XSRF-TOKEN');
          if (freshToken) {
            cachedCsrfToken = freshToken;
            return await fetchAPI(endpoint, {
              ...options,
              _retryCsrf: true,
              headers: {
                ...(options.headers || {}),
                'X-CSRF-Token': freshToken,
              },
            });
          }
        } catch (e) {
          // If CSRF fetch fails, continue to global auth interceptor
        }
      }

      // FIX 6: Global 401 interceptor - redirect to /login on 401 ONLY when the current page is protected.
      // Never redirect for /auth/me or /auth/csrf-token, never redirect on 403, and never redirect on /login or /register.
      if (response.status === 401) {
        const cleanEndpoint = (endpoint || '').split('?')[0];
        const isAuthCheck = cleanEndpoint === '/auth/me' || cleanEndpoint === '/auth/csrf-token';

        if (!isAuthCheck && typeof window !== 'undefined') {
          const p = window.location.pathname.replace(/\/+$/, '') || '/';
          const isAuthPage = p === '/login' || p === '/register';
          const isProtectedPage = ['/dashboard', '/admin', '/add-business', '/profile', '/folder/new/admin'].some(
            (prefix) => p === prefix || p.startsWith(`${prefix}/`)
          );

          if (!isAuthPage && isProtectedPage) {
            window.location.href = '/login';
          }
        }
      }

      const retryAfterHeader = response.headers.get('Retry-After');
      const err = new ApiError(
        data.message || 'Something went wrong',
        response.status,
        data.errors || []
      );
      err.data = data;
      err.isBlocked = Boolean(data.isBlocked);
      err.retryAfter = data.retryAfter || (retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined);
      err.attemptsRemaining = data.attemptsRemaining;
      err.requiresVerification = Boolean(data.requiresVerification || data.requiresEmailVerification);
      err.email = data.email;
      throw err;
    }

    return data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      err.message || 'Network error. Please check your connection.',
      0
    );
  }
}

// ─── Convenience methods ───────────────────────────────────────────────────────
const api = {
  get: (endpoint) => fetchAPI(endpoint, { method: 'GET' }),

  post: (endpoint, body) =>
    fetchAPI(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  patch: (endpoint, body) =>
    fetchAPI(endpoint, {
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  delete: (endpoint) => fetchAPI(endpoint, { method: 'DELETE' }),
};

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authAPI = {
  register: async (data) => {
    await ensureFreshCsrfToken();
    return api.post('/auth/register', data);
  },
  login: async (data) => {
    await ensureFreshCsrfToken();
    return api.post('/auth/login', data);
  },
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  resendOtp: (data) => api.post('/auth/resend-otp', data),
  updateEmail: (data) => api.patch('/auth/email', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  verifyResetOtp: (data) => api.post('/auth/verify-reset-otp', data),
  resendResetOtp: (data) => api.post('/auth/resend-reset-otp', data),
  resetPasswordWithToken: (data) => api.post('/auth/reset-password', data),
  resetPassword: (tokenOrData) => {
    const token = tokenOrData?.token || tokenOrData?.resetToken;
    const newPassword = tokenOrData?.newPassword || tokenOrData?.password;
    if (token) {
      return api.post('/auth/reset-password', {
        email: tokenOrData?.email,
        resetToken: token,
        newPassword,
        password: newPassword,
        token,
      });
    }
    return api.post('/auth/reset-password', tokenOrData);
  },
  changePassword: (data) => api.patch('/auth/change-password', data),
  updateProfile: (formData) => api.patch('/auth/update-profile', formData),
};

// ─── Businesses API ───────────────────────────────────────────────────────────
export const businessAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
    ).toString();
    return api.get(`/businesses${qs ? `?${qs}` : ''}`);
  },
  getSummary: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
    ).toString();
    return api.get(`/businesses/summary${qs ? `?${qs}` : ''}`);
  },
  getById: (id) => api.get(`/businesses/${id}`),
  getMyBusinesses: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
    ).toString();
    return api.get(`/businesses/my${qs ? `?${qs}` : ''}`);
  },
  create: (formData) => api.post('/businesses', formData),
  update: (id, formData) => api.patch(`/businesses/${id}`, formData),
  delete: (id) => api.delete(`/businesses/${id}`),
  deleteImage: (id, publicId) => api.delete(`/businesses/${id}/images/${encodeURIComponent(publicId)}`),
};

// ─── Reviews API ──────────────────────────────────────────────────────────────
export const reviewAPI = {
  getForBusiness: (businessId, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/businesses/${businessId}/reviews${qs ? `?${qs}` : ''}`);
  },
  create: (businessId, data) => api.post(`/businesses/${businessId}/reviews`, data),
  update: (reviewId, data) => api.patch(`/reviews/${reviewId}`, data),
  delete: (reviewId) => api.delete(`/reviews/${reviewId}`),
};

// ─── Admin API ────────────────────────────────────────────────────────────────
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
    ).toString();
    return api.get(`/admin/users${qs ? `?${qs}` : ''}`);
  },
  getAllBusinesses: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
    ).toString();
    return api.get(`/admin/businesses${qs ? `?${qs}` : ''}`);
  },
  getPendingBusinesses: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/admin/businesses/pending${qs ? `?${qs}` : ''}`);
  },
  approveBusiness: (id) => api.patch(`/admin/businesses/${id}/approve`),
  rejectBusiness: (id) => api.patch(`/admin/businesses/${id}/reject`),
  updateUserRole: (id, role, permissions) => api.patch(`/admin/users/${id}/role`, { role, permissions }),
  updateUserPermissions: (id, permissions) => api.patch(`/admin/users/${id}/permissions`, { permissions }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getAllReviews: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
    ).toString();
    return api.get(`/admin/reviews${qs ? `?${qs}` : ''}`);
  },
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`),
  adminUpdateBusiness: (id, data) => api.patch(`/admin/businesses/${id}`, data),
  getPaymentHistory: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
    ).toString();
    return api.get(`/admin/payments${qs ? `?${qs}` : ''}`);
  },
  getBusinessById: (id) => api.get(`/admin/businesses/${id}`),
  getPaymentSettings: () => api.get('/admin/settings/payment'),
  updatePaymentSettings: (data) => api.patch('/admin/settings/payment', data),
  deletePaymentQrCode: () => api.delete('/admin/settings/payment/qr'),
  deleteReceipt: (businessId) => api.delete(`/admin/businesses/${businessId}/receipt`),
  updatePaymentStatus: (businessId, status) => api.patch(`/admin/businesses/${businessId}/payment`, { status }),
  addPaymentMethod: (formData) => api.post('/admin/settings/payment/methods', formData),
  updatePaymentMethod: (methodId, formData) => api.patch(`/admin/settings/payment/methods/${methodId}`, formData),
  deletePaymentMethod: (methodId) => api.delete(`/admin/settings/payment/methods/${methodId}`),
  togglePaymentMethod: (methodId) => api.patch(`/admin/settings/payment/methods/${methodId}/toggle`),
  getClaims: () => api.get('/admin/claims'),
  approveClaim: (claimId) => api.patch(`/admin/claims/${claimId}/approve`),
  rejectClaim: (claimId) => api.patch(`/admin/claims/${claimId}/reject`),
};

// ─── Claim API ────────────────────────────────────────────────────────────────
export const claimAPI = {
  requestClaim: (businessId, data) => api.post(`/businesses/${businessId}/claim`, data),
  verify: (data) => api.post('/claims/verify', data),
  complete: (data) => api.post('/claims/complete', data),
};

// ─── Settings API ─────────────────────────────────────────────────────────────
export const settingsAPI = {
  getPayment: () => api.get('/settings/payment'),
};

export { ApiError };
export default api;

