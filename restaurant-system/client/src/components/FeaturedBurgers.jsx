import { useEffect, useMemo, useRef, useState } from "react";

/**
 * FeaturedBurgers.jsx — Featured Burgers & Best Sellers Section
 *
 * Displays popular handcrafted burgers with add-to-cart, instant order,
 * smooth entrance animations, image hover zooms, and a sticky slide-up cart bar.
 */

const COLORS = {
  charcoal: "#1b1d1c",
  surface: "#242a27",
  green: "#1f4a38",
  amber: "#d9a441",
  cream: "#f4ead5",
  white: "#ffffff",
};

const LOCAL_FALLBACK = "/images/burger/burger-final.png";

const unsplash = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

export const BURGERS = [
  {
    id: "classic-beef",
    name: "Classic Beef Burger",
    price: 990,
    tag: "Best Seller",
    description: "150g prime beef patty, aged cheddar, crisp lettuce, and our house secret sauce.",
    image: unsplash("photo-1568901346375-23c9450c58cd"),
  },
  {
    id: "double-cheese",
    name: "Double Cheese Burger",
    price: 1290,
    tag: "Most Loved",
    description: "Two juicy patties, double cheddar cheese, and slow-caramelized onions.",
    image: unsplash("photo-1550547660-d9450f859349"),
  },
  {
    id: "smoky-bbq",
    name: "Smoky BBQ Burger",
    price: 1190,
    tag: "Chef's Pick",
    description: "Smoky BBQ glaze, crispy onion rings, and a freshly toasted sesame bun.",
    image: unsplash("photo-1571091718767-18b5b1457add"),
  },
  {
    id: "grill-house",
    name: "Grill House Special",
    price: 1390,
    tag: "New",
    description: "Flame-grilled artisan patty, tangy pickles, ripe tomatoes, and melted mozzarella.",
    image: unsplash("photo-1594212699903-ec8a3eca50f5"),
  },
];

const money = (n) => `Rs. ${n.toLocaleString("en-US")}`;

/** Triggers true once the element enters viewport */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
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

function BurgerImage({ src, name }) {
  const [source, setSource] = useState(src);
  const [loaded, setLoaded] = useState(false);
  const [failedAll, setFailedAll] = useState(false);
  const isLocal = source === LOCAL_FALLBACK;

  const handleError = () => {
    setLoaded(false);
    if (source !== LOCAL_FALLBACK) setSource(LOCAL_FALLBACK);
    else setFailedAll(true);
  };

  return (
    <div className={`fb-media ${isLocal ? "fb-media--cutout" : ""}`}>
      {failedAll ? (
        <span className="fb-placeholder">{name}</span>
      ) : (
        <img
          src={source}
          alt={name}
          loading="lazy"
          draggable={false}
          className={`fb-img ${loaded ? "is-loaded" : ""}`}
          onLoad={() => setLoaded(true)}
          onError={handleError}
        />
      )}
    </div>
  );
}

function BurgerCard({ burger, index, visible, justAdded, onAdd, onOrder }) {
  return (
    <article className={`fb-card ${visible ? "is-in" : ""}`} style={{ "--i": index }}>
      <div className="fb-media-wrap">
        <BurgerImage src={burger.image} name={burger.name} />
        {burger.tag && <span className="fb-tag">{burger.tag}</span>}
      </div>

      <div className="fb-body">
        <div className="fb-row">
          <h3 className="fb-name">{burger.name}</h3>
          <span className="fb-price">{money(burger.price)}</span>
        </div>
        <p className="fb-desc">{burger.description}</p>

        <div className="fb-actions">
          <button
            type="button"
            className={`fb-btn fb-btn--primary ${justAdded ? "is-added" : ""}`}
            onClick={() => onAdd(burger)}
          >
            {justAdded ? "Added" : "Add to Cart"}
          </button>
          <button type="button" className="fb-btn fb-btn--ghost" onClick={() => onOrder(burger)}>
            Order Now
          </button>
        </div>
      </div>
    </article>
  );
}

export default function FeaturedBurgers({
  burgers = BURGERS,
  eyebrow = "Best Sellers",
  title = "Featured Burgers",
  subtitle = "Our most beloved signature burgers, freshly prepared to order with premium ingredients.",
  onAddToCart = () => {},
  onOrderNow = () => {},
  onCheckout = () => {},
}) {
  const [headRef, headSeen] = useInView(0.3);
  const [gridRef, gridSeen] = useInView(0.12);
  const [cart, setCart] = useState({}); // { id: qty }
  const [flash, setFlash] = useState(null); // last added id

  const items = useMemo(
    () => burgers.filter((b) => cart[b.id]).map((b) => ({ ...b, qty: cart[b.id] })),
    [burgers, cart]
  );
  const count = items.reduce((s, i) => s + i.qty, 0);
  const total = items.reduce((s, i) => s + i.qty * i.price, 0);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 1400);
    return () => clearTimeout(t);
  }, [flash]);

  const handleAdd = (burger) => {
    setCart((c) => ({ ...c, [burger.id]: (c[burger.id] || 0) + 1 }));
    setFlash(burger.id);
    onAddToCart(burger);
  };

  return (
    <section className="fb-section" id="menu" aria-labelledby="fb-title">
      <style>{css}</style>

      <div className="fb-wrap">
        <header ref={headRef} className={`fb-head ${headSeen ? "is-in" : ""}`}>
          <p className="fb-eyebrow">{eyebrow}</p>
          <h2 id="fb-title" className="fb-title">
            {title}
          </h2>
          <p className="fb-sub">{subtitle}</p>
        </header>

        <div ref={gridRef} className="fb-grid">
          {burgers.map((b, i) => (
            <BurgerCard
              key={b.id}
              burger={b}
              index={i}
              visible={gridSeen}
              justAdded={flash === b.id}
              onAdd={handleAdd}
              onOrder={onOrderNow}
            />
          ))}
        </div>
      </div>

      {/* Cart bar */}
      <div className={`fb-cart ${count > 0 ? "is-open" : ""}`} role="status" aria-live="polite">
        <div className="fb-cart-info">
          <span key={count} className="fb-cart-count">
            {count} {count === 1 ? "item" : "items"}
          </span>
          <span className="fb-cart-total">{money(total)}</span>
        </div>
        <button type="button" className="fb-btn fb-btn--primary" onClick={() => onCheckout(items)}>
          Checkout
        </button>
      </div>
    </section>
  );
}

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

const css = `
.fb-section {
  --charcoal: ${COLORS.charcoal};
  --surface: ${COLORS.surface};
  --green: ${COLORS.green};
  --amber: ${COLORS.amber};
  --cream: ${COLORS.cream};
  --white: ${COLORS.white};
  position: relative;
  background: var(--charcoal);
  color: var(--cream);
  padding: clamp(64px, 9vw, 120px) 0 clamp(96px, 12vw, 150px);
  font-family: "Inter", "Segoe UI", system-ui, sans-serif;
}
.fb-wrap {
  max-width: 1320px;
  margin: 0 auto;
  padding: 0 clamp(20px, 5vw, 72px);
}

/* Heading */
.fb-head {
  max-width: 640px;
  margin-bottom: clamp(36px, 5vw, 64px);
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 800ms ease, transform 900ms ${EASE};
}
.fb-head.is-in { opacity: 1; transform: translateY(0); }
.fb-eyebrow {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--amber);
}
.fb-title {
  margin: 0 0 14px;
  font-family: "Playfair Display", Georgia, "Times New Roman", serif;
  font-size: clamp(32px, 4.4vw, 56px);
  line-height: 1.1;
  font-weight: 700;
  color: var(--cream);
}
.fb-sub { margin: 0; font-size: 17px; line-height: 1.65; color: rgba(244, 234, 213, 0.78); }

/* Grid */
.fb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}

/* Card */
.fb-card {
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid rgba(244, 234, 213, 0.08);
  border-radius: 10px;
  overflow: hidden;
  opacity: 0;
  transform: translateY(48px);
  transition:
    opacity 700ms ease calc(var(--i) * 130ms),
    transform 900ms ${EASE} calc(var(--i) * 130ms),
    border-color 250ms ease;
}
.fb-card.is-in { opacity: 1; transform: translateY(0); }
.fb-card.is-in:hover {
  transform: translateY(-6px);
  border-color: rgba(217, 164, 65, 0.55);
  transition-delay: 0ms;
}

.fb-media-wrap { position: relative; }
.fb-media {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: #151716;
  display: flex;
  align-items: center;
  justify-content: center;
}
.fb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transform: scale(1.15);
  transition: opacity 700ms ease, transform 1400ms ${EASE};
}
.fb-img.is-loaded { opacity: 1; transform: scale(1); }
.fb-card:hover .fb-img.is-loaded { transform: scale(1.07); transition-duration: 900ms; }
.fb-media--cutout .fb-img { object-fit: contain; padding: 10px; }
.fb-placeholder {
  padding: 16px;
  text-align: center;
  font-family: "Playfair Display", Georgia, serif;
  font-size: 20px;
  color: rgba(244, 234, 213, 0.6);
}

.fb-tag {
  position: absolute;
  top: 14px;
  left: 14px;
  padding: 6px 12px;
  border-radius: 6px;
  background: var(--amber);
  color: var(--charcoal);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.fb-body { display: flex; flex-direction: column; gap: 12px; padding: 20px; flex: 1; }
.fb-row { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.fb-name {
  margin: 0;
  font-family: "Playfair Display", Georgia, serif;
  font-size: 21px;
  line-height: 1.25;
  font-weight: 700;
  color: var(--cream);
}
.fb-price { font-size: 18px; font-weight: 700; color: var(--amber); white-space: nowrap; }
.fb-desc { margin: 0; flex: 1; font-size: 15px; line-height: 1.6; color: rgba(244, 234, 213, 0.75); }

.fb-actions { display: flex; gap: 10px; margin-top: 6px; }

/* Buttons */
.fb-btn {
  flex: 1;
  cursor: pointer;
  padding: 12px 8px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  white-space: nowrap;
  transition: background-color 220ms ease, border-color 220ms ease, color 220ms ease, transform 150ms ease;
}
.fb-btn:active { transform: scale(0.97); }
.fb-btn:focus-visible { outline: 3px solid var(--cream); outline-offset: 3px; }
.fb-btn--primary { border: 2px solid var(--amber); background: var(--amber); color: var(--charcoal); }
.fb-btn--primary:hover { background: #e6b658; border-color: #e6b658; }
.fb-btn--primary.is-added { background: var(--green); border-color: var(--green); color: var(--cream); }
.fb-btn--ghost { border: 2px solid rgba(244, 234, 213, 0.4); background: transparent; color: var(--cream); }
.fb-btn--ghost:hover { border-color: var(--cream); background: rgba(244, 234, 213, 0.08); }

/* Cart bar */
.fb-cart {
  position: fixed;
  left: 50%;
  bottom: 20px;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 24px;
  width: min(520px, calc(100vw - 32px));
  padding: 12px 12px 12px 22px;
  background: #101211;
  border: 1px solid rgba(217, 164, 65, 0.45);
  border-radius: 10px;
  transform: translate(-50%, 140%);
  opacity: 0;
  pointer-events: none;
  transition: transform 700ms ${EASE}, opacity 400ms ease;
}
.fb-cart.is-open { transform: translate(-50%, 0); opacity: 1; pointer-events: auto; }
.fb-cart-info { display: flex; flex-direction: column; flex: 1; gap: 2px; }
.fb-cart-count { font-size: 14px; color: rgba(244, 234, 213, 0.75); animation: fb-bump 400ms ${EASE}; }
.fb-cart-total { font-size: 20px; font-weight: 700; color: var(--amber); }
.fb-cart .fb-btn { flex: 0 0 auto; padding: 12px 26px; }
@keyframes fb-bump {
  0% { transform: translateY(6px); opacity: 0.4; }
  100% { transform: translateY(0); opacity: 1; }
}

@media (max-width: 560px) {
  .fb-grid { grid-template-columns: 1fr; }
  .fb-actions { flex-direction: column; }
}

@media (prefers-reduced-motion: reduce) {
  .fb-head, .fb-card, .fb-img, .fb-cart { transition: none !important; }
  .fb-head, .fb-card { opacity: 1; transform: none; }
  .fb-img { opacity: 1; transform: none; }
  .fb-cart-count { animation: none; }
}
`;
