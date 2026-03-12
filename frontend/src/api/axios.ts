import axios from "axios";
import { router } from "expo-router";
import { getToken, removeToken } from "../utils/storage";

const rawApiUrl = process.env.EXPO_PUBLIC_API_URL ?? "";
const normalizedApiUrl = rawApiUrl.trim().replace(/\/+$/, "");

const API = axios.create({
  baseURL: normalizedApiUrl,
  timeout: 15000,
});

let isRedirectingToLogin = false;

API.interceptors.request.use(async (config) => {
  if (!normalizedApiUrl) {
    return Promise.reject(
      new Error(
        "Missing EXPO_PUBLIC_API_URL. Set it in frontend/.env before building the app.",
      ),
    );
  }

  const token = await getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      const requestUrl = error?.config?.url ?? "";
      const isLoginRequest = requestUrl.includes("/auth/login");

      if (!isLoginRequest) {
        await removeToken();

        if (!isRedirectingToLogin) {
          isRedirectingToLogin = true;
          router.replace("/login?reason=session_expired");

          setTimeout(() => {
            isRedirectingToLogin = false;
          }, 300);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default API;
