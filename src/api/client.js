import axios from "axios";

const BASE_API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
export const BASE_URL = BASE_API_URL.replace("/api", "");

const apiClient = axios.create({
  baseURL: BASE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
};

export default apiClient;
