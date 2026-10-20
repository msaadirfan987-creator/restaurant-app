import { useState, useEffect, useCallback } from "react";
import { cashierApi } from "./cashierApi";

export default function CashierDashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStats = useCallback(async () => {
    try {
      const data = await cashierApi.getStats();
      setStats(data);
      setError("");
    } catch (e) {
      setError(e.message || "Failed to load cashier metrics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 15000);
    return () => clearInterval(interval);
  }, [loadStats]);

  const cards = [
    { label: "Today's Orders", val: stats?.ordersToday ?? "—", hint: "Active shift orders" },
    {
      label: "Today's Cash Sales",
      val: stats?.cashSalesToday != null ? `Rs. ${stats.cashSalesToday.toLocaleString()}` : "—",
      hint: `${stats?.paymentsToday || 0} cash payments recorded`,
    },
    {
      label: "Pending Orders",
      val: stats?.pending ?? "—",
      hint: `${stats?.onlinePending || 0} from website orders`,
    },
    {
      label: "Completed Today",
      val: stats?.completedToday ?? "—",
      hint: "Fulfilled & paid",
    },
    {
      label: "Unpaid Active Orders",
      val: stats?.unpaidActive ?? "—",
      hint: "Pending cash collection",
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            margin: "0 0 6px",
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: "clamp(24px, 3.5vw, 32px)",
            fontWeight: "700",
            color: "#f4ead5",
          }}
        >
          Cashier Shift Dashboard
        </h1>
        <p style={{ margin: 0, fontSize: "14px", color: "rgba(244, 234, 213, 0.65)" }}>
          Real-time POS register, today's cash collections, and incoming website orders.
        </p>
      </div>

      {error && (
        <div
          style={{
            padding: "12px 18px",
            marginBottom: 20,
            borderRadius: 8,
            background: "rgba(240, 144, 127, 0.15)",
            border: "1px solid #f0907f",
            color: "#f0907f",
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {/* Metrics Cards */}
      <div className="ap-stat-grid">
        {cards.map((c, i) => (
          <div className="ap-stat-card" key={i}>
            <span className="ap-stat-title">{c.label}</span>
            <span className="ap-stat-value">{loading && !stats ? "..." : c.val}</span>
            <span className="ap-stat-hint">{c.hint}</span>
          </div>
        ))}
      </div>

      {/* Quick Action Shortcuts */}
      <h3 style={{ margin: "32px 0 16px", fontSize: 16, fontWeight: 700, color: "#f4ead5" }}>
        Quick Register Actions
      </h3>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          type="button"
          className="ad-btn ad-btn--solid"
          style={{ padding: "12px 24px", fontSize: 15 }}
          onClick={() => onNavigate("/cashier/pos")}
        >
          + Open POS / New Order
        </button>

        <button
          type="button"
          className="ad-btn ad-btn--ghost"
          style={{ padding: "12px 24px", fontSize: 15, position: "relative" }}
          onClick={() => onNavigate("/cashier/online")}
        >
          Incoming Website Orders
          {stats?.onlinePending > 0 && (
            <span
              style={{
                marginLeft: 10,
                background: "#e74c3c",
                color: "#fff",
                fontSize: 12,
                fontWeight: 800,
                padding: "2px 8px",
                borderRadius: 10,
              }}
            >
              {stats.onlinePending}
            </span>
          )}
        </button>

        <button
          type="button"
          className="ad-btn ad-btn--ghost"
          style={{ padding: "12px 24px", fontSize: 15 }}
          onClick={() => onNavigate("/cashier/dine-in")}
        >
          Dine-In Active Orders
        </button>

        <button
          type="button"
          className="ad-btn ad-btn--ghost"
          style={{ padding: "12px 24px", fontSize: 15 }}
          onClick={() => onNavigate("/cashier/orders")}
        >
          All Orders &amp; Receipts
        </button>
      </div>
    </div>
  );
}
