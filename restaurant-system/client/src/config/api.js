// Centralized API URL helper reading from VITE_API_URL (no trailing slash)
export const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export function apiUrl(path = "") {
  if (!path) return API_BASE;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}
