import { useEffect, useRef, useState } from "react";

/**
 * AuthPage.jsx — Login + Customer Sign Up
 *
 *  - Signup form creates customer accounts.
 *  - Staff (admin, cashier, waiter, kitchen) log in using their credentials.
 *  - Redirects or updates state on successful authentication.
 *  - Clean English text, zero icons, pure image tags, matching dark/gold aesthetic.
 */

export const ROLE_HOME = {
  admin: "/admin",
  cashier: "/cashier",
  waiter: "/waiter",
  kitchen: "/kitchen",
  customer: "/",
};

const ROLE_LABEL = {
  admin: "Admin",
  cashier: "Cashier",
  waiter: "Waiter",
  kitchen: "Kitchen Staff",
  customer: "Customer",
};

const COLORS = {
  bg: "#151a17",
  surface: "#242a27",
  green: "#1f4a38",
  amber: "#d9a441",
  cream: "#f4ead5",
  error: "#f0907f",
};

const ART =
  "https://images.unsplash.com/photo-1607013251379-e6eecfffe234?auto=format&fit=crop&w=1400&q=80";

async function post(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Authentication failed. Please check your credentials.");
  }
  return data.user || data;
}

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

function validate(mode, f) {
  const e = {};
  if (mode === "signup" && f.name.trim().length < 2) {
    e.name = "Please enter your full name.";
  }
  if (!emailOk(f.email.trim())) {
    e.email = "Please enter a valid email address.";
  }
  if (mode === "signup" && f.phone && !/^[0-9+\-\s]{7,16}$/.test(f.phone)) {
    e.phone = "Please enter a valid phone number.";
  }
  if (mode === "login" && !f.password) {
    e.password = "Password is required.";
  }
  if (mode === "signup") {
    if (f.password.length < 6) {
      e.password = "Password must be at least 6 characters.";
    }
    if (f.confirm !== f.password) {
      e.confirm = "Passwords do not match.";
    }
  }
  return e;
}

function Field({ id, label, type = "text", value, onChange, error, autoComplete, delay = 0, children }) {
  return (
    <div className="au-field" style={{ "--d": delay }}>
      <div className={`au-box ${error ? "has-error" : ""}`}>
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder=" "
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
        />
        <label htmlFor={id}>{label}</label>
        {children}
      </div>
      {error && <p id={`${id}-err`} className="au-err">{error}</p>}
    </div>
  );
}

const EMPTY = { name: "", email: "", phone: "", password: "", confirm: "" };

export default function AuthPage({
  brand = "Burger House",
  mark = "BH",
  apiBase = "/api/auth",
  initialMode = "login",
  onLogin = (data) => post(`${apiBase}/login`, data),
  onSignup = (data) => post(`${apiBase}/register`, data),
  onForgotPassword = () => alert("Password reset link will be sent to your email."),
  onAuthenticated = () => {},
  onClose = null,
  art = ART,
}) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState(EMPTY);
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);
  const [shake, setShake] = useState(0);
  const [artOk, setArtOk] = useState(true);
  const timer = useRef();

  useEffect(() => () => clearTimeout(timer.current), []);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
    if (formError) setFormError("");
  };

  const switchMode = (m) => {
    if (m === mode || loading) return;
    setMode(m);
    setErrors({});
    setFormError("");
    setShow(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    const errs = validate(mode, form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      setShake((s) => s + 1);
      return;
    }
    setLoading(true);
    setFormError("");
    try {
      const user =
        mode === "login"
          ? await onLogin({ email: form.email.trim(), password: form.password, remember })
          : await onSignup({
              name: form.name.trim(),
              email: form.email.trim(),
              phone: form.phone.trim(),
              password: form.password,
              confirmPassword: form.confirm,
            });
      const role = user?.role || "customer";
      setDone({ name: user?.name || "", role });
      timer.current = setTimeout(() => {
        onAuthenticated(user, ROLE_HOME[role] || "/");
      }, 1200);
    } catch (err) {
      setFormError(err.message || "Authentication error occurred.");
      setShake((s) => s + 1);
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === "login";

  return (
    <main className="au-page">
      <style>{css}</style>

      {/* Left: food art image */}
      <aside className="au-art" aria-hidden="false">
        {artOk && (
          <img
            className="au-art-img"
            src={art}
            alt="Burger House Kitchen"
            draggable={false}
            onError={() => setArtOk(false)}
          />
        )}
        <div className="au-art-shade" />
        <div className="au-art-top">
          <span className="au-mark">{mark}</span>
          <span className="au-brand">{brand}</span>
        </div>
        <div className="au-art-text">
          <p className="au-art-eyebrow">Welcome</p>
          <h2 className="au-art-title">Fresh Burgers, Warm Welcome.</h2>
          <p className="au-art-sub">
            Sign in to order your favorite burgers and meals in just a few clicks.
          </p>
        </div>
      </aside>

      {/* Right: form panel */}
      <section className="au-panel">
        {onClose && (
          <button
            type="button"
            className="au-close-page"
            onClick={onClose}
            aria-label="Back to home"
          >
            Back to Home
          </button>
        )}

        <div className="au-card">
          {done ? (
            <div className="au-done" role="status">
              <span className="au-done-mark">{mark}</span>
              <h1 className="au-done-title">
                Welcome{done.name ? `, ${done.name.split(" ")[0]}` : ""}!
              </h1>
              <p className="au-done-text">
                Signed in as <strong>{ROLE_LABEL[done.role] || done.role}</strong>. Redirecting...
              </p>
              <span className="au-done-bar" />
            </div>
          ) : (
            <>
              <div className="au-tabs" role="tablist" aria-label="Login or Sign Up">
                <button
                  type="button"
                  role="tab"
                  aria-selected={isLogin}
                  className={`au-tab ${isLogin ? "is-active" : ""}`}
                  onClick={() => switchMode("login")}
                >
                  Login
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={!isLogin}
                  className={`au-tab ${!isLogin ? "is-active" : ""}`}
                  onClick={() => switchMode("signup")}
                >
                  Sign Up
                </button>
                <span className="au-ink" style={{ transform: `translateX(${isLogin ? 0 : 100}%)` }} />
              </div>

              <form key={mode} className="au-form" onSubmit={submit} noValidate>
                <header className="au-head" style={{ "--d": 0 }}>
                  <h1 className="au-title">{isLogin ? "Welcome Back" : "Create Account"}</h1>
                  <p className="au-sub">
                    {isLogin ? "Enter your email and password to log in." : "Create your customer profile in seconds."}
                  </p>
                </header>

                {formError && (
                  <p key={shake} className="au-banner" role="alert">{formError}</p>
                )}

                {!isLogin && (
                  <Field
                    id="name"
                    label="Full Name"
                    value={form.name}
                    onChange={set("name")}
                    error={errors.name}
                    autoComplete="name"
                    delay={1}
                  />
                )}

                <Field
                  id="email"
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  error={errors.email}
                  autoComplete="email"
                  delay={isLogin ? 1 : 2}
                />

                {!isLogin && (
                  <Field
                    id="phone"
                    label="Phone Number (Optional)"
                    type="tel"
                    value={form.phone}
                    onChange={set("phone")}
                    error={errors.phone}
                    autoComplete="tel"
                    delay={3}
                  />
                )}

                <Field
                  id="password"
                  label="Password"
                  type={show ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  error={errors.password}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  delay={isLogin ? 2 : 4}
                >
                  <button
                    type="button"
                    className="au-show"
                    onClick={() => setShow((s) => !s)}
                    aria-pressed={show}
                  >
                    {show ? "Hide" : "Show"}
                  </button>
                </Field>

                {!isLogin && (
                  <Field
                    id="confirm"
                    label="Confirm Password"
                    type={show ? "text" : "password"}
                    value={form.confirm}
                    onChange={set("confirm")}
                    error={errors.confirm}
                    autoComplete="new-password"
                    delay={5}
                  />
                )}

                {isLogin && (
                  <div className="au-row" style={{ "--d": 3 }}>
                    <label className="au-check">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                      />
                      <span className="au-check-box" />
                      <span>Remember me</span>
                    </label>
                    <button type="button" className="au-link" onClick={onForgotPassword}>
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  className={`au-submit ${loading ? "is-loading" : ""}`}
                  disabled={loading}
                  style={{ "--d": isLogin ? 4 : 6 }}
                >
                  <span>{loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}</span>
                </button>

                <p className="au-note" style={{ "--d": isLogin ? 5 : 7 }}>
                  {isLogin
                    ? "Staff member (Admin, Cashier, Waiter, Kitchen)? Use the credentials provided by administration."
                    : "Signing up registers a customer profile. Staff roles are assigned exclusively by administrators."}
                </p>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const css = `
.au-page {
  --bg: ${COLORS.bg}; --surface: ${COLORS.surface}; --green: ${COLORS.green}; --amber: ${COLORS.amber}; --cream: ${COLORS.cream}; --error: ${COLORS.error};
  display: grid; grid-template-columns: 1.05fr 1fr; min-height: 100vh; min-height: 100svh;
  background: var(--bg); color: var(--cream);
  font-family: "Inter", "Segoe UI", system-ui, sans-serif;
  position: relative;
}
.au-page *, .au-page *::before, .au-page *::after { box-sizing: border-box; }

/* Art */
.au-art { position: relative; overflow: hidden; background: var(--green); display: flex; flex-direction: column; justify-content: space-between; padding: clamp(28px, 4vw, 56px); }
.au-art-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; animation: au-zoom 14s ease-out both; }
@keyframes au-zoom { from { transform: scale(1.18); opacity: 0; } 12% { opacity: 1; } to { transform: scale(1); opacity: 1; } }
.au-art-shade { position: absolute; inset: 0; background: rgba(21, 26, 23, 0.62); }
.au-art-top, .au-art-text { position: relative; z-index: 1; }
.au-art-top { display: flex; align-items: center; gap: 12px; animation: au-up 800ms ${EASE} 200ms both; }
.au-mark { width: 44px; height: 44px; border-radius: 8px; background: var(--amber); color: var(--bg); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 17px; }
.au-brand { font-family: "Playfair Display", Georgia, serif; font-size: 24px; font-weight: 700; }
.au-art-text { max-width: 460px; }
.au-art-text > * { animation: au-up 900ms ${EASE} both; }
.au-art-text > :nth-child(1) { animation-delay: 450ms; }
.au-art-text > :nth-child(2) { animation-delay: 600ms; }
.au-art-text > :nth-child(3) { animation-delay: 750ms; }
.au-art-eyebrow { margin: 0 0 12px; font-size: 14px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--amber); }
.au-art-title { margin: 0 0 14px; font-family: "Playfair Display", Georgia, serif; font-size: clamp(32px, 3.8vw, 52px); line-height: 1.1; font-weight: 700; }
.au-art-sub { margin: 0; font-size: 17px; line-height: 1.65; color: rgba(244, 234, 213, 0.85); }
@keyframes au-up { from { opacity: 0; transform: translateY(26px); } to { opacity: 1; transform: none; } }

/* Panel */
.au-panel { position: relative; display: flex; align-items: center; justify-content: center; padding: clamp(24px, 4vw, 56px); }
.au-close-page {
  position: absolute; top: 24px; right: 28px; z-index: 10;
  padding: 8px 18px; border-radius: 999px; border: 1px solid rgba(244, 234, 213, 0.25);
  background: var(--surface); color: var(--cream); font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 200ms ease;
}
.au-close-page:hover { background: var(--amber); color: var(--bg); border-color: var(--amber); }

.au-card { width: 100%; max-width: 440px; animation: au-card-in 900ms ${EASE} 150ms both; }
@keyframes au-card-in { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: none; } }

/* Tabs */
.au-tabs { position: relative; display: grid; grid-template-columns: 1fr 1fr; margin-bottom: 32px; border-bottom: 1px solid rgba(244, 234, 213, 0.14); }
.au-tab { padding: 14px 4px 16px; border: 0; background: transparent; color: rgba(244, 234, 213, 0.6); font-family: inherit; font-size: 17px; font-weight: 600; cursor: pointer; transition: color 250ms ease; }
.au-tab:hover { color: var(--cream); }
.au-tab.is-active { color: var(--amber); }
.au-tab:focus-visible { outline: 3px solid var(--cream); outline-offset: -3px; }
.au-ink { position: absolute; left: 0; bottom: -1px; width: 50%; height: 3px; background: var(--amber); transition: transform 550ms ${EASE}; }

/* Form */
.au-form { display: flex; flex-direction: column; gap: 18px; }
.au-head, .au-field, .au-row, .au-submit, .au-note { opacity: 0; animation: au-up 700ms ${EASE} both; animation-delay: calc(var(--d, 0) * 80ms + 100ms); }
.au-title { margin: 0 0 6px; font-family: "Playfair Display", Georgia, serif; font-size: clamp(28px, 3vw, 38px); line-height: 1.15; font-weight: 700; }
.au-sub { margin: 0; font-size: 16px; color: rgba(244, 234, 213, 0.72); }

.au-banner { margin: 0; padding: 12px 14px; border: 1px solid var(--error); border-radius: 8px; color: var(--error); font-size: 14px; font-weight: 600; animation: au-shake 450ms ease both; }
@keyframes au-shake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-8px); } 40% { transform: translateX(7px); } 60% { transform: translateX(-5px); } 80% { transform: translateX(3px); } }

.au-box { position: relative; }
.au-box input { width: 100%; height: 56px; padding: 22px 16px 6px; border: 1.5px solid rgba(244, 234, 213, 0.25); border-radius: 8px; background: var(--surface); color: var(--cream); font-family: inherit; font-size: 16px; outline: none; transition: border-color 250ms ease, background-color 250ms ease; }
.au-box input:hover { border-color: rgba(244, 234, 213, 0.45); }
.au-box input:focus { border-color: var(--amber); }
.au-box label { position: absolute; left: 16px; top: 17px; font-size: 16px; color: rgba(244, 234, 213, 0.6); pointer-events: none; transform-origin: left top; transition: transform 250ms ${EASE}, color 250ms ease; }
.au-box input:focus + label, .au-box input:not(:placeholder-shown) + label { transform: translateY(-11px) scale(0.76); color: var(--amber); }
.au-box.has-error input { border-color: var(--error); }
.au-box.has-error input:focus + label, .au-box.has-error input:not(:placeholder-shown) + label { color: var(--error); }
.au-err { margin: 6px 2px 0; font-size: 13px; color: var(--error); animation: au-up 350ms ${EASE} both; }
.au-show { position: absolute; right: 8px; top: 12px; padding: 6px 10px; border: 0; border-radius: 6px; background: transparent; color: var(--amber); font-family: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
.au-show:hover { background: rgba(217, 164, 65, 0.12); }
.au-box input[type="password"], .au-box input[name="password"] { padding-right: 70px; }

.au-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.au-check { display: inline-flex; align-items: center; gap: 10px; font-size: 14px; color: rgba(244, 234, 213, 0.82); cursor: pointer; }
.au-check input { position: absolute; opacity: 0; pointer-events: none; }
.au-check-box { width: 20px; height: 20px; border: 1.5px solid rgba(244, 234, 213, 0.45); border-radius: 5px; display: inline-flex; align-items: center; justify-content: center; transition: border-color 200ms ease; }
.au-check-box::after { content: ""; width: 10px; height: 10px; border-radius: 2px; background: var(--amber); transform: scale(0); transition: transform 250ms ${EASE}; }
.au-check input:checked + .au-check-box { border-color: var(--amber); }
.au-check input:checked + .au-check-box::after { transform: scale(1); }
.au-check input:focus-visible + .au-check-box { outline: 3px solid var(--cream); outline-offset: 2px; }
.au-link { padding: 4px 0; border: 0; background: transparent; color: var(--amber); font-family: inherit; font-size: 14px; font-weight: 600; cursor: pointer; background-image: linear-gradient(var(--amber), var(--amber)); background-size: 0 2px; background-position: 0 100%; background-repeat: no-repeat; transition: background-size 350ms ${EASE}; }
.au-link:hover { background-size: 100% 2px; }
.au-link:focus-visible { outline: 3px solid var(--cream); outline-offset: 3px; }

.au-submit { position: relative; overflow: hidden; height: 54px; margin-top: 4px; border: 2px solid var(--amber); border-radius: 8px; background: var(--amber); color: var(--bg); font-family: inherit; font-size: 17px; font-weight: 700; cursor: pointer; transition: background-color 220ms ease, transform 160ms ease; }
.au-submit:hover:not(:disabled) { background: #e6b658; border-color: #e6b658; }
.au-submit:active:not(:disabled) { transform: scale(0.98); }
.au-submit:focus-visible { outline: 3px solid var(--cream); outline-offset: 3px; }
.au-submit:disabled { cursor: progress; }
.au-submit span { position: relative; z-index: 1; }
.au-submit.is-loading::after { content: ""; position: absolute; left: 0; bottom: 0; height: 4px; width: 40%; background: var(--bg); animation: au-load 1s ease-in-out infinite; }
@keyframes au-load { from { transform: translateX(-100%); } to { transform: translateX(260%); } }
.au-note { margin: 4px 0 0; font-size: 13px; line-height: 1.6; color: rgba(244, 234, 213, 0.62); }

/* Success */
.au-done { text-align: center; padding: 24px 0; animation: au-up 700ms ${EASE} both; }
.au-done-mark { display: inline-flex; width: 64px; height: 64px; border-radius: 12px; background: var(--amber); color: var(--bg); align-items: center; justify-content: center; font-size: 22px; font-weight: 800; animation: au-pop 700ms cubic-bezier(0.34, 1.56, 0.64, 1) both; }
@keyframes au-pop { from { transform: scale(0) rotate(-30deg); } to { transform: scale(1) rotate(0); } }
.au-done-title { margin: 22px 0 10px; font-family: "Playfair Display", Georgia, serif; font-size: 34px; }
.au-done-text { margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: rgba(244, 234, 213, 0.8); }
.au-done-text strong { color: var(--amber); }
.au-done-bar { display: block; height: 4px; width: 100%; background: rgba(244, 234, 213, 0.12); position: relative; overflow: hidden; }
.au-done-bar::after { content: ""; position: absolute; inset: 0; background: var(--amber); transform-origin: left; animation: au-fill 1.4s linear both; }
@keyframes au-fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }

/* Mobile */
@media (max-width: 900px) {
  .au-page { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
  .au-art { min-height: 200px; padding: 24px; }
  .au-art-text { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .au-page * { animation: none !important; transition: none !important; }
  .au-head, .au-field, .au-row, .au-submit, .au-note { opacity: 1; }
}
`;
