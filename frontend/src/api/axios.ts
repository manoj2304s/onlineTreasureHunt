import axios from "axios";
import { router } from "expo-router";
import { getToken, removeToken } from "../utils/storage";

const API = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL as string,
});

let isRedirectingToLogin = false;

API.interceptors.request.use(async (config) => {
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
