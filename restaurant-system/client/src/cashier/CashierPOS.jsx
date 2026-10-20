import { useCallback, useEffect, useMemo, useState } from "react";
import { cashierApi } from "./cashierApi";
import ReceiptModal from "./ReceiptModal";

function genClientKey() {
  return "pos_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 9);
}

export default function CashierPOS() {
  const [menu, setMenu] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]); // [{ id, name, price, quantity }]
  const [type, setType] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      return p.get("type") === "dine-in" ? "dine-in" : "takeaway";
    } catch {
      return "takeaway";
    }
  });
  const [selectedTable, setSelectedTable] = useState("");
  const [customer, setCustomer] = useState({ name: "", phone: "" });

  const [discountType, setDiscountType] = useState("none");
  const [discountValue, setDiscountValue] = useState("");
  const [payNow, setPayNow] = useState(true);
  const [amountReceived, setAmountReceived] = useState("");

  const [clientKey, setClientKey] = useState(genClientKey);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [completedOrder, setCompletedOrder] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [menuRes, tablesRes] = await Promise.all([
        cashierApi.getMenu(),
        cashierApi.getTables(),
      ]);
      const items = Array.isArray(menuRes)
        ? menuRes
        : menuRes.products || menuRes.items || [];
      const tbls = Array.isArray(tablesRes)
        ? tablesRes
        : tablesRes.tables || [];
      setMenu(items);
      setTables(tbls);
    } catch (err) {
      setLoadError(err.message || "Failed to load POS data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const categories = useMemo(() => {
    const set = new Set();
    menu.forEach((i) => {
      const cat = typeof i.category === "object" ? i.category?.name : i.category;
      if (cat) set.add(cat);
    });
    return ["All", ...Array.from(set)];
  }, [menu]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return menu.filter((item) => {
      const cat = typeof item.category === "object" ? item.category?.name : item.category;
      const matchCat = activeCategory === "All" || cat === activeCategory;
      const matchSearch = !q || item.name.toLowerCase().includes(q);
      return matchCat && matchSearch && item.isAvailable !== false;
    });
  }, [menu, activeCategory, search]);

  const addToCart = (item) => {
    const itemPrice = item.discountPrice != null ? item.discountPrice : item.price;
    setCart((prev) => {
      const exists = prev.find((l) => l.id === item._id);
      if (exists) {
        return prev.map((l) =>
          l.id === item._id ? { ...l, quantity: Math.min(50, l.quantity + 1) } : l
        );
      }
      return [
        ...prev,
        {
          id: item._id,
          name: item.name,
          price: itemPrice,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((l) => (l.id === id ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0 && l.quantity <= 50)
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((l) => l.id !== id));
  };

  // Preview Totals
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const discount = useMemo(() => {
    const val = Number(discountValue) || 0;
    if (val <= 0 || discountType === "none") return 0;
    if (discountType === "percent") {
      const pct = Math.min(50, Math.max(0, val));
      return Math.round((subtotal * pct) / 100);
    }
    if (discountType === "amount") {
      return Math.min(subtotal, val);
    }
    return 0;
  }, [subtotal, discountType, discountValue]);

  const tax = useMemo(() => {
    // 5% standard sales tax on discounted subtotal
    const base = Math.max(0, subtotal - discount);
    return Math.round(base * 0.05);
  }, [subtotal, discount]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discount + tax);
  }, [subtotal, discount, tax]);

  const changeDue = useMemo(() => {
    const rec = Number(amountReceived) || 0;
    return rec - total;
  }, [amountReceived, total]);

  const resetForm = () => {
    setCart([]);
    setSelectedTable("");
    setCustomer({ name: "", phone: "" });
    setDiscountType("none");
    setDiscountValue("");
    setPayNow(true);
    setAmountReceived("");
    setClientKey(genClientKey());
    setSubmitError("");
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (cart.length === 0) {
      setSubmitError("Please add at least one item to the cart.");
      return;
    }
    if (type === "dine-in" && !selectedTable) {
      setSubmitError("Please select a table for Dine-in orders.");
      return;
    }
    if (type === "takeaway" && !customer.name.trim()) {
      setSubmitError("Please provide a customer name for takeaway.");
      return;
    }
    if (payNow && (Number(amountReceived) || 0) < total) {
      setSubmitError(`Cash received (Rs. ${amountReceived || 0}) must be at least total Rs. ${total}.`);
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const payload = {
        clientKey,
        type,
        table: type === "dine-in" ? selectedTable : undefined,
        customer: {
          name: customer.name.trim() || (type === "dine-in" ? "Dine-In Customer" : "Walk-in Guest"),
          phone: customer.phone.trim(),
        },
        items: cart.map((i) => ({
          menuItem: i.id,
          quantity: i.quantity,
        })),
        discountType,
        discountValue: Number(discountValue) || 0,
        payNow,
        amountReceived: payNow ? Number(amountReceived) : undefined,
      };

      const res = await cashierApi.createOrder(payload);
      const created = res.order;
      setCompletedOrder(created);
      resetForm();
      cashierApi.getTables().then((r) => setTables(r.tables || [])).catch(() => {});
    } catch (err) {
      setSubmitError(err.message || "Failed to create order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "20px", alignItems: "start" }}>
      {/* LEFT: Menu & Catalog */}
      <div>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.5rem", color: "#f4ead5", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "1px" }}>
              POINT OF SALE
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "rgba(244, 234, 213, 0.6)" }}>
              Tap items to add to order. Prices are verified securely from the database.
            </p>
          </div>
          <div style={{ width: "240px" }}>
            <input
              type="text"
              placeholder="Search burgers, drinks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ap-input"
              style={{ fontSize: "0.85rem", padding: "8px 12px" }}
            />
          </div>
        </div>

        {/* Categories Chips */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "10px", marginBottom: "16px" }}>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              style={{
                background: activeCategory === c ? "#d9a441" : "#1f2622",
                color: activeCategory === c ? "#151a17" : "#f4ead5",
                border: "1px solid " + (activeCategory === c ? "#d9a441" : "rgba(217, 164, 65, 0.2)"),
                borderRadius: "20px",
                padding: "6px 14px",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#d9a441" }}>Loading menu catalog...</div>
        ) : loadError ? (
          <div style={{ padding: "16px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", borderRadius: "8px", color: "#fca5a5" }}>
            {loadError}{" "}
            <button onClick={loadData} style={{ background: "none", border: "underline", color: "#f4ead5", cursor: "pointer", marginLeft: "8px" }}>
              Retry
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", background: "#1f2622", borderRadius: "10px", color: "rgba(244, 234, 213, 0.6)" }}>
            No items match your filter.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px" }}>
            {filteredItems.map((item) => {
              const displayPrice = item.discountPrice != null ? item.discountPrice : item.price;
              const hasDiscount = item.discountPrice != null && item.discountPrice < item.price;
              const catName = typeof item.category === "object" ? item.category?.name : item.category;

              return (
                <div
                  key={item._id}
                  onClick={() => addToCart(item)}
                  style={{
                    background: "#1f2622",
                    border: "1px solid rgba(217, 164, 65, 0.15)",
                    borderRadius: "10px",
                    overflow: "hidden",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.15s ease, border-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#d9a441";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(217, 164, 65, 0.15)";
                    e.currentTarget.style.transform = "none";
                  }}
                >
                  {item.image && (
                    <div style={{ height: "110px", overflow: "hidden", background: "#151a17" }}>
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => (e.target.style.display = "none")}
                      />
                    </div>
                  )}
                  <div style={{ padding: "10px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: "0.72rem", color: "#d9a441", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        {catName || "Dish"}
                      </div>
                      <div style={{ fontWeight: 600, color: "#f4ead5", fontSize: "0.9rem", marginTop: "2px", lineHeight: "1.2" }}>
                        {item.name}
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                      <div>
                        <span style={{ fontWeight: 700, color: "#f4ead5", fontSize: "0.95rem" }}>
                          Rs. {displayPrice}
                        </span>
                        {hasDiscount && (
                          <span style={{ fontSize: "0.75rem", textDecoration: "line-through", color: "rgba(244, 234, 213, 0.4)", marginLeft: "4px" }}>
                            Rs. {item.price}
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          background: "#d9a441",
                          color: "#151a17",
                          borderRadius: "4px",
                          padding: "2px 8px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                        }}
                      >
                        + Add
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT: Cart & Checkout Drawer */}
      <div
        style={{
          background: "#1f2622",
          border: "1px solid rgba(217, 164, 65, 0.2)",
          borderRadius: "12px",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(217, 164, 65, 0.15)", paddingBottom: "10px" }}>
          <h2 style={{ margin: 0, fontSize: "1.1rem", color: "#f4ead5", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.5px" }}>
            ORDER TICKET ({cart.length})
          </h2>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "0.75rem" }}
            >
              Clear Cart
            </button>
          )}
        </div>

        {/* Order Type Switch */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", background: "#151a17", padding: "4px", borderRadius: "8px" }}>
          <button
            type="button"
            onClick={() => setType("takeaway")}
            style={{
              background: type === "takeaway" ? "#d9a441" : "transparent",
              color: type === "takeaway" ? "#151a17" : "#f4ead5",
              border: "none",
              borderRadius: "6px",
              padding: "7px 0",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer",
            }}
          >
            Takeaway
          </button>
          <button
            type="button"
            onClick={() => setType("dine-in")}
            style={{
              background: type === "dine-in" ? "#d9a441" : "transparent",
              color: type === "dine-in" ? "#151a17" : "#f4ead5",
              border: "none",
              borderRadius: "6px",
              padding: "7px 0",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer",
            }}
          >
            Dine-In
          </button>
        </div>

        {/* Dine-In Table Picker */}
        {type === "dine-in" && (
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", color: "#d9a441", marginBottom: "4px", fontWeight: 600 }}>
              Select Table *
            </label>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="ap-select"
              style={{ fontSize: "0.85rem", padding: "7px 10px" }}
            >
              <option value="">-- Choose Dine-in Table --</option>
              {tables.map((tbl) => (
                <option key={tbl._id} value={tbl._id}>
                  Table {tbl.number || tbl.tableNumber} ({tbl.seats || tbl.capacity} seats) {tbl.status === "occupied" ? "[Occupied]" : "[Available]"}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Customer Information */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <div>
            <input
              type="text"
              placeholder={type === "takeaway" ? "Guest Name *" : "Guest Name"}
              value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              className="ap-input"
              style={{ fontSize: "0.8rem", padding: "6px 8px" }}
            />
          </div>
          <div>
            <input
              type="tel"
              placeholder="Mobile Phone"
              value={customer.phone}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              className="ap-input"
              style={{ fontSize: "0.8rem", padding: "6px 8px" }}
            />
          </div>
        </div>

        {/* Cart Item Lines */}
        <div style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid rgba(217, 164, 65, 0.1)", paddingTop: "8px" }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "rgba(244, 234, 213, 0.4)", fontSize: "0.82rem" }}>
              Cart is empty. Tap items to build ticket.
            </div>
          ) : (
            cart.map((line) => (
              <div
                key={line.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#151a17",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  fontSize: "0.82rem",
                }}
              >
                <div style={{ flex: 1, minWidth: 0, paddingRight: "8px" }}>
                  <div style={{ color: "#f4ead5", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {line.name}
                  </div>
                  <div style={{ color: "rgba(244, 234, 213, 0.5)", fontSize: "0.75rem" }}>
                    Rs. {line.price} &times; {line.quantity} = <strong style={{ color: "#d9a441" }}>Rs. {line.price * line.quantity}</strong>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <button
                    onClick={() => updateQuantity(line.id, -1)}
                    style={{ background: "#2a332e", border: "none", color: "#f4ead5", width: "22px", height: "22px", borderRadius: "3px", cursor: "pointer", fontWeight: "bold" }}
                  >
                    -
                  </button>
                  <span style={{ fontWeight: 700, color: "#f4ead5", minWidth: "16px", textAlign: "center" }}>
                    {line.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(line.id, 1)}
                    style={{ background: "#2a332e", border: "none", color: "#f4ead5", width: "22px", height: "22px", borderRadius: "3px", cursor: "pointer", fontWeight: "bold" }}
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeFromCart(line.id)}
                    style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", marginLeft: "4px", fontSize: "0.9rem" }}
                    title="Remove item"
                  >
                    &times;
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Discount & Tax Options */}
        <div style={{ background: "#151a17", padding: "10px", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            <select
              value={discountType}
              onChange={(e) => {
                setDiscountType(e.target.value);
                setDiscountValue("");
              }}
              className="ap-select"
              style={{ fontSize: "0.78rem", padding: "5px 6px" }}
            >
              <option value="none">No Discount</option>
              <option value="percent">Discount %</option>
              <option value="amount">Discount Rs.</option>
            </select>
            {discountType !== "none" ? (
              <input
                type="number"
                min="0"
                step="1"
                placeholder={discountType === "percent" ? "e.g. 10%" : "Rs. off"}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="ap-input"
                style={{ fontSize: "0.78rem", padding: "5px 6px" }}
              />
            ) : (
              <div style={{ fontSize: "0.75rem", color: "rgba(244, 234, 213, 0.4)", alignSelf: "center", textAlign: "right" }}>
                0% applied
              </div>
            )}
          </div>
        </div>

        {/* Summary Breakdown */}
        <div style={{ borderTop: "1px dashed rgba(217, 164, 65, 0.2)", paddingTop: "8px", display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.82rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(244, 234, 213, 0.7)" }}>
            <span>Subtotal</span>
            <span>Rs. {subtotal}</span>
          </div>
          {discount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", color: "#4ade80" }}>
              <span>Discount</span>
              <span>- Rs. {discount}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(244, 234, 213, 0.7)" }}>
            <span>GST / Tax (5%)</span>
            <span>Rs. {tax}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#f4ead5", fontWeight: 700, fontSize: "1.1rem", marginTop: "4px", borderTop: "1px solid rgba(217, 164, 65, 0.3)", paddingTop: "4px" }}>
            <span>TOTAL DUE</span>
            <span style={{ color: "#d9a441" }}>Rs. {total}</span>
          </div>
        </div>

        {/* Immediate Payment Option */}
        <div style={{ background: "#151a17", padding: "10px", borderRadius: "8px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.82rem", color: "#f4ead5", fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={payNow}
              onChange={(e) => {
                setPayNow(e.target.checked);
                if (e.target.checked && !amountReceived) {
                  setAmountReceived(String(total));
                }
              }}
            />
            Collect Cash Payment Now
          </label>

          {payNow && (
            <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="number"
                  min={total}
                  placeholder="Cash Received"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  className="ap-input"
                  style={{ fontSize: "0.85rem", padding: "6px 8px", flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => setAmountReceived(String(total))}
                  style={{ background: "#2a332e", border: "1px solid rgba(217, 164, 65, 0.2)", color: "#f4ead5", padding: "0 8px", borderRadius: "4px", fontSize: "0.75rem", cursor: "pointer" }}
                >
                  Exact
                </button>
              </div>

              {/* Quick Cash Presets */}
              <div style={{ display: "flex", gap: "4px" }}>
                {[500, 1000, 2000, 5000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmountReceived(String(preset))}
                    style={{
                      flex: 1,
                      background: Number(amountReceived) === preset ? "#d9a441" : "#1f2622",
                      color: Number(amountReceived) === preset ? "#151a17" : "#f4ead5",
                      border: "1px solid rgba(217, 164, 65, 0.2)",
                      borderRadius: "4px",
                      padding: "4px 0",
                      fontSize: "0.7rem",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem", marginTop: "2px" }}>
                <span style={{ color: "rgba(244, 234, 213, 0.7)" }}>Change to return:</span>
                <strong style={{ color: changeDue >= 0 ? "#4ade80" : "#f87171" }}>
                  {changeDue >= 0 ? `Rs. ${changeDue}` : `Underpaid by Rs. ${Math.abs(changeDue)}`}
                </strong>
              </div>
            </div>
          )}
        </div>

        {submitError && (
          <div style={{ padding: "8px 10px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", borderRadius: "6px", color: "#fca5a5", fontSize: "0.8rem" }}>
            {submitError}
          </div>
        )}

        {/* Place Order Button */}
        <button
          type="button"
          onClick={handleCheckout}
          disabled={submitting || cart.length === 0}
          className="ap-btn primary"
          style={{
            padding: "12px",
            fontSize: "0.95rem",
            letterSpacing: "0.5px",
            opacity: submitting || cart.length === 0 ? 0.6 : 1,
            cursor: submitting || cart.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Placing Order..." : payNow ? `Pay Rs. ${total} & Print Receipt` : "Save Unpaid Order"}
        </button>
      </div>

      {/* Thermal Receipt Preview Modal */}
      {completedOrder && (
        <ReceiptModal
          order={completedOrder}
          onClose={() => setCompletedOrder(null)}
        />
      )}
    </div>
  );
}
