import { useCallback, useMemo, useRef, useState } from "react";
import { adminApi } from "./adminApi";
import useAdminSession from "./useAdminSession";
import AdminLayout from "./AdminLayout";
import { AdminContext } from "./AdminContext";
import { Toaster } from "./ui";
import DashboardHome from "./DashboardHome";
import ProductsPage from "./ProductsPage";
import CategoriesPage from "./CategoriesPage";
import OrdersPage from "./OrdersPage";
import CustomersPage from "./CustomersPage";
import SettingsPage from "./SettingsPage";
import StaffManagement from "./StaffManagement";

/**
 * AdminShell — Verifies session with server (GET /api/admin/me) before rendering layout + active sub-page.
 * Automatically catches 401/403 and routes to login.
 */
export const PAGES = {
  "/admin/dashboard": { key: "dashboard", title: "Dashboard", Component: DashboardHome },
  "/admin/products": { key: "products", title: "Products", Component: ProductsPage },
  "/admin/categories": { key: "categories", title: "Categories", Component: CategoriesPage },
  "/admin/orders": { key: "orders", title: "Orders", Component: OrdersPage },
  "/admin/customers": { key: "customers", title: "Customers", Component: CustomersPage },
  "/admin/staff": { key: "staff", title: "Staff Management", Component: StaffManagement },
  "/admin/settings": { key: "settings", title: "Settings", Component: SettingsPage },
};

const stateCss = `
.sh-state {
  min-height: 100vh;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #151a17;
  color: #f4ead5;
  font-family: "Inter", "Segoe UI", system-ui, sans-serif;
  text-align: center;
  padding: 24px;
}
.sh-state p { margin: 0; color: rgba(244, 234, 213, 0.8); }
.sh-spin {
  width: 34px;
  height: 34px;
  border: 3px solid rgba(244, 234, 213, 0.2);
  border-top-color: #d9a441;
  border-radius: 50%;
  animation: sh-spin 800ms linear infinite;
}
@keyframes sh-spin { to { transform: rotate(360deg); } }
.sh-retry {
  cursor: pointer;
  padding: 11px 24px;
  border: 2px solid #d9a441;
  border-radius: 8px;
  background: #d9a441;
  color: #151a17;
  font-family: inherit;
  font-size: 15px;
  font-weight: 700;
}
`;

export default function AdminShell({ path, navigate }) {
  const toLogin = useCallback(() => navigate("/admin/login"), [navigate]);
  const session = useAdminSession(toLogin);
  const [userOverride, setUser] = useState(null);
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const notify = useCallback((message, type = "success") => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const fail = useCallback(
    (err) => {
      if (err?.status === 401 || err?.status === 403) return toLogin();
      notify(err?.message || "Something went wrong.", "error");
    },
    [toLogin, notify]
  );

  const logout = async () => {
    try {
      await adminApi.logout();
    } catch {
      // Cookie is cleared by server
    }
    toLogin();
  };

  const user = userOverride || session.user;
  const ctx = useMemo(
    () => ({ user, setUser, navigate, notify, fail }),
    [user, navigate, notify, fail]
  );

  if (session.status === "loading") {
    return (
      <div className="sh-state" role="status">
        <style>{stateCss}</style>
        <span className="sh-spin" />
        <p>Checking your session...</p>
      </div>
    );
  }

  if (session.status === "error") {
    return (
      <div className="sh-state" role="alert">
        <style>{stateCss}</style>
        <p>{session.error}</p>
        <button type="button" className="sh-retry" onClick={session.retry}>
          Try again
        </button>
      </div>
    );
  }

  const page = PAGES[path] || PAGES["/admin/dashboard"];
  const { Component } = page;

  return (
    <AdminContext.Provider value={ctx}>
      <AdminLayout
        user={user}
        pageKey={page.key}
        title={page.title}
        onNavigate={navigate}
        onLogout={logout}
      >
        <Component />
      </AdminLayout>
      <Toaster toasts={toasts} />
    </AdminContext.Provider>
  );
}
