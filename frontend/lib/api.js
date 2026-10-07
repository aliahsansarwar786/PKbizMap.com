/**
 * Centralized API client for the Business Directory frontend.
 * - Always sends cookies (credentials: 'include')
 * - Handles JSON automatically
 * - Returns consistent response structure
 * - Handles auth failures globally
 */

const API_URL = 'http://localhost:5001/api';

class ApiError extends Error {
  constructor(message, status, errors = []) {
    super(message);
    this.status = status;
    this.errors = errors;
    this.name = 'ApiError';
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

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || 'Something went wrong',
        response.status,
        data.errors || []
      );
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
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
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
  deleteBusiness: (id) => api.delete(`/admin/businesses/${id}`),
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getAllReviews: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/admin/reviews${qs ? `?${qs}` : ''}`);
  },
};

export { ApiError };
export default api;
