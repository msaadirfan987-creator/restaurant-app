import { useAdmin } from "./AdminContext";
import { Button, LoadingBlock, useFetch } from "./ui";
import { adminApi } from "./adminApi";

export default function DashboardHome() {
  const { user, navigate } = useAdmin();
  const ordersFetch = useFetch(() => adminApi.orders.list(), []);
  const productsFetch = useFetch(() => adminApi.products.list({ limit: 100 }), []);
  const customersFetch = useFetch(() => adminApi.customers.list(), []);

  const orders = ordersFetch.data?.orders || ordersFetch.data?.items || [];
  const products = productsFetch.data?.items || [];
  const customers = customersFetch.data?.customers || [];

  const totalRevenue = orders.reduce((sum, o) => {
    return o.status !== "cancelled" ? sum + (Number(o.total) || 0) : sum;
  }, 0);

  const pendingOrders = orders.filter((o) => o.status === "pending").length;

  return (
    <div>
      <style>{dashCss}</style>

      {/* Hero Welcome with Animated Typography */}
      <section className="dh-hero">
        <span className="dh-shape dh-shape--a" aria-hidden="true" />
        <span className="dh-shape dh-shape--b" aria-hidden="true" />

        <div className="dh-welcome">
          <h1 className="dh-title">
            <span className="dh-word" style={{ "--i": 0 }}>
              Welcome,
            </span>{" "}
            <span className="dh-word dh-word--accent" style={{ "--i": 1 }}>
              Admin
            </span>
          </h1>
          <p className="dh-subtitle">
            Authenticated session active ({user?.email || "admin@restaurant.com"})
          </p>
        </div>
      </section>

      {/* Metric Cards Grid */}
      <div className="ap-stat-grid" style={{ marginTop: 28 }}>
        <div className="ap-stat-card">
          <span className="ap-stat-title">Total Orders</span>
          <span className="ap-stat-value">{ordersFetch.loading ? "..." : orders.length}</span>
          <span className="ap-stat-hint">{pendingOrders} pending fulfillment</span>
        </div>

        <div className="ap-stat-card">
          <span className="ap-stat-title">Total Revenue</span>
          <span className="ap-stat-value">
            {ordersFetch.loading ? "..." : `Rs. ${totalRevenue.toLocaleString()}`}
          </span>
          <span className="ap-stat-hint">Excluding cancelled orders</span>
        </div>

        <div className="ap-stat-card">
          <span className="ap-stat-title">Dishes & Menu Items</span>
          <span className="ap-stat-value">{productsFetch.loading ? "..." : products.length}</span>
          <span className="ap-stat-hint">Active on public menu</span>
        </div>

        <div className="ap-stat-card">
          <span className="ap-stat-title">Registered Customers</span>
          <span className="ap-stat-value">{customersFetch.loading ? "..." : customers.length}</span>
          <span className="ap-stat-hint">Registered client accounts</span>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 32,
          flexWrap: "wrap",
        }}
      >
        <Button onClick={() => navigate("/admin/products")}>Manage Products</Button>
        <Button variant="ghost" onClick={() => navigate("/admin/categories")}>
          Manage Categories
        </Button>
        <Button variant="ghost" onClick={() => navigate("/admin/orders")}>
          View Live Orders
        </Button>
      </div>

      {/* Recent Orders Overview */}
      <div
        style={{
          background: "#1b211e",
          border: "1px solid rgba(244, 234, 213, 0.08)",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#f4ead5" }}>
            Recent Orders
          </h2>
          <Button
            variant="ghost"
            className="ap-btn--sm"
            onClick={() => navigate("/admin/orders")}
          >
            View All ({orders.length})
          </Button>
        </div>

        {ordersFetch.loading ? (
          <LoadingBlock label="Loading recent orders" />
        ) : orders.length === 0 ? (
          <p style={{ margin: 0, color: "rgba(244, 234, 213, 0.6)", fontSize: 14 }}>
            No customer orders received yet. Orders placed through the website will appear here in real-time.
          </p>
        ) : (
          <div className="ap-tablewrap" style={{ border: 0 }}>
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((o, i) => (
                  <tr key={o._id || o.orderId} style={{ "--i": i }}>
                    <td>
                      <span className="ap-strong">{o.orderId}</span>
                    </td>
                    <td>
                      <div>
                        <span className="ap-strong">{o.customerName}</span>
                        <div className="ap-muted" style={{ fontSize: 12 }}>
                          {o.phone}
                        </div>
                      </div>
                    </td>
                    <td className="ap-muted">
                      {o.items?.length || 0} item{(o.items?.length || 0) === 1 ? "" : "s"}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: "#f4ead5" }}>
                        Rs. {o.total}
                      </span>
                    </td>
                    <td>
                      <span className={`ap-badge ap-badge--${o.status}`}>
                        {o.status?.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const dashCss = `
.dh-hero {
  position: relative;
  overflow: hidden;
  border-radius: 14px;
  background: radial-gradient(circle at top right, rgba(31, 74, 56, 0.45), transparent 70%), #1b211e;
  border: 1px solid rgba(244, 234, 213, 0.08);
  padding: clamp(28px, 5vw, 48px);
}
.dh-shape {
  position: absolute;
  pointer-events: none;
  border-radius: 50%;
  filter: blur(40px);
}
.dh-shape--a {
  width: 240px; height: 240px; right: -40px; top: -40px;
  background: rgba(31, 74, 56, 0.5);
}
.dh-shape--b {
  width: 180px; height: 180px; right: 140px; bottom: -60px;
  background: rgba(217, 164, 65, 0.15);
}

.dh-welcome { position: relative; z-index: 2; }
.dh-title {
  margin: 0;
  font-family: "Playfair Display", Georgia, serif;
  font-size: clamp(32px, 5.5vw, 56px);
  font-weight: 700;
  line-height: 1.1;
  color: #f4ead5;
}
.dh-word {
  display: inline-block;
  opacity: 0;
  animation: dh-reveal 800ms ${EASE} both;
  animation-delay: calc(var(--i) * 140ms + 100ms);
}
.dh-word--accent {
  color: #d9a441;
}
.dh-subtitle {
  margin: 12px 0 0;
  font-size: 14px;
  color: rgba(244, 234, 213, 0.65);
}

@keyframes dh-reveal {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: none; }
}
`;
