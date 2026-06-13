import axios from 'axios';

// In development the Vite proxy rewrites /api → localhost:8000.
// In production set VITE_API_BASE_URL=https://your-app.onrender.com/api in Vercel.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Converts /uploads/... relative paths to full backend URLs.
// In dev the Vite proxy handles it; in production we prepend the Railway origin.
const _apiOrigin = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/api$/, '');
export const getMediaUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${_apiOrigin}${path}`;
};

// Interceptor: agregar token a cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: manejar errores de auth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// === AUTH ===
export const authAPI = {
  login: (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    return api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },
  register: (data) => api.post('/auth/register', data),

  // Verificación de email
  verifyEmail: (token) => api.get(`/auth/verify-email?token=${token}`),
  resendVerification: (email) => api.post(`/auth/resend-verification?email=${encodeURIComponent(email)}`),

  // 2FA
  generate2FA: () => api.post('/auth/2fa/generate'),
  enable2FA: (code) => api.post('/auth/2fa/enable', { code }),
  disable2FA: (code) => api.post('/auth/2fa/disable', { code }),
  verify2FA: (tempToken, code) => api.post('/auth/2fa/verify', { temp_token: tempToken, code }),

  // 2FA por correo
  setupEmail2FA: () => api.post('/auth/2fa/email/setup'),
  enableEmail2FA: (code) => api.post('/auth/2fa/email/enable', { code }),
  disableEmail2FA: (password) => api.post('/auth/2fa/email/disable', { password }),
  sendEmail2FA: (tempToken) => api.post('/auth/2fa/email/send', { temp_token: tempToken }),
  verifyEmail2FA: (tempToken, code) => api.post('/auth/2fa/email/verify', { temp_token: tempToken, code }),

  // Recuperación de contraseña
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
};

// === USERS ===
export const usersAPI = {
  getMe: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
  uploadAvatar: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/users/me/avatar', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getPublicProfile: (id) => api.get(`/users/${id}`),
  searchBloodDonors: (params) => api.get('/users/donors/blood', { params }),
};

// === SUPPLIES ===
export const suppliesAPI = {
  list: (params) => api.get('/supplies/', { params }),
  get: (id) => api.get(`/supplies/${id}`),
  create: (data) => api.post('/supplies/', data),
  update: (id, data) => api.put(`/supplies/${id}`, data),
  delete: (id) => api.delete(`/supplies/${id}`),
  getMy: () => api.get('/supplies/my'),
  uploadImages: (id, files) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    return api.post(`/supplies/${id}/images`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  toggleFavorite: (id) => api.post(`/supplies/${id}/favorite`),
  getFavorites: () => api.get('/supplies/favorites/my'),
};

// === REQUESTS ===
export const requestsAPI = {
  create: (data) => api.post('/requests/', data),
  getSent: () => api.get('/requests/sent'),
  getReceived: () => api.get('/requests/received'),
  getMyForSupply: (supplyId) => api.get(`/requests/supply/${supplyId}/my`),
  respond: (id, data) => api.put(`/requests/${id}/respond`, data),
  complete: (id) => api.put(`/requests/${id}/complete`),
  cancel: (id) => api.put(`/requests/${id}/cancel`),
};

// === REVIEWS ===
export const reviewsAPI = {
  create: (data) => api.post('/reviews/', data),
  getForUser: (userId) => api.get(`/reviews/user/${userId}`),
  canReview: (requestId) => api.get(`/reviews/can-review/${requestId}`),
};

// === NOTIFICATIONS ===
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications/', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// === MESSAGES ===
export const messagesAPI = {
  getConversations: () => api.get('/messages/'),
  getMessages: (requestId) => api.get(`/messages/${requestId}`),
  send: (data) => api.post('/messages/', data),
};

// === ALERTAS DE BÚSQUEDA ===
export const alertsAPI = {
  list: () => api.get('/alerts/'),
  create: (data) => api.post('/alerts/', data),
  toggle: (id) => api.put(`/alerts/${id}/toggle`),
  delete: (id) => api.delete(`/alerts/${id}`),
};

// === INSIGNIAS ===
export const badgesAPI = {
  getMine: () => api.get('/users/me/badges'),
  getForUser: (id) => api.get(`/users/${id}/badges`),
};

// === ESTADÍSTICAS PÚBLICAS ===
export const statsAPI = {
  getPublic: () => api.get('/stats'),
};

// === BLOOD DONOR RECORD ===
export const bloodAPI = {
  getRecord: () => api.get('/blood/record'),
  saveRecord: (data) => api.post('/blood/record', data),
  deleteRecord: () => api.delete('/blood/record'),
  getEligibility: () => api.get('/blood/record/eligibility'),
  getDonations: () => api.get('/blood/record/donations'),
  registerDonation: (data) => api.post('/blood/record/donations', data),
  getPublicProfile: (userId) => api.get(`/blood/record/public/${userId}`),
};

// === ADMIN ===
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUserActive: (id) => api.put(`/admin/users/${id}/toggle-active`),
  toggleUserVerified: (id) => api.put(`/admin/users/${id}/verify`),
  changeUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  getSupplies: (params) => api.get('/admin/supplies', { params }),
  deleteSupply: (id) => api.delete(`/admin/supplies/${id}`),
  setSupplyStatus: (id, status) => api.put(`/admin/supplies/${id}/status`, { status }),
  getRequests: (params) => api.get('/admin/requests', { params }),
};

export default api;
