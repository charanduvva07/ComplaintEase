import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  timeout: 15000, // 15s — was 30s (users shouldn't wait >15s before seeing error)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Separate instance for file uploads (needs longer timeout for Cloudinary uploads)
export const uploadApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  timeout: 60000, // 60s for file uploads
});

// Request interceptor – attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ce_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Also attach token to upload API
uploadApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ce_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor – handle errors globally
const handleResponseError = (error) => {
  if (error.response?.status === 401) {
    localStorage.removeItem('ce_token');
    localStorage.removeItem('ce_user');
    if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
      window.location.href = '/login';
    }
  }

  // Make timeout errors user-friendly
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return Promise.reject({
      message: 'The request timed out. The server may be starting up — please try again in a moment.',
      success: false,
    });
  }

  // Network error (Render cold start / offline)
  if (!error.response) {
    return Promise.reject({
      message: 'Unable to connect to the server. Please check your connection and try again.',
      success: false,
    });
  }

  return Promise.reject(error.response?.data || { message: 'Something went wrong', success: false });
};

api.interceptors.response.use((response) => response.data, handleResponseError);
uploadApi.interceptors.response.use((response) => response.data, handleResponseError);

export default api;
