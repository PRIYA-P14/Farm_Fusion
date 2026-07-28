import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const api = axios.create({ baseURL: BASE });

// Attach JWT token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('agri-token') || sessionStorage.getItem('agri-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authAPI = {
  register:    (data) => api.post('/auth/register', data),
  login:       (data) => api.post('/auth/login', data),
  googleLogin: (data) => api.post('/auth/google', data),
  profile:     ()     => api.get('/auth/profile'),
};

export const soilAPI = {
  createReport:      (data)   => api.post('/reports', data),
  analyseWithImage:  (data)   => api.post('/reports/analyse-with-image', data),
  uploadImage:       (fd)     => api.post('/reports/upload-image', fd),
  getReports:        (params) => api.get('/reports', { params }),
  getReport:         (id)     => api.get(`/reports/${id}`),
  deleteReport:      (id)     => api.delete(`/reports/${id}`),
  agentHealth:       ()       => api.get('/agent/health'),
  agentContext:      (id)     => api.get(`/agent/soil-context/${id}`),
};

export const govAPI = {
  analyse:     (data)   => api.post('/government/analyse', data),
  getReports:  (params) => api.get('/government/reports', { params }),
  getReport:   (id)     => api.get(`/government/reports/${id}`),
  deleteReport:(id)     => api.delete(`/government/reports/${id}`),
  getStats:    ()       => api.get('/government/stats'),
  health:      ()       => api.get('/government/health'),
  exportCSV:   ()       => api.get('/government/reports/export/csv', { responseType: 'blob' }),
};

export const weatherAPI = {
  get: (params) => api.get('/weather', { params }),
};
