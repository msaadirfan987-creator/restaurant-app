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

  // Scroll par background dark
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Jo section screen par ho uska link active
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

  // Escape se mobile menu band
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (href) => {
    setActive(href);
    setOpen(false);
  };

  return (
    <>
      <style>{css}</style>
      <header className={`fh-nav ${scrolled ? "fh-nav--solid" : ""} ${open ? "fh-nav--open" : ""}`}>
        <div className="fh-nav__inner">
          <a className="fh-brand" href="#home" onClick={() => go("#home")}>
            <svg className="fh-brand__mark" viewBox="0 0 24 32" aria-hidden="true">
              <path d="M12 1c1 6 8 9 8 18a8 8 0 0 1-16 0c0-4 2-6 4-8 0 3 1 4 2 4 0-5-1-9 2-14z" fill="#D9A55B" />
            </svg>
            <span className="fh-brand__text">
              <strong>The Flavor Hub</strong>
              <small>Restaurant &amp; Cafe</small>
            </span>
          </a>

          <nav className="fh-nav__links" aria-label="Primary">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={active === l.href ? "is-active" : ""}
                aria-current={active === l.href ? "page" : undefined}
                onClick={() => go(l.href)}
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="fh-nav__actions">
            <button className="fh-icon-btn" aria-label={`Cart, ${cartCount} items`} onClick={onCartClick}>
              <img
                src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=100&q=80"
                alt="Cart"
                className="fh-cart-img"
              />
              {cartCount > 0 && <span className="fh-icon-btn__badge">{cartCount}</span>}
            </button>

            {currentUser ? (
              <div className="fh-user-pill">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
                  alt={currentUser.name}
                  className="fh-user-img"
                />
                <span className="fh-user-name">{currentUser.name ? currentUser.name.split(" ")[0] : "Account"}</span>
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
                style={{ background: "#3498db" }}
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
                style={{ background: "#e67e22" }}
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
                style={{ background: "#2ecc71" }}
              >
                Waiter Panel
              </button>
            )}

            <button className="fh-btn fh-nav__order" onClick={onOrderClick}>
              Order Now
            </button>

            <button
              className="fh-burger"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="fh-mobile-nav"
              onClick={() => setOpen((o) => !o)}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>

        <div className="fh-mobile" id="fh-mobile-nav" hidden={!open}>
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className={active === l.href ? "is-active" : ""} onClick={() => go(l.href)}>
              {l.label}
            </a>
          ))}
          {currentUser ? (
            <div className="fh-mobile-user">
              <span>Hi, {currentUser.name} ({currentUser.role})</span>
              {currentUser.role === "admin" && (
                <button type="button" className="fh-btn" onClick={() => { setOpen(false); onAdminClick?.(); }}>
                  Admin Dashboard
                </button>
              )}
              {currentUser.role === "cashier" && (
                <button type="button" className="fh-btn" onClick={() => { setOpen(false); onStaffClick?.("/cashier"); }}>
                  Cashier POS
                </button>
              )}
              {currentUser.role === "kitchen" && (
                <button type="button" className="fh-btn" onClick={() => { setOpen(false); onStaffClick?.("/kitchen"); }}>
                  Kitchen KDS
                </button>
              )}
              {currentUser.role === "waiter" && (
                <button type="button" className="fh-btn" onClick={() => { setOpen(false); onStaffClick?.("/waiter"); }}>
                  Waiter Panel
                </button>
              )}
              <button
                type="button"
                className="fh-btn fh-btn--secondary"
                onClick={() => { setOpen(false); onLogout?.(); }}
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="fh-btn fh-btn--secondary"
              onClick={() => { setOpen(false); onLoginClick?.("login"); }}
            >
              Sign In / Register
            </button>
          )}
          <button className="fh-btn" onClick={() => { setOpen(false); onOrderClick?.(); }}>
            Order Now
          </button>
        </div>
      </header>
    </>
  );
}

const css = `
.fh-nav{
  --fh-bg:#101C1B; --fh-gold:#D9A55B; --fh-cream:#F5F0E6; --fh-white:#fff;
  --fh-h:72px; --fh-ease:cubic-bezier(.22,.61,.36,1);
  position:fixed; inset:0 0 auto 0; z-index:50;
  background:linear-gradient(rgba(16,28,27,.55),rgba(16,28,27,0));
  font-family:Inter,system-ui,sans-serif;
  transition:background-color .3s var(--fh-ease),box-shadow .3s var(--fh-ease);
  animation:fh-in .5s var(--fh-ease) both;
}
.fh-nav *{box-sizing:border-box}
.fh-nav a{color:inherit;text-decoration:none}
.fh-nav :focus-visible{outline:2px solid var(--fh-gold);outline-offset:3px;border-radius:4px}
.fh-nav--solid,.fh-nav--open{
  background:rgba(16,28,27,.94); backdrop-filter:blur(10px);
  box-shadow:0 1px 0 rgba(217,165,91,.18),0 10px 30px rgba(0,0,0,.25);
}
@keyframes fh-in{from{opacity:0;transform:translateY(-8px)}}

.fh-nav__inner{max-width:1240px;margin:0 auto;height:var(--fh-h);padding:0 1.5rem;display:flex;align-items:center;justify-content:space-between;gap:1.5rem}

.fh-brand{display:flex;align-items:center;gap:.65rem}
.fh-brand__mark{width:26px;height:34px}
.fh-brand__text{display:flex;flex-direction:column;line-height:1.15}
.fh-brand__text strong{font:700 1.1rem "Playfair Display",Georgia,serif;color:var(--fh-white)}
.fh-brand__text small{font-size:.62rem;letter-spacing:.14em;text-transform:uppercase;color:rgba(245,240,230,.65)}

.fh-nav__links{display:flex;gap:2rem}
.fh-nav__links a,.fh-mobile a{position:relative;padding:.4rem 0;font-size:.9rem;font-weight:500;color:rgba(245,240,230,.82);transition:color .25s var(--fh-ease)}
.fh-nav__links a::after{content:"";position:absolute;left:0;right:0;bottom:-2px;height:2px;background:var(--fh-gold);transform:scaleX(0);transform-origin:left;transition:transform .3s var(--fh-ease)}
.fh-nav__links a:hover,.fh-nav__links a.is-active{color:var(--fh-white)}
.fh-nav__links a:hover::after{transform:scaleX(.5)}
.fh-nav__links a.is-active::after{transform:scaleX(1)}

.fh-nav__actions{display:flex;align-items:center;gap:.9rem}
.fh-icon-btn{position:relative;display:grid;place-items:center;width:40px;height:40px;border:0;border-radius:50%;background:transparent;color:var(--fh-cream);cursor:pointer;transition:background-color .25s var(--fh-ease),color .25s var(--fh-ease)}
.fh-icon-btn:hover{background:rgba(245,240,230,.1);color:var(--fh-gold)}
.fh-cart-img{width:32px;height:32px;border-radius:50%;object-fit:cover;border:1.5px solid var(--fh-gold);transition:transform .25s var(--fh-ease)}
.fh-icon-btn:hover .fh-cart-img{transform:scale(1.08)}
.fh-icon-btn__badge{position:absolute;top:-2px;right:-2px;min-width:18px;height:18px;padding:0 4px;border-radius:9px;background:var(--fh-gold);color:var(--fh-bg);font:700 .68rem/18px Inter,sans-serif;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,.4)}

.fh-auth-btn{
  display:inline-flex;align-items:center;gap:.5rem;padding:.32rem .9rem .32rem .35rem;
  border:1.5px solid rgba(217,165,91,.45);border-radius:999px;background:rgba(245,240,230,.06);
  color:var(--fh-cream);font:600 .86rem Inter,sans-serif;cursor:pointer;transition:all .25s var(--fh-ease);
}
.fh-auth-btn:hover{background:rgba(217,165,91,.15);border-color:var(--fh-gold);color:var(--fh-white);transform:translateY(-1px)}
.fh-auth-img,.fh-user-img{width:28px;height:28px;border-radius:50%;object-fit:cover;border:1.5px solid var(--fh-gold);flex-shrink:0}

.fh-user-pill{
  display:inline-flex;align-items:center;gap:.5rem;padding:.3rem .75rem .3rem .35rem;
  border:1.5px solid rgba(217,165,91,.35);border-radius:999px;background:rgba(36,42,39,.85);
  font:600 .84rem Inter,sans-serif;color:var(--fh-cream);
}
.fh-user-name{max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fh-logout-btn{
  background:none;border:0;padding:.2rem .45rem;border-radius:4px;
  color:var(--fh-gold);font-size:.76rem;font-weight:700;cursor:pointer;transition:all .2s ease;
}
.fh-admin-btn{
  background:rgba(217,165,91,.18);border:1.5px solid var(--fh-gold);border-radius:999px;
  padding:.32rem .85rem;color:var(--fh-gold);font:700 .78rem Inter,sans-serif;
  text-transform:uppercase;letter-spacing:.05em;cursor:pointer;transition:all .2s ease;
}
.fh-admin-btn:hover{background:var(--fh-gold);color:var(--fh-bg)}
.fh-btn--secondary{background:transparent;color:var(--fh-gold);border:1.5px solid var(--fh-gold);margin-top:.8rem}
.fh-mobile-user{display:flex;flex-direction:column;gap:.5rem;margin-top:.8rem;font-size:.9rem;color:var(--fh-cream)}

.fh-btn{display:inline-flex;align-items:center;justify-content:center;padding:.55rem 1.2rem;border:0;border-radius:999px;background:var(--fh-gold);color:var(--fh-bg);font:600 .88rem Inter,sans-serif;cursor:pointer;transition:transform .25s var(--fh-ease),background-color .25s var(--fh-ease)}
.fh-btn:hover{background:#e6b873;transform:translateY(-1px)}
.fh-btn:active{transform:scale(.97)}

.fh-burger{display:none;flex-direction:column;justify-content:center;gap:5px;width:40px;height:40px;padding:0 9px;border:0;background:none;cursor:pointer}
.fh-burger span{height:2px;border-radius:2px;background:var(--fh-cream);transition:transform .3s var(--fh-ease),opacity .2s}
.fh-nav--open .fh-burger span:nth-child(1){transform:translateY(7px) rotate(45deg)}
.fh-nav--open .fh-burger span:nth-child(2){opacity:0}
.fh-nav--open .fh-burger span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
.fh-mobile{display:flex;flex-direction:column;padding:.5rem 1.5rem 1.4rem}
.fh-mobile[hidden]{display:none}
.fh-mobile a{padding:.75rem 0;font-size:1rem;border-bottom:1px solid rgba(245,240,230,.08)}
.fh-mobile a.is-active{color:var(--fh-gold)}
.fh-mobile .fh-btn{margin-top:1rem;padding:.8rem 1.6rem}

@media (max-width:1024px){.fh-nav__links{gap:1.3rem}}
@media (max-width:820px){
  .fh-nav{--fh-h:64px}
  .fh-nav__links,.fh-nav__order{display:none}
  .fh-burger{display:flex}
}
@media (prefers-reduced-motion:reduce){
  .fh-nav,.fh-nav *{animation:none!important;transition-duration:.01ms!important}
}
`;
