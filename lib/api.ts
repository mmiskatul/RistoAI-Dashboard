import axios, { AxiosError } from "axios";

const FALLBACK_API_BASE_URL = "http://127.0.0.1:8000";

const normalizeBaseUrl = (value: string): string => value.replace(/\/+$/, "");

export const getApiBaseUrl = (): string =>
  normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL || FALLBACK_API_BASE_URL);

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((request) => {
    if (error) {
      request.reject(error);
    } else {
      request.resolve(token);
    }
  });

  failedQueue = [];
};

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; detail?: string }>) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    if (typeof window === "undefined") {
      return Promise.reject(error);
    }

    const accessToken = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");
    const requestUrl = String(originalRequest?.url || "");
    const isRefreshRequest = requestUrl.includes("/api/v1/auth/refresh");

    if (error.response?.status === 401 && accessToken && !originalRequest?._retry && !isRefreshRequest) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest?.headers && token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((queueError) => Promise.reject(queueError));
      }

      if (!refreshToken) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        window.location.href = "/auth";
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(`${getApiBaseUrl()}/api/v1/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const newTokens = refreshResponse.data as {
          access_token: string;
          refresh_token: string;
          token_type: string;
        };

        localStorage.setItem("access_token", newTokens.access_token);
        localStorage.setItem("refresh_token", newTokens.refresh_token);
        document.cookie = `access_token=${newTokens.access_token}; path=/; max-age=86400; SameSite=Lax`;

        processQueue(null, newTokens.access_token);

        if (originalRequest?.headers) {
          originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        window.location.href = "/auth";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      window.location.href = "/auth";
    }

    return Promise.reject(error);
  }
);

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.response?.data?.detail ||
      error.message ||
      fallback
    );
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};
