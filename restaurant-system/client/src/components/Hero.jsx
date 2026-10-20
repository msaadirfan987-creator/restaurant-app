import { useEffect, useMemo, useState } from "react";

/**
 * Hero.jsx — Handcrafted Burger Assemble Hero
 *
 * Sequence:
 *  1. init     -> Ingredients enter from outside the viewport.
 *  2. spread   -> Ingredients float in to their respective spread coordinates.
 *  3. assemble -> Ingredients stack tightly together layer-by-layer.
 *                 The top bun descends firmly onto the lettuce & tomatoes,
 *                 completely closing the burger shut (no separated layers / no gaps).
 *  4. complete -> All animations stop completely, showing the delicious,
 *                 fully assembled, closed burger.
 *
 * Click anywhere on the burger to replay the assemble animation.
 */

const COLORS = {
  charcoal: "#1b1d1c", // Single flat solid matte background
  green: "#1f4a38",
  amber: "#d9a441",
  cream: "#f4ead5",
};

const IMG = "/images/burger";

// Stage coordinate system matching original dimensions
const STAGE_W = 1024;
const STAGE_H = 1536;

// Fully assembled closed burger bounding box and center
const CLOSED_BURGER = { x: 236, y: 387, w: 552, h: 508 };
const BURGER_CENTER = { x: 512, y: 640 };

/**
 * Burger Ingredients configuration:
 * nw, nh  : Original image dimensions
 * from    : Float-in starting coordinates during spread phase
 * rot     : Rotation in degrees during spread
 * to      : Fully closed assembled coordinates & dimensions
 * z, step : Stacking order & assemble sequence (step 7 is top bun capping it shut)
 * fly     : Initial entry offset
 */
const PIECES = [
  { key: "bun-bottom", src: `${IMG}/bun-bottom.png`, nw: 485, nh: 109, from: { x: 725, y: 1285 }, rot: -22, to: { x: 501.5, y: 840, w: 485, h: 109 }, z: 2, step: 0, fly: { x: 220, y: 260 } },
  { key: "patty", src: `${IMG}/patty.png`, nw: 435, nh: 216, from: { x: 495, y: 1095 }, rot: -4, to: { x: 518, y: 770, w: 470, h: 135 }, z: 3, step: 1, fly: { x: 0, y: 320 } },
  { key: "cheese", src: `${IMG}/cheese.png`, nw: 296, nh: 286, from: { x: 148, y: 958 }, rot: 8, to: { x: 520, y: 745, w: 410, h: 125 }, z: 4, step: 2, fly: { x: -260, y: 120 } },
  { key: "pickle", src: `${IMG}/pickle.png`, nw: 262, nh: 175, from: { x: 936, y: 485 }, rot: 90, to: { x: 515, y: 720, w: 360, h: 84 }, z: 5, step: 3, fly: { x: 260, y: -120 } },
  { key: "onion", src: `${IMG}/onion.png`, nw: 252, nh: 205, from: { x: 921, y: 750 }, rot: 90, to: { x: 510, y: 695, w: 340, h: 96 }, z: 6, step: 4, fly: { x: 260, y: 40 } },
  { key: "tomato", src: `${IMG}/tomato.png`, nw: 259, nh: 266, from: { x: 130, y: 593 }, rot: -6, to: { x: 530, y: 670, w: 380, h: 115 }, z: 7, step: 5, fly: { x: -260, y: 0 } },
  { key: "lettuce-l", src: `${IMG}/lettuce-l.png`, nw: 308, nh: 332, from: { x: 154, y: 280 }, rot: -5, to: { x: 415, y: 640, w: 310, h: 170 }, z: 8, step: 6, fly: { x: -260, y: -200 } },
  { key: "lettuce-r", src: `${IMG}/lettuce-r.png`, nw: 323, nh: 312, from: { x: 862, y: 1025 }, rot: 6, to: { x: 655, y: 642, w: 310, h: 170 }, z: 8, step: 6, fly: { x: 260, y: 260 } },
  { key: "bun-top", src: `${IMG}/bun-top.png`, nw: 542, nh: 266, from: { x: 542, y: 207 }, rot: 0, to: { x: 520, y: 520, w: 542, h: 266 }, z: 10, step: 7, fly: { x: 0, y: -240 } },
];

// Decorative sauce elements that blend into the burger patty upon assemble
const DECOR = [
  { key: "sauce-r", src: `${IMG}/sauce-r.png`, nw: 213, nh: 140, from: { x: 913, y: 171 }, rot: 6, fly: { x: 200, y: -200 } },
  { key: "sauce-l", src: `${IMG}/sauce-l.png`, nw: 244, nh: 193, from: { x: 153, y: 1220 }, rot: -6, fly: { x: -200, y: 220 } },
];

const ENTER_STAGGER = 110;
const ENTER_DURATION = 1200;
const ASSEMBLE_STAGGER = 150;
const ASSEMBLE_DURATION = 1300;
const TIMELINE = {
  spread: 900,
  assemble: 900 + (PIECES.length + DECOR.length) * ENTER_STAGGER + ENTER_DURATION + 500,
};
TIMELINE.complete = TIMELINE.assemble + 7 * ASSEMBLE_STAGGER + ASSEMBLE_DURATION + 150;

const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
const EASE_SETTLE = "cubic-bezier(0.34, 1.12, 0.64, 1)";

export default function Hero({
  backgroundColor = COLORS.charcoal,
  brand = "Burger House",
  title = "Freshly Grilled Burgers, Straight to Your Table",
  description = "Freshly baked artisanal buns, premium hand-pressed patties, and farm-fresh ingredients. Every burger is handcrafted and grilled to order.",
  price = "Rs. 1,290",
  onOrder = () => {},
  onMenu = () => {},
}) {
  const [phase, setPhase] = useState("init"); // init | spread | assemble | complete
  const [runId, setRunId] = useState(0);
  const [vp, setVp] = useState({ w: 1280, h: 800 });

  useEffect(() => {
    const update = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    setPhase("init");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setPhase("complete");
      return;
    }
    const t = [
      setTimeout(() => setPhase("spread"), TIMELINE.spread),
      setTimeout(() => setPhase("assemble"), TIMELINE.assemble),
      setTimeout(() => setPhase("complete"), TIMELINE.complete),
    ];
    return () => t.forEach(clearTimeout);
  }, [runId]);

  const isMobile = vp.w < 860;
  const assembled = phase === "assemble" || phase === "complete";

  // Compute adaptive stage scales for viewport
  const { s0, s1 } = useMemo(() => {
    const pad = Math.min(72, Math.max(24, vp.w * 0.05));
    const colW = isMobile ? vp.w - 48 : (Math.min(vp.w, 1320) - pad * 2 - 24) / 2;
    const colH = isMobile ? vp.h * 0.52 : vp.h;
    return {
      s0: Math.min((colH * 0.92) / STAGE_H, colW / STAGE_W),
      s1: Math.min(1.22, (colH * 0.82) / CLOSED_BURGER.h, (colW * 0.95) / CLOSED_BURGER.w),
    };
  }, [vp, isMobile]);

  // Center burger on the right column
  const dx = BURGER_CENTER.x - STAGE_W / 2;
  const dy = BURGER_CENTER.y - STAGE_H / 2;
  const stageTransform = assembled
    ? `translate(${-dx * s1}px, ${-dy * s1}px) scale(${s1})`
    : `translate(0px, 0px) scale(${s0})`;

  const pieceStyle = (p, i) => {
    const base = {
      left: p.to.x - p.nw / 2,
      top: p.to.y - p.nh / 2,
      width: p.nw,
      height: p.nh,
      zIndex: p.z,
    };
    const sx = p.to.w / p.nw;
    const sy = p.to.h / p.nh;
    const move = (cx, cy, rot, scx, scy) =>
      `translate(${cx - p.to.x}px, ${cy - p.to.y}px) rotate(${rot}deg) scale(${scx}, ${scy})`;

    if (phase === "init") {
      return {
        ...base,
        transform: move(p.from.x + p.fly.x, p.from.y + p.fly.y, p.rot * 1.8, 0.85, 0.85),
        opacity: 0,
        transition: "none",
      };
    }
    if (phase === "spread") {
      const d = i * ENTER_STAGGER;
      return {
        ...base,
        transform: move(p.from.x, p.from.y, p.rot, 1, 1),
        opacity: 1,
        transition: `transform ${ENTER_DURATION}ms ${EASE_OUT} ${d}ms, opacity 700ms ease ${d}ms`,
      };
    }
    // assemble & complete: stays fully assembled as closed burger with no gaps
    const d = phase === "assemble" ? p.step * ASSEMBLE_STAGGER : 0;
    return {
      ...base,
      transform: move(p.to.x, p.to.y, 0, sx, sy),
      opacity: 1,
      transition: `transform ${ASSEMBLE_DURATION}ms ${EASE_SETTLE} ${d}ms`,
    };
  };

  const decorStyle = (p, i) => {
    const base = {
      left: p.from.x - p.nw / 2,
      top: p.from.y - p.nh / 2,
      width: p.nw,
      height: p.nh,
      zIndex: 1,
    };
    const tr = (x, y, rot, s) =>
      `translate(${x - p.from.x}px, ${y - p.from.y}px) rotate(${rot}deg) scale(${s})`;
    const idx = PIECES.length + i;
    if (phase === "init") {
      return {
        ...base,
        transform: tr(p.from.x + p.fly.x, p.from.y + p.fly.y, p.rot * 2, 0.8),
        opacity: 0,
        transition: "none",
      };
    }
    if (phase === "spread") {
      const d = idx * ENTER_STAGGER;
      return {
        ...base,
        transform: tr(p.from.x, p.from.y, p.rot, 1),
        opacity: 1,
        transition: `transform ${ENTER_DURATION}ms ${EASE_OUT} ${d}ms, opacity 700ms ease ${d}ms`,
      };
    }
    // assemble / complete: blend smoothly into the burger patty
    return {
      ...base,
      transform: tr(BURGER_CENTER.x, 770, 0, 0.15),
      opacity: 0,
      transition: `transform 1100ms cubic-bezier(0.65, 0, 0.35, 1) ${i * 120 + 500}ms, opacity 500ms ease ${i * 120 + 900}ms`,
    };
  };

  return (
    <section className="bh-hero" aria-label={brand} style={{ backgroundColor }}>
      <style>{css}</style>

      <div className="bh-grid">
        {/* LEFT: Text Content */}
        <div className="bh-content">
          <p className="bh-brand">{brand}</p>
          <h1 className="bh-title">{title}</h1>
          <p className="bh-desc">{description}</p>
          <div className="bh-row">
            <span className="bh-price">{price}</span>
            <button type="button" className="bh-btn bh-btn--primary" onClick={onOrder}>
              Order now
            </button>
            <button type="button" className="bh-btn bh-btn--ghost" onClick={onMenu}>
              View menu
            </button>
          </div>
        </div>

        {/* RIGHT: Assemble Animation -> Completely closed solid burger */}
        <div
          className="bh-visual"
          onClick={() => setRunId((r) => r + 1)}
          title="Click to replay burger assemble animation"
        >
          <div
            className="bh-stage"
            style={{
              width: STAGE_W,
              height: STAGE_H,
              marginLeft: -STAGE_W / 2,
              marginTop: -STAGE_H / 2,
              transform: stageTransform,
              transition: assembled
                ? `transform 2200ms cubic-bezier(0.65, 0, 0.35, 1)`
                : phase === "init"
                ? "none"
                : "transform 600ms ease",
            }}
            role="img"
            aria-label="Burger ingredients assemble and firmly close into a complete burger"
          >
            {/* The assembled closed burger: all layers stacked tightly with no floating gaps */}
            <div className="bh-burger-wrap">
              {DECOR.map((p, i) => (
                <img
                  key={p.key}
                  src={p.src}
                  alt=""
                  draggable={false}
                  className="bh-piece"
                  style={decorStyle(p, i)}
                />
              ))}
              {PIECES.map((p, i) => (
                <img
                  key={p.key}
                  src={p.src}
                  alt=""
                  draggable={false}
                  className="bh-piece"
                  style={pieceStyle(p, i)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const css = `
.bh-hero {
  --charcoal: ${COLORS.charcoal};
  --green: ${COLORS.green};
  --amber: ${COLORS.amber};
  --cream: ${COLORS.cream};
  position: relative;
  min-height: 100vh;
  min-height: 100svh;
  overflow: hidden;
  background-color: var(--charcoal);
  color: var(--cream);
  font-family: "Inter", "Segoe UI", system-ui, sans-serif;
}

.bh-grid {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  min-height: 100vh;
  min-height: 100svh;
  max-width: 1320px;
  margin: 0 auto;
  padding: 0 clamp(24px, 5vw, 72px);
  gap: 24px;
}

/* LEFT */
.bh-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: bh-text-in 1000ms ${EASE_OUT} 400ms both;
}
@keyframes bh-text-in {
  from { opacity: 0; transform: translateX(-24px); }
  to { opacity: 1; transform: translateX(0); }
}
.bh-brand {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--amber);
}
.bh-title {
  margin: 0;
  font-family: "Playfair Display", Georgia, "Times New Roman", serif;
  font-size: clamp(34px, 4.6vw, 62px);
  line-height: 1.08;
  font-weight: 700;
  color: var(--cream);
}
.bh-desc {
  margin: 0;
  max-width: 48ch;
  font-size: 17px;
  line-height: 1.65;
  color: rgba(244, 234, 213, 0.85);
}
.bh-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
}
.bh-price {
  margin-right: 8px;
  font-size: 28px;
  font-weight: 700;
  color: var(--amber);
}
.bh-btn {
  cursor: pointer;
  padding: 14px 26px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  font-family: inherit;
  transition: background-color 200ms ease, border-color 200ms ease, transform 150ms ease;
}
.bh-btn:active { transform: scale(0.98); }
.bh-btn:focus-visible { outline: 3px solid var(--cream); outline-offset: 3px; }
.bh-btn--primary {
  border: 2px solid var(--amber);
  background: var(--amber);
  color: var(--charcoal);
}
.bh-btn--primary:hover {
  background: #c89536;
  border-color: #c89536;
}
.bh-btn--ghost {
  border: 2px solid rgba(244, 234, 213, 0.4);
  background: transparent;
  color: var(--cream);
}
.bh-btn--ghost:hover {
  border-color: var(--cream);
  background: rgba(244, 234, 213, 0.06);
}

/* RIGHT */
.bh-visual {
  position: relative;
  height: 100vh;
  height: 100svh;
  cursor: pointer;
}
.bh-stage {
  position: absolute;
  left: 50%;
  top: 50%;
  transform-origin: center;
  will-change: transform;
}
.bh-burger-wrap {
  position: absolute;
  inset: 0;
}
.bh-piece {
  position: absolute;
  max-width: none;
  user-select: none;
  will-change: transform;
  filter: drop-shadow(0 12px 18px rgba(0, 0, 0, 0.38));
}

/* Mobile: animation top, text bottom */
@media (max-width: 859px) {
  .bh-grid {
    grid-template-columns: 1fr;
    grid-template-rows: 52svh auto;
    align-items: start;
    padding-bottom: 40px;
  }
  .bh-visual {
    order: -1;
    height: 52svh;
  }
  .bh-title { font-size: clamp(28px, 8vw, 38px); }
  .bh-desc { font-size: 15px; }
}

@media (prefers-reduced-motion: reduce) {
  .bh-content { animation: none; }
  .bh-piece, .bh-stage { transition: none !important; }
}
`;
