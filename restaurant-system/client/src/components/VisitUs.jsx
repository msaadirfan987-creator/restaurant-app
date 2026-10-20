import { useEffect, useMemo, useRef, useState } from "react";

/**
 * VisitUs.jsx — Section 07: Visit Our Restaurant
 *
 *  - Location (address + map & restaurant image), Opening hours (aaj ka din highlight, Open/Closed badge)
 *  - Contact information
 *  - Get Directions button (Google Maps directions kholta hai)
 *
 * <VisitUs address="..." phone="..." email="..." />
 */

const COLORS = { bg: "#151a17", surface: "#242a27", green: "#1f4a38", amber: "#d9a441", cream: "#f4ead5" };

const RESTAURANT_PHOTO =
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80";

// open/close minutes (din ke shuru se). close 1440 se zyada = agle din tak khula.
const DEFAULT_HOURS = [
  { day: "Sunday", open: 13 * 60, close: 23 * 60 },
  { day: "Monday", open: 12 * 60, close: 23 * 60 },
  { day: "Tuesday", open: 12 * 60, close: 23 * 60 },
  { day: "Wednesday", open: 12 * 60, close: 23 * 60 },
  { day: "Thursday", open: 12 * 60, close: 23 * 60 },
  { day: "Friday", open: 12 * 60, close: 25 * 60 },
  { day: "Saturday", open: 12 * 60, close: 25 * 60 },
];

const fmt = (min) => {
  const m = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, "0");
  const ap = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${mm} ${ap}`;
};

function isOpenNow(hours, date = new Date()) {
  const day = date.getDay();
  const mins = date.getHours() * 60 + date.getMinutes();
  const today = hours[day];
  const yesterday = hours[(day + 6) % 7];
  if (mins >= today.open && mins < today.close) return true;
  return yesterday.close > 1440 && mins < yesterday.close - 1440;
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

export default function VisitUs({
  id = "visit",
  eyebrow = "Visit Our Restaurant",
  title = "Come Visit Us, Sizzling Gourmet Burgers Await",
  address = "Main Boulevard, Food Street, Lahore, Pakistan",
  phone = "+92 300 1234567",
  email = "hello@burgerhouse.com",
  hours = DEFAULT_HOURS,
  showMap = true,
  restaurantImage = RESTAURANT_PHOTO,
}) {
  const [ref, seen] = useInView(0.15);
  const [viewMode, setViewMode] = useState("map"); // "map" | "photo"
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const open = isOpenNow(hours, now);
  const todayIdx = now.getDay();
  const order = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun
  const encoded = useMemo(() => encodeURIComponent(address), [address]);
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
  const mapUrl = `https://maps.google.com/maps?q=${encoded}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  return (
    <section id={id} ref={ref} className={`vu-section ${seen ? "is-in" : ""}`} aria-labelledby="vu-title">
      <style>{css}</style>
      <div className="vu-wrap">
        <header className="vu-head">
          <p className="vu-eyebrow">{eyebrow}</p>
          <h2 id="vu-title" className="vu-title">{title}</h2>
        </header>

        <div className="vu-grid">
          <div className="vu-info">
            {/* Location */}
            <div className="vu-card" style={{ "--c": 0 }}>
              <h3 className="vu-card-title">Location</h3>
              <p className="vu-address">{address}</p>
              <a className="vu-btn" href={directionsUrl} target="_blank" rel="noopener noreferrer">
                Get Directions
              </a>
            </div>

            {/* Hours */}
            <div className="vu-card" style={{ "--c": 1 }}>
              <div className="vu-card-top">
                <h3 className="vu-card-title">Opening Hours</h3>
                <span className={`vu-status ${open ? "is-open" : ""}`}>
                  {open ? "Open Now" : "Closed Now"}
                </span>
              </div>
              <ul className="vu-hours">
                {order.map((d) => (
                  <li key={d} className={d === todayIdx ? "is-today" : ""}>
                    <span>{hours[d].day}</span>
                    <span>
                      {fmt(hours[d].open)} – {fmt(hours[d].close)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="vu-card" style={{ "--c": 2 }}>
              <h3 className="vu-card-title">Contact</h3>
              <dl className="vu-contact">
                <div>
                  <dt>Phone</dt>
                  <dd>
                    <a href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a>
                  </dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>
                    <a href={`mailto:${email}`}>{email}</a>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="vu-map-container">
            <div className="vu-toggle-bar">
              <button
                type="button"
                className={`vu-toggle-btn ${viewMode === "map" ? "is-active" : ""}`}
                onClick={() => setViewMode("map")}
              >
                Google Map
              </button>
              <button
                type="button"
                className={`vu-toggle-btn ${viewMode === "photo" ? "is-active" : ""}`}
                onClick={() => setViewMode("photo")}
              >
                Restaurant Photo
              </button>
            </div>

            <div className="vu-map">
              {viewMode === "map" && showMap ? (
                <iframe
                  title="Restaurant location map"
                  src={mapUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="vu-photo-view">
                  <img
                    src={restaurantImage}
                    alt="Restaurant Ambiance"
                    className="vu-restaurant-img"
                    loading="lazy"
                  />
                  <div className="vu-photo-overlay">
                    <p className="vu-photo-title">Burger House Ambiance</p>
                    <p className="vu-photo-sub">{address}</p>
                  </div>
                </div>
              )}
              <a className="vu-map-link" href={directionsUrl} target="_blank" rel="noopener noreferrer">
                Open in Google Maps
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const css = `
.vu-section {
  --bg: ${COLORS.bg}; --surface: ${COLORS.surface}; --green: ${COLORS.green}; --amber: ${COLORS.amber}; --cream: ${COLORS.cream};
  background: var(--bg); color: var(--cream);
  padding: clamp(64px, 9vw, 120px) 0;
  font-family: "Inter", "Segoe UI", system-ui, sans-serif;
  border-top: 1px solid rgba(244, 234, 213, 0.06);
  overflow: hidden;
}
.vu-wrap { max-width: 1320px; margin: 0 auto; padding: 0 clamp(20px, 5vw, 72px); }
.vu-head { max-width: 720px; margin-bottom: clamp(32px, 5vw, 56px); opacity: 0; transform: translateY(28px); transition: opacity 800ms ease, transform 900ms ${EASE}; }
.vu-section.is-in .vu-head { opacity: 1; transform: none; }
.vu-eyebrow { margin: 0 0 12px; font-size: 14px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--amber); }
.vu-title { margin: 0; font-family: "Playfair Display", Georgia, "Times New Roman", serif; font-size: clamp(30px, 4.2vw, 52px); line-height: 1.15; font-weight: 700; }

.vu-grid { display: grid; grid-template-columns: 1fr 1.1fr; gap: 28px; align-items: stretch; }
.vu-info { display: flex; flex-direction: column; gap: 20px; }
.vu-card { padding: 24px 26px; background: var(--surface); border: 1px solid rgba(244, 234, 213, 0.08); border-radius: 10px; opacity: 0; transform: translateX(-36px); transition: opacity 700ms ease, transform 900ms ${EASE}, border-color 250ms ease; transition-delay: calc(var(--c) * 150ms + 300ms), calc(var(--c) * 150ms + 300ms), 0ms; }
.vu-section.is-in .vu-card { opacity: 1; transform: none; }
.vu-card:hover { border-color: rgba(217, 164, 65, 0.5); }
.vu-card-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.vu-card-title { margin: 0 0 12px; font-family: "Playfair Display", Georgia, serif; font-size: 22px; font-weight: 700; color: var(--amber); }
.vu-card-top .vu-card-title { margin: 0; }
.vu-address { margin: 0 0 20px; font-size: 17px; line-height: 1.6; }

.vu-btn { display: inline-block; padding: 13px 28px; border: 2px solid var(--amber); border-radius: 8px; background: var(--amber); color: var(--bg); font-size: 16px; font-weight: 700; text-decoration: none; transition: background-color 220ms ease, transform 160ms ease; }
.vu-btn:hover { background: #e6b658; border-color: #e6b658; transform: translateY(-2px); }
.vu-btn:focus-visible, .vu-map-link:focus-visible, .vu-contact a:focus-visible { outline: 3px solid var(--cream); outline-offset: 3px; }

.vu-status { padding: 5px 12px; border-radius: 6px; background: rgba(244, 234, 213, 0.12); font-size: 12px; font-weight: 700; letter-spacing: 0.03em; }
.vu-status.is-open { background: var(--green); color: var(--cream); animation: vu-blink 2.4s ease-in-out infinite; }
@keyframes vu-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.65; } }

.vu-hours { margin: 0; padding: 0; list-style: none; }
.vu-hours li { display: flex; justify-content: space-between; gap: 16px; padding: 10px 12px; margin: 0 -12px; border-radius: 6px; font-size: 15px; color: rgba(244, 234, 213, 0.8); transition: background-color 250ms ease; }
.vu-hours li:hover { background: rgba(244, 234, 213, 0.05); }
.vu-hours li.is-today { background: rgba(217, 164, 65, 0.14); color: var(--cream); font-weight: 700; }

.vu-contact { margin: 0; display: flex; flex-direction: column; gap: 12px; }
.vu-contact div { display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.vu-contact dt { font-size: 14px; color: rgba(244, 234, 213, 0.65); }
.vu-contact dd { margin: 0; font-size: 16px; font-weight: 600; }
.vu-contact a { color: var(--cream); text-decoration: none; background-image: linear-gradient(var(--amber), var(--amber)); background-size: 0 2px; background-position: 0 100%; background-repeat: no-repeat; transition: background-size 350ms ${EASE}, color 250ms ease; }
.vu-contact a:hover { color: var(--amber); background-size: 100% 2px; }

.vu-map-container { display: flex; flex-direction: column; gap: 12px; }
.vu-toggle-bar { display: flex; gap: 10px; align-self: flex-end; }
.vu-toggle-btn {
  background: var(--surface); color: var(--cream); border: 1px solid rgba(244, 234, 213, 0.2);
  border-radius: 6px; padding: 6px 14px; font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 200ms ease;
}
.vu-toggle-btn.is-active { background: var(--amber); color: var(--bg); border-color: var(--amber); }

.vu-map { position: relative; min-height: 420px; flex: 1; border-radius: 10px; overflow: hidden; background: #101311; border: 1px solid rgba(244, 234, 213, 0.08); clip-path: inset(0 0 0 100%); transition: clip-path 1300ms ${EASE} 400ms; }
.vu-section.is-in .vu-map { clip-path: inset(0 0 0 0); }
.vu-map iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; filter: grayscale(0.55) contrast(1.05); }

.vu-photo-view { position: absolute; inset: 0; width: 100%; height: 100%; }
.vu-restaurant-img { width: 100%; height: 100%; object-fit: cover; }
.vu-photo-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%); display: flex; flex-direction: column; justify-content: flex-end; padding: 24px; }
.vu-photo-title { margin: 0; font-size: 20px; font-weight: 700; color: var(--amber); }
.vu-photo-sub { margin: 4px 0 0; font-size: 14px; color: rgba(244, 234, 213, 0.85); }

.vu-map-link { position: absolute; left: 16px; bottom: 16px; z-index: 5; padding: 9px 16px; border-radius: 6px; background: var(--bg); color: var(--cream); font-size: 13px; font-weight: 600; text-decoration: none; border: 1px solid rgba(244, 234, 213, 0.3); transition: border-color 220ms ease; }
.vu-map-link:hover { border-color: var(--amber); }

@media (max-width: 900px) {
  .vu-grid { grid-template-columns: 1fr; }
  .vu-map { min-height: 340px; }
}
@media (prefers-reduced-motion: reduce) {
  .vu-head, .vu-card, .vu-map { transition: none !important; opacity: 1; transform: none; clip-path: none; }
  .vu-status.is-open { animation: none; }
}
`;
