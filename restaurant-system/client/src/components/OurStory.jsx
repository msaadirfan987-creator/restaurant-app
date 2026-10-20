import { useEffect, useRef, useState } from "react";

/**
 * OurStory.jsx — Section 05: Our Story
 *
 *  - Image collage (reveal animation) + animated text
 *  - Heading word-by-word reveal
 *  - 3 features: Fresh Ingredients, Quality & Taste, Unique Cooking Process
 *  - Count-up numbers with high quality online images
 *
 * <OurStory />
 */

const COLORS = { bg: "#151a17", surface: "#242a27", green: "#1f4a38", amber: "#d9a441", cream: "#f4ead5" };

const MAIN_ONLINE_IMG = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80";
const SMALL_ONLINE_IMG = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80";

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

function CountUp({ to, suffix = "", run, duration = 1800 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setVal(to);
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      setVal(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, to, duration]);
  return (
    <>
      {val.toLocaleString("en-US")}
      {suffix}
    </>
  );
}

function Photo({ src, alt }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="os-placeholder">{alt}</span>;
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      draggable={false}
      className={`os-img ${loaded ? "is-loaded" : ""}`}
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
    />
  );
}

const FEATURES = [
  {
    n: "01",
    title: "Fresh Ingredients",
    text: "Crisp produce delivered daily from local farms, paired with 100% prime, fresh beef. We never compromise with frozen patties or artificial additives.",
  },
  {
    n: "02",
    title: "Quality & Taste",
    text: "Every recipe is crafted and perfected. Golden butter-toasted brioche buns, melted aged cheddar, and balanced house-made sauces in every satisfying bite.",
  },
  {
    n: "03",
    title: "Unique Cooking Process",
    text: "Hand-pressed patties flame-grilled to seal in smoky juices, glazed with butter and dressed with our signature scratch-made sauces.",
  },
];

const STATS = [
  { to: 100, suffix: "%", label: "Fresh Ingredients" },
  { to: 12, suffix: "+", label: "Years of Experience" },
  { to: 50000, suffix: "+", label: "Burgers Served" },
];

export default function OurStory({
  id = "story",
  eyebrow = "Our Story",
  title = "One Passion, Pure Craftsmanship, and Only Fresh Ingredients",
  intro = "We started as a humble kitchen with a single dream: to craft burgers that feel comforting, wholesome, and bursting with unforgettable gourmet flavor. Today, every single burger is prepared with that very same passion.",
  mainImage = MAIN_ONLINE_IMG,
  smallImage = SMALL_ONLINE_IMG,
  features = FEATURES,
  stats = STATS,
}) {
  const [ref, seen] = useInView(0.15);
  const words = title.split(" ");

  return (
    <section id={id} ref={ref} className={`os-section ${seen ? "is-in" : ""}`} aria-labelledby="os-title">
      <style>{css}</style>
      <div className="os-wrap">
        {/* Images */}
        <div className="os-media">
          <div className="os-main">
            <Photo src={mainImage} alt="Fresh burger ingredients and kitchen" />
          </div>
          <div className="os-small">
            <Photo src={smallImage} alt="Our signature gourmet burger" />
          </div>
          <div className="os-tag">
            <strong>Since 2013</strong>
            <span>Fresh, Always</span>
          </div>
        </div>

        {/* Text */}
        <div className="os-text">
          <p className="os-eyebrow">{eyebrow}</p>
          <h2 id="os-title" className="os-title" aria-label={title}>
            {words.map((w, i) => (
              <span key={i} className="os-word" style={{ "--w": i }} aria-hidden="true">
                {w}&nbsp;
              </span>
            ))}
          </h2>
          <p className="os-intro">{intro}</p>

          <div className="os-features">
            {features.map((f, i) => (
              <div key={f.n} className="os-feature" style={{ "--f": i }}>
                <span className="os-fnum">{f.n}</span>
                <div>
                  <h3 className="os-ftitle">{f.title}</h3>
                  <p className="os-ftext">{f.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="os-stats">
            {stats.map((s) => (
              <div key={s.label} className="os-stat">
                <span className="os-stat-num">
                  <CountUp to={s.to} suffix={s.suffix} run={seen} />
                </span>
                <span className="os-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const css = `
.os-section {
  --bg: ${COLORS.bg}; --surface: ${COLORS.surface}; --green: ${COLORS.green}; --amber: ${COLORS.amber}; --cream: ${COLORS.cream};
  background: var(--bg); color: var(--cream);
  padding: clamp(72px, 10vw, 140px) 0;
  font-family: "Inter", "Segoe UI", system-ui, sans-serif;
  overflow: hidden;
}
.os-wrap { max-width: 1320px; margin: 0 auto; padding: 0 clamp(20px, 5vw, 72px); display: grid; grid-template-columns: 1fr 1.05fr; gap: clamp(36px, 6vw, 96px); align-items: center; }

/* Media */
.os-media { position: relative; padding-bottom: 60px; padding-right: 60px; }
.os-main, .os-small { overflow: hidden; border-radius: 10px; background: #101311; display: flex; align-items: center; justify-content: center; clip-path: inset(100% 0 0 0); transition: clip-path 1300ms ${EASE}; }
.os-main { aspect-ratio: 4 / 5; }
.os-small { position: absolute; right: 0; bottom: 0; width: 46%; aspect-ratio: 1; border: 8px solid var(--bg); transition-delay: 350ms; }
.os-section.is-in .os-main, .os-section.is-in .os-small { clip-path: inset(0 0 0 0); }
.os-img { width: 100%; height: 100%; object-fit: cover; opacity: 0; transform: scale(1.25); transition: opacity 800ms ease, transform 2400ms ${EASE}; }
.os-img.is-loaded { opacity: 1; transform: scale(1); }
.os-placeholder { padding: 16px; text-align: center; font-family: "Playfair Display", Georgia, serif; color: rgba(244, 234, 213, 0.55); }
.os-tag { position: absolute; left: -12px; bottom: 90px; padding: 14px 20px; background: var(--amber); color: var(--bg); border-radius: 8px; display: flex; flex-direction: column; opacity: 0; transform: translateX(-30px); transition: opacity 700ms ease 1.2s, transform 900ms ${EASE} 1.2s; }
.os-tag strong { font-size: 20px; }
.os-tag span { font-size: 13px; font-weight: 600; }
.os-section.is-in .os-tag { opacity: 1; transform: none; }

/* Text */
.os-eyebrow { margin: 0 0 14px; font-size: 14px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--amber); opacity: 0; transform: translateY(16px); transition: opacity 600ms ease, transform 700ms ${EASE}; }
.os-section.is-in .os-eyebrow { opacity: 1; transform: none; }
.os-title { margin: 0 0 20px; font-family: "Playfair Display", Georgia, "Times New Roman", serif; font-size: clamp(30px, 4vw, 52px); line-height: 1.15; font-weight: 700; }
.os-word { display: inline-block; opacity: 0; transform: translateY(32px); transition: opacity 600ms ease, transform 800ms ${EASE}; transition-delay: calc(var(--w) * 70ms + 200ms); }
.os-section.is-in .os-word { opacity: 1; transform: none; }
.os-intro { margin: 0 0 32px; max-width: 56ch; font-size: 17px; line-height: 1.7; color: rgba(244, 234, 213, 0.8); opacity: 0; transform: translateY(20px); transition: opacity 700ms ease 900ms, transform 800ms ${EASE} 900ms; }
.os-section.is-in .os-intro { opacity: 1; transform: none; }

.os-features { display: flex; flex-direction: column; gap: 22px; margin-bottom: 36px; }
.os-feature { display: flex; gap: 20px; padding-bottom: 22px; border-bottom: 1px solid rgba(244, 234, 213, 0.12); opacity: 0; transform: translateX(40px); transition: opacity 700ms ease, transform 900ms ${EASE}; transition-delay: calc(var(--f) * 160ms + 1100ms); }
.os-section.is-in .os-feature { opacity: 1; transform: none; }
.os-fnum { flex: 0 0 auto; font-family: "Playfair Display", Georgia, serif; font-size: 34px; line-height: 1; font-weight: 700; color: var(--amber); }
.os-ftitle { margin: 0 0 6px; font-size: 19px; font-weight: 700; }
.os-ftext { margin: 0; font-size: 15px; line-height: 1.65; color: rgba(244, 234, 213, 0.75); }

.os-stats { display: flex; flex-wrap: wrap; gap: clamp(20px, 4vw, 56px); opacity: 0; transition: opacity 800ms ease 1.7s; }
.os-section.is-in .os-stats { opacity: 1; }
.os-stat { display: flex; flex-direction: column; gap: 4px; }
.os-stat-num { font-size: clamp(30px, 3.4vw, 42px); font-weight: 800; line-height: 1; color: var(--amber); font-variant-numeric: tabular-nums; }
.os-stat-label { font-size: 13px; font-weight: 600; letter-spacing: 0.04em; color: rgba(244, 234, 213, 0.72); }

@media (max-width: 900px) {
  .os-wrap { grid-template-columns: 1fr; }
  .os-media { max-width: 520px; }
  .os-tag { left: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .os-main, .os-small, .os-img, .os-tag, .os-eyebrow, .os-word, .os-intro, .os-feature, .os-stats { transition: none !important; opacity: 1; transform: none; clip-path: none; }
}
`;
