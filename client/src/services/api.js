import axios from 'axios';

const defaultUrl = import.meta.env.PROD
  ? 'https://library-management-system-w4rx.onrender.com/api'
  : 'http://localhost:5000/api';

let rawUrl = import.meta.env.VITE_API_URL || defaultUrl;
if (!rawUrl.endsWith('/api')) {
  rawUrl = rawUrl.replace(/\/+$/, '') + '/api';
}
const API_BASE = rawUrl;

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

// ==================== Book API ====================
export const bookAPI = {
  getAll: (params = {}) => api.get('/books', { params }),
  getById: (id) => api.get(`/books/${id}`),
  create: (data) => api.post('/books', data),
  update: (id, data) => api.put(`/books/${id}`, data),
  delete: (id) => api.delete(`/books/${id}`),
  verify: (code) => api.get(`/books/verify/${encodeURIComponent(code)}`),
  getCategories: () => api.get('/books/categories'),
  regenerateQR: (id) => api.post(`/books/${id}/regenerate-qr`),
};

// ==================== Transaction API ====================
export const transactionAPI = {
  getAll: (params = {}) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  issue: (data) => api.post('/transactions/issue', data),
  return: (data) => api.post('/transactions/return', data),
  getOverdue: () => api.get('/transactions/overdue'),
};

// ==================== Dashboard API ====================
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

// ==================== Report API ====================
export const reportAPI = {
  exportCSV: (params = {}) => {
    const queryStr = new URLSearchParams(params).toString();
    window.open(`${API_BASE}/reports/export/csv${queryStr ? '?' + queryStr : ''}`, '_blank');
  },
  exportExcel: (params = {}) => {
    const queryStr = new URLSearchParams(params).toString();
    window.open(`${API_BASE}/reports/export/excel${queryStr ? '?' + queryStr : ''}`, '_blank');
  },
};

// ==================== AI API ====================
export const aiAPI = {
  smartSearch: (query) => api.post('/ai/smart-search', { query }),
  recommend: (studentId) => api.post('/ai/recommend', { studentId }),
  categorize: (title, description = '') => api.post('/ai/categorize', { title, description }),
  chat: (message) => api.post('/ai/chat', { message }),
};

// ==================== Borrower API ====================
export const borrowerAPI = {
  getAll: (params = {}) => api.get('/borrowers', { params }),
  getById: (id) => api.get(`/borrowers/${id}`),
  create: (data) => api.post('/borrowers', data),
  verify: (code) => api.get(`/borrowers/verify/${encodeURIComponent(code)}`),
};

export default api;
