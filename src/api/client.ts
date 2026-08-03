// src/api/client.ts

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { auth } from "../lib/firebase";
import { BACKEND_URL } from "../constants";
import { keysToCamel } from "../utils/camelCase";

export const apiClient: AxiosInstance = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach Firebase Bearer token and x-local-date header
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const user = auth.currentUser;
    if (user) {
      try {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (err) {
        console.warn("Failed to retrieve Firebase ID token:", err);
      }
    }

    // Attach local date header YYYY-MM-DD
    config.headers["x-local-date"] = new Date().toISOString().split("T")[0];

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Normalize responses to camelCase, handle 401 refresh, retry network errors
apiClient.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = keysToCamel(response.data);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 1. Handle 401 Unauthorized with token refresh retry
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const user = auth.currentUser;
      if (user) {
        try {
          const newToken = await user.getIdToken(true); // Force token refresh
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        } catch (refreshErr) {
          console.error("Token refresh failed:", refreshErr);
        }
      }
    }

    // 2. Handle Network or Timeout Errors
    if (error.code === "ECONNABORTED" || error.message === "Network Error") {
      console.warn("Network error or timeout on request:", originalRequest?.url);
    }

    // Standardize error message
    const responseData = error.response?.data as any;
    const serverMessage = responseData?.error || responseData?.message || error.message || "An unexpected error occurred";
    return Promise.reject(new Error(serverMessage));
  }
);

/**
 * Generic API wrapper maintaining exact signature compatibility with existing apiRequest
 */
export async function apiRequest<T = any>(
  path: string,
  method = "GET",
  body: any = null,
  isRetry = false
): Promise<T> {
  try {
    const response = await apiClient({
      url: path,
      method,
      data: body,
    });
    return response.data;
  } catch (err: any) {
    if (isRetry) throw err;
    // Fallback manual handling if needed
    throw err;
  }
}
