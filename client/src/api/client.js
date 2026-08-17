import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sunrise_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const token = localStorage.getItem('sunrise_token');
      if (token) {
        // Session expired — clear and redirect to login.
        localStorage.removeItem('sunrise_token');
        localStorage.removeItem('sunrise_user');
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

/** Friendly error message extractor. */
export function errorMessage(err, fallback = 'Unable to load data.') {
  return err?.response?.data?.message || err?.message || fallback;
}

export default api;
