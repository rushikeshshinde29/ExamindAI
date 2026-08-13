import axios from 'axios';
import toast from 'react-hot-toast';

const API = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
API.interceptors.request.use(cfg => {
  const token = localStorage.getItem('qmp_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Endpoints where a 401 is an expected "wrong credentials" response,
// not an expired-session response — these must NOT trigger the global redirect.
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];

// Handle 401 globally (session expiry only — login/register failures are handled by their own forms)
API.interceptors.response.use(
  res => res,
  err => {
    const url = err.config?.url || '';
    const isAuthEndpoint = AUTH_ENDPOINTS.some(ep => url.includes(ep));
    const hadToken = !!localStorage.getItem('qmp_token');

    if (err.response?.status === 401 && hadToken && !isAuthEndpoint) {
      localStorage.removeItem('qmp_token');
      localStorage.removeItem('qmp_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── AUTH ─────────────────────────────────────────────────────
export const authApi = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  me: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/profile', data),
  changePassword: (data) => API.put('/auth/change-password', data),
  forgotPassword: (email) => API.post('/auth/forgot-password', { email }),
  resetPassword: (data) => API.post('/auth/reset-password', data),
};

// ── QUIZZES ──────────────────────────────────────────────────
export const quizApi = {
  getAll: (params) => API.get('/quizzes', { params }),
  getById: (id) => API.get(`/quizzes/${id}`),
  create: (data) => API.post('/quizzes', data),
  update: (id, data) => API.put(`/quizzes/${id}`, data),
  delete: (id) => API.delete(`/quizzes/${id}`),
  togglePublish: (id) => API.patch(`/quizzes/${id}/publish`),
  getResults: (id) => API.get(`/quizzes/${id}/results`),
  getLeaderboard: (id) => API.get(`/quizzes/leaderboard/${id}`),
};

// ── QUESTIONS ─────────────────────────────────────────────────
export const questionApi = {
  getByQuiz: (quizId) => API.get(`/questions/quiz/${quizId}`),
  create: (quizId, data) => API.post(`/questions/${quizId}`, data),
  update: (id, data) => API.put(`/questions/${id}`, data),
  delete: (id) => API.delete(`/questions/${id}`),
  bulk: (quizId, data) => API.post(`/questions/bulk/${quizId}`, data),
};

// ── ATTEMPTS ──────────────────────────────────────────────────
export const attemptApi = {
  start: (data) => API.post('/attempts/start', data),
  submit: (id, data) => API.post(`/attempts/${id}/submit`, data),
  antiCheat: (id, data) => API.post(`/attempts/${id}/anticheat`, data),
  my: () => API.get('/attempts/my'),
  get: (id) => API.get(`/attempts/${id}`),
  feedback: (id, data) => API.post(`/attempts/${id}/feedback`, data),
};

// ── AI ────────────────────────────────────────────────────────
export const aiApi = {
  generate: (data) => API.post('/ai/generate', data),
};

// ── CERTIFICATES ──────────────────────────────────────────────
export const certApi = {
  my: () => API.get('/certificates/my'),
  verify: (id) => API.get(`/certificates/verify/${id}`),
};

// ── ANALYTICS ─────────────────────────────────────────────────
export const analyticsApi = {
  student: () => API.get('/analytics/student'),
  faculty: () => API.get('/analytics/faculty'),
};

// ── ADMIN ─────────────────────────────────────────────────────
export const adminApi = {
  stats: () => API.get('/admin/stats'),
  users: (role, params) => API.get(`/admin/users/${role}`, { params }),
  createUser: (data) => API.post('/admin/users', data),
  updateStatus: (id, data) => API.put(`/admin/users/${id}/status`, data),
  deleteUser: (id) => API.delete(`/admin/users/${id}`),
  quizzes: () => API.get('/admin/quizzes'),
};

export default API;
