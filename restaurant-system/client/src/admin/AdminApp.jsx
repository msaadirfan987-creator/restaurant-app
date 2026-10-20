import { useCallback, useEffect, useState } from "react";
import { adminApi } from "./adminApi";
import AdminLogin from "./AdminLogin";
import AdminShell, { PAGES } from "./AdminShell";

/**
 * AdminApp.jsx — Sub-router for all /admin/* paths.
 *   /admin/login        -> AdminLogin
 *   /admin/dashboard, /admin/products, /admin/categories, /admin/orders, /admin/customers, /admin/settings -> AdminShell
 */
function usePath() {
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = useCallback((to, { replace = false } = {}) => {
    window.history[replace ? "replaceState" : "pushState"]({}, "", to);
    setPath(to);
    window.scrollTo?.(0, 0);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  return [path, navigate];
}

function LoginRoute({ navigate, onNavigateHome }) {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let alive = true;
    adminApi
      .me()
      .then(() => alive && navigate("/admin/dashboard"))
      .catch(() => alive && setChecked(true));
    return () => {
      alive = false;
    };
  }, [navigate]);

  if (!checked) return null;

  return (
    <AdminLogin
      onSuccess={() => navigate("/admin/dashboard")}
      onNavigateHome={onNavigateHome}
    />
  );
}

export default function AdminApp({ onNavigateHome }) {
  const [path, navigate] = usePath();
  const known = path === "/admin/login" || !!PAGES[path];

  useEffect(() => {
    if (!known && path.startsWith("/admin")) {
      navigate("/admin/dashboard");
    }
  }, [known, path, navigate]);

  if (path === "/admin/login") {
    return <LoginRoute navigate={navigate} onNavigateHome={onNavigateHome} />;
  }

  if (PAGES[path] || path.startsWith("/admin")) {
    return <AdminShell path={path} navigate={navigate} />;
  }

  return null;
}
