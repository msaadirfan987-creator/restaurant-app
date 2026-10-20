import { useEffect, useMemo, useState } from "react";
import OurMenu from "./OurMenu";
import FeaturedBurgers from "./FeaturedBurgers";

/**
 * PublicCatalog.jsx — Connects public landing page to live database catalog data.
 *   GET /api/categories, GET /api/products
 *
 * Provides:
 *   <FeaturedFromApi onAddToCart={...} onOrderNow={...} onCheckout={...} />
 *   <MenuFromApi onAddToCart={...} onCheckout={...} />
 */

const effectivePrice = (p) => (p.discountPrice != null ? p.discountPrice : p.price);
const DEFAULT_BURGER_IMG =
  "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80";

import { apiUrl } from "../config/api.js";

async function getJson(url) {
  const res = await fetch(apiUrl(url));
  if (!res.ok) throw new Error("Could not load the menu. Please try again.");
  return res.json();
}

export function useCatalog({ featuredOnly = false } = {}) {
  const [state, setState] = useState({
    status: "loading",
    categories: [],
    products: [],
    error: "",
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, status: "loading" }));

    Promise.all([
      featuredOnly ? Promise.resolve({ items: [] }) : getJson("/api/categories"),
      getJson(`/api/products?limit=100${featuredOnly ? "&featured=true" : ""}`),
    ]).then(
      ([c, p]) => {
        if (alive) {
          setState({
            status: "ready",
            categories: c.items || [],
            products: p.items || [],
            error: "",
          });
        }
      },
      (e) => {
        if (alive) {
          setState({
            status: "error",
            categories: [],
            products: [],
            error: e.message || "Failed to load catalog.",
          });
        }
      }
    );

    return () => {
      alive = false;
    };
  }, [featuredOnly, tick]);

  return { ...state, retry: () => setTick((t) => t + 1) };
}

const BOX = {
  padding: "72px 20px",
  textAlign: "center",
  background: "#151a17",
  color: "rgba(244,234,213,0.8)",
  fontFamily: '"Inter","Segoe UI",system-ui,sans-serif',
};

function StateBox({ children }) {
  return (
    <section style={BOX}>
      <style>{`@keyframes pc-spin{to{transform:rotate(360deg)}}`}</style>
      {children}
    </section>
  );
}

const Loading = ({ label }) => (
  <StateBox>
    <span
      style={{
        display: "inline-block",
        width: 32,
        height: 32,
        border: "3px solid rgba(244,234,213,0.2)",
        borderTopColor: "#d9a441",
        borderRadius: "50%",
        animation: "pc-spin 800ms linear infinite",
      }}
    />
    <p style={{ margin: "16px 0 0", color: "#f4ead5", fontSize: "15px" }}>{label}</p>
  </StateBox>
);

export function MenuFromApi(props) {
  const { status, categories, products, error, retry } = useCatalog();

  const mapped = useMemo(() => {
    return categories
      .map((c) => {
        const catId = c.id || c._id;
        const items = products
          .filter((p) => {
            const pCatId = p.category?.id || p.category?._id || p.category;
            return pCatId && String(pCatId) === String(catId);
          })
          .map((p) => ({
            id: p.id || p._id,
            name: p.name,
            price: effectivePrice(p),
            description: p.description,
            tag: p.isFeatured ? "Featured" : undefined,
            image: (p.images && p.images[0]) || DEFAULT_BURGER_IMG,
          }));

        return {
          id: catId,
          label: c.name,
          tagline: c.description || `Our ${c.name.toLowerCase()}, made fresh to order.`,
          banner: c.image?.url || c.image || items[0]?.image || DEFAULT_BURGER_IMG,
          items,
        };
      })
      .filter((c) => c.items.length > 0);
  }, [categories, products]);

  if (status === "loading") return <Loading label="Loading our artisanal menu..." />;
  if (status === "error") {
    return (
      <StateBox>
        <p style={{ color: "#f0907f" }}>{error}</p>
        <button
          type="button"
          onClick={retry}
          style={{
            cursor: "pointer",
            padding: "11px 24px",
            border: "2px solid #d9a441",
            borderRadius: 8,
            background: "#d9a441",
            color: "#151a17",
            fontWeight: 700,
            fontSize: 15,
            marginTop: 12,
          }}
        >
          Try again
        </button>
      </StateBox>
    );
  }

  if (mapped.length === 0) {
    // If database returned 0 categories, render default OurMenu
    return <OurMenu {...props} />;
  }

  return <OurMenu {...props} categories={mapped} defaultCategory={mapped[0]?.id} />;
}

export function FeaturedFromApi(props) {
  const { status, products, error, retry } = useCatalog({ featuredOnly: true });

  const burgers = useMemo(() => {
    return products.map((p) => ({
      id: p.id || p._id,
      name: p.name,
      price: effectivePrice(p),
      description: p.description,
      tag: "Featured",
      image: (p.images && p.images[0]) || DEFAULT_BURGER_IMG,
    }));
  }, [products]);

  if (status === "loading") return <Loading label="Loading featured burgers..." />;
  if (status === "error") {
    return (
      <StateBox>
        <p style={{ color: "#f0907f" }}>{error}</p>
        <button
          type="button"
          onClick={retry}
          style={{
            cursor: "pointer",
            padding: "11px 24px",
            border: "2px solid #d9a441",
            borderRadius: 8,
            background: "#d9a441",
            color: "#151a17",
            fontWeight: 700,
            fontSize: 15,
            marginTop: 12,
          }}
        >
          Try again
        </button>
      </StateBox>
    );
  }

  if (burgers.length === 0) {
    // Fallback to default FeaturedBurgers if none marked featured yet
    return <FeaturedBurgers {...props} />;
  }

  return <FeaturedBurgers {...props} burgers={burgers.slice(0, 4)} />;
}
