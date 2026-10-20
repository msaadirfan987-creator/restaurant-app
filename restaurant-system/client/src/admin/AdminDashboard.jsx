import { useCallback } from "react";
import { adminApi } from "./adminApi";
import useAdminSession from "./useAdminSession";
import AdminLayout from "./AdminLayout";

/**
 * AdminDashboard.jsx — /admin/dashboard
 * Content strictly displays: "Welcome, Admin" (word-by-word animation).
 * No charts, tables, or complex widgets.
 * Verifies session on server (GET /api/admin/me).
 */
export default function AdminDashboard({ onUnauthorized, onLoggedOut, onNavigateHome }) {
  const unauthorized = useCallback(() => onUnauthorized(), [onUnauthorized]);
  const { status, user, error, retry } = useAdminSession(unauthorized);

  const logout = async () => {
    try {
      await adminApi.logout();
    } catch {
      // Cookie is cleared by server
    }
    onLoggedOut();
  };

  if (status === "loading") {
    return (
      <div className="wd-state" role="status">
        <style>{stateCss}</style>
        <span className="wd-spinner" />
        <p>Checking your session...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="wd-state" role="alert">
        <style>{stateCss}</style>
        <p>{error}</p>
        <button type="button" className="wd-retry" onClick={retry}>Try again</button>
      </div>
    );
  }

  const words = ["Welcome,", "Admin"];

  return (
    <AdminLayout
      user={user}
      pageKey="dashboard"
      title="Dashboard"
      onLogout={logout}
      onNavigateHome={onNavigateHome}
    >
      <style>{css}</style>
      <span className="wd-shape wd-shape--a" aria-hidden="true" />
      <span className="wd-shape wd-shape--b" aria-hidden="true" />
      <span className="wd-shape wd-shape--c" aria-hidden="true" />

      <section className="wd-welcome">
        <h1 className="wd-title" aria-label="Welcome, Admin">
          {words.map((w, i) => (
            <span key={w} className="wd-word" style={{ "--w": i }} aria-hidden="true">{w}&nbsp;</span>
          ))}
        </h1>
        <span className="wd-line" aria-hidden="true" />
        <p className="wd-sub">
          Authenticated session active ({user?.email || "admin@restaurant.com"})
        </p>
      </section>
    </AdminLayout>
  );
}

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

const stateCss = `
.wd-state { min-height: 100vh; min-height: 100svh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; background: #151a17; color: #f4ead5; font-family: "Inter", "Segoe UI", system-ui, sans-serif; text-align: center; padding: 24px; }
.wd-state p { margin: 0; font-size: 16px; color: rgba(244, 234, 213, 0.8); }
.wd-spinner { width: 34px; height: 34px; border: 3px solid rgba(244, 234, 213, 0.2); border-top-color: #d9a441; border-radius: 50%; animation: wd-spin 800ms linear infinite; }
@keyframes wd-spin { to { transform: rotate(360deg); } }
.wd-retry { cursor: pointer; padding: 11px 24px; border: 2px solid #d9a441; border-radius: 8px; background: #d9a441; color: #151a17; font-family: inherit; font-size: 15px; font-weight: 700; }
.wd-retry:hover { background: #e6b658; border-color: #e6b658; }
@media (prefers-reduced-motion: reduce) { .wd-spinner { animation-duration: 2.4s; } }
`;

const css = `
.wd-welcome { position: relative; z-index: 1; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; gap: 20px; min-height: 52vh; }
.wd-title { margin: 0; font-family: "Playfair Display", Georgia, "Times New Roman", serif; font-size: clamp(44px, 8vw, 96px); line-height: 1.05; font-weight: 700; color: #f4ead5; }
.wd-word { display: inline-block; opacity: 0; transform: translateY(34px); animation: wd-in 900ms ${EASE} both; animation-delay: calc(var(--w) * 160ms + 350ms); }
.wd-word:last-child { color: #d9a441; }
@keyframes wd-in { from { opacity: 0; transform: translateY(34px); } to { opacity: 1; transform: none; } }
.wd-line { display: block; width: clamp(80px, 14vw, 180px); height: 4px; background: #d9a441; transform: scaleX(0); transform-origin: left; animation: wd-draw 900ms ${EASE} 1s both; }
@keyframes wd-draw { to { transform: scaleX(1); } }
.wd-sub { margin: 0; font-size: 15px; color: rgba(244, 234, 213, 0.65); animation: wd-in 900ms ${EASE} 1.1s both; }

/* Flat decorative shapes */
.wd-shape { position: absolute; z-index: 0; pointer-events: none; }
.wd-shape--a { width: 260px; height: 260px; border-radius: 50%; right: -70px; top: -50px; background: rgba(31, 74, 56, 0.55); animation: wd-float 16s ease-in-out infinite; }
.wd-shape--b { width: 110px; height: 110px; right: 20%; bottom: 14%; background: rgba(217, 164, 65, 0.14); animation: wd-float 12s ease-in-out -5s infinite reverse; }
.wd-shape--c { width: 340px; height: 340px; border-radius: 50%; left: -150px; bottom: -170px; background: rgba(31, 74, 56, 0.35); animation: wd-float 19s ease-in-out -9s infinite; }
@keyframes wd-float { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 50% { transform: translate(20px, -26px) rotate(9deg); } }

@media (prefers-reduced-motion: reduce) {
  .wd-word { opacity: 1; transform: none; animation: none; }
  .wd-line { transform: scaleX(1); animation: none; }
  .wd-shape { animation: none; }
  .wd-sub { opacity: 1; transform: none; animation: none; }
}
`;
