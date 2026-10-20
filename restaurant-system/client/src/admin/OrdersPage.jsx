import { useState } from "react";
import { adminApi } from "./adminApi";
import { useAdmin } from "./AdminContext";
import { Button, EmptyBlock, ErrorBlock, LoadingBlock, Modal, PageHeader, useFetch } from "./ui";

const STATUSES = [
  { key: "all", label: "All Orders" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "preparing", label: "Preparing" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

export default function OrdersPage() {
  const { notify, fail } = useAdmin();
  const list = useFetch(() => adminApi.orders.list(), []);
  const [filter, setFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const rawOrders = list.data?.orders || list.data?.items || [];
  const orders = filter === "all" ? rawOrders : rawOrders.filter((o) => o.status === filter);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await adminApi.orders.updateStatus(orderId, newStatus);
      notify(`Order status changed to ${newStatus.replace("_", " ")}.`);
      list.reload();
      if (selectedOrder && (selectedOrder._id === orderId || selectedOrder.orderId === orderId)) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      fail(err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Live tracking and order fulfillment management."
        action={
          <Button variant="ghost" onClick={list.reload}>
            Refresh
          </Button>
        }
      />

      {/* Status Filter Tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 24,
          overflowX: "auto",
          paddingBottom: 4,
        }}
      >
        {STATUSES.map((s) => {
          const count =
            s.key === "all"
              ? rawOrders.length
              : rawOrders.filter((o) => o.status === s.key).length;
          const active = filter === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setFilter(s.key)}
              style={{
                cursor: "pointer",
                padding: "8px 16px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                border: active ? "1px solid #d9a441" : "1px solid rgba(244, 234, 213, 0.12)",
                background: active ? "rgba(217, 164, 65, 0.15)" : "#1b211e",
                color: active ? "#d9a441" : "rgba(244, 234, 213, 0.75)",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>{s.label}</span>
              <span
                style={{
                  fontSize: 11,
                  padding: "1px 6px",
                  borderRadius: 10,
                  background: active ? "#d9a441" : "rgba(244, 234, 213, 0.1)",
                  color: active ? "#151a17" : "inherit",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {list.loading && !list.data ? (
        <LoadingBlock label="Loading orders" />
      ) : list.error ? (
        <ErrorBlock error={list.error} onRetry={list.reload} />
      ) : orders.length === 0 ? (
        <EmptyBlock
          title="No orders found"
          text={
            filter === "all"
              ? "No customer orders have been placed yet."
              : `There are currently no orders in "${filter.replace("_", " ")}" status.`
          }
        />
      ) : (
        <div className="ap-tablewrap">
          <table className="ap-table" style={{ minWidth: 760 }}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items Ordered</th>
                <th>Total</th>
                <th>Status</th>
                <th className="ap-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <tr key={o._id || o.orderId} style={{ "--i": i }}>
                  <td>
                    <div>
                      <span className="ap-strong">{o.orderId}</span>
                      <div className="ap-muted" style={{ fontSize: 12 }}>
                        {new Date(o.createdAt || Date.now()).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <span className="ap-strong">{o.customerName}</span>
                      <div className="ap-muted" style={{ fontSize: 12 }}>
                        {o.phone}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ maxWidth: 220 }}>
                      <span style={{ fontSize: 13, color: "#f4ead5" }}>
                        {o.items?.map((it) => `${it.qty}x ${it.name}`).join(", ") || "No items"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: 700, color: "#f4ead5" }}>Rs. {o.total}</span>
                      <span className="ap-muted" style={{ fontSize: 11, textTransform: "uppercase" }}>
                        {o.paymentMethod || "COD"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <select
                      className="ap-select"
                      style={{
                        padding: "6px 10px",
                        fontSize: 12,
                        fontWeight: 700,
                        width: "auto",
                        minWidth: 130,
                      }}
                      value={o.status}
                      disabled={updatingId === (o._id || o.orderId)}
                      onChange={(e) => handleStatusChange(o._id || o.orderId, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="preparing">Preparing</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td>
                    <div className="ap-actions">
                      <Button
                        variant="ghost"
                        className="ap-btn--sm"
                        onClick={() => setSelectedOrder(o)}
                      >
                        Details
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Full Order Details Modal */}
      {selectedOrder && (
        <Modal
          title={`Order Details — #${selectedOrder.orderId}`}
          onClose={() => setSelectedOrder(null)}
          footer={
            <Button variant="ghost" onClick={() => setSelectedOrder(null)}>
              Close
            </Button>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
                background: "rgba(0,0,0,0.2)",
                padding: 16,
                borderRadius: 8,
              }}
            >
              <div>
                <span className="ap-muted" style={{ fontSize: 12 }}>
                  Customer Name
                </span>
                <div className="ap-strong">{selectedOrder.customerName}</div>
              </div>
              <div>
                <span className="ap-muted" style={{ fontSize: 12 }}>
                  Contact Phone
                </span>
                <div className="ap-strong">{selectedOrder.phone}</div>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <span className="ap-muted" style={{ fontSize: 12 }}>
                  Delivery Address
                </span>
                <div style={{ color: "#f4ead5", fontSize: 14, marginTop: 2 }}>
                  {selectedOrder.address}
                </div>
              </div>
              {selectedOrder.instructions && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <span className="ap-muted" style={{ fontSize: 12 }}>
                    Special Instructions
                  </span>
                  <div style={{ color: "#d9a441", fontSize: 13, marginTop: 2 }}>
                    {selectedOrder.instructions}
                  </div>
                </div>
              )}
            </div>

            <div>
              <h4 style={{ margin: "0 0 10px", fontSize: 14, color: "#f4ead5" }}>Ordered Items</h4>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  borderTop: "1px solid rgba(244, 234, 213, 0.08)",
                  paddingTop: 10,
                }}
              >
                {selectedOrder.items?.map((it, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: 14,
                    }}
                  >
                    <span>
                      {it.qty}x <strong style={{ color: "#f4ead5" }}>{it.name}</strong>
                    </span>
                    <span style={{ fontWeight: 600 }}>Rs. {it.price * it.qty}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                borderTop: "1px solid rgba(244, 234, 213, 0.12)",
                paddingTop: 14,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 700, color: "#f4ead5" }}>Total Amount</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#d9a441" }}>
                Rs. {selectedOrder.total}
              </span>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
