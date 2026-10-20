import { useEffect, useMemo, useRef, useState } from "react";

/**
 * OurMenu.jsx — Full Restaurant Menu Section
 *
 * Categories: Burgers, Fries & Sides, Drinks, Combos
 * - Category filter tabs (All + 4 categories)
 * - Category banners with smooth entrance transitions
 * - Product cards with image zoom on hover and add-to-cart actions
 * - Floating slide-up cart drawer
 * - Clean matte solid-color design without artificial glowing/shiny effects
 */

const COLORS = {
  bg: "#1b1d1c",
  surface: "#242a27",
  green: "#1f4a38",
  amber: "#d9a441",
  cream: "#f4ead5",
};

const img = (id, w = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const CATEGORIES = [
  {
    id: "burgers",
    label: "Burgers",
    tagline: "Juicy flame-grilled patties, toasted artisanal buns, and bold signature flavors.",
    banner: img("photo-1550547660-d9450f859349", 1600),
    items: [
      {
        id: "b1",
        name: "Classic Beef Burger",
        price: 990,
        tag: "Best Seller",
        description: "150g prime beef patty, aged cheddar, crisp lettuce, and our house secret sauce.",
        image: img("photo-1568901346375-23c9450c58cd"),
      },
      {
        id: "b2",
        name: "Double Patty Cheeseburger",
        price: 1390,
        tag: "Most Loved",
        description: "Two juicy grilled patties, double cheddar cheese, and crunchy dill pickles.",
        image: img("photo-1572802419224-296b0aeee0d9"),
      },
      {
        id: "b3",
        name: "Smoky BBQ Bacon Burger",
        price: 1190,
        description: "Aged cheddar, tangy pickles, crispy onion straw, and house smoky BBQ sauce.",
        image: img("photo-1550547660-d9450f859349"),
      },
      {
        id: "b4",
        name: "Wood-Fire Cheeseburger",
        price: 1090,
        tag: "Chef's Pick",
        description: "Flame-grilled artisan patty, ripe vine tomatoes, red onion, and melted cheddar.",
        image: img("photo-1571091718767-18b5b1457add"),
      },
    ],
  },
  {
    id: "sides",
    label: "Fries & Sides",
    tagline: "Crisp, golden, and always served fresh and hot. The ultimate burger companion.",
    banner: img("photo-1576107232684-1279f3908594", 1600),
    items: [
      {
        id: "s1",
        name: "Classic Sea Salt Fries",
        price: 390,
        tag: "Best Seller",
        description: "Golden crispy skin-on fries tossed in fine sea salt with garlic ketchup.",
        image: img("photo-1541592106381-b31e9677c0e5"),
      },
      {
        id: "s2",
        name: "Loaded Fries Basket",
        price: 590,
        tag: "Shareable",
        description: "Large sharing basket of seasoned fries, perfect for sharing with family and friends.",
        image: img("photo-1630384060421-cb20d0e0649d"),
      },
      {
        id: "s3",
        name: "Artisan Dipping Fries",
        price: 490,
        description: "Crisp golden fries accompanied by garlic aioli and spicy honey mustard dips.",
        image: img("photo-1518013431117-eb1465fa5752"),
      },
      {
        id: "s4",
        name: "Firehouse Spiced Fries",
        price: 450,
        tag: "Spicy",
        description: "Hand-cut fries generously dusted with our fiery paprika and herbs seasoning.",
        image: img("photo-1598679253544-2c97992403ea"),
      },
    ],
  },
  {
    id: "drinks",
    label: "Drinks & Shakes",
    tagline: "Thick hand-spun milkshakes and chilled sparkling coolers, freshly prepared to order.",
    banner: img("photo-1572490122747-3968b75cc699", 1600),
    items: [
      {
        id: "d1",
        name: "Organic Strawberry Shake",
        price: 590,
        tag: "Best Seller",
        description: "Blended with sun-ripened organic strawberries and velvety vanilla ice cream.",
        image: img("photo-1579954115545-a95591f28bfc"),
      },
      {
        id: "d2",
        name: "Chocolate Cookie Frappe",
        price: 650,
        tag: "Most Loved",
        description: "Rich Belgian chocolate fudge, chocolate cookie crumble, and fresh whipped cream.",
        image: img("photo-1572490122747-3968b75cc699"),
      },
      {
        id: "d3",
        name: "Madagascar Vanilla Shake",
        price: 550,
        description: "Silky Madagascar vanilla bean shake whipped to smooth, creamy perfection.",
        image: img("photo-1553787499-6f9133860278"),
      },
      {
        id: "d4",
        name: "Wild Berry Mint Cooler",
        price: 450,
        tag: "New",
        description: "Lightly sweetened sparkling berry infusion with fresh mint and citrus zest.",
        image: img("photo-1556881286-fc6915169721"),
      },
    ],
  },
  {
    id: "combos",
    label: "Combos & Deals",
    tagline: "Burgers, golden fries, and ice-cold drinks combined for the best dining value.",
    banner: img("photo-1594212699903-ec8a3eca50f5", 1600),
    items: [
      {
        id: "c1",
        name: "Classic Combo Meal",
        price: 1290,
        tag: "Best Value",
        description: "Classic Beef Burger served with sea-salted fries and your choice of cold drink.",
        image: img("photo-1594212699903-ec8a3eca50f5"),
      },
      {
        id: "c2",
        name: "Double Cheese Feast",
        price: 1690,
        description: "Double Patty Cheeseburger paired with crispy fries and a thick hand-spun shake.",
        image: img("photo-1561758033-d89a9ad46330"),
      },
      {
        id: "c3",
        name: "Grill Master Special",
        price: 1790,
        tag: "Chef's Pick",
        description: "Smoky BBQ Burger, loaded fries basket, and a rich chocolate cookie frappe.",
        image: img("photo-1603064752734-4c48eff53d05"),
      },
      {
        id: "c4",
        name: "Family Party Platter",
        price: 3290,
        tag: "For 3-4",
        description: "Three handcrafted burgers, three large seasoned fries, and three chilled drinks.",
        image: img("photo-1586190848861-99aa4a171e90"),
      },
    ],
  },
];

const money = (n) => `Rs. ${n.toLocaleString("en-US")}`;

function useInView(threshold = 0.1) {
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

function Photo({ src, alt, className = "" }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="om-placeholder">{alt}</span>;
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      draggable={false}
      className={`om-photo ${className} ${loaded ? "is-loaded" : ""}`}
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
    />
  );
}

function ItemCard({ item, index, justAdded, onAdd }) {
  return (
    <article className="om-card" style={{ "--i": index }}>
      <div className="om-media">
        <Photo src={item.image} alt={item.name} />
        {item.tag && <span className="om-tag">{item.tag}</span>}
      </div>
      <div className="om-body">
        <div className="om-row">
          <h4 className="om-name">{item.name}</h4>
          <span className="om-price">{money(item.price)}</span>
        </div>
        <p className="om-desc">{item.description}</p>
        <button
          type="button"
          className={`om-btn ${justAdded ? "is-added" : ""}`}
          onClick={() => onAdd(item)}
        >
          {justAdded ? "Added" : "Add to Cart"}
        </button>
      </div>
    </article>
  );
}

function CategorySection({ category, flash, onAdd }) {
  const [ref, seen] = useInView(0.08);
  const from = Math.min(...category.items.map((i) => i.price));

  return (
    <section ref={ref} className={`om-cat ${seen ? "is-in" : ""}`} aria-label={category.label}>
      <div className="om-banner">
        <Photo src={category.banner} alt={category.label} className="om-banner-img" />
        <div className="om-banner-shade" />
        <div className="om-banner-text">
          <span className="om-banner-eyebrow">{category.items.length} Options</span>
          <h3 className="om-banner-title">{category.label}</h3>
          <p className="om-banner-tag">{category.tagline}</p>
          <span className="om-banner-from">Starting from {money(from)}</span>
        </div>
      </div>

      <div className="om-grid">
        {category.items.map((item, i) => (
          <ItemCard key={item.id} item={item} index={i} justAdded={flash === item.id} onAdd={onAdd} />
        ))}
      </div>
    </section>
  );
}

export default function OurMenu({
  categories = CATEGORIES,
  defaultCategory = "burgers",
  eyebrow = "Our Menu",
  title = "Explore Our Full Menu",
  subtitle = "Choose a category below to discover handcrafted burgers, crispy sides, drinks, and value combos.",
  onAddToCart = () => {},
  onCheckout = () => {},
}) {
  const [active, setActive] = useState(defaultCategory);
  const [cart, setCart] = useState({});
  const [flash, setFlash] = useState(null);
  const [headRef, headSeen] = useInView(0.2);

  const allItems = useMemo(() => categories.flatMap((c) => c.items), [categories]);
  const visible = active === "all" ? categories : categories.filter((c) => c.id === active);

  const cartItems = useMemo(
    () => allItems.filter((i) => cart[i.id]).map((i) => ({ ...i, qty: cart[i.id] })),
    [allItems, cart]
  );
  const count = cartItems.reduce((s, i) => s + i.qty, 0);
  const total = cartItems.reduce((s, i) => s + i.qty * i.price, 0);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 1400);
    return () => clearTimeout(t);
  }, [flash]);

  const handleAdd = (item) => {
    setCart((c) => ({ ...c, [item.id]: (c[item.id] || 0) + 1 }));
    setFlash(item.id);
    onAddToCart(item);
  };

  const tabs = [
    { id: "all", label: "All Items", count: allItems.length },
    ...categories.map((c) => ({ id: c.id, label: c.label, count: c.items.length })),
  ];

  return (
    <section className="om-section" id="full-menu" aria-labelledby="om-title">
      <style>{css}</style>

      <div className="om-wrap">
        <header ref={headRef} className={`om-head ${headSeen ? "is-in" : ""}`}>
          <p className="om-eyebrow">{eyebrow}</p>
          <h2 id="om-title" className="om-title">{title}</h2>
          <p className="om-sub">{subtitle}</p>
        </header>

        {/* Category filter tabs */}
        <div className="om-tabs-scroll">
          <div className="om-tabs" role="tablist" aria-label="Menu categories">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active === t.id}
                className={`om-tab ${active === t.id ? "is-active" : ""}`}
                onClick={() => setActive(t.id)}
              >
                {t.label}
                <span className="om-tab-count">{t.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Remounts on category tab change to trigger smooth transition */}
        <div key={active} className="om-panel" role="tabpanel">
          {visible.map((c) => (
            <CategorySection key={c.id} category={c} flash={flash} onAdd={handleAdd} />
          ))}
        </div>
      </div>

      {/* Slide-up sticky cart indicator */}
      <div className={`om-cart ${count > 0 ? "is-open" : ""}`} role="status" aria-live="polite">
        <div className="om-cart-info">
          <span key={count} className="om-cart-count">{count} {count === 1 ? "item" : "items"}</span>
          <span className="om-cart-total">{money(total)}</span>
        </div>
        <button type="button" className="om-btn om-btn--auto" onClick={() => onCheckout(cartItems)}>
          Checkout
        </button>
      </div>
    </section>
  );
}

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

const css = `
.om-section {
  --bg: ${COLORS.bg};
  --surface: ${COLORS.surface};
  --green: ${COLORS.green};
  --amber: ${COLORS.amber};
  --cream: ${COLORS.cream};
  background-color: var(--bg);
  color: var(--cream);
  padding: clamp(64px, 8vw, 110px) 0 clamp(96px, 10vw, 140px);
  font-family: "Inter", "Segoe UI", system-ui, sans-serif;
  position: relative;
}
.om-wrap {
  max-width: 1320px;
  margin: 0 auto;
  padding: 0 clamp(20px, 5vw, 72px);
}

/* Heading */
.om-head {
  max-width: 640px;
  margin-bottom: clamp(28px, 4vw, 44px);
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 800ms ease, transform 900ms ${EASE};
}
.om-head.is-in { opacity: 1; transform: translateY(0); }
.om-eyebrow {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--amber);
}
.om-title {
  margin: 0 0 14px;
  font-family: "Playfair Display", Georgia, "Times New Roman", serif;
  font-size: clamp(32px, 4.4vw, 54px);
  line-height: 1.1;
  font-weight: 700;
  color: var(--cream);
}
.om-sub {
  margin: 0;
  font-size: 17px;
  line-height: 1.65;
  color: rgba(244, 234, 213, 0.82);
}

/* Tabs */
.om-tabs-scroll {
  overflow-x: auto;
  margin-bottom: clamp(24px, 4vw, 40px);
  border-bottom: 1px solid rgba(244, 234, 213, 0.1);
  scrollbar-width: none;
}
.om-tabs-scroll::-webkit-scrollbar { display: none; }
.om-tabs {
  display: flex;
  gap: clamp(16px, 3vw, 36px);
  min-width: max-content;
}
.om-tab {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 2px 16px;
  border: 0;
  background: transparent;
  color: rgba(244, 234, 213, 0.65);
  font-family: inherit;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: color 220ms ease;
}
.om-tab::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2.5px;
  background: var(--amber);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 350ms ${EASE};
}
.om-tab:hover { color: var(--cream); }
.om-tab.is-active { color: var(--amber); }
.om-tab.is-active::after { transform: scaleX(1); }
.om-tab:focus-visible { outline: 2px solid var(--amber); outline-offset: 3px; }
.om-tab-count {
  min-width: 22px;
  padding: 2px 6px;
  border-radius: 6px;
  background: rgba(244, 234, 213, 0.08);
  font-size: 12px;
  text-align: center;
  transition: background-color 220ms ease, color 220ms ease;
}
.om-tab.is-active .om-tab-count {
  background: var(--amber);
  color: #1b1d1c;
}

/* Panel */
.om-panel {
  display: flex;
  flex-direction: column;
  gap: clamp(52px, 7vw, 88px);
}

.om-cat {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 700ms ease, transform 850ms ${EASE};
}
.om-cat.is-in { opacity: 1; transform: translateY(0); }

/* Category Banner */
.om-banner {
  position: relative;
  display: flex;
  align-items: center;
  min-height: clamp(200px, 26vw, 300px);
  margin-bottom: 24px;
  overflow: hidden;
  border-radius: 10px;
  background-color: var(--surface);
  border: 1px solid rgba(244, 234, 213, 0.08);
}
.om-banner .om-photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.om-banner-img {
  transform: scale(1.08);
  transition: opacity 800ms ease, transform 2000ms ${EASE};
}
.om-cat.is-in .om-banner-img.is-loaded { transform: scale(1); }
.om-banner-shade {
  position: absolute;
  inset: 0;
  background: rgba(18, 22, 20, 0.72);
}
.om-banner-text {
  position: relative;
  z-index: 1;
  max-width: 540px;
  padding: clamp(24px, 4vw, 48px);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.om-banner-text > * {
  opacity: 0;
  transform: translateY(18px);
  transition: opacity 650ms ease, transform 750ms ${EASE};
}
.om-cat.is-in .om-banner-text > * { opacity: 1; transform: translateY(0); }
.om-cat.is-in .om-banner-text > :nth-child(1) { transition-delay: 180ms; }
.om-cat.is-in .om-banner-text > :nth-child(2) { transition-delay: 300ms; }
.om-cat.is-in .om-banner-text > :nth-child(3) { transition-delay: 420ms; }
.om-cat.is-in .om-banner-text > :nth-child(4) { transition-delay: 540ms; }
.om-banner-eyebrow {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--amber);
}
.om-banner-title {
  margin: 0;
  font-family: "Playfair Display", Georgia, serif;
  font-size: clamp(28px, 4vw, 46px);
  line-height: 1.12;
  font-weight: 700;
  color: var(--cream);
}
.om-banner-tag {
  margin: 0;
  font-size: 15px;
  line-height: 1.55;
  color: rgba(244, 234, 213, 0.86);
}
.om-banner-from {
  margin-top: 4px;
  font-size: 17px;
  font-weight: 700;
  color: var(--amber);
}

/* Grid & Cards */
.om-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 22px;
}
.om-card {
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid rgba(244, 234, 213, 0.08);
  border-radius: 10px;
  overflow: hidden;
  opacity: 0;
  transform: translateY(36px);
  transition:
    opacity 600ms ease calc(var(--i) * 100ms + 200ms),
    transform 750ms ${EASE} calc(var(--i) * 100ms + 200ms),
    border-color 200ms ease;
}
.om-cat.is-in .om-card { opacity: 1; transform: translateY(0); }
.om-cat.is-in .om-card:hover {
  transform: translateY(-4px);
  border-color: rgba(217, 164, 65, 0.45);
  transition-delay: 0ms;
}

.om-media {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: #141715;
  display: flex;
  align-items: center;
  justify-content: center;
}
.om-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transform: scale(1.1);
  transition: opacity 600ms ease, transform 1200ms ${EASE};
}
.om-photo.is-loaded { opacity: 1; transform: scale(1); }
.om-card:hover .om-media .om-photo.is-loaded {
  transform: scale(1.05);
  transition-duration: 700ms;
}
.om-placeholder {
  padding: 16px;
  text-align: center;
  font-family: "Playfair Display", Georgia, serif;
  font-size: 18px;
  color: rgba(244, 234, 213, 0.55);
}

.om-tag {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 5px 11px;
  border-radius: 6px;
  background: var(--amber);
  color: #1b1d1c;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.om-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px;
  flex: 1;
}
.om-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.om-name {
  margin: 0;
  font-family: "Playfair Display", Georgia, serif;
  font-size: 19px;
  line-height: 1.25;
  font-weight: 700;
  color: var(--cream);
}
.om-price {
  font-size: 17px;
  font-weight: 700;
  color: var(--amber);
  white-space: nowrap;
}
.om-desc {
  margin: 0;
  flex: 1;
  font-size: 14.5px;
  line-height: 1.6;
  color: rgba(244, 234, 213, 0.75);
}

/* Button */
.om-btn {
  width: 100%;
  margin-top: 6px;
  cursor: pointer;
  padding: 11px 16px;
  border: 2px solid var(--amber);
  border-radius: 8px;
  background: var(--amber);
  color: #1b1d1c;
  font-family: inherit;
  font-size: 14.5px;
  font-weight: 600;
  transition: background-color 200ms ease, border-color 200ms ease, color 200ms ease, transform 150ms ease;
}
.om-btn:hover {
  background: #c89536;
  border-color: #c89536;
}
.om-btn:active { transform: scale(0.98); }
.om-btn:focus-visible { outline: 2px solid var(--cream); outline-offset: 2px; }
.om-btn.is-added {
  background: var(--green);
  border-color: var(--green);
  color: var(--cream);
}
.om-btn--auto {
  width: auto;
  margin: 0;
  padding: 11px 24px;
}

/* Slide-up Cart Bar */
.om-cart {
  position: fixed;
  left: 50%;
  bottom: 20px;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 20px;
  width: min(500px, calc(100vw - 32px));
  padding: 12px 14px 12px 20px;
  background: #141715;
  border: 1px solid rgba(217, 164, 65, 0.4);
  border-radius: 10px;
  transform: translate(-50%, 140%);
  opacity: 0;
  pointer-events: none;
  transition: transform 600ms ${EASE}, opacity 350ms ease;
}
.om-cart.is-open {
  transform: translate(-50%, 0);
  opacity: 1;
  pointer-events: auto;
}
.om-cart-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 2px;
}
.om-cart-count {
  font-size: 13.5px;
  color: rgba(244, 234, 213, 0.75);
}
.om-cart-total {
  font-size: 19px;
  font-weight: 700;
  color: var(--amber);
}

@media (max-width: 560px) {
  .om-grid { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  .om-head, .om-cat, .om-card, .om-photo, .om-banner-img, .om-banner-text > *, .om-cart, .om-tab::after {
    transition: none !important;
  }
  .om-head, .om-cat, .om-card, .om-banner-text > * {
    opacity: 1;
    transform: none;
  }
  .om-photo { opacity: 1; transform: none; }
}
`;
