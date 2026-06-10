import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/auth.store';

const instance = axios.create({
  baseURL: '/api',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// 1. Tự động đính kèm Access Token trong memory.
// Refresh token nằm trong httpOnly cookie do BFF quản lý.
instance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 2. Xử lý 401 + Queue các request bị chặn
instance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const isAuthEndpoint =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/register');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      // Nếu đang refresh rồi → đưa vào hàng đợi
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return instance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post('/api/auth/refresh', {});

        const newAccessToken = data.data?.accessToken || data.accessToken;
        if (!newAccessToken) {
          throw new Error('No access token returned from refresh');
        }

        useAuthStore.getState().setTokens(newAccessToken);

        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return instance(originalRequest);
      } catch (err) {
        processQueue(err as AxiosError, null);
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') {
          // Instead of hard reloading the page, we just clear the state.
          // The application should react to isAuthenticated() becoming false.
          console.warn('Unauthorized, user logged out.');
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    // 3. Xử lý Transient Server Errors (502, 503, 504, Timeout) + Auto Retry với Exponential Backoff
    const isTransient =
      error.response?.status === 502 ||
      error.response?.status === 503 ||
      error.response?.status === 504 ||
      error.code === 'ECONNABORTED';

    const retryConfig = originalRequest as Record<string, ApiPayload>;
    if (isTransient && (!retryConfig._retryCount || retryConfig._retryCount < 3)) {
      retryConfig._retryCount = (retryConfig._retryCount || 0) + 1;
      const delay = Math.pow(2, retryConfig._retryCount) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return instance(originalRequest);
    }

    return Promise.reject(error);
  },
);

export default instance;
