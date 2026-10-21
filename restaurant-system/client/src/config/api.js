// Centralized API URL & Auth Header helper
export const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export const TOKEN_KEY = "bh_auth_token";

export function getAuthToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function setAuthToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {}
}

export function apiUrl(path = "") {
  if (!path) return API_BASE;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}

export function authHeaders(extraHeaders = {}) {
  const token = getAuthToken();
  const headers = {
    "X-Requested-With": "XMLHttpRequest",
    ...extraHeaders,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}
