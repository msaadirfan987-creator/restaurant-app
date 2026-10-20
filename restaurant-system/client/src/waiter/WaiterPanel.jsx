import { useEffect, useState, useCallback, useRef } from "react";
import "./waiter.css";

export default function WaiterPanel({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("tables"); // "tables" | "my-orders"
  const [tables, setTables] = useState([]);
  const [readyOrders, setReadyOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal State for Order Taking / Editing
  const [activeTable, setActiveTable] = useState(null); // Table object
  const [guestCount, setGuestCount] = useState(2);
  const [tableNotes, setTableNotes] = useState("");
  const [cartItems, setCartItems] = useState([]); // Array of { id, name, price, qty, notes, isExisting, round }
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isSending, setIsSending] = useState(false);
  const [actionBusy, setActionBusy] = useState({});
  const [modalTab, setModalTab] = useState("menu"); // "menu" | "cart" for mobile

  // Audio alert on food ready
  const prevReadyCount = useRef(0);
  const playAlertSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3); // G5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start();
      osc.stop(ctx.currentTime + 0.65);
    } catch {
      // Audio autoplay policy
    }
  }, []);

  // Fetch waiter service data
  const fetchWaiterData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const res = await fetch("/api/panels/waiter", {
          credentials: "include",
          headers: { "X-Requested-With": "XMLHttpRequest" },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load waiter data.");

        setTables(data.tables || []);
        setReadyOrders(data.readyOrders || []);
        setMyOrders(data.myOrders || []);
        if (data.menu) setMenu(data.menu);
        if (data.categories) setCategories(data.categories);
        setError("");

        // Check for new ready orders to alert waiter
        if (silent && (data.readyOrders || []).length > prevReadyCount.current) {
          playAlertSound();
        }
        prevReadyCount.current = (data.readyOrders || []).length;
      } catch (err) {
        if (!silent) setError(err.message || "Could not connect to waiter service.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [playAlertSound]
  );

  useEffect(() => {
    fetchWaiterData(false);
    const interval = setInterval(() => fetchWaiterData(true), 8000);
    return () => clearInterval(interval);
  }, [fetchWaiterData]);

  // Open modal for a specific table
  const handleOpenTable = (tbl) => {
    setActiveTable(tbl);
    setSearchQuery("");
    setSelectedCategory("all");
    setModalTab("menu");

    if (tbl.activeOrder) {
      // Existing order: load items
      setGuestCount(tbl.activeOrder.guestCount || 2);
      setTableNotes(tbl.activeOrder.instructions || tbl.activeOrder.customer?.notes || "");
      const existing = (tbl.activeOrder.items || []).map((it, idx) => ({
        id: it.id || it.menuItem || `item-${idx}`,
        name: it.name,
        price: it.price,
        qty: it.quantity || it.qty || 1,
        notes: it.notes || "",
        isExisting: true,
        round: it.round || 1,
        orderId: tbl.activeOrder._id,
        itemIndex: idx,
      }));
      setCartItems(existing);
    } else {
      // New order
      setGuestCount(tbl.seats || 2);
      setTableNotes("");
      setCartItems([]);
    }
  };

  const handleCloseModal = () => {
    if (isSending) return;
    setActiveTable(null);
    setCartItems([]);
  };

  // Add item to cart
  const handleAddItem = (prod) => {
    setCartItems((prev) => {
      // Find if same product is already in the "new items" list
      const idx = prev.findIndex((it) => !it.isExisting && it.id === prod.id && !it.notes);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 };
        return copy;
      }
      return [
        ...prev,
        {
          id: prod.id,
          name: prod.name,
          price: prod.price,
          qty: 1,
          notes: "",
          isExisting: false,
          image: prod.images?.[0] || "",
        },
      ];
    });
  };

  // Modify quantity of new cart item
  const handleUpdateQty = (index, delta) => {
    setCartItems((prev) => {
      const copy = [...prev];
      const item = copy[index];
      if (item.isExisting) return prev; // Cannot change existing item quantity directly

      const newQty = item.qty + delta;
      if (newQty <= 0) {
        copy.splice(index, 1);
      } else {
        copy[index] = { ...item, qty: newQty };
      }
      return copy;
    });
  };

  // Update note on an item (e.g. no onion)
  const handleUpdateNote = (index, notes) => {
    setCartItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], notes };
      return copy;
    });
  };

  // Remove item (Strict rule: only if not yet preparing)
  const handleRemoveItem = async (item, index) => {
    if (!item.isExisting) {
      setCartItems((prev) => prev.filter((_, i) => i !== index));
      return;
    }

    // Existing item: check order status
    if (activeTable?.activeOrder?.status !== "pending") {
      alert("Kitchen has started preparing this order! Cannot remove item without Cashier or Admin approval.");
      return;
    }

    if (!confirm(`Are you sure you want to remove "${item.name}" from the order?`)) return;

    try {
      const res = await fetch(`/api/panels/waiter/order/${item.orderId}/item/${item.itemIndex}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to remove item.");

      // Refresh table data
      await fetchWaiterData(true);
      setCartItems((prev) => prev.filter((_, i) => i !== index));
    } catch (err) {
      alert(err.message || "Could not remove item.");
    }
  };

  // Send Order to Kitchen (with double-click protection)
  const handleSendToKitchen = async () => {
    if (isSending) return;

    const newItems = cartItems.filter((i) => !i.isExisting);
    if (newItems.length === 0) {
      alert("Please add at least one new item to send to the kitchen.");
      return;
    }

    setIsSending(true);

    try {
      const clientKey = `waiter-${activeTable._id}-${Date.now()}`;

      if (activeTable.activeOrder) {
        // Append items as new round:
        const res = await fetch(`/api/panels/waiter/order/${activeTable.activeOrder._id}/add-items`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({
            items: newItems,
            clientKey,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to send additional round to kitchen.");
      } else {
        // Create brand new order for table:
        const res = await fetch("/api/panels/waiter/order", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({
            tableId: activeTable._id,
            guestCount: Math.max(1, Number(guestCount) || 1),
            notes: tableNotes,
            items: newItems,
            clientKey,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to place order.");
      }

      await fetchWaiterData(true);
      handleCloseModal();
    } catch (err) {
      alert(err.message || "Could not send order to kitchen.");
    } finally {
      setIsSending(false);
    }
  };

  // Mark food as served
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
      if (!res.ok) throw new Error(data.message || "Failed to mark order as served.");

      await fetchWaiterData(true);
    } catch (err) {
      alert(err.message || "Could not mark order served.");
    } finally {
      setActionBusy((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  // Request Bill from Cashier
  const handleRequestBill = async (orderId) => {
    if (!confirm("Request bill for this table? Cashier will be notified to print invoice.")) return;
    setActionBusy((prev) => ({ ...prev, [orderId]: true }));
    try {
      const res = await fetch(`/api/panels/waiter/order/${orderId}/bill-request`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to request bill.");

      await fetchWaiterData(true);
      if (activeTable) handleCloseModal();
    } catch (err) {
      alert(err.message || "Could not request bill.");
    } finally {
      setActionBusy((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  // Filter menu items by search and category
  const filteredMenu = menu.filter((item) => {
    if (selectedCategory !== "all") {
      const catId = item.category?.id || item.category?._id || item.category;
      if (catId !== selectedCategory) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Calculate cart subtotal (new items + existing items)
  const cartSubtotal = cartItems.reduce((sum, it) => sum + it.price * it.qty, 0);
  const newItemsCount = cartItems.filter((i) => !i.isExisting).length;

  return (
    <div className="waiter-root">
      {/* Top Header */}
      <header className="waiter-header">
        <div className="waiter-brand">
          <span className="waiter-badge">WAITER TERMINAL</span>
          <div>
            <h1 className="waiter-title">Floor Service</h1>
            <div className="waiter-sub">
              Tables: {tables.length} &middot; Ready to Serve:{" "}
              <strong style={{ color: "#38bdf8" }}>{readyOrders.length}</strong>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="waiter-nav">
          <button
            type="button"
            className={`waiter-tab-btn ${activeTab === "tables" ? "active" : ""}`}
            onClick={() => setActiveTab("tables")}
          >
            Floor Tables ({tables.length})
          </button>
          <button
            type="button"
            className={`waiter-tab-btn ${activeTab === "my-orders" ? "active" : ""}`}
            onClick={() => setActiveTab("my-orders")}
          >
            My Orders Today ({myOrders.length})
          </button>
        </div>

        {/* User profile & Refresh */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            className="waiter-tab-btn"
            style={{ padding: "6px 12px", fontSize: "0.8rem" }}
            onClick={() => fetchWaiterData(false)}
          >
            Refresh
          </button>
          <div className="waiter-user-chip">
            <span className="waiter-avatar">{(user?.name || "W").charAt(0).toUpperCase()}</span>
            <span>{user?.name || "Floor Waiter"}</span>
          </div>
          <button type="button" className="waiter-btn-logout" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Food Ready Alert Banner */}
      {readyOrders.length > 0 && (
        <aside className="waiter-alert-banner" role="alert">
          <div className="waiter-alert-title">
            <span style={{ fontSize: "1.2rem" }}>&bull;</span>
            <span>
              <strong>{readyOrders.length} Order(s) Ready in Kitchen!</strong> Pick up and serve to table.
            </span>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {readyOrders.map((ord) => (
              <button
                key={ord._id}
                type="button"
                className="btn-table-action btn-table-serve"
                style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                disabled={actionBusy[ord._id]}
                onClick={() => handleMarkServed(ord._id)}
              >
                {actionBusy[ord._id]
                  ? "Serving..."
                  : `Serve Table ${ord.table?.number || "?"} (${ord.orderId})`}
              </button>
            ))}
          </div>
        </aside>
      )}

      {/* Main View Area */}
      <main className="waiter-content">
        {loading && tables.length === 0 ? (
          <div className="waiter-empty">Loading floor tables...</div>
        ) : error ? (
          <div className="waiter-empty" style={{ color: "#ef4444" }}>
            {error}
          </div>
        ) : activeTab === "tables" ? (
          /* TABLE VIEW */
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#ffffff" }}>
                All Restaurant Tables
              </h2>
              <div style={{ display: "flex", gap: "10px", fontSize: "0.78rem" }}>
                <span style={{ color: "#34d399" }}>&bull; Free</span>
                <span style={{ color: "#fbbf24" }}>&bull; Occupied</span>
                <span style={{ color: "#38bdf8" }}>&bull; Food Ready</span>
                <span style={{ color: "#c084fc" }}>&bull; Bill Requested</span>
              </div>
            </div>

            <div className="tables-grid">
              {tables.map((tbl) => {
                const statusClass = `status-${tbl.status}`;
                const hasReadyOrder = tbl.status === "food_ready";
                const isOccupied = tbl.status === "occupied" || hasReadyOrder || tbl.status === "bill_requested";

                return (
                  <div
                    key={tbl._id}
                    className={`table-card ${statusClass}`}
                    onClick={() => handleOpenTable(tbl)}
                  >
                    <div>
                      <div className="table-header">
                        <span className="table-num">Table {tbl.number}</span>
                        <span className="table-seats">{tbl.seats} Seats</span>
                      </div>

                      <div>
                        {tbl.status === "free" && <span className="table-badge-status badge-free">Free</span>}
                        {tbl.status === "occupied" && (
                          <span className="table-badge-status badge-occupied">Occupied</span>
                        )}
                        {tbl.status === "food_ready" && (
                          <span className="table-badge-status badge-ready">Food Ready</span>
                        )}
                        {tbl.status === "bill_requested" && (
                          <span className="table-badge-status badge-bill">Bill Requested</span>
                        )}
                      </div>

                      {tbl.activeOrder && (
                        <div className="table-order-info">
                          <div>
                            Order: <strong>{tbl.activeOrder.orderId}</strong>
                          </div>
                          <div>
                            Guests: {tbl.activeOrder.guestCount || 1} &middot; Rs.{" "}
                            {tbl.activeOrder.total?.toLocaleString() || 0}
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "4px" }}>
                            Status: <span style={{ textTransform: "capitalize" }}>{tbl.activeOrder.status}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="table-actions" onClick={(e) => e.stopPropagation()}>
                      {!isOccupied ? (
                        <button
                          type="button"
                          className="btn-table-action btn-table-order"
                          onClick={() => handleOpenTable(tbl)}
                        >
                          Take Order
                        </button>
                      ) : (
                        <>
                          {hasReadyOrder ? (
                            <button
                              type="button"
                              className="btn-table-action btn-table-serve"
                              disabled={actionBusy[tbl.activeOrder?._id]}
                              onClick={() => handleMarkServed(tbl.activeOrder?._id)}
                            >
                              Serve Food
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn-table-action btn-table-order"
                              onClick={() => handleOpenTable(tbl)}
                            >
                              + Add Items
                            </button>
                          )}

                          {!tbl.activeOrder?.billRequested && (
                            <button
                              type="button"
                              className="btn-table-action btn-table-bill"
                              disabled={actionBusy[tbl.activeOrder?._id]}
                              onClick={() => handleRequestBill(tbl.activeOrder?._id)}
                            >
                              Bill
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* MY ORDERS TODAY VIEW */
          <div>
            <h2 style={{ margin: "0 0 16px", fontSize: "1.1rem", fontWeight: 700, color: "#ffffff" }}>
              My Orders Taken Today ({myOrders.length})
            </h2>

            {myOrders.length === 0 ? (
              <div className="waiter-empty">You haven't placed any orders yet today.</div>
            ) : (
              <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
                {myOrders.map((ord) => (
                  <div
                    key={ord._id}
                    style={{
                      background: "#16203b",
                      border: "1px solid #233157",
                      borderRadius: "10px",
                      padding: "14px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 800, color: "#ffffff", fontSize: "0.95rem" }}>
                        {ord.orderId}
                      </span>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "4px",
                          textTransform: "uppercase",
                          background:
                            ord.status === "completed"
                              ? "rgba(16, 185, 129, 0.2)"
                              : ord.status === "ready"
                              ? "rgba(6, 182, 212, 0.2)"
                              : "rgba(245, 158, 11, 0.2)",
                          color:
                            ord.status === "completed"
                              ? "#34d399"
                              : ord.status === "ready"
                              ? "#38bdf8"
                              : "#fbbf24",
                        }}
                      >
                        {ord.status}
                      </span>
                    </div>

                    <div style={{ fontSize: "0.82rem", color: "#94a3b8", marginTop: "8px" }}>
                      Table: <strong>{ord.table?.number || "N/A"}</strong> &middot; Guests:{" "}
                      {ord.guestCount || 1} &middot; Items: {ord.items?.length || 0}
                    </div>

                    <div style={{ marginTop: "10px", borderTop: "1px solid #233157", paddingTop: "8px", display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>Total:</span>
                      <strong style={{ color: "#38bdf8" }}>Rs. {ord.total?.toLocaleString()}</strong>
                    </div>

                    {ord.status === "ready" && (
                      <button
                        type="button"
                        className="btn-table-action btn-table-serve"
                        style={{ width: "100%", marginTop: "10px" }}
                        disabled={actionBusy[ord._id]}
                        onClick={() => handleMarkServed(ord._id)}
                      >
                        {actionBusy[ord._id] ? "Serving..." : "Mark as Served"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL: ORDER TAKING / ADDING ITEMS */}
      {activeTable && (
        <div className="waiter-modal-overlay" onClick={handleCloseModal}>
          <div className="waiter-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="waiter-modal-header">
              <div>
                <h3 className="waiter-modal-title">
                  Table {activeTable.number} &mdash;{" "}
                  {activeTable.activeOrder ? "Add Items / Round" : "New Table Order"}
                </h3>
                <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                  Capacity: {activeTable.seats} Seats &middot; Status: {activeTable.status}
                </span>
              </div>
              <button type="button" className="waiter-modal-close" onClick={handleCloseModal}>
                &times;
              </button>
            </div>

            {/* Mobile Tab Switcher */}
            <div className="waiter-modal-mobile-tabs">
              <button
                type="button"
                className={`waiter-modal-tab-btn ${modalTab === "menu" ? "active" : ""}`}
                onClick={() => setModalTab("menu")}
              >
                Browse Menu
              </button>
              <button
                type="button"
                className={`waiter-modal-tab-btn ${modalTab === "cart" ? "active" : ""}`}
                onClick={() => setModalTab("cart")}
              >
                Order Ticket ({cartItems.length})
              </button>
            </div>

            <div className="waiter-modal-body">
              {/* Left Column: Menu Catalog & Search */}
              <div className={`waiter-catalog-side ${modalTab !== "menu" ? "hide-on-mobile" : ""}`}>
                {/* Search */}
                <div className="waiter-search-bar">
                  <input
                    type="text"
                    className="waiter-search-input"
                    placeholder="Search food, burger, sides, drinks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Categories */}
                <div className="waiter-categories">
                  <button
                    type="button"
                    className={`waiter-cat-pill ${selectedCategory === "all" ? "active" : ""}`}
                    onClick={() => setSelectedCategory("all")}
                  >
                    All Items
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c._id}
                      type="button"
                      className={`waiter-cat-pill ${selectedCategory === c._id ? "active" : ""}`}
                      onClick={() => setSelectedCategory(c._id)}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>

                {/* Items Grid */}
                <div className="waiter-items-grid">
                  {filteredMenu.map((prod) => (
                    <div
                      key={prod.id || prod._id}
                      className="waiter-item-card"
                      onClick={() => handleAddItem(prod)}
                    >
                      <div className="waiter-item-name">{prod.name}</div>
                      <div className="waiter-item-price">Rs. {prod.price?.toLocaleString()}</div>
                    </div>
                  ))}
                  {filteredMenu.length === 0 && (
                    <div style={{ gridColumn: "1 / -1", textAlign: "center", color: "#64748b", padding: "20px" }}>
                      No items found.
                    </div>
                  )}
                </div>

                {cartItems.length > 0 && (
                  <div style={{ marginTop: "12px" }}>
                    <button
                      type="button"
                      className="btn-send-kitchen"
                      style={{ padding: "10px", fontSize: "0.85rem", width: "100%" }}
                      onClick={() => setModalTab("cart")}
                    >
                      View Ticket ({cartItems.length} items &middot; Rs. {cartSubtotal.toLocaleString()}) &rarr;
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: Ticket / Cart */}
              <div className={`waiter-cart-side ${modalTab !== "cart" ? "hide-on-mobile" : ""}`}>
                <div>
                  <div className="cart-section-title">
                    <span>Order Ticket</span>
                    {activeTable.activeOrder && (
                      <span style={{ fontSize: "0.75rem", color: "#38bdf8" }}>
                        {activeTable.activeOrder.orderId}
                      </span>
                    )}
                  </div>

                  {/* Guests count */}
                  <div className="guest-input-row">
                    <span style={{ fontSize: "0.82rem", color: "#94a3b8" }}>Guests:</span>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      disabled={!!activeTable.activeOrder}
                      value={guestCount}
                      onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      style={{
                        width: "60px",
                        background: "#0f172a",
                        border: "1px solid #334155",
                        color: "#fff",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        textAlign: "center",
                      }}
                    />
                    <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                      (Max seats: {activeTable.seats})
                    </span>
                  </div>

                  {/* Cart Items List */}
                  <div className="cart-items-list">
                    {cartItems.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "20px", color: "#64748b", fontSize: "0.85rem" }}>
                        Select items from menu to add.
                      </div>
                    ) : (
                      cartItems.map((item, idx) => (
                        <div key={`${item.id}-${idx}`} className="cart-item-row">
                          <div className="cart-item-header">
                            <div>
                              <span className="cart-item-name">{item.name}</span>
                              {item.round && (
                                <span
                                  className={`round-badge ${!item.isExisting ? "new" : ""}`}
                                  style={{ marginLeft: "6px" }}
                                >
                                  Round {item.round} {!item.isExisting && "(NEW)"}
                                </span>
                              )}
                            </div>
                            <span style={{ fontWeight: 700, fontSize: "0.82rem", color: "#38bdf8" }}>
                              Rs. {(item.price * item.qty).toLocaleString()}
                            </span>
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            {/* Quantity Controls */}
                            {!item.isExisting ? (
                              <div className="cart-qty-ctrls">
                                <button
                                  type="button"
                                  className="cart-qty-btn"
                                  onClick={() => handleUpdateQty(idx, -1)}
                                >
                                  -
                                </button>
                                <span style={{ fontSize: "0.85rem", fontWeight: 700, padding: "0 4px" }}>
                                  {item.qty}
                                </span>
                                <button
                                  type="button"
                                  className="cart-qty-btn"
                                  onClick={() => handleUpdateQty(idx, 1)}
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                                Qty: <strong>{item.qty}</strong> (Locked)
                              </span>
                            )}

                            {/* Remove item button */}
                            {(!item.isExisting || activeTable.activeOrder?.status === "pending") ? (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item, idx)}
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: "#ef4444",
                                  cursor: "pointer",
                                  fontSize: "0.75rem",
                                }}
                              >
                                Remove
                              </button>
                            ) : (
                              <span style={{ fontSize: "0.7rem", color: "#eab308" }}>
                                Preparing
                              </span>
                            )}
                          </div>

                          {/* Notes (no onion, spicy, allergy) */}
                          {!item.isExisting ? (
                            <input
                              type="text"
                              className="cart-item-note-input"
                              placeholder="Notes: no onion, spicy, allergy..."
                              value={item.notes || ""}
                              onChange={(e) => handleUpdateNote(idx, e.target.value)}
                            />
                          ) : (
                            item.notes && (
                              <div style={{ fontSize: "0.72rem", color: "#fbbf24", background: "rgba(245, 158, 11, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                                Note: {item.notes}
                              </div>
                            )
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Cart Footer */}
                <div className="cart-footer">
                  <div className="cart-total-row">
                    <span>Total Bill:</span>
                    <span>Rs. {cartSubtotal.toLocaleString()}</span>
                  </div>

                  <button
                    type="button"
                    className="btn-send-kitchen"
                    disabled={isSending || newItemsCount === 0}
                    onClick={handleSendToKitchen}
                  >
                    {isSending
                      ? "Sending to Kitchen..."
                      : activeTable.activeOrder
                      ? `Send Round (${newItemsCount} new items)`
                      : `Send to Kitchen (${newItemsCount} items)`}
                  </button>

                  {activeTable.activeOrder && !activeTable.activeOrder.billRequested && (
                    <button
                      type="button"
                      className="btn-table-action btn-table-bill"
                      style={{ width: "100%", marginTop: "8px" }}
                      onClick={() => handleRequestBill(activeTable.activeOrder._id)}
                    >
                      Request Bill from Cashier
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
