import { useEffect, useState, useCallback, useRef } from "react";
import "./kitchen.css";

function elapsedMinutes(createdAt) {
  if (!createdAt) return 0;
  const diff = Date.now() - new Date(createdAt).getTime();
  return Math.floor(diff / 60000);
}

export default function KitchenPanel({ user, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionBusy, setActionBusy] = useState({});
  const [filter, setFilter] = useState("all"); // "all" | "pending" | "preparing" | "dine-in" | "online"
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const prevCount = useRef(0);

  const playChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // Audio autoplay restrictions, harmless
    }
  }, [soundEnabled]);

  const fetchKitchenOrders = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const res = await fetch("/api/panels/kitchen", {
          credentials: "include",
          headers: { "X-Requested-With": "XMLHttpRequest" },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load kitchen queue.");

        const fetchedOrders = data.orders || [];
        setOrders(fetchedOrders);
        setError("");

        // If new order arrived, chime
        if (silent && fetchedOrders.length > prevCount.current) {
          playChime();
        }
        prevCount.current = fetchedOrders.length;
      } catch (err) {
        if (!silent) setError(err.message || "Could not connect to kitchen service.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [playChime]
  );

  useEffect(() => {
    fetchKitchenOrders(false);
    const interval = setInterval(() => fetchKitchenOrders(true), 6000);
    return () => clearInterval(interval);
  }, [fetchKitchenOrders]);

  const updateOrderStatus = async (orderId, newStatus) => {
    setActionBusy((prev) => ({ ...prev, [orderId]: true }));
    try {
      const res = await fetch(`/api/panels/kitchen/${orderId}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update order status.");

      // Refresh queue
      await fetchKitchenOrders(true);
    } catch (err) {
      alert(err.message || "Could not update status.");
    } finally {
      setActionBusy((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout();
    } else {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      window.location.href = "/";
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (filter === "pending") return o.status === "pending";
    if (filter === "preparing") return o.status === "preparing";
    if (filter === "dine-in") return o.type === "dine-in";
    if (filter === "online") return o.source === "online" || o.type === "delivery" || o.type === "takeaway";
    return true;
  });

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const preparingCount = orders.filter((o) => o.status === "preparing").length;

  return (
    <div className="kds-root">
      {/* Top Header */}
      <header className="kds-header">
        <div className="kds-brand">
          <span className="kds-badge">KDS</span>
          <div>
            <h1 className="kds-title">KITCHEN DISPLAY SYSTEM</h1>
            <div className="kds-subtitle">
              Active Queue: <strong style={{ color: "#d9a441" }}>{orders.length}</strong> (
              <span style={{ color: "#fcd34d" }}>{pendingCount} New</span> ·{" "}
              <span style={{ color: "#60a5fa" }}>{preparingCount} Cooking</span>) · Auto-sync 6s
            </div>
          </div>
        </div>

        <div className="kds-actions">
          <button
            type="button"
            className="kds-btn"
            onClick={() => setSoundEnabled((s) => !s)}
            title={soundEnabled ? "Mute audio alert" : "Enable order chime"}
          >
            {soundEnabled ? "Sound: ON" : "Sound: OFF"}
          </button>

          <button
            type="button"
            className="kds-btn"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen for Kitchen Monitor"
          >
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen KDS"}
          </button>

          <button
            type="button"
            className="kds-btn"
            onClick={() => fetchKitchenOrders(false)}
          >
            Refresh
          </button>

          <div style={{ fontSize: "0.82rem", color: "rgba(244, 234, 213, 0.8)", padding: "0 6px" }}>
            Chef: <strong style={{ color: "#d9a441" }}>{user?.name || "Kitchen Chef"}</strong>
          </div>

          <button
            type="button"
            className="kds-btn kds-btn-logout"
            onClick={handleLogout}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Filter Tabs Bar */}
      <nav className="kds-filter-bar" aria-label="Kitchen queue filters">
        <button
          type="button"
          className={`kds-filter-pill ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All Tickets ({orders.length})
        </button>
        <button
          type="button"
          className={`kds-filter-pill ${filter === "pending" ? "active" : ""}`}
          onClick={() => setFilter("pending")}
        >
          New / Pending ({pendingCount})
        </button>
        <button
          type="button"
          className={`kds-filter-pill ${filter === "preparing" ? "active" : ""}`}
          onClick={() => setFilter("preparing")}
        >
          In Prep / Cooking ({preparingCount})
        </button>
        <button
          type="button"
          className={`kds-filter-pill ${filter === "dine-in" ? "active" : ""}`}
          onClick={() => setFilter("dine-in")}
        >
          Dine-In Tables
        </button>
        <button
          type="button"
          className={`kds-filter-pill ${filter === "online" ? "active" : ""}`}
          onClick={() => setFilter("online")}
        >
          Website &amp; Takeaway
        </button>
      </nav>

      {/* Main Tickets Screen */}
      <main className="kds-main">
        {loading && orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#d9a441", fontSize: "1.1rem" }}>
            Connecting to Live Kitchen Stream...
          </div>
        ) : error && orders.length === 0 ? (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid #ef4444",
              borderRadius: "10px",
              padding: "24px",
              color: "#fca5a5",
              textAlign: "center",
              maxWidth: "600px",
              margin: "40px auto",
            }}
          >
            {error}{" "}
            <button
              type="button"
              onClick={() => fetchKitchenOrders(false)}
              style={{
                background: "none",
                border: "none",
                color: "#f4ead5",
                textDecoration: "underline",
                cursor: "pointer",
                fontWeight: "bold",
                marginLeft: "8px",
              }}
            >
              Retry Connection
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div
            style={{
              background: "#151a17",
              border: "1px dashed rgba(217, 164, 65, 0.35)",
              borderRadius: "14px",
              padding: "70px 20px",
              textAlign: "center",
              marginTop: "40px",
              maxWidth: "600px",
              margin: "40px auto",
            }}
          >
            <div style={{ width: "68px", height: "68px", margin: "0 auto 16px", borderRadius: "50%", overflow: "hidden", border: "2px solid #d9a441" }}>
              <img
                src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80"
                alt="Kitchen"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <h2
              style={{
                margin: "0 0 8px",
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1.8rem",
                letterSpacing: "1px",
                color: "#f4ead5",
              }}
            >
              {filter === "all" ? "KITCHEN QUEUE CLEAR!" : "NO ORDERS IN THIS VIEW"}
            </h2>
            <p style={{ margin: 0, color: "rgba(244, 234, 213, 0.65)", fontSize: "0.95rem" }}>
              {filter === "all"
                ? "All customer orders have been cooked. Incoming orders will arrive here automatically."
                : "Switch to 'All Tickets' tab above to view other active orders."}
            </p>
          </div>
        ) : (
          <div className="kds-grid">
            {filteredOrders.map((o) => {
              const mins = elapsedMinutes(o.createdAt);
              const isUrgent = mins >= 15;
              const isPreparing = o.status === "preparing";
              const tableNum = o.table?.number || o.table?.tableNumber;
              const busy = actionBusy[o._id];
              const orderIdStr = o.orderNumber || (o._id ? o._id.slice(-5).toUpperCase() : "100");

              return (
                <article
                  key={o._id}
                  className={`kds-card ${isPreparing ? "preparing" : ""} ${isUrgent ? "urgent" : ""}`}
                >
                  {/* Card Top / Header */}
                  <div className="kds-card-head">
                    <div>
                      <span className="kds-order-num">#{orderIdStr}</span>
                      <span
                        className={`kds-order-source ${
                          o.source === "online" ? "kds-source-online" : "kds-source-pos"
                        }`}
                      >
                        {o.source === "online" ? "Website" : o.type || "POS"}
                      </span>
                    </div>

                    <div className="kds-timer">
                      <span>{mins === 0 ? "Just now" : `${mins}m ago`}</span>
                      {isUrgent && (
                        <span
                          style={{
                            marginLeft: 4,
                            background: "#ef4444",
                            color: "#fff",
                            padding: "1px 5px",
                            borderRadius: "3px",
                            fontSize: "0.68rem",
                            fontWeight: 800,
                          }}
                        >
                          URGENT
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Customer / Table Info */}
                  <div className="kds-info-bar">
                    <div>
                      {tableNum ? (
                        <span className="kds-table-badge">
                          Table {tableNum}
                          {o.table?.seats ? ` (${o.table.seats} Seats)` : ""}
                        </span>
                      ) : (
                        <span style={{ color: "#f4ead5", fontWeight: 600 }}>
                          {o.customer?.name || o.customerName || "Customer"}
                        </span>
                      )}
                    </div>
                    <div style={{ color: "rgba(244, 234, 213, 0.6)", textTransform: "capitalize" }}>
                      {o.type || "Dine-In"}
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="kds-items-list">
                    {o.items?.map((it, idx) => (
                      <div key={idx} className="kds-item-row">
                        <span className="kds-item-name">{it.name}</span>
                        <span className="kds-item-qty">&times; {it.quantity || it.qty || 1}</span>
                      </div>
                    ))}

                    {/* Special Instructions */}
                    {(o.instructions || o.notes) && (
                      <div className="kds-instructions">
                        <strong>Note:</strong> {o.instructions || o.notes}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="kds-card-actions">
                    {o.status === "pending" ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => updateOrderStatus(o._id, "preparing")}
                        className="kds-action-btn kds-btn-cook"
                      >
                        {busy ? "Updating..." : "Start Cooking / Preparing"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => updateOrderStatus(o._id, "ready")}
                        className="kds-action-btn kds-btn-ready"
                      >
                        {busy ? "Updating..." : "Food Ready (Notify Staff)"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
