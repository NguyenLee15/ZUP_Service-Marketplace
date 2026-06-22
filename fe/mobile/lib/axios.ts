/**
 * Axios instance với interceptors
 * - Tự động gắn Authorization header
 * - Tự động refresh token khi 401
 */
import axios from "axios";
import { API_BASE_URL } from "../constants/api";
import { storage } from "./storage";
import { useAuthStore } from "../features/auth/auth.store";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor — gắn token
api.interceptors.request.use(async (config) => {
  const token = await storage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — auto refresh token khi 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const AUTH_ENDPOINTS_WITHOUT_REFRESH = [
  "/auth/login",
  "/auth/register",
  "/auth/provider/google",
  "/auth/refresh",
  "/auth/verify-otp",
  "/auth/forgot-password",
];

const shouldSkipRefresh = (url?: string) => {
  if (!url) return false;
  return AUTH_ENDPOINTS_WITHOUT_REFRESH.some((endpoint) =>
    url.startsWith(endpoint),
  );
};

const createSessionExpiredError = () => {
  const error = new Error(
    "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  );
  error.name = "SESSION_EXPIRED";
  return error;
};

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !shouldSkipRefresh(originalRequest?.url)
    ) {
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
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken = data.data.accessToken;
        const newRefreshToken = data.data.refreshToken;

        await storage.setTokens(newAccessToken, newRefreshToken);
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await useAuthStore.getState().logout();
        // Navigation sẽ redirect về login qua auth check trong root layout
        return Promise.reject(createSessionExpiredError());
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
