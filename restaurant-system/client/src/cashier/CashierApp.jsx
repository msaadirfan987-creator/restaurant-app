import { useState, useEffect } from "react";
import CashierLayout from "./CashierLayout";
import CashierDashboard from "./CashierDashboard";
import CashierPOS from "./CashierPOS";
import CashierOrdersPage from "./CashierOrdersPage";
import CashierProfile from "./CashierProfile";

export default function CashierApp({ user, onLogout }) {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
  };

  // Determine active view
  let pageKey = "dashboard";
  let title = "Shift Dashboard";
  let content = null;

  if (currentPath === "/cashier/pos" || currentPath.startsWith("/cashier/pos?")) {
    pageKey = "pos";
    title = "Point of Sale (POS)";
    content = <CashierPOS />;
  } else if (currentPath === "/cashier/online") {
    pageKey = "online";
    title = "Online Orders";
    content = (
      <CashierOrdersPage
        title="Online Website Orders"
        subtitle="Real-time incoming orders placed by customers from the website."
        fixed={{ source: "online" }}
        availableFilters={["search", "status", "paymentStatus"]}
        poll={true}
      />
    );
  } else if (currentPath === "/cashier/dine-in") {
    pageKey = "dine-in";
    title = "Dine-In Orders";
    content = (
      <CashierOrdersPage
        title="Dine-In Orders"
        subtitle="Orders assigned to restaurant tables. Open orders to collect payment or complete dining."
        fixed={{ type: "dine-in" }}
        availableFilters={["search", "status", "paymentStatus"]}
        newDineInBtn={true}
      />
    );
  } else if (currentPath === "/cashier/orders") {
    pageKey = "orders";
    title = "All Orders Ledger";
    content = (
      <CashierOrdersPage
        title="All Orders & Thermal Receipts"
        subtitle="Comprehensive log of all orders across POS and Website."
        availableFilters={["search", "status", "paymentStatus", "type"]}
      />
    );
  } else if (currentPath === "/cashier/profile") {
    pageKey = "profile";
    title = "Cashier Profile";
    content = <CashierProfile user={user} />;
  } else {
    // Default: /cashier dashboard
    pageKey = "dashboard";
    title = "Cashier Shift Dashboard";
    content = <CashierDashboard user={user} onNavigate={navigate} />;
  }

  return (
    <CashierLayout
      user={user}
      pageKey={pageKey}
      title={title}
      onNavigate={navigate}
      onLogout={onLogout}
    >
      {content}
    </CashierLayout>
  );
}
