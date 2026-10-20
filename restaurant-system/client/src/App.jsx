import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import FeaturedBurgers from "./components/FeaturedBurgers";
import OurMenu from "./components/OurMenu";
import { FeaturedFromApi, MenuFromApi } from "./components/PublicCatalog";
import SpecialOffer from "./components/SpecialOffer";
import OurStory from "./components/OurStory";
import CustomerReviews from "./components/CustomerReviews";
import VisitUs from "./components/VisitUs";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import AuthPage from "./components/AuthPage";
import AdminApp from "./admin/AdminApp";
import CashierApp from "./cashier/CashierApp";
import KitchenPanel from "./kitchen/KitchenPanel";
import WaiterPanel from "./waiter/WaiterPanel";

function StaffGuard({ title, requiredRoles, currentUser, onOpenLogin, onGoHome, children }) {
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#151a17] text-[#f4ead5] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-[#1f2622] border border-[#d9a441]/30 p-8 rounded-xl max-w-md w-full shadow-2xl">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#d9a441]/15 border border-[#d9a441]/40 flex items-center justify-center overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=120&q=80"
              alt="Security"
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-2xl font-bold font-['Bebas_Neue'] tracking-wider text-[#d9a441] mb-2">
            {title} LOGIN REQUIRED
          </h2>
          <p className="text-sm text-[#f4ead5]/70 mb-6">
            Please log in with your staff account to access this terminal.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={onOpenLogin}
              className="w-full py-2.5 px-4 bg-[#d9a441] text-[#151a17] font-bold rounded-lg hover:brightness-110 transition-all text-sm"
            >
              Staff Sign In
            </button>
            <button
              onClick={onGoHome}
              className="w-full py-2 px-4 bg-transparent border border-[#d9a441]/30 text-[#f4ead5] rounded-lg hover:bg-white/5 transition-all text-sm"
            >
              ← Back to Main Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasAccess = requiredRoles.includes(currentUser.role) || currentUser.role === "admin";
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#151a17] text-[#f4ead5] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-[#1f2622] border border-red-500/40 p-8 rounded-xl max-w-md w-full shadow-2xl">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/15 border border-red-500/50 flex items-center justify-center font-bold text-red-400 text-2xl font-serif">
            !
          </div>
          <h2 className="text-2xl font-bold font-['Bebas_Neue'] tracking-wider text-red-400 mb-2">
            ACCESS RESTRICTED
          </h2>
          <p className="text-sm text-[#f4ead5]/70 mb-6">
            Your account ({currentUser.role}) does not have permission to access the {title}. This portal is restricted to authorized staff.
          </p>
          <button
            onClick={onGoHome}
            className="w-full py-2.5 px-4 bg-[#d9a441] text-[#151a17] font-bold rounded-lg hover:brightness-110 transition-all text-sm"
          >
            ← Return to Customer Website
          </button>
        </div>
      </div>
    );
  }

  return children;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("bh_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  const [authModalMode, setAuthModalMode] = useState(null); // null | "login" | "signup"

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("bh_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastItem, setToastItem] = useState(null); // { name, image }

  // Listen to browser navigation (Back / Forward buttons)
  useEffect(() => {
    const onPopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Synchronize active session with backend HttpOnly cookie on page load
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("bh_cart", JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  // Sync user to localStorage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem("bh_user", JSON.stringify(currentUser));
      } else {
        localStorage.removeItem("bh_user");
      }
    } catch {
      // ignore
    }
  }, [currentUser]);

  // Toast timer
  useEffect(() => {
    if (!toastItem) return;
    const t = setTimeout(() => setToastItem(null), 3000);
    return () => clearTimeout(t);
  }, [toastItem]);

  const showToast = (item) => {
    setToastItem(item);
  };

  const navigateTo = (path) => {
    setCurrentPath(path);
    window.history.pushState({}, "", path);
  };

  const handleAuthenticated = (user, redirectPath) => {
    setCurrentUser(user);
    setAuthModalMode(null);

    // Route to respective panel depending on role
    if (user?.role === "admin" || redirectPath === "/admin") {
      navigateTo("/admin");
    } else if (user?.role === "cashier" || redirectPath === "/cashier") {
      navigateTo("/cashier");
    } else if (user?.role === "kitchen" || redirectPath === "/kitchen") {
      navigateTo("/kitchen");
    } else if (user?.role === "waiter" || redirectPath === "/waiter") {
      navigateTo("/waiter");
    }

    showToast({
      name: `Welcome, ${user.name ? user.name.split(" ")[0] : "Customer"}!`,
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
    });
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
        credentials: "include",
      });
    } catch {
      // ignore network errors on logout
    }

    setCurrentUser(null);
    localStorage.removeItem("bh_user");

    // If currently on any staff page, redirect to home
    if (
      currentPath.startsWith("/admin") ||
      currentPath.startsWith("/cashier") ||
      currentPath.startsWith("/kitchen") ||
      currentPath.startsWith("/waiter")
    ) {
      navigateTo("/");
    }

    showToast({
      name: "Signed out successfully.",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=100&q=80",
    });
  };

  // Add item to cart
  const handleAddToCart = (product, openDrawer = false) => {
    if (!product) return;
    const id = product.id || String(product.name || product.title).toLowerCase().replace(/\s+/g, "-");
    const name = product.name || product.title || "Gourmet Burger";
    const price = typeof product.price === "number" ? product.price : 1290;
    const image =
      product.image ||
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80";

    setCart((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing) {
        return prev.map((item) =>
          item.id === id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { id, name, price, image, qty: 1 }];
    });

    if (openDrawer) {
      setIsCartOpen(true);
    } else {
      showToast({ name, image });
    }
  };

  // Instant order now: adds item & directly opens cart drawer
  const handleOrderNow = (product) => {
    const item = product || {
      id: "chef-special",
      name: "Chef's Signature Burger",
      price: 1290,
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80",
    };
    handleAddToCart(item, true);
  };

  // Update item quantity (+ or -)
  const handleUpdateQty = (id, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(id);
    } else {
      setCart((prev) =>
        prev.map((item) => (item.id === id ? { ...item, qty: newQty } : item))
      );
    }
  };

  // Remove single item
  const handleRemoveItem = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // Clear all items
  const handleClearCart = () => {
    setCart([]);
  };

  const handleExplore = () => {
    const el = document.getElementById("menu");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // If on /admin route: render dedicated Admin App (handles /admin/login and /admin/dashboard)
  if (currentPath.startsWith("/admin")) {
    return <AdminApp onNavigateHome={() => navigateTo("/")} />;
  }

  // Cashier POS and Terminal Routes
  if (currentPath.startsWith("/cashier")) {
    return (
      <>
        <StaffGuard
          title="Cashier Terminal"
          requiredRoles={["cashier"]}
          currentUser={currentUser}
          onOpenLogin={() => setAuthModalMode("login")}
          onGoHome={() => navigateTo("/")}
        >
          <CashierApp user={currentUser} onLogout={handleLogout} />
        </StaffGuard>
        {authModalMode && (
          <div className="fixed inset-0 z-[1000] overflow-y-auto bg-black/80 backdrop-blur-md">
            <AuthPage
              initialMode={authModalMode}
              onClose={() => setAuthModalMode(null)}
              onAuthenticated={handleAuthenticated}
            />
          </div>
        )}
      </>
    );
  }

  // Kitchen Display System (KDS)
  if (currentPath.startsWith("/kitchen")) {
    return (
      <>
        <StaffGuard
          title="Kitchen Display System"
          requiredRoles={["kitchen"]}
          currentUser={currentUser}
          onOpenLogin={() => setAuthModalMode("login")}
          onGoHome={() => navigateTo("/")}
        >
          <KitchenPanel user={currentUser} onLogout={handleLogout} />
        </StaffGuard>
        {authModalMode && (
          <div className="fixed inset-0 z-[1000] overflow-y-auto bg-black/80 backdrop-blur-md">
            <AuthPage
              initialMode={authModalMode}
              onClose={() => setAuthModalMode(null)}
              onAuthenticated={handleAuthenticated}
            />
          </div>
        )}
      </>
    );
  }

  // Waiter Service Panel
  if (currentPath.startsWith("/waiter")) {
    return (
      <>
        <StaffGuard
          title="Waiter Service Panel"
          requiredRoles={["waiter"]}
          currentUser={currentUser}
          onOpenLogin={() => setAuthModalMode("login")}
          onGoHome={() => navigateTo("/")}
        >
          <WaiterPanel user={currentUser} onLogout={handleLogout} />
        </StaffGuard>
        {authModalMode && (
          <div className="fixed inset-0 z-[1000] overflow-y-auto bg-black/80 backdrop-blur-md">
            <AuthPage
              initialMode={authModalMode}
              onClose={() => setAuthModalMode(null)}
              onAuthenticated={handleAuthenticated}
            />
          </div>
        )}
      </>
    );
  }

  // Standard Customer / Public Landing Page
  return (
    <div className="min-h-screen bg-[#151a17] text-[#f4ead5] relative">
      <Navbar
        cartCount={totalCartCount}
        currentUser={currentUser}
        onCartClick={() => setIsCartOpen(true)}
        onOrderClick={() => handleOrderNow()}
        onLoginClick={(mode) => setAuthModalMode(mode || "login")}
        onLogout={handleLogout}
        onAdminClick={() => navigateTo("/admin")}
        onStaffClick={(path) => navigateTo(path)}
      />

      <main>
        <div id="home">
          <Hero
            brand="Burger House"
            price="Rs. 1,290"
            onOrder={() => handleOrderNow()}
            onMenu={handleExplore}
          />
        </div>

        <FeaturedFromApi
          onAddToCart={(item) => handleAddToCart(item)}
          onOrderNow={(item) => handleOrderNow(item)}
          onCheckout={() => setIsCartOpen(true)}
        />

        <MenuFromApi
          onAddToCart={(item) => handleAddToCart(item)}
          onCheckout={() => setIsCartOpen(true)}
        />

        <SpecialOffer
          onOrder={(item) => handleOrderNow(item)}
        />

        <OurStory />

        <CustomerReviews />

        <VisitUs />
      </main>

      <Footer />

      {/* Slide-out interactive Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        currentUser={currentUser}
        onOpenAuth={(mode) => setAuthModalMode(mode || "login")}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onExploreMenu={handleExplore}
      />

      {/* Fullscreen Authentication Modal */}
      {authModalMode && (
        <div className="fixed inset-0 z-[1000] overflow-y-auto bg-black/80 backdrop-blur-md">
          <AuthPage
            initialMode={authModalMode}
            onClose={() => setAuthModalMode(null)}
            onAuthenticated={handleAuthenticated}
          />
        </div>
      )}

      {/* Floating Add to Cart Toast Notification (Image Tag Only, No Icons) */}
      {toastItem && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3.5 px-4 py-3 rounded-xl shadow-2xl transition-all duration-300"
          style={{
            background: "#242a27",
            border: "1px solid rgba(217, 164, 65, 0.4)",
            color: "#f4ead5",
          }}
        >
          <img
            src={toastItem.image}
            alt={toastItem.name}
            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
            style={{ border: "1px solid rgba(217, 164, 65, 0.3)" }}
          />
          <div className="flex flex-col">
            <span className="font-semibold text-sm leading-tight">{toastItem.name}</span>
            <span className="text-xs text-[#d9a441] mt-0.5">Added to cart</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setToastItem(null);
              setIsCartOpen(true);
            }}
            className="ml-2 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-colors"
            style={{ background: "#d9a441", color: "#151a17" }}
          >
            View Cart
          </button>
        </aside>
      )}
    </div>
  );
}
