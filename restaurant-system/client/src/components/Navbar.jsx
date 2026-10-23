import { useEffect, useState } from "react";

const LINKS = [
  { label: "Home", href: "#home" },
  { label: "Menu", href: "#menu" },
  { label: "Offers", href: "#offer" },
  { label: "Our Story", href: "#story" },
  { label: "Reviews", href: "#reviews" },
  { label: "Visit Us", href: "#visit" },
];

export default function Navbar({
  cartCount = 0,
  currentUser = null,
  onCartClick,
  onOrderClick,
  onLoginClick,
  onLogout,
  onAdminClick,
  onStaffClick,
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("#home");

  // Dark background on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Active section indicator
  useEffect(() => {
    const targets = LINKS.map((l) => document.querySelector(l.href)).filter(Boolean);
    if (!targets.length || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive("#" + e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close mobile menu on Escape key
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (href) => {
    setActive(href);
    setOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <style>{css}</style>
      <header className={`fh-nav ${scrolled ? "fh-nav--solid" : ""} ${open ? "fh-nav--open" : ""}`}>
        <div className="fh-nav__inner">
          {/* Brand Logo */}
          <a className="fh-brand" href="#home" onClick={() => go("#home")}>
            <svg className="fh-brand__mark" viewBox="0 0 24 32" aria-hidden="true">
              <path d="M12 1c1 6 8 9 8 18a8 8 0 0 1-16 0c0-4 2-6 4-8 0 3 1 4 2 4 0-5-1-9 2-14z" fill="#D9A55B" />
            </svg>
            <span className="fh-brand__text">
              <strong>The Flavor Hub</strong>
              <small>Restaurant &amp; Cafe</small>
            </span>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="fh-nav__links" aria-label="Primary">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={active === l.href ? "is-active" : ""}
                aria-current={active === l.href ? "page" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  go(l.href);
                }}
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* Action Bar */}
          <div className="fh-nav__actions">
            {/* Cart Icon Button (Always visible on mobile & desktop) */}
            <button
              type="button"
              className="fh-icon-btn"
              aria-label={`Shopping Cart, ${cartCount} items`}
              onClick={onCartClick}
            >
              <img
                src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=100&q=80"
                alt="Cart"
                className="fh-cart-img"
              />
              {cartCount > 0 && <span className="fh-icon-btn__badge">{cartCount}</span>}
            </button>

            {/* Desktop Actions Only (> 820px) */}
            <div className="fh-desktop-actions">
              {currentUser ? (
                <div className="fh-user-pill">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
                    alt={currentUser.name}
                    className="fh-user-img"
                  />
                  <span className="fh-user-name">
                    {currentUser.name ? currentUser.name.split(" ")[0] : "Account"}
                  </span>
                  <button type="button" className="fh-logout-btn" onClick={onLogout} title="Sign Out">
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="fh-auth-btn"
                  onClick={() => onLoginClick?.("login")}
                  aria-label="Login or Sign Up"
                >
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
                    alt="Account"
                    className="fh-auth-img"
                  />
                  <span>Sign In</span>
                </button>
              )}

              {currentUser?.role === "admin" && (
                <button
                  type="button"
                  className="fh-admin-btn"
                  onClick={onAdminClick}
                  title="Open Admin Dashboard"
                >
                  Admin
                </button>
              )}
              {currentUser?.role === "cashier" && (
                <button
                  type="button"
                  className="fh-admin-btn"
                  onClick={() => onStaffClick?.("/cashier")}
                  title="Open Cashier POS Terminal"
                  style={{ background: "#3498db", borderColor: "#3498db" }}
                >
                  Cashier POS
                </button>
              )}
              {currentUser?.role === "kitchen" && (
                <button
                  type="button"
                  className="fh-admin-btn"
                  onClick={() => onStaffClick?.("/kitchen")}
                  title="Open Kitchen Display System"
                  style={{ background: "#e67e22", borderColor: "#e67e22" }}
                >
                  Kitchen KDS
                </button>
              )}
              {currentUser?.role === "waiter" && (
                <button
                  type="button"
                  className="fh-admin-btn"
                  onClick={() => onStaffClick?.("/waiter")}
                  title="Open Waiter Service Panel"
                  style={{ background: "#2ecc71", borderColor: "#2ecc71" }}
                >
                  Waiter Panel
                </button>
              )}

              <button className="fh-btn fh-nav__order" onClick={onOrderClick}>
                Order Now
              </button>
            </div>

            {/* Mobile Hamburger Button — ALWAYS VISIBLE on mobile (<= 820px), 44x44px touch target */}
            <button
              type="button"
              className="fh-burger"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="fh-mobile-nav"
              onClick={() => setOpen((o) => !o)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Menu Drawer */}
        <div
          className={`fh-mobile ${open ? "is-open" : ""}`}
          id="fh-mobile-nav"
        >
          {/* User Account / Staff Header in Mobile Drawer */}
          {currentUser ? (
            <div className="fh-mobile-user-card">
              <div className="fh-mobile-user-row">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
                  alt={currentUser.name}
                  className="fh-mobile-avatar"
                />
                <div className="fh-mobile-user-meta">
                  <div className="fh-mobile-user-name">{currentUser.name}</div>
                  <div className="fh-mobile-user-role">{currentUser.role || "Customer"}</div>
                </div>
              </div>

              {/* Staff Shortcuts */}
              {currentUser.role === "admin" && (
                <button
                  type="button"
                  className="fh-mobile-staff-btn fh-mobile-staff-btn--admin"
                  onClick={() => {
                    setOpen(false);
                    onAdminClick?.();
                  }}
                >
                  ⚙️ Admin Dashboard
                </button>
              )}
              {currentUser.role === "cashier" && (
                <button
                  type="button"
                  className="fh-mobile-staff-btn fh-mobile-staff-btn--cashier"
                  onClick={() => {
                    setOpen(false);
                    onStaffClick?.("/cashier");
                  }}
                >
                  💵 Cashier POS Terminal
                </button>
              )}
              {currentUser.role === "kitchen" && (
                <button
                  type="button"
                  className="fh-mobile-staff-btn fh-mobile-staff-btn--kitchen"
                  onClick={() => {
                    setOpen(false);
                    onStaffClick?.("/kitchen");
                  }}
                >
                  👨‍🍳 Kitchen Display (KDS)
                </button>
              )}
              {currentUser.role === "waiter" && (
                <button
                  type="button"
                  className="fh-mobile-staff-btn fh-mobile-staff-btn--waiter"
                  onClick={() => {
                    setOpen(false);
                    onStaffClick?.("/waiter");
                  }}
                >
                  🍽️ Waiter Service Panel
                </button>
              )}

              <button
                type="button"
                className="fh-mobile-logout-btn"
                onClick={() => {
                  setOpen(false);
                  onLogout?.();
                }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="fh-mobile-guest-card">
              <p className="fh-mobile-guest-text">Welcome to The Flavor Hub!</p>
              <button
                type="button"
                className="fh-btn fh-btn--primary fh-btn--block"
                onClick={() => {
                  setOpen(false);
                  onLoginClick?.("login");
                }}
              >
                Sign In / Register
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <div className="fh-mobile-links">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={`fh-mobile-link ${active === l.href ? "is-active" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  go(l.href);
                }}
              >
                <span>{l.label}</span>
                <span className="fh-mobile-link-arrow">→</span>
              </a>
            ))}
          </div>

          {/* Mobile CTAs */}
          <div className="fh-mobile-actions">
            <button
              type="button"
              className="fh-btn fh-btn--primary fh-btn--block fh-btn--lg"
              onClick={() => {
                setOpen(false);
                onOrderClick?.();
              }}
            >
              Order Now
            </button>
            <button
              type="button"
              className="fh-btn fh-btn--outline fh-btn--block"
              onClick={() => {
                setOpen(false);
                onCartClick?.();
              }}
            >
              View Cart {cartCount > 0 ? `(${cartCount} items)` : ""}
            </button>
          </div>

          {/* Quick Info & Direct Call */}
          <div className="fh-mobile-info">
            <span>🕒 Open Daily: 11:00 AM – 12:00 AM</span>
            <a href="tel:+923001234567" className="fh-mobile-tel">
              📞 Call Us: 0300 1234567
            </a>
          </div>
        </div>

        {/* Backdrop for click outside */}
        {open && (
          <div
            className="fh-mobile-backdrop"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
        )}
      </header>
    </>
  );
}

const css = `
.fh-nav {
  --fh-bg: #101C1B;
  --fh-gold: #D9A55B;
  --fh-cream: #F5F0E6;
  --fh-white: #ffffff;
  --fh-h: 72px;
  --fh-ease: cubic-bezier(.22, .61, .36, 1);
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 100;
  background: linear-gradient(rgba(16, 28, 27, 0.9), rgba(16, 28, 27, 0));
  font-family: Inter, system-ui, sans-serif;
  transition: background-color 0.3s var(--fh-ease), box-shadow 0.3s var(--fh-ease);
}
.fh-nav * {
  box-sizing: border-box;
}
.fh-nav a {
  color: inherit;
  text-decoration: none;
}
.fh-nav :focus-visible {
  outline: 2px solid var(--fh-gold);
  outline-offset: 3px;
  border-radius: 4px;
}
.fh-nav--solid,
.fh-nav--open {
  background: rgba(16, 28, 27, 0.98);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow: 0 1px 0 rgba(217, 165, 91, 0.22), 0 10px 30px rgba(0, 0, 0, 0.35);
}

.fh-nav__inner {
  max-width: 1240px;
  margin: 0 auto;
  height: var(--fh-h);
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  position: relative;
  z-index: 110;
}

/* Brand */
.fh-brand {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-shrink: 0;
}
.fh-brand__mark {
  width: 26px;
  height: 34px;
  flex-shrink: 0;
}
.fh-brand__text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}
.fh-brand__text strong {
  font: 700 1.15rem "Playfair Display", Georgia, serif;
  color: var(--fh-white);
  letter-spacing: 0.02em;
}
.fh-brand__text small {
  font-size: 0.62rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(245, 240, 230, 0.65);
}

/* Desktop Links */
.fh-nav__links {
  display: flex;
  gap: 2rem;
}
.fh-nav__links a {
  position: relative;
  padding: 0.4rem 0;
  font-size: 0.9rem;
  font-weight: 500;
  color: rgba(245, 240, 230, 0.82);
  transition: color 0.25s var(--fh-ease);
}
.fh-nav__links a::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -2px;
  height: 2px;
  background: var(--fh-gold);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s var(--fh-ease);
}
.fh-nav__links a:hover,
.fh-nav__links a.is-active {
  color: var(--fh-white);
}
.fh-nav__links a:hover::after {
  transform: scaleX(0.5);
}
.fh-nav__links a.is-active::after {
  transform: scaleX(1);
}

/* Actions */
.fh-nav__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}
.fh-desktop-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Cart Button */
.fh-icon-btn {
  position: relative;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--fh-cream);
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color 0.25s var(--fh-ease), transform 0.2s ease;
}
.fh-icon-btn:hover {
  background: rgba(245, 240, 230, 0.1);
  transform: scale(1.05);
}
.fh-cart-img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid var(--fh-gold);
}
.fh-icon-btn__badge {
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9px;
  background: var(--fh-gold);
  color: var(--fh-bg);
  font: 700 0.68rem/18px Inter, sans-serif;
  text-align: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}

/* Auth & User Pill */
.fh-auth-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.32rem 0.9rem 0.32rem 0.35rem;
  border: 1.5px solid rgba(217, 165, 91, 0.45);
  border-radius: 999px;
  background: rgba(245, 240, 230, 0.06);
  color: var(--fh-cream);
  font: 600 0.86rem Inter, sans-serif;
  cursor: pointer;
  transition: all 0.25s var(--fh-ease);
}
.fh-auth-btn:hover {
  background: rgba(217, 165, 91, 0.15);
  border-color: var(--fh-gold);
  color: var(--fh-white);
  transform: translateY(-1px);
}
.fh-auth-img,
.fh-user-img {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid var(--fh-gold);
  flex-shrink: 0;
}
.fh-user-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.75rem 0.3rem 0.35rem;
  border: 1.5px solid rgba(217, 165, 91, 0.35);
  border-radius: 999px;
  background: rgba(36, 42, 39, 0.85);
  font: 600 0.84rem Inter, sans-serif;
  color: var(--fh-cream);
}
.fh-user-name {
  max-width: 90px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fh-logout-btn {
  background: none;
  border: 0;
  padding: 0.2rem 0.45rem;
  border-radius: 4px;
  color: var(--fh-gold);
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

/* Staff Badges */
.fh-admin-btn {
  background: rgba(217, 165, 91, 0.18);
  border: 1.5px solid var(--fh-gold);
  border-radius: 999px;
  padding: 0.32rem 0.85rem;
  color: var(--fh-gold);
  font: 700 0.78rem Inter, sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.2s ease;
}
.fh-admin-btn:hover {
  background: var(--fh-gold);
  color: var(--fh-bg);
}

/* Buttons */
.fh-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.55rem 1.25rem;
  border: 0;
  border-radius: 999px;
  background: var(--fh-gold);
  color: var(--fh-bg);
  font: 600 0.88rem Inter, sans-serif;
  cursor: pointer;
  transition: transform 0.25s var(--fh-ease), background-color 0.25s var(--fh-ease);
}
.fh-btn:hover {
  background: #e6b873;
  transform: translateY(-1px);
}
.fh-btn:active {
  transform: scale(0.97);
}
.fh-btn--primary {
  background: var(--fh-gold);
  color: var(--fh-bg);
}
.fh-btn--outline {
  background: transparent;
  border: 1.5px solid var(--fh-gold);
  color: var(--fh-gold);
}
.fh-btn--outline:hover {
  background: rgba(217, 165, 91, 0.15);
  color: var(--fh-white);
}
.fh-btn--block {
  width: 100%;
  text-align: center;
}
.fh-btn--lg {
  padding: 0.85rem 1.4rem;
  font-size: 0.95rem;
  font-weight: 700;
}

/* Mobile Hamburger Button — Flex-shrink: 0, 44x44px Touch Target */
.fh-burger {
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1.5px solid rgba(217, 165, 91, 0.45);
  border-radius: 8px;
  background: rgba(217, 165, 91, 0.1);
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
}
.fh-burger:hover {
  background: rgba(217, 165, 91, 0.2);
  border-color: var(--fh-gold);
}
.fh-burger span {
  display: block;
  width: 22px;
  height: 2.5px;
  border-radius: 2px;
  background: var(--fh-gold);
  transition: transform 0.3s var(--fh-ease), opacity 0.2s ease;
}
.fh-nav--open .fh-burger span:nth-child(1) {
  transform: translateY(7.5px) rotate(45deg);
}
.fh-nav--open .fh-burger span:nth-child(2) {
  opacity: 0;
  transform: scaleX(0);
}
.fh-nav--open .fh-burger span:nth-child(3) {
  transform: translateY(-7.5px) rotate(-45deg);
}

/* Mobile Menu Drawer */
.fh-mobile {
  position: fixed;
  top: var(--fh-h);
  left: 0;
  right: 0;
  max-height: calc(100svh - var(--fh-h));
  overflow-y: auto;
  background: rgba(16, 28, 27, 0.98);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 2px solid rgba(217, 165, 91, 0.35);
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.7);
  display: none;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem 1.25rem 2.2rem;
  z-index: 105;
}
.fh-mobile.is-open {
  display: flex;
  animation: fh-drawer-in 0.28s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes fh-drawer-in {
  from {
    opacity: 0;
    transform: translateY(-12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fh-mobile-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 90;
}

/* Drawer Cards & Elements */
.fh-mobile-user-card {
  background: rgba(245, 240, 230, 0.05);
  border: 1px solid rgba(217, 165, 91, 0.25);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.fh-mobile-user-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}
.fh-mobile-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid var(--fh-gold);
  object-fit: cover;
  flex-shrink: 0;
}
.fh-mobile-user-meta {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.fh-mobile-user-name {
  font-weight: 700;
  font-size: 1rem;
  color: var(--fh-white);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.fh-mobile-user-role {
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--fh-gold);
  font-weight: 600;
}

.fh-mobile-staff-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s ease;
}
.fh-mobile-staff-btn--admin {
  background: linear-gradient(135deg, #d9a55b, #b88339);
  color: #101c1b;
}
.fh-mobile-staff-btn--cashier {
  background: linear-gradient(135deg, #3498db, #2980b9);
}
.fh-mobile-staff-btn--kitchen {
  background: linear-gradient(135deg, #e67e22, #d35400);
}
.fh-mobile-staff-btn--waiter {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
}
.fh-mobile-logout-btn {
  background: transparent;
  border: 1px solid rgba(224, 82, 82, 0.4);
  color: #ff7675;
  padding: 0.55rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.fh-mobile-logout-btn:hover {
  background: rgba(224, 82, 82, 0.12);
  border-color: #e05252;
}

.fh-mobile-guest-card {
  background: rgba(245, 240, 230, 0.05);
  border: 1px solid rgba(217, 165, 91, 0.25);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  text-align: center;
}
.fh-mobile-guest-text {
  margin: 0;
  font-size: 0.92rem;
  color: rgba(245, 240, 230, 0.85);
}

.fh-mobile-links {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.fh-mobile-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  color: rgba(245, 240, 230, 0.9);
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.2s ease;
}
.fh-mobile-link:hover,
.fh-mobile-link.is-active {
  background: rgba(217, 165, 91, 0.12);
  border-color: rgba(217, 165, 91, 0.4);
  color: var(--fh-gold);
  transform: translateX(4px);
}
.fh-mobile-link-arrow {
  font-size: 1.1rem;
  color: rgba(217, 165, 91, 0.6);
  transition: transform 0.2s ease;
}
.fh-mobile-link:hover .fh-mobile-link-arrow,
.fh-mobile-link.is-active .fh-mobile-link-arrow {
  transform: translateX(4px);
  color: var(--fh-gold);
}

.fh-mobile-actions {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  margin-top: 0.25rem;
}
.fh-mobile-info {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding-top: 0.85rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 0.82rem;
  color: rgba(245, 240, 230, 0.65);
  text-align: center;
}
.fh-mobile-tel {
  color: var(--fh-gold);
  font-weight: 600;
}

/* Breakpoints */
@media (max-width: 1024px) {
  .fh-nav__links {
    gap: 1.25rem;
  }
}
@media (max-width: 820px) {
  .fh-nav {
    --fh-h: 64px;
  }
  .fh-nav__inner {
    padding: 0 1rem;
    gap: 0.5rem;
  }
  .fh-nav__links {
    display: none !important;
  }
  .fh-desktop-actions {
    display: none !important;
  }
  .fh-burger {
    display: flex !important;
  }
  .fh-brand__text strong {
    font-size: 1.05rem;
  }
}
@media (max-width: 480px) {
  .fh-nav__inner {
    padding: 0 0.85rem;
  }
  .fh-brand__mark {
    width: 22px;
    height: 28px;
  }
  .fh-brand__text strong {
    font-size: 0.98rem;
  }
  .fh-brand__text small {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .fh-nav,
  .fh-nav *,
  .fh-mobile {
    animation: none !important;
    transition-duration: 0.01ms !important;
  }
}
`;
