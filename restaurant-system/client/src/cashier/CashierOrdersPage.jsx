import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cashierApi } from "./cashierApi";
import OrderModal from "./OrderModal";

function formatDate(isoStr) {
  if (!isoStr) return "-";
  const d = new Date(isoStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " · " + d.toLocaleDateString();
}

function StatusTag({ status }) {
  const map = {
    pending: { bg: "#fef3c7", color: "#92400e", label: "Pending" },
    preparing: { bg: "#dbeafe", color: "#1e40af", label: "Preparing" },
    ready: { bg: "#d1fae5", color: "#065f46", label: "Ready to Serve" },
    completed: { bg: "#f3f4f6", color: "#374151", label: "Completed" },
    cancelled: { bg: "#fee2e2", color: "#991b1b", label: "Cancelled" },
  };
  const cfg = map[status] || { bg: "#374151", color: "#fff", label: status };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 8px",
        borderRadius: "4px",
        fontSize: "0.72rem",
        fontWeight: 700,
        textTransform: "uppercase",
        background: cfg.bg,
        color: cfg.color,
      }}
    >
      {cfg.label}
    </span>
  );
}

function PaymentTag({ status }) {
  const isPaid = status === "paid";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 8px",
        borderRadius: "4px",
        fontSize: "0.72rem",
        fontWeight: 700,
        textTransform: "uppercase",
        background: isPaid ? "rgba(74, 222, 128, 0.15)" : "rgba(239, 68, 68, 0.15)",
        color: isPaid ? "#4ade80" : "#fca5a5",
        border: `1px solid ${isPaid ? "rgba(74, 222, 128, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
      }}
    >
      {isPaid ? "PAID" : "UNPAID"}
    </span>
  );
}

export default function CashierOrdersPage({
  title = "Orders",
  subtitle = "View and manage active restaurant orders.",
  fixed = {},
  availableFilters = ["search", "status", "paymentStatus", "type"],
  poll = false,
  newDineInBtn = false,
}) {
  const [filters, setFilters] = useState({
    status: "",
    paymentStatus: "",
    source: "",
    type: "",
    search: "",
  });
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const reqId = useRef(0);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }));
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const queryParams = useMemo(() => {
    const p = { ...fixed, page, limit: 15 };
    Object.entries(filters).forEach(([k, v]) => {
      if (v) p[k] = v;
    });
    return p;
  }, [fixed, filters, page]);

  const fetchOrders = useCallback(async (silent = false) => {
    const currentId = ++reqId.current;
    if (!silent) setLoading(true);
    try {
      const res = await cashierApi.getOrders(queryParams);
      if (currentId === reqId.current) {
        setData(res);
        setError("");
      }
    } catch (err) {
      if (currentId === reqId.current) {
        setError(err.message || "Failed to load orders.");
      }
    } finally {
      if (currentId === reqId.current) {
        setLoading(false);
      }
    }
  }, [queryParams]);

  useEffect(() => {
    fetchOrders(false);
  }, [fetchOrders]);

  // Polling for live orders
  useEffect(() => {
    if (!poll) return;
    const interval = setInterval(() => {
      if (!selectedOrder) {
        fetchOrders(true);
      }
    }, 12000);
    return () => clearInterval(interval);
  }, [poll, fetchOrders, selectedOrder]);

  const orders = data?.orders || [];
  const totalPages = data?.pages || 1;
  const totalCount = data?.total || 0;

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.6rem", color: "#f4ead5", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "1px" }}>
            {title}
          </h1>
          <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "rgba(244, 234, 213, 0.6)" }}>
            {subtitle} {poll && <span style={{ color: "#4ade80", marginLeft: "6px" }}>● Live updates active</span>}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => fetchOrders(false)}
            className="ap-btn"
            style={{ fontSize: "0.8rem", padding: "6px 12px" }}
          >
            Refresh
          </button>
          {newDineInBtn && (
            <button
              onClick={() => {
                window.history.pushState({}, "", "/cashier/pos?type=dine-in");
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
              className="ad-btn ad-btn--solid"
              style={{ fontSize: "0.8rem", padding: "6px 14px" }}
            >
              + New Dine-In Order
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          background: "#1f2622",
          border: "1px solid rgba(217, 164, 65, 0.15)",
          borderRadius: "8px",
          padding: "12px",
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "16px",
          alignItems: "center",
        }}
      >
        {availableFilters.includes("search") && (
          <div style={{ flex: "1 1 200px" }}>
            <input
              type="text"
              placeholder="Search #order, customer, phone..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="ap-input"
              style={{ fontSize: "0.82rem", padding: "6px 10px" }}
            />
          </div>
        )}

        {availableFilters.includes("status") && (
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, status: e.target.value }));
              setPage(1);
            }}
            className="ap-select"
            style={{ fontSize: "0.82rem", padding: "6px 10px", width: "auto" }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready to Serve</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        )}

        {availableFilters.includes("paymentStatus") && (
          <select
            value={filters.paymentStatus}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, paymentStatus: e.target.value }));
              setPage(1);
            }}
            className="ap-select"
            style={{ fontSize: "0.82rem", padding: "6px 10px", width: "auto" }}
          >
            <option value="">Paid & Unpaid</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
          </select>
        )}

        {availableFilters.includes("type") && (
          <select
            value={filters.type}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, type: e.target.value }));
              setPage(1);
            }}
            className="ap-select"
            style={{ fontSize: "0.82rem", padding: "6px 10px", width: "auto" }}
          >
            <option value="">All Order Types</option>
            <option value="dine-in">Dine-In</option>
            <option value="takeaway">Takeaway</option>
            <option value="delivery">Delivery</option>
          </select>
        )}
      </div>

      {/* Orders Table */}
      {loading && !data ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#d9a441" }}>Loading orders...</div>
      ) : error ? (
        <div style={{ padding: "16px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", borderRadius: "8px", color: "#fca5a5" }}>
          {error}{" "}
          <button onClick={() => fetchOrders(false)} style={{ background: "none", border: "none", color: "#f4ead5", textDecoration: "underline", cursor: "pointer", marginLeft: "8px" }}>
            Retry
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div style={{ background: "#1f2622", padding: "40px", textAlign: "center", borderRadius: "10px", color: "rgba(244, 234, 213, 0.6)" }}>
          <div style={{ fontSize: "1.2rem", color: "#f4ead5", marginBottom: "4px" }}>No orders found</div>
          <div style={{ fontSize: "0.82rem" }}>Orders will appear here as they are placed via website or POS.</div>
        </div>
      ) : (
        <div style={{ background: "#1f2622", border: "1px solid rgba(217, 164, 65, 0.15)", borderRadius: "10px", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ background: "#151a17", borderBottom: "1px solid rgba(217, 164, 65, 0.2)", color: "#d9a441" }}>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>ORDER #</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>DATE & TIME</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>TYPE</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>CUSTOMER</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>ITEMS</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700, textAlign: "right" }}>TOTAL</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>PAYMENT</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>STATUS</th>
                  <th style={{ padding: "12px 14px", textAlign: "right" }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const tableNumber = o.table?.number || o.table?.tableNumber;
                  const itemSummary = (o.items || []).map((it) => `${it.quantity}x ${it.name}`).join(", ");

                  return (
                    <tr
                      key={o._id}
                      onClick={() => setSelectedOrder(o)}
                      style={{
                        borderBottom: "1px solid rgba(217, 164, 65, 0.08)",
                        cursor: "pointer",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#262e2a")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "12px 14px", fontWeight: 700, color: "#f4ead5" }}>
                        #{o.orderNumber || o._id.slice(-6).toUpperCase()}
                        <div style={{ fontSize: "0.7rem", color: "rgba(244, 234, 213, 0.5)", fontWeight: 400 }}>
                          {o.source === "online" ? "Website" : "POS"}
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px", color: "rgba(244, 234, 213, 0.8)", whiteSpace: "nowrap" }}>
                        {formatDate(o.createdAt)}
                      </td>
                      <td style={{ padding: "12px 14px", color: "#f4ead5", textTransform: "capitalize" }}>
                        {o.type}
                        {tableNumber && (
                          <div style={{ fontSize: "0.72rem", color: "#d9a441", fontWeight: 700 }}>
                            Table {tableNumber}
                          </div>
                        )}
                        {o.billRequested && (
                          <span
                            style={{
                              display: "inline-block",
                              marginTop: "4px",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "0.68rem",
                              fontWeight: 800,
                              background: "rgba(139, 92, 246, 0.25)",
                              color: "#c084fc",
                              border: "1px solid #8b5cf6",
                              letterSpacing: "0.5px",
                            }}
                          >
                            BILL REQUESTED
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px", color: "#f4ead5" }}>
                        <div style={{ fontWeight: 600 }}>{o.customer?.name || "Guest"}</div>
                        {o.customer?.phone && (
                          <div style={{ fontSize: "0.72rem", color: "rgba(244, 234, 213, 0.5)" }}>
                            {o.customer.phone}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "rgba(244, 234, 213, 0.8)" }}>
                        {itemSummary || "-"}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 700, color: "#f4ead5", fontSize: "0.9rem" }}>
                        Rs. {o.total}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <PaymentTag status={o.paymentStatus} />
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <StatusTag status={o.status} />
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "right" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(o);
                          }}
                          className="ap-btn"
                          style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                        >
                          View Ticket
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "#151a17", borderTop: "1px solid rgba(217, 164, 65, 0.15)", fontSize: "0.8rem", color: "rgba(244, 234, 213, 0.7)" }}>
            <div>
              Showing {orders.length} of {totalCount} orders (Page {page} of {totalPages})
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="ap-btn"
                style={{ fontSize: "0.75rem", padding: "4px 10px", opacity: page <= 1 ? 0.4 : 1 }}
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="ap-btn"
                style={{ fontSize: "0.75rem", padding: "4px 10px", opacity: page >= totalPages ? 0.4 : 1 }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          onClose={() => {
            setSelectedOrder(null);
            fetchOrders(true);
          }}
          onChanged={(updated) => setSelectedOrder(updated)}
        />
      )}
    </div>
  );
}
