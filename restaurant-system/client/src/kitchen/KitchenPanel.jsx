import { useEffect, useState, useCallback, useRef } from "react";
import "./kitchen.css";

function elapsedMinutes(createdAt) {
  if (!createdAt) return 0;
  const diff = Date.now() - new Date(createdAt).getTime();
  return Math.floor(diff / 60000);
}

export default function KitchenPanel({ user, onLogout }) {
  const [newOrders, setNewOrders] = useState([]);
  const [preparingOrders, setPreparingOrders] = useState([]);
  const [readyOrders, setReadyOrders] = useState([]);
  const [completedCount, setCompletedCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionBusy, setActionBusy] = useState({});
  const [filterType, setFilterType] = useState("all"); // "all" | "dine-in" | "takeaway" | "online"
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Modals
  const [show86Modal, setShow86Modal] = useState(false);
  const [productsList, setProductsList] = useState([]);
  const [search86, setSearch86] = useState("");

  const [rejectOrder, setRejectOrder] = useState(null); // Order to reject
  const [rejectReason, setRejectReason] = useState("");

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [completedOrders, setCompletedOrders] = useState([]);

  const prevNewCount = useRef(0);

  // Audio chime
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
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.55);
    } catch {
      // Audio autoplay policy
    }
  }, [soundEnabled]);

  // Fetch live KOT queue
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

        const fetchedNew = data.newOrders || [];
        setNewOrders(fetchedNew);
        setPreparingOrders(data.preparingOrders || []);
        setReadyOrders(data.readyOrders || []);
        setCompletedCount(data.completedTodayCount || 0);
        setError("");

        // Check if brand new order arrived
        if (silent && fetchedNew.length > prevNewCount.current) {
          playChime();
        }
        prevNewCount.current = fetchedNew.length;
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

  // Update order status (bidirectional)
  const handleUpdateStatus = async (orderId, newStatus) => {
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
      if (!res.ok) throw new Error(data.message || "Failed to update status.");

      await fetchKitchenOrders(true);
    } catch (err) {
      alert(err.message || "Could not update status.");
    } finally {
      setActionBusy((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  // Reject / Cannot prepare order
  const handleRejectOrder = async () => {
    if (!rejectOrder || !rejectReason.trim()) {
      alert("Please enter a reason for rejecting this order.");
      return;
    }
    setActionBusy((prev) => ({ ...prev, [rejectOrder._id]: true }));
    try {
      const res = await fetch(`/api/panels/kitchen/${rejectOrder._id}/reject`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reject order.");

      setRejectOrder(null);
      setRejectReason("");
      await fetchKitchenOrders(true);
    } catch (err) {
      alert(err.message || "Could not reject order.");
    } finally {
      setActionBusy((prev) => ({ ...prev, [rejectOrder?._id]: false }));
    }
  };

  // Open 86 Item Modal
  const handleOpen86Modal = async () => {
    setShow86Modal(true);
    try {
      const res = await fetch("/api/panels/kitchen/products", {
        credentials: "include",
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      const data = await res.json();
      if (res.ok && data.products) setProductsList(data.products);
    } catch {
      // ignore
    }
  };

  // Toggle item 86 status
  const handleToggle86 = async (productId) => {
    try {
      const res = await fetch(`/api/panels/kitchen/products/${productId}/toggle-86`, {
        method: "PATCH",
        credentials: "include",
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      const data = await res.json();
      if (res.ok) {
        setProductsList((prev) =>
          prev.map((p) => (p.id === productId || p._id === productId ? data.product : p))
        );
      }
    } catch (err) {
      alert(err.message || "Could not toggle product availability.");
    }
  };

  // Open completed history modal
  const handleOpenHistory = async () => {
    setShowHistoryModal(true);
    try {
      const res = await fetch("/api/panels/kitchen/completed-today", {
        credentials: "include",
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      const data = await res.json();
      if (res.ok && data.orders) setCompletedOrders(data.orders);
    } catch {
      // ignore
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Filter orders by order type (dine-in, takeaway, online)
  const filterList = (list) => {
    if (filterType === "all") return list;
    if (filterType === "online") return list.filter((o) => o.source === "online" || o.type === "delivery");
    if (filterType === "dine-in") return list.filter((o) => o.type === "dine-in");
    if (filterType === "takeaway") return list.filter((o) => o.type === "takeaway");
    return list;
  };

  const filteredNew = filterList(newOrders);
  const filteredPreparing = filterList(preparingOrders);
  const filteredReady = filterList(readyOrders);

  // Render Single Order Card
  const renderCard = (ord, columnKey) => {
    const mins = elapsedMinutes(ord.createdAt);
    const timerClass = mins >= 20 ? "timer-red" : mins >= 10 ? "timer-yellow" : "timer-normal";
    const timerBadgeClass = mins >= 20 ? "timer-badge-red" : mins >= 10 ? "timer-badge-yellow" : "timer-badge-normal";

    const isDineIn = ord.type === "dine-in";
    const isOnline = ord.source === "online" || ord.type === "delivery";
    const isTakeaway = ord.type === "takeaway";

    return (
      <div key={ord._id} className={`kds-card ${timerClass}`}>
        <div className="kds-card-head">
          <div>
            <div className="kds-order-number">{ord.orderId}</div>
            <div className="kds-meta-chips">
              {isDineIn && (
                <span className="kds-chip kds-chip-table">
                  Table {ord.table?.number || "?"}
                </span>
              )}
              {isOnline && <span className="kds-chip kds-chip-online">Online</span>}
              {isTakeaway && <span className="kds-chip kds-chip-takeaway">Takeaway</span>}
              {ord.guestCount > 1 && (
                <span className="kds-chip" style={{ background: "#334155", color: "#fff" }}>
                  {ord.guestCount} Guests
                </span>
              )}
            </div>
          </div>

          <div className={`kds-timer-badge ${timerBadgeClass}`}>
            <span>{mins}m ago</span>
          </div>
        </div>

        {/* Instructions / Allergies */}
        {(ord.instructions || ord.customer?.notes) && (
          <div className="kds-order-instructions">
            <strong>Note:</strong> {ord.instructions || ord.customer?.notes}
          </div>
        )}

        {/* Items List */}
        <div className="kds-items-list">
          {(ord.items || []).map((it, idx) => (
            <div key={`${it.id}-${idx}`} className="kds-item-row">
              <div className="kds-item-main">
                <span className="kds-item-qty">{it.quantity || it.qty}x</span>
                <span className="kds-item-name">{it.name}</span>
                {it.round && it.round > 1 && (
                  <span className="kds-item-round">Round {it.round}</span>
                )}
              </div>
              {it.notes && <div className="kds-item-note">Note: {it.notes}</div>}
            </div>
          ))}
        </div>

        {/* Card Actions */}
        <div className="kds-card-actions">
          {columnKey === "new" && (
            <>
              <button
                type="button"
                className="kds-action-btn btn-start-prep"
                disabled={actionBusy[ord._id]}
                onClick={() => handleUpdateStatus(ord._id, "preparing")}
              >
                {actionBusy[ord._id] ? "Updating..." : "Start Preparing"}
              </button>
              <button
                type="button"
                className="kds-action-btn btn-reject"
                title="Cannot prepare / Cancel"
                disabled={actionBusy[ord._id]}
                onClick={() => setRejectOrder(ord)}
              >
                Reject
              </button>
            </>
          )}

          {columnKey === "preparing" && (
            <>
              <button
                type="button"
                className="kds-action-btn btn-undo"
                title="Undo back to New"
                disabled={actionBusy[ord._id]}
                onClick={() => handleUpdateStatus(ord._id, "pending")}
              >
                &larr; Back
              </button>
              <button
                type="button"
                className="kds-action-btn btn-mark-ready"
                disabled={actionBusy[ord._id]}
                onClick={() => handleUpdateStatus(ord._id, "ready")}
              >
                {actionBusy[ord._id] ? "Updating..." : "Mark Ready"}
              </button>
            </>
          )}

          {columnKey === "ready" && (
            <>
              <button
                type="button"
                className="kds-action-btn btn-undo"
                title="Undo back to Preparing"
                disabled={actionBusy[ord._id]}
                onClick={() => handleUpdateStatus(ord._id, "preparing")}
              >
                &larr; Prep
              </button>
              <div
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "10px",
                  background: "rgba(16, 185, 129, 0.15)",
                  color: "#34d399",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  borderRadius: "6px",
                }}
              >
                Ready for Waiter Pickup
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`kds-root ${isFullscreen ? "is-fullscreen" : ""}`}>
      {/* KDS Header */}
      <header className="kds-header">
        <div className="kds-brand">
          <span className="kds-badge">KDS &middot; KITCHEN</span>
          <div>
            <h1 className="kds-title">Kitchen Live Display</h1>
            <div className="kds-subtitle">
              New: {newOrders.length} &middot; Preparing: {preparingOrders.length} &middot; Ready:{" "}
              {readyOrders.length}
            </div>
          </div>
        </div>

        <div className="kds-header-actions">
          {/* Sound Toggle */}
          <button
            type="button"
            className={`kds-btn ${soundEnabled ? "active" : ""}`}
            onClick={() => setSoundEnabled((v) => !v)}
          >
            Sound: {soundEnabled ? "ON" : "OFF"}
          </button>

          {/* Fullscreen Toggle */}
          <button type="button" className="kds-btn" onClick={toggleFullscreen}>
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button>

          {/* 86 Stock Manager */}
          <button type="button" className="kds-btn kds-btn-86" onClick={handleOpen86Modal}>
            Item Khatam (86)
          </button>

          {/* Completed History */}
          <button type="button" className="kds-btn" onClick={handleOpenHistory}>
            Today's Completed ({completedCount})
          </button>

          {/* Logout */}
          <button
            type="button"
            className="kds-btn"
            style={{ background: "rgba(239, 68, 68, 0.2)", color: "#fca5a5" }}
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="kds-filter-bar">
        <div className="kds-filter-group">
          <button
            type="button"
            className={`kds-filter-btn ${filterType === "all" ? "active" : ""}`}
            onClick={() => setFilterType("all")}
          >
            All Orders ({newOrders.length + preparingOrders.length + readyOrders.length})
          </button>
          <button
            type="button"
            className={`kds-filter-btn ${filterType === "dine-in" ? "active" : ""}`}
            onClick={() => setFilterType("dine-in")}
          >
            Dine-In
          </button>
          <button
            type="button"
            className={`kds-filter-btn ${filterType === "takeaway" ? "active" : ""}`}
            onClick={() => setFilterType("takeaway")}
          >
            Takeaway
          </button>
          <button
            type="button"
            className={`kds-filter-btn ${filterType === "online" ? "active" : ""}`}
            onClick={() => setFilterType("online")}
          >
            Online / Delivery
          </button>
        </div>

        <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
          Chef: <strong>{user?.name || "Kitchen Staff"}</strong> &middot; Timer:{" "}
          <span style={{ color: "#f59e0b" }}>&gt;10m Yellow</span> &middot;{" "}
          <span style={{ color: "#ef4444" }}>&gt;20m Urgent Red</span>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div style={{ padding: "12px 24px", background: "#ef4444", color: "#fff", fontWeight: 700 }}>
          {error}
        </div>
      )}

      {/* 3 Columns Queue Layout */}
      <main className="kds-columns-grid">
        {/* Column 1: NEW ORDERS */}
        <section className="kds-column col-new">
          <div className="kds-column-header">
            <span className="kds-column-title" style={{ color: "#38bdf8" }}>
              1. NEW ORDERS
            </span>
            <span className="kds-column-count">{filteredNew.length}</span>
          </div>
          <div className="kds-cards-scroll">
            {filteredNew.length === 0 ? (
              <div className="kds-col-empty">No new orders waiting.</div>
            ) : (
              filteredNew.map((ord) => renderCard(ord, "new"))
            )}
          </div>
        </section>

        {/* Column 2: PREPARING */}
        <section className="kds-column col-preparing">
          <div className="kds-column-header">
            <span className="kds-column-title" style={{ color: "#fbbf24" }}>
              2. PREPARING
            </span>
            <span className="kds-column-count">{filteredPreparing.length}</span>
          </div>
          <div className="kds-cards-scroll">
            {filteredPreparing.length === 0 ? (
              <div className="kds-col-empty">No orders currently on grill/prep.</div>
            ) : (
              filteredPreparing.map((ord) => renderCard(ord, "preparing"))
            )}
          </div>
        </section>

        {/* Column 3: READY */}
        <section className="kds-column col-ready">
          <div className="kds-column-header">
            <span className="kds-column-title" style={{ color: "#34d399" }}>
              3. READY FOR PICKUP
            </span>
            <span className="kds-column-count">{filteredReady.length}</span>
          </div>
          <div className="kds-cards-scroll">
            {filteredReady.length === 0 ? (
              <div className="kds-col-empty">No orders waiting for pickup.</div>
            ) : (
              filteredReady.map((ord) => renderCard(ord, "ready"))
            )}
          </div>
        </section>
      </main>

      {/* MODAL: 86 ITEMS (ITEM KHATAM) */}
      {show86Modal && (
        <div className="kds-modal-overlay" onClick={() => setShow86Modal(false)}>
          <div className="kds-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="kds-modal-header">
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>
                Item Khatam (86) &mdash; Availability Manager
              </h3>
              <button
                type="button"
                className="waiter-modal-close"
                onClick={() => setShow86Modal(false)}
              >
                &times;
              </button>
            </div>

            <div className="kds-modal-body">
              <p style={{ margin: "0 0 12px", fontSize: "0.85rem", color: "#94a3b8" }}>
                Agar koi item khatam ho gaya hai to yahan se <strong>86</strong> mark karein. Yeh
                item foran website aur POS par unavailable ho jayega.
              </p>

              <input
                type="text"
                placeholder="Search menu items..."
                className="waiter-search-input"
                style={{ width: "100%", marginBottom: "16px" }}
                value={search86}
                onChange={(e) => setSearch86(e.target.value)}
              />

              <div style={{ maxHeight: "350px", overflowY: "auto" }}>
                {productsList
                  .filter((p) => p.name.toLowerCase().includes(search86.toLowerCase()))
                  .map((prod) => (
                    <div key={prod.id || prod._id} className="kds-86-item">
                      <div>
                        <div style={{ fontWeight: 800, color: "#ffffff", fontSize: "0.95rem" }}>
                          {prod.name}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                          Category: {prod.category?.name || "General"} &middot; Rs.{" "}
                          {prod.price?.toLocaleString()}
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`kds-toggle-btn ${prod.isAvailable !== false ? "toggle-avail" : "toggle-86"}`}
                        onClick={() => handleToggle86(prod.id || prod._id)}
                      >
                        {prod.isAvailable !== false ? "AVAILABLE" : "86 / KHATAM"}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REJECT ORDER / CANNOT PREPARE */}
      {rejectOrder && (
        <div className="kds-modal-overlay" onClick={() => setRejectOrder(null)}>
          <div className="kds-modal-box" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <div className="kds-modal-header" style={{ background: "#7f1d1d" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#fecaca" }}>
                Cannot Prepare: {rejectOrder.orderId}
              </h3>
              <button
                type="button"
                className="waiter-modal-close"
                onClick={() => setRejectOrder(null)}
              >
                &times;
              </button>
            </div>

            <div className="kds-modal-body">
              <p style={{ margin: "0 0 10px", fontSize: "0.85rem", color: "#cbd5e1" }}>
                Enter reason for rejection (this will be sent to Waiter & Cashier):
              </p>
              <textarea
                rows={3}
                className="waiter-search-input"
                style={{ width: "100%", marginBottom: "14px", resize: "none" }}
                placeholder="e.g. Out of beef patties, grill breakdown, customer allergen issue..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className="kds-action-btn btn-undo"
                  onClick={() => setRejectOrder(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="kds-action-btn btn-reject"
                  disabled={actionBusy[rejectOrder._id]}
                  onClick={handleRejectOrder}
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: COMPLETED ORDERS TODAY */}
      {showHistoryModal && (
        <div className="kds-modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="kds-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="kds-modal-header">
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>
                Today's Completed Orders ({completedOrders.length})
              </h3>
              <button
                type="button"
                className="waiter-modal-close"
                onClick={() => setShowHistoryModal(false)}
              >
                &times;
              </button>
            </div>

            <div className="kds-modal-body">
              {completedOrders.length === 0 ? (
                <div className="kds-col-empty">No completed orders recorded today.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {completedOrders.map((ord) => (
                    <div
                      key={ord._id}
                      style={{
                        background: "#1a2333",
                        border: "1px solid #28354d",
                        padding: "12px 16px",
                        borderRadius: "8px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 800, color: "#ffffff" }}>{ord.orderId}</span>
                        <span style={{ fontSize: "0.78rem", color: "#34d399", fontWeight: 700 }}>
                          SERVED & COMPLETED
                        </span>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "4px" }}>
                        Type: {ord.type} &middot; Table: {ord.table?.number || "N/A"} &middot; Items:{" "}
                        {ord.items?.map((i) => `${i.quantity || i.qty}x ${i.name}`).join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
