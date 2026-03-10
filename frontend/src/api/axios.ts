import axios from "axios";
import { getToken } from "../utils/storage";

const API = axios.create({
  baseURL: "http://192.168.1.5:5000/",
});

API.interceptors.request.use(async (config) => {
  const token = await getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log("API ERROR:", error.response?.data);
    return Promise.reject(error);
  },
);

export default API;
