// adminApi.js — Centralized, Secure Admin API client
// Uses credentials: "include" so HttpOnly cookies are attached automatically.
// Enforces CSRF defense header on all requests.

import { apiUrl } from "../config/api.js";

async function request(url, { method = "GET", body, isForm = false } = {}) {
  let res;
  try {
    const headers = {
      "X-Requested-With": "XMLHttpRequest",
    };
    if (body && !isForm) {
      headers["Content-Type"] = "application/json";
    }

    res = await fetch(apiUrl(url), {
      method,
      credentials: "include",
      headers,
      body: isForm ? body : body ? JSON.stringify(body) : undefined,
    });
  } catch {
    const err = new Error("Could not reach the server. Check your connection and try again.");
    err.network = true;
    throw err;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || "Something went wrong. Please try again.");
    err.status = res.status;
    err.errors = data.errors || {};
    throw err;
  }
  return data;
}

export const adminApi = {
  // Session & Authentication
  login: (email, password) =>
    request("/api/admin/login", { method: "POST", body: { email, password } }),
  logout: () => request("/api/admin/logout", { method: "POST" }),
  me: () => request("/api/admin/me"),

  // File Upload (with client-side security checks)
  upload: async (file) => {
    if (!file) throw new Error("No file selected.");
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      throw new Error("Only JPG, PNG, or WebP images are permitted.");
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("File size must not exceed 5 MB.");
    }

    const formData = new FormData();
    formData.append("file", file);
    return request("/api/upload", { method: "POST", body: formData, isForm: true });
  },

  // Categories CRUD
  categories: {
    list: () => request("/api/categories"),
    create: (data) => request("/api/categories", { method: "POST", body: data }),
    update: (id, data) => request(`/api/categories/${id}`, { method: "PUT", body: data }),
    remove: (id) => request(`/api/categories/${id}`, { method: "DELETE" }),
  },

  // Products CRUD
  products: {
    list: (params = {}) => {
      const q = new URLSearchParams();
      if (params.category) q.set("category", params.category);
      if (params.featured) q.set("featured", "true");
      if (params.search) q.set("search", params.search);
      if (params.limit) q.set("limit", String(params.limit));
      if (params.page) q.set("page", String(params.page));
      const qs = q.toString();
      return request(`/api/products${qs ? `?${qs}` : ""}`);
    },
    get: (id) => request(`/api/products/${id}`),
    create: (data) => request("/api/products", { method: "POST", body: data }),
    update: (id, data) => request(`/api/products/${id}`, { method: "PUT", body: data }),
    remove: (id) => request(`/api/products/${id}`, { method: "DELETE" }),
  },

  // Orders Management
  orders: {
    list: () => request("/api/orders"),
    updateStatus: (id, status) =>
      request(`/api/orders/${id}/status`, { method: "PATCH", body: { status } }),
  },

  // Customer Management
  customers: {
    list: () => request("/api/admin/customers"),
  },

  // Restaurant & Admin Settings
  settings: {
    get: () => request("/api/settings"),
    update: (data) => request("/api/settings", { method: "PUT", body: data }),
    changePassword: (data) =>
      request("/api/settings/change-password", { method: "POST", body: data }),
  },

  // Staff Management
  staff: {
    list: (params = {}) => {
      const q = new URLSearchParams();
      if (params.search) q.set("search", params.search);
      if (params.role) q.set("role", params.role);
      if (params.status) q.set("status", params.status);
      const qs = q.toString();
      return request(`/api/staff${qs ? `?${qs}` : ""}`);
    },
    create: (data) => request("/api/staff", { method: "POST", body: data }),
    update: (id, data) => request(`/api/staff/${id}`, { method: "PATCH", body: data }),
    toggleStatus: (id, isActive) =>
      request(`/api/staff/${id}/status`, { method: "PATCH", body: { isActive } }),
    resetPassword: (id, newPassword) =>
      request(`/api/staff/${id}/reset-password`, { method: "POST", body: { newPassword } }),
  },

  // Tables Management
  tables: {
    list: () => request("/api/tables"),
    create: (data) => request("/api/tables", { method: "POST", body: data }),
    updateStatus: (id, status) =>
      request(`/api/tables/${id}/status`, { method: "PATCH", body: { status } }),
  },
};
