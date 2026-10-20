import { useEffect, useState, useCallback } from "react";

export default function WaiterPanel({ user, onLogout }) {
  const [tables, setTables] = useState([]);
  const [readyOrders, setReadyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionBusy, setActionBusy] = useState({});

  const fetchWaiterData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/panels/waiter", {
        credentials: "include",
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load waiter service data.");

      setTables(data.tables || []);
      setReadyOrders(data.readyOrders || []);
      setError("");
    } catch (err) {
      if (!silent) setError(err.message || "Could not connect to waiter service.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWaiterData(false);
    const interval = setInterval(() => fetchWaiterData(true), 10000);
    return () => clearInterval(interval);
  }, [fetchWaiterData]);

  const handleMarkServed = async (orderId) => {
    setActionBusy((prev) => ({ ...prev, [orderId]: true }));
    try {
      const res = await fetch(`/api/panels/waiter/${orderId}/complete`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to complete order.");

      await fetchWaiterData(true);
    } catch (err) {
      alert(err.message || "Could not complete order.");
    } finally {
      setActionBusy((prev) => ({ ...prev, [orderId]: false }));
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

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f1411",
        color: "#f4ead5",
        fontFamily: "'Inter', sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <header
        style={{
          background: "#151a17",
          borderBottom: "2px solid #3498db",
          padding: "14px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{
              background: "#3498db",
              color: "#fff",
              fontWeight: 900,
              fontSize: "0.85rem",
              padding: "4px 10px",
              borderRadius: "4px",
              letterSpacing: "1px",
            }}
          >
            STAFF
          </span>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.3rem", letterSpacing: "1px", fontFamily: "'Bebas Neue', sans-serif" }}>
              WAITER SERVICE PANEL
            </h1>
            <div style={{ fontSize: "0.78rem", color: "rgba(244, 234, 213, 0.6)" }}>
              Ready to Serve: <strong style={{ color: "#4ade80" }}>{readyOrders.length}</strong> orders · Active Tables: {tables.length}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => fetchWaiterData(false)}
            style={{
              background: "#1f2622",
              border: "1px solid rgba(217, 164, 65, 0.3)",
              color: "#f4ead5",
              padding: "6px 14px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.8rem",
              fontWeight: 600,
            }}
          >
            Refresh
          </button>
          <div style={{ fontSize: "0.8rem", color: "rgba(244, 234, 213, 0.8)" }}>
            Waiter: <strong>{user?.name || "Staff"}</strong>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: "rgba(239, 68, 68, 0.2)",
              border: "1px solid #ef4444",
              color: "#fca5a5",
              padding: "6px 14px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.8rem",
              fontWeight: 600,
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main style={{ padding: "24px", maxWidth: "1600px", margin: "0 auto", width: "100%", boxSizing: "border-box", display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px" }}>
        {/* Left Column: Ready Orders to Serve */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <h2 style={{ margin: 0, fontSize: "1.4rem", fontFamily: "'Bebas Neue', sans-serif", color: "#4ade80", letterSpacing: "1px" }}>
              READY TO SERVE ({readyOrders.length})
            </h2>
            <span style={{ fontSize: "0.78rem", color: "rgba(244, 234, 213, 0.5)" }}>
              Food cooked in kitchen waiting for delivery
            </span>
          </div>

          {loading && readyOrders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#d9a441" }}>Loading ready orders...</div>
          ) : error ? (
            <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", borderRadius: "8px", padding: "16px", color: "#fca5a5" }}>
              {error}
            </div>
          ) : readyOrders.length === 0 ? (
            <div style={{ background: "#151a17", border: "1px dashed rgba(217, 164, 65, 0.25)", borderRadius: "10px", padding: "50px 20px", textAlign: "center", color: "rgba(244, 234, 213, 0.6)" }}>
              <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🔔</div>
              <h3 style={{ margin: "0 0 4px", color: "#f4ead5" }}>No Food Waiting to be Served</h3>
              <p style={{ margin: 0, fontSize: "0.85rem" }}>
                As soon as the kitchen marks food as "Ready", it will appear here immediately.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
              {readyOrders.map((o) => {
                const tableNum = o.table?.number || o.table?.tableNumber;
                const busy = actionBusy[o._id];

                return (
                  <div
                    key={o._id}
                    style={{
                      background: "#18201b",
                      border: "2px solid #4ade80",
                      borderRadius: "10px",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      boxShadow: "0 0 12px rgba(74, 222, 128, 0.2)",
                    }}
                  >
                    <div style={{ background: "#064e3b", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#f4ead5" }}>
                        #{o.orderNumber || o._id.slice(-5).toUpperCase()}
                      </span>
                      <span style={{ background: "#4ade80", color: "#064e3b", fontSize: "0.72rem", fontWeight: 900, padding: "2px 6px", borderRadius: "4px" }}>
                        FOOD READY
                      </span>
                    </div>

                    <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(217, 164, 65, 0.1)", background: "#131a15" }}>
                      <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#d9a441" }}>
                        {tableNum ? `🍽️ Table ${tableNum}` : `📦 ${o.type.toUpperCase()}`}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "rgba(244, 234, 213, 0.7)", marginTop: "2px" }}>
                        Customer: {o.customer?.name || "Guest"}
                      </div>
                    </div>

                    <div style={{ padding: "12px 14px", flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                      {o.items?.map((it, idx) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", color: "#f4ead5" }}>
                          <span>{it.name}</span>
                          <strong style={{ color: "#d9a441" }}>&times; {it.quantity}</strong>
                        </div>
                      ))}
                    </div>

                    <div style={{ padding: "12px 14px", background: "#131a15", borderTop: "1px solid rgba(217, 164, 65, 0.1)" }}>
                      <button
                        disabled={busy}
                        onClick={() => handleMarkServed(o._id)}
                        style={{
                          width: "100%",
                          padding: "10px",
                          background: "#4ade80",
                          color: "#0f1411",
                          border: "none",
                          borderRadius: "6px",
                          fontWeight: 800,
                          fontSize: "0.88rem",
                          cursor: busy ? "wait" : "pointer",
                        }}
                      >
                        {busy ? "Updating..." : "✓ Mark Served & Delivered"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Restaurant Floor Tables Status */}
        <div>
          <h2 style={{ margin: "0 0 16px", fontSize: "1.4rem", fontFamily: "'Bebas Neue', sans-serif", color: "#d9a441", letterSpacing: "1px" }}>
            DINING TABLES FLOOR
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {tables.map((t) => {
              const num = t.number || t.tableNumber;
              const seats = t.seats || t.capacity;
              const isOccupied = t.status === "occupied";
              const isReserved = t.status === "reserved";

              return (
                <div
                  key={t._id}
                  style={{
                    background: "#18201b",
                    border: `1px solid ${
                      isOccupied ? "rgba(239, 68, 68, 0.4)" : isReserved ? "rgba(217, 164, 65, 0.4)" : "rgba(74, 222, 128, 0.4)"
                    }`,
                    borderRadius: "8px",
                    padding: "12px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f4ead5" }}>
                    Table {num}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(244, 234, 213, 0.5)", marginTop: "2px" }}>
                    {seats} Seats
                  </div>
                  <div
                    style={{
                      marginTop: "6px",
                      display: "inline-block",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      background: isOccupied ? "rgba(239, 68, 68, 0.2)" : isReserved ? "rgba(217, 164, 65, 0.2)" : "rgba(74, 222, 128, 0.2)",
                      color: isOccupied ? "#fca5a5" : isReserved ? "#fcd34d" : "#86efac",
                    }}
                  >
                    {t.status || "available"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
