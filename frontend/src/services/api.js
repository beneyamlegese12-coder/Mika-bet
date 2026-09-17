import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 👈 needed for cookie-based sessions (harmless for JWT)
  timeout: 30000,
});

// Request interceptor — attach JWT to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // 👈 use `api` instance, NOT raw axios — so it hits the backend
        const response = await api.post('/api/auth/refresh-token', { refreshToken });
        const { token, refreshToken: newRefreshToken } = response.data.data;

        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', newRefreshToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        delete api.defaults.headers.common['Authorization'];
        window.location.href = '/login';
        toast.error('Session expired. Please login again.');
        return Promise.reject(refreshError);
      }
    }

    if (error.response) {
      const { status, data } = error.response;

      if (status === 403) {
        if (data.code === 'EMAIL_NOT_VERIFIED') {
          toast.error('Please verify your email first');
        } else if (data.code === 'ACCOUNT_BLOCKED') {
          toast.error('Account has been blocked. Contact support.');
        } else {
          toast.error(data.message || 'Access denied');
        }
      } else if (status === 422 && data.errors) {
        data.errors.forEach((err) => {
          toast.error(`${err.field}: ${err.message}`);
        });
      } else if (status >= 500) {
        toast.error('Server error. Please try again later.');
      } else if (data.message) {
        toast.error(data.message);
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('An unexpected error occurred.');
    }

    return Promise.reject(error);
  }
);

export default api;
