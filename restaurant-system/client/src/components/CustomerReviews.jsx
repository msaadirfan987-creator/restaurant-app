import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * CustomerReviews.jsx — Section 06: Customer Reviews
 *
 *  - Feedback cards: star rating, review, customer name, avatar photos (online high-res portraits)
 *  - Smooth carousel (auto-play, hover par pause, Prev/Next, dots)
 *  - Stars CSS se bane hain
 *
 * <CustomerReviews />
 */

const COLORS = { bg: "#151a17", surface: "#242a27", green: "#1f4a38", amber: "#d9a441", cream: "#f4ead5" };

const REVIEWS = [
  {
    name: "Ayesha Khan",
    role: "Regular Customer",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    text: "Hands down the juiciest burger I have had in years! The bun was pillowy soft and the patty was flame-grilled to absolute perfection. It's now our official weekend spot.",
  },
  {
    name: "Hamza Ali",
    role: "Food Blogger",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    text: "You can instantly taste how fresh the ingredients are. The double cheeseburger paired with crispy seasoned fries is hands down my top recommendation.",
  },
  {
    name: "Sara Ahmed",
    role: "Family Visit",
    rating: 4,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    text: "The family feast platter was an instant hit with the kids! Super fast service and the burgers were served piping hot. Well worth every moment.",
  },
  {
    name: "Usman Tariq",
    role: "Office Lunch",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    text: "Ordered lunch for our entire office team. Packaging was top-notch and kept the food hot and crisp. Everyone in the office loved every bite.",
  },
  {
    name: "Fatima Noor",
    role: "Dessert Lover",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    text: "Their signature chocolate cookie frappe is unbelievable! The sweetest complement to a smoky, savory burger, and very reasonably priced.",
  },
  {
    name: "Bilal Hussain",
    role: "Late Night Visit",
    rating: 4,
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80",
    text: "Even during late-night hours, the meal arrived hot, fresh, and bursting with smoky flavor. The BBQ burger is unforgettable. Highly recommended!",
  },
];

const initials = (name) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

function Avatar({ src, name }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className="rv-avatar" aria-hidden="true">
      {src && !failed ? (
        <img
          src={src}
          alt={name}
          className={`rv-avatar-img ${loaded ? "is-loaded" : ""}`}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : null}
      {(!src || failed || !loaded) && (
        <span className="rv-avatar-fallback">{initials(name)}</span>
      )}
    </div>
  );
}

function Stars({ rating }) {
  return (
    <span className="rv-stars" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`rv-star ${i <= rating ? "is-on" : ""}`} />
      ))}
    </span>
  );
}

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

const GAP = 24;

export default function CustomerReviews({
  id = "reviews",
  eyebrow = "Customer Reviews",
  title = "What Our Customers Say",
  subtitle = "Genuine feedback from real food lovers. Your trust and delight inspire our kitchen every day.",
  reviews = REVIEWS,
  autoPlayMs = 5000,
}) {
  const [headRef, seen] = useInView(0.2);
  const viewportRef = useRef(null);
  const [vw, setVw] = useState(1000);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const perView = vw < 640 ? 1 : vw < 1000 ? 2 : 3;
  const maxIndex = Math.max(0, reviews.length - perView);
  const cardW = (vw - GAP * (perView - 1)) / perView;

  const average = useMemo(
    () => (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1),
    [reviews]
  );

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setVw(e.contentRect.width));
    ro.observe(el);
    setVw(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex));
  }, [maxIndex]);

  const next = useCallback(() => setIndex((i) => (i >= maxIndex ? 0 : i + 1)), [maxIndex]);
  const prev = () => setIndex((i) => (i <= 0 ? maxIndex : i - 1));

  useEffect(() => {
    if (paused || !seen) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(next, autoPlayMs);
    return () => clearInterval(t);
  }, [paused, seen, next, autoPlayMs]);

  return (
    <section id={id} className={`rv-section ${seen ? "is-in" : ""}`} aria-labelledby="rv-title">
      <style>{css}</style>
      <div className="rv-wrap">
        <header ref={headRef} className="rv-head">
          <div className="rv-head-text">
            <p className="rv-eyebrow">{eyebrow}</p>
            <h2 id="rv-title" className="rv-title">{title}</h2>
            <p className="rv-sub">{subtitle}</p>
          </div>
          <div className="rv-summary">
            <span className="rv-avg">{average}</span>
            <div>
              <Stars rating={Math.round(Number(average))} />
              <span className="rv-count">{reviews.length} customer reviews</span>
            </div>
          </div>
        </header>

        <div
          className="rv-carousel"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <div className="rv-viewport" ref={viewportRef}>
            <div
              className="rv-track"
              style={{
                gap: GAP,
                transform: `translateX(-${index * (cardW + GAP)}px)`,
              }}
            >
              {reviews.map((r, i) => {
                const visible = i >= index && i < index + perView;
                return (
                  <article
                    key={r.name}
                    className={`rv-card ${visible ? "is-visible" : ""}`}
                    style={{ width: cardW, "--i": i }}
                  >
                    <Stars rating={r.rating} />
                    <p className="rv-text">{r.text}</p>
                    <div className="rv-user">
                      <Avatar src={r.avatar} name={r.name} />
                      <div>
                        <span className="rv-name">{r.name}</span>
                        <span className="rv-role">{r.role}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="rv-controls">
            <div className="rv-dots" role="tablist" aria-label="Reviews slides">
              {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Slide ${i + 1}`}
                  className={`rv-dot ${i === index ? "is-active" : ""}`}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
            <div className="rv-arrows">
              <button type="button" className="rv-arrow" onClick={prev} aria-label="Previous review">
                Prev
              </button>
              <button type="button" className="rv-arrow" onClick={next} aria-label="Next review">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const css = `
.rv-section {
  --bg: ${COLORS.bg}; --surface: ${COLORS.surface}; --green: ${COLORS.green}; --amber: ${COLORS.amber}; --cream: ${COLORS.cream};
  background: var(--bg); color: var(--cream);
  padding: clamp(64px, 9vw, 120px) 0;
  font-family: "Inter", "Segoe UI", system-ui, sans-serif;
  border-top: 1px solid rgba(244, 234, 213, 0.06);
  overflow: hidden;
}
.rv-wrap { max-width: 1320px; margin: 0 auto; padding: 0 clamp(20px, 5vw, 72px); }
.rv-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 28px; margin-bottom: clamp(32px, 5vw, 56px); opacity: 0; transform: translateY(28px); transition: opacity 800ms ease, transform 900ms ${EASE}; }
.rv-section.is-in .rv-head { opacity: 1; transform: none; }
.rv-head-text { max-width: 620px; }
.rv-eyebrow { margin: 0 0 12px; font-size: 14px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--amber); }
.rv-title { margin: 0 0 14px; font-family: "Playfair Display", Georgia, "Times New Roman", serif; font-size: clamp(32px, 4.4vw, 56px); line-height: 1.1; font-weight: 700; }
.rv-sub { margin: 0; font-size: 17px; line-height: 1.65; color: rgba(244, 234, 213, 0.78); }
.rv-summary { display: flex; align-items: center; gap: 16px; padding: 16px 22px; border: 1px solid rgba(244, 234, 213, 0.14); border-radius: 10px; }
.rv-avg { font-family: "Playfair Display", Georgia, serif; font-size: 52px; font-weight: 700; line-height: 1; color: var(--amber); }
.rv-count { display: block; margin-top: 6px; font-size: 13px; color: rgba(244, 234, 213, 0.72); }

/* Stars */
.rv-stars { display: inline-flex; gap: 4px; }
.rv-star { width: 18px; height: 18px; background: rgba(244, 234, 213, 0.2); clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%); transition: background-color 300ms ease; }
.rv-star.is-on { background: var(--amber); }

/* Carousel */
.rv-viewport { overflow: hidden; }
.rv-track { display: flex; transition: transform 900ms ${EASE}; will-change: transform; }
.rv-card {
  box-sizing: border-box; flex: 0 0 auto; display: flex; flex-direction: column; gap: 18px;
  padding: 28px; background: var(--surface); border: 1px solid rgba(244, 234, 213, 0.08); border-radius: 10px;
  opacity: 0.35; transform: scale(0.96);
  transition: opacity 700ms ease, transform 900ms ${EASE}, border-color 300ms ease;
}
.rv-card.is-visible { opacity: 1; transform: scale(1); }
.rv-card:hover { border-color: rgba(217, 164, 65, 0.5); }
.rv-text { margin: 0; flex: 1; font-size: 16px; line-height: 1.75; color: rgba(244, 234, 213, 0.88); }
.rv-user { display: flex; align-items: center; gap: 14px; padding-top: 18px; border-top: 1px solid rgba(244, 234, 213, 0.1); }
.rv-avatar { position: relative; width: 48px; height: 48px; border-radius: 50%; overflow: hidden; background: var(--green); color: var(--cream); display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 2px solid rgba(217, 164, 65, 0.35); }
.rv-avatar-img { width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 300ms ease; }
.rv-avatar-img.is-loaded { opacity: 1; }
.rv-avatar-fallback { position: absolute; font-size: 15px; font-weight: 700; }
.rv-name { display: block; font-size: 16px; font-weight: 700; }
.rv-role { display: block; margin-top: 2px; font-size: 13px; color: rgba(244, 234, 213, 0.65); }

.rv-controls { display: flex; align-items: center; justify-content: space-between; margin-top: 32px; }
.rv-dots { display: flex; gap: 10px; }
.rv-dot { width: 12px; height: 12px; padding: 0; border: 0; border-radius: 6px; background: rgba(244, 234, 213, 0.25); cursor: pointer; transition: width 450ms ${EASE}, background-color 300ms ease; }
.rv-dot.is-active { width: 36px; background: var(--amber); }
.rv-dot:focus-visible, .rv-arrow:focus-visible { outline: 3px solid var(--cream); outline-offset: 3px; }
.rv-arrows { display: flex; gap: 10px; }
.rv-arrow { cursor: pointer; padding: 10px 22px; border: 2px solid rgba(244, 234, 213, 0.4); border-radius: 8px; background: transparent; color: var(--cream); font-family: inherit; font-size: 15px; font-weight: 600; transition: border-color 220ms ease, background-color 220ms ease, color 220ms ease; }
.rv-arrow:hover { border-color: var(--amber); background: var(--amber); color: var(--bg); }

@media (prefers-reduced-motion: reduce) {
  .rv-head, .rv-track, .rv-card, .rv-dot { transition: none !important; opacity: 1; transform: none; }
  .rv-track { transform: none; }
}
`;
