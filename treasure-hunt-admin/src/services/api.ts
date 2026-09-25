import axios from "axios";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL as string,
});

const isSessionExpiredError = (error: any) => {
  if (error?.response?.status !== 401) return false;

  const message = String(error?.response?.data?.message ?? "").toLowerCase();

  const authOnlyMessages = [
    "not authorized",
    "token invalid",
    "no token",
    "user not found",
  ];

  return authOnlyMessages.some((entry) => message.includes(entry));
};

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isSessionExpiredError(error) && typeof window !== "undefined") {
      localStorage.removeItem("adminToken");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login?reason=session_expired";
      }
    }

    return Promise.reject(error);
  }
);

export default API;
