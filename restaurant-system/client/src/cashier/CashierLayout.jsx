import { useState, useEffect } from "react";
import { cashierApi } from "./cashierApi";
import "./cashier.css";

const NAV = [
  { key: "pos", label: "POS / New Order", href: "/cashier/pos" },
  { key: "dashboard", label: "Shift Dashboard", href: "/cashier" },
  { key: "online", label: "Online Website Orders", href: "/cashier/online" },
  { key: "dine-in", label: "Dine-In Orders", href: "/cashier/dine-in" },
  { key: "orders", label: "All Orders & Receipts", href: "/cashier/orders" },
  { key: "profile", label: "Profile", href: "/cashier/profile" },
];

export default function CashierLayout({
  user,
  pageKey = "dashboard",
  title = "Cashier Terminal",
  onNavigate,
  onLogout,
  children,
  brand = "Burger House",
}) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);

  // Poll online pending count every 20s
  useEffect(() => {
    let alive = true;
    const fetchStats = () => {
      cashierApi
        .getStats()
        .then((s) => alive && setOnlineCount(s.onlinePending || 0))
        .catch(() => {});
    };
    fetchStats();
    const interval = setInterval(fetchStats, 20000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setLoggingOut(false);
    }
  };

  const handleNavigate = (href) => {
    setOpen(false);
    if (onNavigate) {
      onNavigate(href);
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
      <aside className={`ad-side ${open ? "is-open" : ""}`} aria-label="Cashier navigation">
        <div className="ad-side-top">
          <span className="ad-mark" style={{ background: "#3498db", color: "#151a17" }}>
            POS
          </span>
          <span className="ad-brand">{brand}</span>
        </div>

        <nav className="ad-nav">
          {NAV.map((n, i) => {
            const active = pageKey === n.key;
            return (
              <a
                key={n.key}
                href={n.href}
                className={`ad-link ${active ? "is-active" : ""}`}
                style={{
                  "--i": i,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigate(n.href);
                }}
              >
                <span>{n.label}</span>
                {n.key === "online" && onlineCount > 0 && (
                  <span
                    style={{
                      background: "#e74c3c",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 800,
                      padding: "2px 6px",
                      borderRadius: 10,
                    }}
                  >
                    {onlineCount}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: "auto" }}>
          <button
            type="button"
            className="ad-btn ad-btn--ghost"
            style={{ fontSize: 13, padding: "8px 14px", textAlign: "left" }}
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
              style={{ fontSize: 13, padding: "6px 14px" }}
              onClick={handleGoToSite}
            >
              View Website
            </button>
            <div className="ad-profile">
              <span className="ad-avatar" style={{ background: "#3498db" }}>
                {(user?.name || "C").charAt(0).toUpperCase()}
              </span>
              <div className="ad-profile-text">
                <span className="ad-profile-name">{user?.name || "Cashier"}</span>
                <span className="ad-profile-role" style={{ textTransform: "capitalize" }}>
                  {user?.role || "Cashier"} Terminal
                </span>
              </div>
            </div>
            <button
              type="button"
              className="ad-btn ad-btn--solid"
              onClick={logout}
              disabled={loggingOut}
            >
              {loggingOut ? "Logging out" : "Logout"}
            </button>
          </div>
        </header>

        <main className="ad-content">{children}</main>
      </div>
    </div>
  );
}
