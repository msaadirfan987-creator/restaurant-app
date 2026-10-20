import { useEffect, useState } from "react";
import { UiStyles } from "./ui";

/**
 * AdminLayout.jsx — Responsive Sidebar + Top Bar + Content Canvas.
 */

const COLORS = {
  bg: "#151a17",
  surface: "#1b211e",
  green: "#1f4a38",
  amber: "#d9a441",
  cream: "#f4ead5",
};

export const NAV = [
  { key: "dashboard", label: "Dashboard", href: "/admin/dashboard" },
  { key: "products", label: "Products", href: "/admin/products" },
  { key: "categories", label: "Categories", href: "/admin/categories" },
  { key: "orders", label: "Orders", href: "/admin/orders" },
  { key: "customers", label: "Customers", href: "/admin/customers" },
  { key: "staff", label: "Staff", href: "/admin/staff" },
  { key: "settings", label: "Settings", href: "/admin/settings" },
];

export default function AdminLayout({
  user,
  pageKey = "dashboard",
  title = "Dashboard",
  nav = NAV,
  onNavigate,
  onLogout,
  children,
  brand = "Burger House",
  mark = "BH",
}) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setLoggingOut(false);
    }
  };

  const initial = (user?.name || user?.email || "A").trim().charAt(0).toUpperCase();

  const handleNavigate = (href) => {
    setOpen(false);
    if (onNavigate) {
      onNavigate(href, { replace: false });
    } else {
      window.history.pushState({}, "", href);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  const handleGoToSite = () => {
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="ad-shell">
      <style>{css}</style>
      <UiStyles />

      <aside className={`ad-side ${open ? "is-open" : ""}`} aria-label="Admin navigation">
        <div className="ad-side-top">
          <span className="ad-mark">{mark}</span>
          <span className="ad-brand">{brand}</span>
        </div>

        <nav className="ad-nav">
          {nav.map((n, i) => (
            <a
              key={n.key}
              href={n.href}
              className={`ad-link ${n.key === pageKey ? "is-active" : ""}`}
              style={{ "--i": i }}
              aria-current={n.key === pageKey ? "page" : undefined}
              onClick={(e) => {
                e.preventDefault();
                handleNavigate(n.href);
              }}
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "auto" }}>
          <button
            type="button"
            className="ad-btn ad-btn--ghost"
            style={{ fontSize: "13px", padding: "8px 14px", textAlign: "left" }}
            onClick={handleGoToSite}
          >
            ← View Website
          </button>
          <button
            type="button"
            className="ad-btn ad-btn--ghost ad-side-logout"
            onClick={logout}
            disabled={loggingOut}
          >
            {loggingOut ? "Logging out" : "Logout"}
          </button>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          className="ad-scrim"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="ad-main">
        <header className="ad-top">
          <div className="ad-top-left">
            <button
              type="button"
              className="ad-btn ad-btn--ghost ad-menu"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
            >
              Menu
            </button>
            <span className="ad-page-title">{title}</span>
          </div>

          <div className="ad-top-right">
            <button
              type="button"
              className="ad-btn ad-btn--ghost"
              style={{ fontSize: "13px", padding: "6px 14px" }}
              onClick={handleGoToSite}
            >
              View Website
            </button>
            <div className="ad-profile">
              <span className="ad-avatar" aria-hidden="true">
                {initial}
              </span>
              <span className="ad-profile-text">
                <span className="ad-profile-name">{user?.name || "Admin"}</span>
                <span className="ad-profile-role">Administrator</span>
              </span>
            </div>
            <button
              type="button"
              className="ad-btn ad-btn--solid ad-top-logout"
              onClick={logout}
              disabled={loggingOut}
            >
              {loggingOut ? "Logging out" : "Logout"}
            </button>
          </div>
        </header>

        <main key={pageKey} className="ad-content">
          {children}
        </main>
      </div>
    </div>
  );
}

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const css = `
.ad-shell {
  --bg:${COLORS.bg};
  --surface:${COLORS.surface};
  --green:${COLORS.green};
  --amber:${COLORS.amber};
  --cream:${COLORS.cream};
  display: flex;
  min-height: 100vh;
  min-height: 100svh;
  background: var(--bg);
  color: var(--cream);
  font-family: "Inter", "Segoe UI", system-ui, sans-serif;
}
.ad-shell *, .ad-shell *::before, .ad-shell *::after { box-sizing: border-box; }

.ad-side {
  position: sticky;
  top: 0;
  align-self: flex-start;
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 250px;
  height: 100vh;
  height: 100svh;
  padding: 24px 18px;
  background: var(--surface);
  border-right: 1px solid rgba(244, 234, 213, 0.08);
  animation: ad-side-in 700ms ${EASE} both;
}
@keyframes ad-side-in {
  from { opacity: 0; transform: translateX(-24px); }
  to { opacity: 1; transform: none; }
}

.ad-side-top { display: flex; align-items: center; gap: 12px; padding: 0 6px; }
.ad-mark {
  width: 40px; height: 40px; border-radius: 8px; background: var(--amber); color: var(--bg);
  display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px;
}
.ad-brand { font-family: "Playfair Display", Georgia, serif; font-size: 20px; font-weight: 700; color: #f4ead5; }

.ad-nav { display: flex; flex-direction: column; gap: 6px; flex: 1; }
.ad-link {
  position: relative; display: block; padding: 12px 14px; border-radius: 8px;
  color: rgba(244, 234, 213, 0.75); font-size: 14px; font-weight: 600; text-decoration: none;
  opacity: 0; animation: ad-fade-up 500ms ${EASE} both; animation-delay: calc(var(--i) * 60ms + 200ms);
  transition: background-color 200ms ease, color 200ms ease;
}
.ad-link::before {
  content: ""; position: absolute; left: 0; top: 10px; bottom: 10px; width: 3px;
  border-radius: 2px; background: var(--amber); transform: scaleY(0); transition: transform 250ms ${EASE};
}
.ad-link:hover { background: rgba(244, 234, 213, 0.06); color: var(--cream); }
.ad-link.is-active { background: rgba(217, 164, 65, 0.12); color: var(--amber); }
.ad-link.is-active::before { transform: scaleY(1); }
.ad-link:focus-visible, .ad-btn:focus-visible, .ad-scrim:focus-visible { outline: 3px solid var(--cream); outline-offset: 2px; }
@keyframes ad-fade-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }

.ad-btn {
  cursor: pointer; padding: 10px 20px; border-radius: 8px; font-family: inherit;
  font-size: 14px; font-weight: 700;
  transition: background-color 200ms ease, border-color 200ms ease, color 200ms ease, transform 160ms ease;
}
.ad-btn:active:not(:disabled) { transform: scale(0.97); }
.ad-btn:disabled { cursor: progress; opacity: 0.7; }
.ad-btn--solid { border: 2px solid var(--amber); background: var(--amber); color: var(--bg); }
.ad-btn--solid:hover:not(:disabled) { background: #e6b658; border-color: #e6b658; }
.ad-btn--ghost { border: 2px solid rgba(244, 234, 213, 0.3); background: transparent; color: var(--cream); }
.ad-btn--ghost:hover:not(:disabled) { border-color: var(--amber); color: var(--amber); }
.ad-side-logout { display: none; }

.ad-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.ad-top {
  position: sticky; top: 0; z-index: 20; display: flex; align-items: center; justify-content: space-between;
  gap: 16px; padding: 14px clamp(16px, 3vw, 36px); background: var(--bg);
  border-bottom: 1px solid rgba(244, 234, 213, 0.08); animation: ad-fade-down 600ms ${EASE} both;
}
@keyframes ad-fade-down { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: none; } }
.ad-top-left, .ad-top-right { display: flex; align-items: center; gap: 14px; }
.ad-menu { display: none; padding: 8px 14px; }
.ad-page-title { font-size: 15px; font-weight: 600; color: rgba(244, 234, 213, 0.75); }
.ad-profile { display: flex; align-items: center; gap: 10px; }
.ad-avatar {
  width: 36px; height: 36px; border-radius: 50%; background: var(--green); color: var(--cream);
  display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px;
}
.ad-profile-text { display: flex; flex-direction: column; line-height: 1.25; }
.ad-profile-name { font-size: 14px; font-weight: 700; color: #f4ead5; }
.ad-profile-role { font-size: 11px; color: rgba(244, 234, 213, 0.6); }

.ad-content { position: relative; flex: 1; overflow-x: hidden; padding: clamp(20px, 3.5vw, 44px); animation: ad-page 600ms ${EASE} both; }
@keyframes ad-page { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }

.ad-scrim { position: fixed; inset: 0; z-index: 25; border: 0; background: rgba(0, 0, 0, 0.6); }

@media (max-width: 860px) {
  .ad-side { position: fixed; left: 0; top: 0; bottom: 0; transform: translateX(-105%); animation: none; transition: transform 350ms ${EASE}; }
  .ad-side.is-open { transform: none; }
  .ad-side-logout { display: block; }
  .ad-menu { display: inline-block; }
  .ad-top-logout, .ad-profile-text { display: none; }
}
@media (max-width: 540px) {
  .ad-top { padding: 10px 14px; gap: 8px; }
  .ad-page-title { font-size: 13px; max-width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ad-content { padding: 14px 12px; }
  .ad-avatar { width: 30px; height: 30px; font-size: 12px; }
}
@media (prefers-reduced-motion: reduce) {
  .ad-shell *, .ad-shell *::before, .ad-shell *::after { animation: none !important; transition: none !important; }
  .ad-link { opacity: 1; }
}
`;
