import axios from 'axios';
import { API_BASE_URL } from '../constants/api';
import { storage } from './storage';
import { useAuthStore } from '../features/auth/auth.store';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await storage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const AUTH_ENDPOINTS_WITHOUT_REFRESH = [
  '/auth/login',
  '/auth/register',
  '/auth/google',
  '/auth/refresh',
  '/auth/verify-otp',
  '/auth/forgot-password',
];

function shouldSkipRefresh(url?: string) {
  if (!url) return false;
  return AUTH_ENDPOINTS_WITHOUT_REFRESH.some((endpoint) => url.startsWith(endpoint));
}

function createSessionExpiredError() {
  const error = new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  error.name = 'SESSION_EXPIRED';
  return error;
}

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((promise) => {
    if (error) promise.reject(error);
    else promise.resolve(token!);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status !== 401 ||
      originalRequest?._retry ||
      shouldSkipRefresh(originalRequest?.url)
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await storage.getRefreshToken();
      if (!refreshToken) throw new Error('No refresh token');

      const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });
      const accessToken = data?.data?.accessToken;
      const nextRefreshToken = data?.data?.refreshToken;
      if (!accessToken || !nextRefreshToken) throw new Error('Invalid refresh response');

      await storage.setTokens(accessToken, nextRefreshToken);
      processQueue(null, accessToken);
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await useAuthStore.getState().logout();
      return Promise.reject(createSessionExpiredError());
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
