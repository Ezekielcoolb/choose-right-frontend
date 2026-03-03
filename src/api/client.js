import axios from "axios";

const BASE_API_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api.hichooseright.com/api";
// import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
export const BASE_URL = BASE_API_URL.replace("/api", "");

const apiClient = axios.create({
  baseURL: BASE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to dynamically attach the correct token based on the route
apiClient.interceptors.request.use(
  (config) => {
    const url = (config.url || "").toLowerCase();

    // Retrieve all possible tokens from localStorage
    const managerToken = localStorage.getItem("manager_token");
    const csoToken = localStorage.getItem("cso_token");
    const customerToken = localStorage.getItem("customer_token");
    const adminToken = localStorage.getItem("token");

    // 1. Identify context from browser URL (Current active page)
    const path = (
      typeof window !== "undefined" ? window.location.pathname : ""
    ).toLowerCase();
    const isCsoPage = path.startsWith("/cso");
    const isManagerPage = path.startsWith("/manager");
    const isCustomerPage = path.startsWith("/customer");
    const isAdminPage = path.startsWith("/admin");

    // 2. Identify context from API endpoint URL
    const isCsoApi =
      url.startsWith("/cso") ||
      url.startsWith("/csos") ||
      (isCsoPage &&
        (url.includes("/customers") ||
          url.includes("/savings") ||
          url.includes("/loans")));
    const isManagerApi = url.startsWith("/manager");

    // Strict match for customer portal: starts with "/customer" (singular)
    const isCustomerPortalApi =
      url.startsWith("/customer") && !url.startsWith("/customers");
    const isAdminApi = url.startsWith("/admin");

    let token = null;

    // 3. Selection Logic based on explicit API intent OR browser context fallback
    if (isAdminApi) {
      token = adminToken || managerToken || csoToken;
    } else if (isManagerApi) {
      token = managerToken || adminToken;
    } else if (isCsoApi) {
      token = csoToken || managerToken || adminToken;
    } else if (isCustomerPortalApi) {
      token = customerToken || adminToken;
    } else {
      // Ambiguous URLs (e.g. /customers, /savings, /loans): Use browser context to prioritize the right token
      if (isManagerPage) token = managerToken || adminToken;
      else if (isCsoPage) token = csoToken || managerToken || adminToken;
      else if (isCustomerPage) token = customerToken || adminToken;
      else if (isAdminPage) token = adminToken || managerToken || csoToken;
      else {
        // Absolute fallback if no clear context
        token = adminToken || managerToken || csoToken || customerToken;
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Deprecated: Kept for backward compatibility but does nothing now
export const setAuthToken = (token) => {
  // No-op: Interceptor handles this dynamically
};

export default apiClient;
