// cashierApi.js — Secure Cashier API client
// Automatically sends credentials: "include" and X-Requested-With header.

async function request(url, { method = "GET", body } = {}) {
  let res;
  try {
    const headers = {
      "X-Requested-With": "XMLHttpRequest",
    };
    if (body) {
      headers["Content-Type"] = "application/json";
    }

    res = await fetch(url, {
      method,
      credentials: "include",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    const err = new Error("Could not reach the server. Check your connection.");
    err.network = true;
    throw err;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || "Request failed.");
    err.status = res.status;
    throw err;
  }
  return data;
}

export const cashierApi = {
  // Session / Auth
  me: () => request("/api/auth/me"),
  logout: () => request("/api/auth/logout", { method: "POST" }),

  // Shift & Daily Stats
  getStats: () => request("/api/cashier/stats"),

  // Orders
  getOrders: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") q.set(k, String(v));
    });
    const qs = q.toString();
    return request(`/api/cashier/orders${qs ? `?${qs}` : ""}`);
  },
  getOrder: (id) => request(`/api/cashier/orders/${id}`),
  createOrder: (data) => request("/api/cashier/orders", { method: "POST", body: data }),
  recordPayment: (id, amountReceived) =>
    request(`/api/cashier/orders/${id}/pay`, { method: "POST", body: { amountReceived } }),
  updateStatus: (id, status, reason = "") =>
    request(`/api/cashier/orders/${id}/status`, { method: "PATCH", body: { status, reason } }),

  // Tables & Menu for POS
  getTables: () => request("/api/tables"),
  getMenu: () => request("/api/products?limit=100"),

  // Profile
  getProfile: () => request("/api/cashier/profile"),
  updateProfile: (data) => request("/api/cashier/profile", { method: "PATCH", body: data }),
};
