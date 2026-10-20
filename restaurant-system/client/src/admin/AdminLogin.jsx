import { useState } from "react";
import { adminApi } from "./adminApi";

/**
 * AdminLogin.jsx — Dedicated Admin Login with background image, dark/gold aesthetic, and animations.
 * Credentials are authenticated server-side; no passwords or secrets are kept in client code.
 */

const COLORS = { bg: "#151a17", surface: "#242a27", green: "#1f4a38", amber: "#d9a441", cream: "#f4ead5", error: "#f0907f" };
const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

const KITCHEN_IMAGE = "https://images.unsplash.com/photo-1607013251379-e6eecfffe234?auto=format&fit=crop&w=1200&q=80";

export default function AdminLogin({ onSuccess, onNavigateHome, brand = "Burger House", mark = "BH" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0);

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    const errs = {};
    if (!emailOk(email.trim())) errs.email = "Enter a valid email address.";
    if (!password) errs.password = "Enter your password.";
    setErrors(errs);
    if (Object.keys(errs).length) return setShake((s) => s + 1);

    setLoading(true);
    setFormError("");
    try {
      const { user } = await adminApi.login(email.trim(), password);
      onSuccess(user);
    } catch (err) {
      setFormError(err.message || "Invalid credentials.");
      setShake((s) => s + 1);
      setLoading(false);
    }
  };

  return (
    <main className="al-page">
      <style>{css}</style>

      {/* Left side: Culinary image + dark gradient + floating shapes */}
      <aside className="al-side" aria-hidden="true">
        <img
          className="al-side-img"
          src={KITCHEN_IMAGE}
          alt="Burger House Kitchen"
          draggable={false}
        />
        <div className="al-side-shade" />

        <span className="al-shape al-shape--a" />
        <span className="al-shape al-shape--b" />
        <span className="al-shape al-shape--c" />
        <div className="al-side-brand">
          <span className="al-mark">{mark}</span>
          <span className="al-brand">{brand}</span>
        </div>
        <div className="al-side-text">
          <p className="al-eyebrow">Admin Portal</p>
          <h2 className="al-side-title">Run the restaurant, from one place.</h2>
        </div>
      </aside>

      {/* Right side: Login form */}
      <section className="al-panel">
        {onNavigateHome && (
          <button
            type="button"
            className="al-back-btn"
            onClick={onNavigateHome}
          >
            ← Back to Website
          </button>
        )}

        <form className="al-card" onSubmit={submit} noValidate>
          <header className="al-head" style={{ "--d": 0 }}>
            <p className="al-eyebrow">Restricted area</p>
            <h1 className="al-title">Admin Login</h1>
            <p className="al-sub">Sign in with your administrator account.</p>
          </header>

          {formError && <p key={shake} className="al-banner" role="alert">{formError}</p>}

          <div className="al-field" style={{ "--d": 1 }}>
            <div className={`al-box ${errors.email ? "has-error" : ""}`}>
              <input
                id="admin-email"
                type="email"
                value={email}
                placeholder=" "
                autoComplete="username"
                onChange={(e) => { setEmail(e.target.value); setErrors((x) => ({ ...x, email: undefined })); setFormError(""); }}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-err" : undefined}
              />
              <label htmlFor="admin-email">Email</label>
            </div>
            {errors.email && <p id="email-err" className="al-err">{errors.email}</p>}
          </div>

          <div className="al-field" style={{ "--d": 2 }}>
            <div className={`al-box ${errors.password ? "has-error" : ""}`}>
              <input
                id="admin-password"
                type={show ? "text" : "password"}
                value={password}
                placeholder=" "
                autoComplete="current-password"
                className="has-toggle"
                onChange={(e) => { setPassword(e.target.value); setErrors((x) => ({ ...x, password: undefined })); setFormError(""); }}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-err" : undefined}
              />
              <label htmlFor="admin-password">Password</label>
              <button type="button" className="al-show" onClick={() => setShow((s) => !s)} aria-pressed={show}>
                {show ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && <p id="password-err" className="al-err">{errors.password}</p>}
          </div>

          <button type="submit" className={`al-submit ${loading ? "is-loading" : ""}`} disabled={loading} style={{ "--d": 3 }}>
            <span>{loading ? "Signing in..." : "Sign In"}</span>
          </button>
        </form>
      </section>
    </main>
  );
}

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const css = `
.al-page { --bg:${COLORS.bg}; --surface:${COLORS.surface}; --green:${COLORS.green}; --amber:${COLORS.amber}; --cream:${COLORS.cream}; --error:${COLORS.error};
  display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh; min-height: 100svh; background: var(--bg); color: var(--cream);
  font-family: "Inter", "Segoe UI", system-ui, sans-serif; position: relative; }
.al-page *, .al-page *::before, .al-page *::after { box-sizing: border-box; }

.al-side { position: relative; overflow: hidden; background: var(--green); padding: clamp(28px, 4vw, 56px); display: flex; flex-direction: column; justify-content: space-between; }
.al-side-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.al-side-shade { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(21, 26, 23, 0.88), rgba(31, 74, 56, 0.78)); }
.al-side-brand, .al-side-text { position: relative; z-index: 2; }
.al-side-brand { display: flex; align-items: center; gap: 12px; animation: al-up 800ms ${EASE} 150ms both; }
.al-mark { width: 44px; height: 44px; border-radius: 8px; background: var(--amber); color: var(--bg); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 17px; }
.al-brand { font-family: "Playfair Display", Georgia, serif; font-size: 24px; font-weight: 700; }
.al-side-text { max-width: 440px; animation: al-up 900ms ${EASE} 350ms both; }
.al-side-title { margin: 8px 0 0; font-family: "Playfair Display", Georgia, serif; font-size: clamp(30px, 3.6vw, 48px); line-height: 1.12; font-weight: 700; color: #fff; }
.al-eyebrow { margin: 0 0 10px; font-size: 13px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--amber); }

/* Flat floating shapes */
.al-shape { position: absolute; z-index: 1; pointer-events: none; }
.al-shape--a { width: 220px; height: 220px; border-radius: 50%; top: -60px; right: -50px; background: rgba(31, 74, 56, 0.6); animation: al-drift 14s ease-in-out infinite; }
.al-shape--b { width: 120px; height: 120px; left: 12%; top: 38%; background: rgba(217, 164, 65, 0.16); animation: al-drift 11s ease-in-out -4s infinite reverse; }
.al-shape--c { width: 300px; height: 300px; border-radius: 50%; right: 8%; bottom: -150px; background: rgba(217, 164, 65, 0.2); animation: al-drift 17s ease-in-out -8s infinite; }
@keyframes al-drift { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 50% { transform: translate(18px, -22px) rotate(8deg); } }

.al-panel { position: relative; display: flex; align-items: center; justify-content: center; padding: clamp(24px, 4vw, 56px); }
.al-back-btn { position: absolute; top: 24px; right: 28px; padding: 8px 16px; border-radius: 999px; border: 1px solid rgba(244, 234, 213, 0.25); background: var(--surface); color: var(--cream); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 200ms ease; }
.al-back-btn:hover { background: var(--amber); color: var(--bg); border-color: var(--amber); }

.al-card { width: 100%; max-width: 420px; display: flex; flex-direction: column; gap: 18px; animation: al-card 900ms ${EASE} 100ms both; }
@keyframes al-card { from { opacity: 0; transform: translateX(36px); } to { opacity: 1; transform: none; } }
@keyframes al-up { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
.al-head, .al-field, .al-submit { opacity: 0; animation: al-up 700ms ${EASE} both; animation-delay: calc(var(--d, 0) * 90ms + 200ms); }
.al-title { margin: 0 0 6px; font-family: "Playfair Display", Georgia, serif; font-size: clamp(30px, 3.2vw, 40px); line-height: 1.1; font-weight: 700; }
.al-sub { margin: 0; font-size: 16px; color: rgba(244, 234, 213, 0.72); }

.al-banner { margin: 0; padding: 12px 14px; border: 1px solid var(--error); border-radius: 8px; color: var(--error); font-size: 14px; font-weight: 600; animation: al-shake 450ms ease both; }
@keyframes al-shake { 0%, 100% { transform: none; } 20% { transform: translateX(-8px); } 40% { transform: translateX(7px); } 60% { transform: translateX(-5px); } 80% { transform: translateX(3px); } }

.al-box { position: relative; }
.al-box input { width: 100%; height: 56px; padding: 22px 16px 6px; border: 1.5px solid rgba(244, 234, 213, 0.25); border-radius: 8px; background: var(--surface); color: var(--cream); font-family: inherit; font-size: 16px; outline: none; transition: border-color 250ms ease; }
.al-box input.has-toggle { padding-right: 72px; }
.al-box input:hover { border-color: rgba(244, 234, 213, 0.45); }
.al-box input:focus { border-color: var(--amber); }
.al-box label { position: absolute; left: 16px; top: 17px; font-size: 16px; color: rgba(244, 234, 213, 0.6); pointer-events: none; transform-origin: left top; transition: transform 250ms ${EASE}, color 250ms ease; }
.al-box input:focus + label, .al-box input:not(:placeholder-shown) + label { transform: translateY(-11px) scale(0.76); color: var(--amber); }
.al-box.has-error input { border-color: var(--error); }
.al-box.has-error input:focus + label, .al-box.has-error input:not(:placeholder-shown) + label { color: var(--error); }
.al-err { margin: 6px 2px 0; font-size: 13px; color: var(--error); animation: al-up 350ms ${EASE} both; }
.al-show { position: absolute; right: 8px; top: 12px; padding: 6px 10px; border: 0; border-radius: 6px; background: transparent; color: var(--amber); font-family: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
.al-show:hover { background: rgba(217, 164, 65, 0.12); }
.al-show:focus-visible, .al-submit:focus-visible { outline: 3px solid var(--cream); outline-offset: 2px; }

.al-submit { position: relative; overflow: hidden; height: 54px; margin-top: 4px; border: 2px solid var(--amber); border-radius: 8px; background: var(--amber); color: var(--bg); font-family: inherit; font-size: 17px; font-weight: 700; cursor: pointer; transition: background-color 220ms ease, transform 160ms ease; }
.al-submit:hover:not(:disabled) { background: #e6b658; border-color: #e6b658; }
.al-submit:active:not(:disabled) { transform: scale(0.98); }
.al-submit:disabled { cursor: progress; }
.al-submit span { position: relative; z-index: 1; }
.al-submit.is-loading::after { content: ""; position: absolute; left: 0; bottom: 0; height: 4px; width: 40%; background: var(--bg); animation: al-load 1s ease-in-out infinite; }
@keyframes al-load { from { transform: translateX(-100%); } to { transform: translateX(260%); } }

@media (max-width: 860px) {
  .al-page { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
  .al-side { min-height: 180px; padding: 24px; }
  .al-side-text { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .al-page *, .al-page *::before, .al-page *::after { animation: none !important; transition: none !important; }
  .al-head, .al-field, .al-submit { opacity: 1; }
}
`;
