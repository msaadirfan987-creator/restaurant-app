import { useState } from "react";
import { cashierApi } from "./cashierApi";
import ReceiptModal from "./ReceiptModal";

export default function OrderModal({ order: initial, onClose, onChanged }) {
  const [order, setOrder] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [showPay, setShowPay] = useState(false);
  const [received, setReceived] = useState(String(initial.total));
  const [showCancel, setShowCancel] = useState(false);
  const [reason, setReason] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);

  const act = async (fn) => {
    if (busy) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fn();
      const updated = res.order || res;
      setOrder(updated);
      onChanged?.(updated);
      setShowPay(false);
      setShowCancel(false);
    } catch (e) {
      setErr(e.message || "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  const setStatus = (status, rsn) =>
    act(() => cashierApi.updateStatus(order._id || order.id, status, rsn));

  const pay = () =>
    act(() => cashierApi.recordPayment(order._id || order.id, Number(received)));

  const change = Number(received) - order.total;
  const open = ["pending", "preparing", "ready"].includes(order.status);
  const canPay = order.paymentStatus === "unpaid" && order.status !== "cancelled";
  const canCancel = open && order.paymentStatus === "unpaid";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "#1b211e",
          border: "1px solid rgba(244, 234, 213, 0.15)",
          borderRadius: "14px",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 48px rgba(0,0,0,0.6)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 24px",
            borderBottom: "1px solid rgba(244, 234, 213, 0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#f4ead5" }}>
              Order #{order.orderNumber || order.orderId}
            </h2>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                padding: "2px 8px",
                borderRadius: 4,
                background: order.source === "online" ? "rgba(52, 152, 219, 0.2)" : "rgba(155, 89, 182, 0.2)",
                color: order.source === "online" ? "#3498db" : "#9b59b6",
              }}
            >
              {order.source === "online" ? "Website" : "POS"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: 0,
              color: "rgba(244, 234, 213, 0.6)",
              fontSize: "20px",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
          {err && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                background: "rgba(240, 144, 127, 0.15)",
                border: "1px solid #f0907f",
                color: "#f0907f",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {err}
            </div>
          )}

          {/* Badges and Type */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: "capitalize",
                padding: "3px 10px",
                borderRadius: 6,
                background:
                  order.status === "completed" || order.status === "delivered"
                    ? "rgba(46, 204, 113, 0.2)"
                    : order.status === "cancelled"
                    ? "rgba(231, 76, 60, 0.2)"
                    : "rgba(217, 164, 65, 0.2)",
                color:
                  order.status === "completed" || order.status === "delivered"
                    ? "#2ecc71"
                    : order.status === "cancelled"
                    ? "#e74c3c"
                    : "#d9a441",
              }}
            >
              Status: {order.status?.replace("_", " ")}
            </span>

            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                padding: "3px 10px",
                borderRadius: 6,
                background: order.paymentStatus === "paid" ? "rgba(46, 204, 113, 0.2)" : "rgba(231, 76, 60, 0.2)",
                color: order.paymentStatus === "paid" ? "#2ecc71" : "#e74c3c",
              }}
            >
              Payment: {order.paymentStatus}
            </span>

            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "rgba(244, 234, 213, 0.7)",
                textTransform: "capitalize",
              }}
            >
              {order.type} {order.table ? `(Table ${order.table.number || order.table.tableNumber})` : ""}
            </span>
          </div>

          {/* Customer Details */}
          {(order.customer?.name || order.customerName) && (
            <div
              style={{
                background: "rgba(0,0,0,0.2)",
                borderRadius: 8,
                padding: "14px 18px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                fontSize: 13,
              }}
            >
              <div>
                <span style={{ color: "rgba(244, 234, 213, 0.55)", display: "block" }}>Customer</span>
                <strong style={{ color: "#f4ead5" }}>{order.customer?.name || order.customerName}</strong>
              </div>
              <div>
                <span style={{ color: "rgba(244, 234, 213, 0.55)", display: "block" }}>Phone</span>
                <strong style={{ color: "#f4ead5" }}>{order.customer?.phone || order.phone}</strong>
              </div>
              {(order.customer?.address || order.address) && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <span style={{ color: "rgba(244, 234, 213, 0.55)", display: "block" }}>Address</span>
                  <div style={{ color: "#f4ead5", marginTop: 2 }}>{order.customer?.address || order.address}</div>
                </div>
              )}
              {(order.customer?.notes || order.instructions) && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <span style={{ color: "rgba(244, 234, 213, 0.55)", display: "block" }}>Special Note</span>
                  <div style={{ color: "#d9a441", marginTop: 2 }}>{order.customer?.notes || order.instructions}</div>
                </div>
              )}
            </div>
          )}

          {/* Items Table */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(244, 234, 213, 0.1)" }}>
                <th style={{ textAlign: "left", padding: "6px 0", color: "rgba(244, 234, 213, 0.6)" }}>Item</th>
                <th style={{ textAlign: "center", padding: "6px 0", color: "rgba(244, 234, 213, 0.6)" }}>Qty</th>
                <th style={{ textAlign: "right", padding: "6px 0", color: "rgba(244, 234, 213, 0.6)" }}>Price</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((it, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid rgba(244, 234, 213, 0.05)" }}>
                  <td style={{ padding: "8px 0", color: "#f4ead5" }}>{it.name}</td>
                  <td style={{ textAlign: "center", padding: "8px 0", color: "rgba(244, 234, 213, 0.8)" }}>
                    {it.quantity || it.qty}
                  </td>
                  <td style={{ textAlign: "right", padding: "8px 0", color: "#f4ead5", fontWeight: 600 }}>
                    Rs. {it.price * (it.quantity || it.qty)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} style={{ paddingTop: 10, color: "rgba(244, 234, 213, 0.6)" }}>Subtotal</td>
                <td style={{ paddingTop: 10, textAlign: "right", color: "#f4ead5" }}>Rs. {order.subtotal}</td>
              </tr>
              {order.discount > 0 && (
                <tr>
                  <td colSpan={2} style={{ color: "rgba(244, 234, 213, 0.6)" }}>Discount</td>
                  <td style={{ textAlign: "right", color: "#f0907f" }}>- Rs. {order.discount}</td>
                </tr>
              )}
              {order.tax > 0 && (
                <tr>
                  <td colSpan={2} style={{ color: "rgba(244, 234, 213, 0.6)" }}>Tax</td>
                  <td style={{ textAlign: "right", color: "#f4ead5" }}>Rs. {order.tax}</td>
                </tr>
              )}
              <tr style={{ fontSize: 16, fontWeight: 800 }}>
                <td colSpan={2} style={{ paddingTop: 10, color: "#f4ead5" }}>Total Amount</td>
                <td style={{ paddingTop: 10, textAlign: "right", color: "#d9a441" }}>Rs. {order.total}</td>
              </tr>
            </tfoot>
          </table>

          {order.paymentStatus === "paid" && order.amountReceived && (
            <div style={{ fontSize: 12, color: "rgba(244, 234, 213, 0.6)" }}>
              Cash Received: Rs. {order.amountReceived} &middot; Change Due: Rs. {order.changeGiven || 0}
            </div>
          )}

          {/* Cash Payment Drawer */}
          {showPay && (
            <div
              style={{
                background: "rgba(0,0,0,0.3)",
                border: "1px solid #d9a441",
                borderRadius: 8,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <label style={{ fontSize: 13, fontWeight: 700, color: "#f4ead5" }}>
                Cash Received (Rs.)
                <input
                  type="number"
                  min={order.total}
                  className="ap-input"
                  style={{ marginTop: 6 }}
                  value={received}
                  onChange={(e) => setReceived(e.target.value)}
                  autoFocus
                />
              </label>

              <div style={{ fontSize: 14, color: "#f4ead5" }}>
                Change Due:{" "}
                <strong style={{ color: change >= 0 ? "#2ecc71" : "#f0907f" }}>
                  {change >= 0 ? `Rs. ${change}` : "Insufficient Cash"}
                </strong>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className="ad-btn ad-btn--ghost"
                  onClick={() => setShowPay(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="ad-btn ad-btn--solid"
                  disabled={busy || change < 0}
                  onClick={pay}
                >
                  {busy ? "Saving..." : "Confirm Cash Payment"}
                </button>
              </div>
            </div>
          )}

          {/* Cancel Order Form */}
          {showCancel && (
            <div
              style={{
                background: "rgba(240, 144, 127, 0.1)",
                border: "1px solid #f0907f",
                borderRadius: 8,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <label style={{ fontSize: 13, fontWeight: 700, color: "#f0907f" }}>
                Cancellation Reason:
                <input
                  className="ap-input"
                  placeholder="e.g. Customer cancelled, Item out of stock"
                  style={{ marginTop: 6 }}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className="ad-btn ad-btn--ghost"
                  onClick={() => setShowCancel(false)}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="ad-btn ap-btn--danger"
                  disabled={busy}
                  onClick={() => setStatus("cancelled", reason)}
                >
                  Confirm Cancellation
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid rgba(244, 234, 213, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
            background: "rgba(0,0,0,0.2)",
          }}
        >
          <button
            type="button"
            className="ad-btn ad-btn--ghost"
            onClick={() => setShowReceipt(true)}
          >
            Receipt
          </button>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {canPay && !showPay && (
              <button
                type="button"
                className="ad-btn ad-btn--solid"
                onClick={() => setShowPay(true)}
              >
                Receive Cash
              </button>
            )}

            {order.status === "pending" && (
              <button
                type="button"
                className="ad-btn ad-btn--solid"
                disabled={busy}
                onClick={() => setStatus("preparing")}
              >
                Accept & Start Preparing
              </button>
            )}

            {order.status === "preparing" && (
              <button
                type="button"
                className="ad-btn ad-btn--solid"
                disabled={busy}
                onClick={() => setStatus("ready")}
              >
                Mark Ready
              </button>
            )}

            {order.status === "ready" && order.paymentStatus === "paid" && (
              <button
                type="button"
                className="ad-btn ad-btn--solid"
                disabled={busy}
                onClick={() => setStatus("completed")}
              >
                Complete Order
              </button>
            )}

            {canCancel && !showCancel && (
              <button
                type="button"
                className="ad-btn ap-btn--danger"
                onClick={() => setShowCancel(true)}
              >
                Cancel
              </button>
            )}

            <button type="button" className="ad-btn ad-btn--ghost" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>

      {showReceipt && <ReceiptModal order={order} onClose={() => setShowReceipt(false)} />}
    </div>
  );
}
