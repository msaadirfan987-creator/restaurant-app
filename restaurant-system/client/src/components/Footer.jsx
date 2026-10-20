import { useEffect, useRef, useState } from "react";

/**
 * Footer.jsx — Section 08: Footer
 *
 *  - Logo + short description
 *  - Quick navigation links (smooth scroll)
 *  - Contact details
 *  - Social media links (text links)
 *  - Copyright (saal automatic)
 *
 * <Footer />
 */

const COLORS = { bg: "#0f1311", green: "#1f4a38", amber: "#d9a441", cream: "#f4ead5" };

const LINKS = [
  { label: "Home", href: "#home" },
  { label: "Menu", href: "#menu" },
  { label: "Special Offer", href: "#offer" },
  { label: "Our Story", href: "#story" },
  { label: "Reviews", href: "#reviews" },
  { label: "Visit Us", href: "#visit" },
];

const SOCIALS = [
  { label: "Facebook", href: "https://facebook.com" },
  { label: "Instagram", href: "https://instagram.com" },
  { label: "X", href: "https://x.com" },
  { label: "TikTok", href: "https://tiktok.com" },
];

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) return setSeen(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, seen];
}

export default function Footer({
  brand = "Burger House",
  mark = "BH",
  logoImage = null,
  description = "Fresh ingredients, flame-grilled artisan patties, and crafted with love in every bite. Every burger with us is an unforgettable culinary experience.",
  links = LINKS,
  contact = {
    address: "Main Boulevard, Food Street, Lahore, Pakistan",
    phone: "+92 300 1234567",
    email: "hello@burgerhouse.com",
  },
  socials = SOCIALS,
}) {
  const [ref, seen] = useInView(0.15);

  const go = (e, href) => {
    if (!href.startsWith("#")) return;
    const el = document.querySelector(href);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <footer ref={ref} className={`ft-footer ${seen ? "is-in" : ""}`}>
      <style>{css}</style>
      <div className="ft-wrap">
        <div className="ft-grid">
          <div className="ft-col ft-brand" style={{ "--c": 0 }}>
            <a className="ft-logo" href="#home" onClick={(e) => go(e, "#home")} aria-label={`${brand} home`}>
              {logoImage ? (
                <img src={logoImage} alt={brand} className="ft-logo-img" />
              ) : (
                <span className="ft-mark">{mark}</span>
              )}
              <span className="ft-name">{brand}</span>
            </a>
            <p className="ft-desc">{description}</p>
          </div>

          <nav className="ft-col" style={{ "--c": 1 }} aria-label="Quick links">
            <h4 className="ft-h">Quick Links</h4>
            <ul className="ft-list">
              {links.map((l) => (
                <li key={l.label}>
                  <a className="ft-link" href={l.href} onClick={(e) => go(e, l.href)}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ft-col" style={{ "--c": 2 }}>
            <h4 className="ft-h">Contact</h4>
            <ul className="ft-list ft-contact">
              <li>{contact.address}</li>
              <li>
                <a className="ft-link" href={`tel:${contact.phone.replace(/\s/g, "")}`}>
                  {contact.phone}
                </a>
              </li>
              <li>
                <a className="ft-link" href={`mailto:${contact.email}`}>
                  {contact.email}
                </a>
              </li>
            </ul>
          </div>

          <div className="ft-col" style={{ "--c": 3 }}>
            <h4 className="ft-h">Follow Us</h4>
            <ul className="ft-socials">
              {socials.map((s) => (
                <li key={s.label}>
                  <a className="ft-social" href={s.href} target="_blank" rel="noopener noreferrer">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="ft-bottom">
          <p className="ft-copy">
            © {new Date().getFullYear()} {brand}. All rights reserved.
          </p>
          <button
            type="button"
            className="ft-top"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Back to top
          </button>
        </div>
      </div>
    </footer>
  );
}

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const css = `
.ft-footer {
  --bg: ${COLORS.bg}; --green: ${COLORS.green}; --amber: ${COLORS.amber}; --cream: ${COLORS.cream};
  background: var(--bg); color: var(--cream);
  border-top: 3px solid var(--amber);
  padding: clamp(48px, 7vw, 88px) 0 28px;
  font-family: "Inter", "Segoe UI", system-ui, sans-serif;
}
.ft-wrap { max-width: 1320px; margin: 0 auto; padding: 0 clamp(20px, 5vw, 72px); }
.ft-grid { display: grid; grid-template-columns: 1.6fr 1fr 1.3fr 1fr; gap: clamp(28px, 4vw, 56px); }
.ft-col { opacity: 0; transform: translateY(28px); transition: opacity 700ms ease, transform 900ms ${EASE}; transition-delay: calc(var(--c) * 130ms); }
.ft-footer.is-in .ft-col { opacity: 1; transform: none; }

.ft-logo { display: inline-flex; align-items: center; gap: 12px; margin-bottom: 18px; color: var(--cream); text-decoration: none; }
.ft-mark { width: 44px; height: 44px; border-radius: 8px; background: var(--amber); color: var(--bg); display: flex; align-items: center; justify-content: center; font-size: 17px; font-weight: 800; transition: transform 500ms ${EASE}; }
.ft-logo:hover .ft-mark { transform: rotate(-8deg) scale(1.06); }
.ft-logo-img { width: 44px; height: 44px; object-fit: cover; border-radius: 8px; }
.ft-name { font-family: "Playfair Display", Georgia, serif; font-size: 24px; font-weight: 700; }
.ft-desc { margin: 0; max-width: 38ch; font-size: 15px; line-height: 1.7; color: rgba(244, 234, 213, 0.7); }

.ft-h { margin: 0 0 18px; font-size: 14px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--amber); }
.ft-list { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 12px; font-size: 15px; line-height: 1.55; color: rgba(244, 234, 213, 0.75); }
.ft-link { color: rgba(244, 234, 213, 0.8); text-decoration: none; background-image: linear-gradient(var(--amber), var(--amber)); background-size: 0 2px; background-position: 0 100%; background-repeat: no-repeat; transition: background-size 350ms ${EASE}, color 250ms ease; }
.ft-link:hover { color: var(--amber); background-size: 100% 2px; }

.ft-socials { margin: 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 10px; }
.ft-social { display: inline-block; padding: 9px 16px; border: 1px solid rgba(244, 234, 213, 0.3); border-radius: 8px; color: var(--cream); font-size: 14px; font-weight: 600; text-decoration: none; transition: background-color 250ms ease, border-color 250ms ease, color 250ms ease, transform 250ms ${EASE}; }
.ft-social:hover { background: var(--amber); border-color: var(--amber); color: var(--bg); transform: translateY(-3px); }
.ft-link:focus-visible, .ft-social:focus-visible, .ft-logo:focus-visible, .ft-top:focus-visible { outline: 3px solid var(--cream); outline-offset: 3px; }

.ft-bottom { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; margin-top: clamp(36px, 5vw, 64px); padding-top: 24px; border-top: 1px solid rgba(244, 234, 213, 0.12); }
.ft-copy { margin: 0; font-size: 14px; color: rgba(244, 234, 213, 0.6); }
.ft-top { cursor: pointer; padding: 8px 18px; border: 1px solid rgba(244, 234, 213, 0.3); border-radius: 8px; background: transparent; color: var(--cream); font-family: inherit; font-size: 14px; font-weight: 600; transition: border-color 220ms ease, color 220ms ease; }
.ft-top:hover { border-color: var(--amber); color: var(--amber); }

@media (max-width: 900px) { .ft-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 560px) { .ft-grid { grid-template-columns: 1fr; } }
@media (prefers-reduced-motion: reduce) { .ft-col { transition: none !important; opacity: 1; transform: none; } }
`;
