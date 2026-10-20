import { useEffect, useRef, useState } from "react";

/**
 * SpecialOffer.jsx — Section 04: Special Offer / Combo Deal
 *
 *  - Special combo, discount badge, purani/nayi price
 *  - Bari food image (reveal + float animation) with online high-res images
 *  - Live countdown timer
 *  - Order Now CTA
 *
 * <SpecialOffer onOrder={() => {}} />
 */

const COLORS = { bg: "#151a17", green: "#1f4a38", amber: "#d9a441", cream: "#f4ead5" };

// High-quality online food combo & burger images
const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=1200&q=80";
const FALLBACK_ONLINE_IMAGE =
  "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80";

function useInView(threshold = 0.2) {
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

function useCountdown(endsAt) {
  const [target] = useState(() =>
    endsAt ? new Date(endsAt).getTime() : Date.now() + (3 * 24 + 4) * 3600 * 1000
  );
  const [left, setLeft] = useState(() => Math.max(0, target - Date.now()));
  useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(0, target - Date.now())), 1000);
    return () => clearInterval(t);
  }, [target]);
  const s = Math.floor(left / 1000);
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
    done: left === 0,
  };
}

const pad = (n) => String(n).padStart(2, "0");
const money = (n) => `Rs. ${n.toLocaleString("en-US")}`;

export default function SpecialOffer({
  id = "offer",
  label = "Limited Time Deal",
  title = "Mega Burger Combo",
  description = "Two juicy double-patty smash cheeseburgers, a generous basket of crispy golden fries, and two chilled chocolate milkshakes. The perfect feast to share with friends or family.",
  includes = ["2 Double Patty Cheeseburgers", "Large Fries Basket", "2 Chocolate Shakes"],
  discount = 30,
  oldPrice = 2190,
  price = 1530,
  endsAt = null,
  image = DEFAULT_IMAGE,
  fallbackImage = FALLBACK_ONLINE_IMAGE,
  onOrder = () => {},
}) {
  const [ref, seen] = useInView(0.2);
  const [src, setSrc] = useState(image);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const t = useCountdown(endsAt);
  const cutout = src === fallbackImage;

  const units = [
    ["Days", t.d],
    ["Hours", t.h],
    ["Mins", t.m],
    ["Secs", t.s],
  ];

  return (
    <section id={id} ref={ref} className={`so-section ${seen ? "is-in" : ""}`} aria-labelledby="so-title">
      <style>{css}</style>
      <div className="so-wrap">
        <div className="so-text">
          <span className="so-label">{label}</span>
          <h2 id="so-title" className="so-title">{title}</h2>
          <p className="so-desc">{description}</p>

          <ul className="so-list">
            {includes.map((it, i) => (
              <li key={it} style={{ "--i": i }}>{it}</li>
            ))}
          </ul>

          <div className="so-price">
            <span className="so-new">{money(price)}</span>
            <span className="so-old">{money(oldPrice)}</span>
            <span className="so-save">Save {money(oldPrice - price)}</span>
          </div>

          <div className="so-timer" aria-label="Countdown timer for special offer">
            {units.map(([name, val]) => (
              <div key={name} className="so-unit">
                <span key={val} className="so-num">{pad(val)}</span>
                <span className="so-unit-name">{name}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="so-cta"
            onClick={() => onOrder({ id: "mega-burger-combo", name: title, price, image: src })}
          >
            Order Now
          </button>
        </div>

        <div className="so-visual">
          <div className="so-frame" />
          <div className={`so-img-wrap ${cutout ? "is-cutout" : ""}`}>
            {failed ? (
              <span className="so-placeholder">{title}</span>
            ) : (
              <img
                src={src}
                alt={title}
                draggable={false}
                className={`so-img ${loaded ? "is-loaded" : ""}`}
                onLoad={() => setLoaded(true)}
                onError={() => {
                  setLoaded(false);
                  if (src !== fallbackImage) setSrc(fallbackImage);
                  else setFailed(true);
                }}
              />
            )}
          </div>
          <div className="so-badge" aria-label={`${discount} percent off`}>
            <span className="so-badge-num">{discount}%</span>
            <span className="so-badge-off">OFF</span>
          </div>
        </div>
      </div>
    </section>
  );
}

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const css = `
.so-section {
  --bg: ${COLORS.bg}; --green: ${COLORS.green}; --amber: ${COLORS.amber}; --cream: ${COLORS.cream};
  background: var(--bg);
  border-top: 1px solid rgba(244, 234, 213, 0.06);
  border-bottom: 1px solid rgba(244, 234, 213, 0.06);
  color: var(--cream);
  padding: clamp(64px, 9vw, 120px) 0;
  overflow: hidden;
  font-family: "Inter", "Segoe UI", system-ui, sans-serif;
}
.so-wrap {
  max-width: 1320px; margin: 0 auto; padding: 0 clamp(20px, 5vw, 72px);
  display: grid; grid-template-columns: 1fr 1fr; gap: clamp(32px, 5vw, 80px); align-items: center;
}
.so-text > * { opacity: 0; transform: translateY(28px); transition: opacity 700ms ease, transform 900ms ${EASE}; }
.so-section.is-in .so-text > * { opacity: 1; transform: none; }
.so-section.is-in .so-text > :nth-child(1) { transition-delay: 100ms; }
.so-section.is-in .so-text > :nth-child(2) { transition-delay: 200ms; }
.so-section.is-in .so-text > :nth-child(3) { transition-delay: 300ms; }
.so-section.is-in .so-text > :nth-child(4) { transition-delay: 400ms; }
.so-section.is-in .so-text > :nth-child(5) { transition-delay: 500ms; }
.so-section.is-in .so-text > :nth-child(6) { transition-delay: 600ms; }
.so-section.is-in .so-text > :nth-child(7) { transition-delay: 700ms; }

.so-text { display: flex; flex-direction: column; align-items: flex-start; gap: 20px; }
.so-label { padding: 7px 14px; border-radius: 6px; background: var(--amber); color: var(--bg); font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
.so-title { margin: 0; font-family: "Playfair Display", Georgia, "Times New Roman", serif; font-size: clamp(38px, 5.4vw, 72px); line-height: 1.04; font-weight: 700; }
.so-desc { margin: 0; max-width: 50ch; font-size: 17px; line-height: 1.65; color: rgba(244, 234, 213, 0.88); }

.so-list { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 10px; }
.so-list li { position: relative; padding-left: 22px; font-size: 17px; font-weight: 600; opacity: 0; transform: translateX(-16px); transition: opacity 600ms ease, transform 700ms ${EASE}; transition-delay: calc(var(--i) * 140ms + 700ms); }
.so-list li::before { content: ""; position: absolute; left: 0; top: 8px; width: 9px; height: 9px; background: var(--amber); }
.so-section.is-in .so-list li { opacity: 1; transform: none; }

.so-price { display: flex; align-items: baseline; flex-wrap: wrap; gap: 14px; }
.so-new { font-size: clamp(36px, 4.4vw, 56px); font-weight: 800; color: var(--amber); line-height: 1; }
.so-old { font-size: 22px; text-decoration: line-through; color: rgba(244, 234, 213, 0.6); }
.so-save { padding: 5px 10px; border: 1px solid var(--amber); border-radius: 6px; font-size: 13px; font-weight: 700; color: var(--amber); }

.so-timer { display: flex; gap: 10px; }
.so-unit { min-width: 74px; padding: 12px 8px 10px; border: 1px solid rgba(244, 234, 213, 0.28); border-radius: 8px; text-align: center; background: rgba(21, 26, 23, 0.35); }
.so-num { display: block; font-size: 30px; font-weight: 800; line-height: 1; font-variant-numeric: tabular-nums; animation: so-tick 450ms ${EASE}; }
.so-unit-name { display: block; margin-top: 6px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(244, 234, 213, 0.7); }
@keyframes so-tick { from { transform: translateY(-8px); opacity: 0.3; } to { transform: none; opacity: 1; } }

.so-cta { cursor: pointer; padding: 16px 38px; border: 2px solid var(--amber); border-radius: 8px; background: var(--amber); color: var(--bg); font-family: inherit; font-size: 18px; font-weight: 700; transition: background-color 220ms ease, transform 160ms ease; }
.so-cta:hover { background: #e6b658; border-color: #e6b658; transform: translateY(-2px); }
.so-cta:active { transform: scale(0.97); }
.so-cta:focus-visible { outline: 3px solid var(--cream); outline-offset: 3px; }

/* Visual */
.so-visual { position: relative; }
.so-frame { position: absolute; inset: 28px -20px -20px 28px; border: 3px solid var(--amber); border-radius: 12px; opacity: 0; transform: translate(24px, 24px); transition: opacity 800ms ease 600ms, transform 1000ms ${EASE} 600ms; }
.so-section.is-in .so-frame { opacity: 1; transform: none; }
.so-img-wrap { position: relative; aspect-ratio: 5 / 4; overflow: hidden; border-radius: 12px; background: #101311; display: flex; align-items: center; justify-content: center; clip-path: inset(0 100% 0 0); transition: clip-path 1300ms ${EASE} 250ms; }
.so-section.is-in .so-img-wrap { clip-path: inset(0 0 0 0); }
.so-img { width: 100%; height: 100%; object-fit: cover; opacity: 0; transform: scale(1.2); transition: opacity 800ms ease, transform 2200ms ${EASE}; }
.so-img.is-loaded { opacity: 1; transform: scale(1); }
.so-section.is-in .so-img.is-loaded { animation: so-float 6s ease-in-out 2.4s infinite; }
.is-cutout .so-img { object-fit: cover; padding: 0; }
@keyframes so-float { 0%, 100% { transform: scale(1) translateY(0); } 50% { transform: scale(1.04) translateY(-8px); } }
.so-placeholder { font-family: "Playfair Display", Georgia, serif; font-size: 24px; color: rgba(244, 234, 213, 0.55); }

.so-badge { position: absolute; top: -26px; right: -14px; z-index: 2; width: clamp(96px, 11vw, 132px); aspect-ratio: 1; border-radius: 50%; background: var(--amber); color: var(--bg); display: flex; flex-direction: column; align-items: center; justify-content: center; transform: scale(0) rotate(-40deg); transition: transform 900ms cubic-bezier(0.34, 1.56, 0.64, 1) 1.1s; }
.so-section.is-in .so-badge { transform: scale(1) rotate(-12deg); animation: so-pulse 2.8s ease-in-out 2.2s infinite; }
.so-badge-num { font-size: clamp(30px, 3.6vw, 44px); font-weight: 800; line-height: 1; }
.so-badge-off { font-size: 15px; font-weight: 800; letter-spacing: 0.1em; }
@keyframes so-pulse { 0%, 100% { transform: scale(1) rotate(-12deg); } 50% { transform: scale(1.07) rotate(-8deg); } }

@media (max-width: 900px) {
  .so-wrap { grid-template-columns: 1fr; }
  .so-visual { order: -1; margin-right: 20px; }
  .so-unit { min-width: 64px; }
}
@media (prefers-reduced-motion: reduce) {
  .so-text > *, .so-list li, .so-frame, .so-img-wrap, .so-img, .so-badge { transition: none !important; animation: none !important; opacity: 1; transform: none; clip-path: none; }
  .so-badge { transform: rotate(-12deg); }
}
`;
