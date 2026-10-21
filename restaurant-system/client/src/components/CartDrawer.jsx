import { useEffect, useMemo, useState } from "react";
import { apiUrl, authHeaders } from "../config/api.js";

/**
 * CartDrawer.jsx — Full Slide-Out Cart Drawer & Checkout Modal
 *
 * Features:
 *  - Slide-in from right with smooth backdrop blur
 *  - Real-time item listing with images, quantity increment/decrement, and removal
 *  - Subtotal, dynamic free delivery threshold calculation (Free over Rs. 2,000)
 *  - Promo code support (e.g., "BURGER10" for 10% off)
 *  - In-drawer Checkout Form (Customer Name, Phone, Delivery Address, Cash on Delivery / Card)
 *  - Instant Order Placed Confirmation with simulated Order ID and Delivery ETA
 */

const COLORS = {
  bg: "#151a17",
  surface: "#242a27",
  surfaceLight: "#2e3632",
  green: "#1f4a38",
  amber: "#d9a441",
  amberHover: "#e6b658",
  cream: "#f4ead5",
  danger: "#e05252",
};

const money = (n) => `Rs. ${Math.round(n).toLocaleString("en-US")}`;
const FREE_DELIVERY_THRESHOLD = 2000;
const STANDARD_DELIVERY_FEE = 150;

export default function CartDrawer({
  isOpen,
  onClose,
  items = [],
  currentUser = null,
  onOpenAuth = null,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onExploreMenu,
}) {
  const [step, setStep] = useState("cart"); // "cart" | "checkout" | "success"
  const [promoCode, setPromoCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");

  // Checkout form fields
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    instructions: "",
    payment: "cod",
  });
  const [orderId, setOrderId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill user data if logged in
  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || currentUser.name || "",
        phone: prev.phone || currentUser.phone || "",
      }));
    }
  }, [currentUser, isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Lock background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      // Reset step after closing
      const t = setTimeout(() => {
        setStep("cart");
        setPromoError("");
        setPromoSuccess("");
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Totals calculations
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.qty, 0),
    [items]
  );
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0 ? 0 : STANDARD_DELIVERY_FEE;
  const discountAmount = (subtotal * discountPercent) / 100;
  const total = Math.max(0, subtotal - discountAmount + deliveryFee);
  const totalItemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.qty, 0),
    [items]
  );

  const applyPromo = (e) => {
    e.preventDefault();
    setPromoError("");
    setPromoSuccess("");
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    if (code === "BURGER10" || code === "WELCOME10") {
      setDiscountPercent(10);
      setPromoSuccess("10% discount applied!");
    } else if (code === "COMBO20" || code === "BURGER20") {
      setDiscountPercent(20);
      setPromoSuccess("20% discount applied!");
    } else {
      setPromoError("Invalid promo code. Try 'BURGER10'");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address) {
      alert("Please fill in your name, phone number, and address.");
      return;
    }
    setIsSubmitting(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch(apiUrl("/api/orders"), {
        method: "POST",
        signal: controller.signal,
        headers: authHeaders({
          "Content-Type": "application/json",
        }),
        credentials: "include",
        body: JSON.stringify({
          customerName: formData.name,
          phone: formData.phone,
          address: formData.address,
          instructions: formData.instructions,
          paymentMethod: formData.payment,
          promoCode,
          items: items.map((it) => ({
            id: it.id,
            name: it.name,
            price: it.price,
            qty: it.qty,
            image: it.image,
          })),
          subtotal,
          deliveryFee,
          discount: discountAmount,
          total,
        }),
      });

      clearTimeout(timer);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to save order to database.");
      }

      setOrderId(data.orderId || ("BH-" + Math.floor(100000 + Math.random() * 900000)));
      setStep("success");
      onClearCart?.();
    } catch (err) {
      clearTimeout(timer);
      if (err.name === "AbortError") {
        alert("Server took too long to respond. Please check your internet connection or try again.");
      } else {
        alert(err.message || "Could not save your order. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cd-overlay" onClick={onClose} aria-modal="true" role="dialog">
      <style>{css}</style>
      <div className="cd-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="cd-header">
          <div className="cd-header-left">
            <h2 className="cd-title">
              {step === "cart" && "Your Cart"}
              {step === "checkout" && "Checkout"}
              {step === "success" && "Order Confirmed!"}
            </h2>
            {step === "cart" && (
              <span className="cd-badge">
                {totalItemCount} {totalItemCount === 1 ? "item" : "items"}
              </span>
            )}
          </div>
          <button
            type="button"
            className="cd-close-btn"
            onClick={onClose}
            aria-label="Close cart"
          >
            Close
          </button>
        </header>

        {/* STEP 1: CART ITEMS */}
        {step === "cart" && (
          <div className="cd-body">
            {items.length === 0 ? (
              <div className="cd-empty">
                <img
                  src="https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=400&q=80"
                  alt="Empty Cart Food Platter"
                  className="cd-empty-img"
                  loading="lazy"
                />
                <h3 className="cd-empty-title">Your cart is empty</h3>
                <p className="cd-empty-desc">
                  Looks like you haven't added any delicious flame-grilled burgers or sides yet.
                </p>
                <button
                  type="button"
                  className="cd-btn cd-btn--primary cd-btn--lg"
                  onClick={() => {
                    onClose();
                    onExploreMenu?.();
                  }}
                >
                  Explore Menu
                </button>
              </div>
            ) : (
              <>
                {/* Free delivery tracker */}
                <div className="cd-delivery-bar">
                  {subtotal >= FREE_DELIVERY_THRESHOLD ? (
                    <p className="cd-delivery-text is-free">
                      <strong>Free Delivery Unlocked!</strong> You qualify for free shipping.
                    </p>
                  ) : (
                    <>
                      <p className="cd-delivery-text">
                        Add <strong>{money(FREE_DELIVERY_THRESHOLD - subtotal)}</strong> more to get <strong>Free Delivery</strong>!
                      </p>
                      <div className="cd-progress-track">
                        <div
                          className="cd-progress-fill"
                          style={{
                            width: `${Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100)}%`,
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Items List */}
                <div className="cd-items-list">
                  {items.map((item) => (
                    <article key={item.id} className="cd-item">
                      <img
                        src={item.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=200&q=80"}
                        alt={item.name}
                        className="cd-item-img"
                        loading="lazy"
                      />
                      <div className="cd-item-details">
                        <div className="cd-item-top">
                          <h4 className="cd-item-name">{item.name}</h4>
                          <button
                            type="button"
                            className="cd-item-remove"
                            onClick={() => onRemoveItem(item.id)}
                            title="Remove item"
                          >
                            Remove
                          </button>
                        </div>
                        <span className="cd-item-price">{money(item.price)}</span>

                        <div className="cd-item-bottom">
                          <div className="cd-qty-selector">
                            <button
                              type="button"
                              className="cd-qty-btn"
                              onClick={() => onUpdateQty(item.id, item.qty - 1)}
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="cd-qty-val">{item.qty}</span>
                            <button
                              type="button"
                              className="cd-qty-btn"
                              onClick={() => onUpdateQty(item.id, item.qty + 1)}
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                          <span className="cd-item-subtotal">
                            {money(item.price * item.qty)}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Promo Code Input */}
                <form className="cd-promo" onSubmit={applyPromo}>
                  <input
                    type="text"
                    className="cd-promo-input"
                    placeholder="Promo code (e.g. BURGER10)"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                  />
                  <button type="submit" className="cd-promo-btn">
                    Apply
                  </button>
                </form>
                {promoError && <p className="cd-promo-msg is-error">{promoError}</p>}
                {promoSuccess && <p className="cd-promo-msg is-success">{promoSuccess}</p>}

                {/* Order Summary */}
                <div className="cd-summary">
                  <div className="cd-summary-row">
                    <span>Subtotal</span>
                    <span>{money(subtotal)}</span>
                  </div>
                  {discountPercent > 0 && (
                    <div className="cd-summary-row is-discount">
                      <span>Discount ({discountPercent}%)</span>
                      <span>−{money(discountAmount)}</span>
                    </div>
                  )}
                  <div className="cd-summary-row">
                    <span>Delivery Fee</span>
                    <span>{deliveryFee === 0 ? "FREE" : money(deliveryFee)}</span>
                  </div>
                  <div className="cd-summary-row is-total">
                    <span>Total Amount</span>
                    <span className="cd-total-price">{money(total)}</span>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="cd-footer">
                  <button
                    type="button"
                    className="cd-btn cd-btn--primary cd-btn--block"
                    onClick={() => setStep("checkout")}
                  >
                    Proceed to Checkout ({money(total)})
                  </button>
                  <button
                    type="button"
                    className="cd-btn cd-btn--ghost cd-btn--block"
                    onClick={onClearCart}
                  >
                    Clear Cart
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 2: CHECKOUT FORM */}
        {step === "checkout" && (
          <form className="cd-body cd-checkout-form" onSubmit={handlePlaceOrder}>
            <div className="cd-checkout-summary">
              <span className="cd-checkout-label">Total to pay:</span>
              <span className="cd-checkout-amount">{money(total)}</span>
            </div>

            {currentUser ? (
              <div className="cd-user-info-bar">
                <span>Ordering as <strong>{currentUser.name}</strong></span>
                <span className="cd-role-tag">{currentUser.role || "Customer"}</span>
              </div>
            ) : (
              <div className="cd-guest-banner">
                <span>Have an account?</span>
                <button
                  type="button"
                  className="cd-auth-link"
                  onClick={() => {
                    onClose();
                    onOpenAuth?.("login");
                  }}
                >
                  Sign In for Saved Details
                </button>
              </div>
            )}

            <div className="cd-form-group">
              <label htmlFor="cd-name" className="cd-label">Full Name *</label>
              <input
                id="cd-name"
                name="name"
                type="text"
                required
                className="cd-input"
                placeholder="e.g. John Doe"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>

            <div className="cd-form-group">
              <label htmlFor="cd-phone" className="cd-label">Phone Number *</label>
              <input
                id="cd-phone"
                name="phone"
                type="tel"
                required
                className="cd-input"
                placeholder="e.g. 0300 1234567"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>

            <div className="cd-form-group">
              <label htmlFor="cd-address" className="cd-label">Delivery Address *</label>
              <textarea
                id="cd-address"
                name="address"
                required
                rows={3}
                className="cd-input cd-textarea"
                placeholder="House / Flat no, Street, Area, Landmark"
                value={formData.address}
                onChange={handleInputChange}
              />
            </div>

            <div className="cd-form-group">
              <label htmlFor="cd-notes" className="cd-label">Special Cooking Instructions (Optional)</label>
              <input
                id="cd-notes"
                name="instructions"
                type="text"
                className="cd-input"
                placeholder="e.g. Extra spicy, extra napkins"
                value={formData.instructions}
                onChange={handleInputChange}
              />
            </div>

            <div className="cd-form-group">
              <label className="cd-label">Payment Method</label>
              <div className="cd-payment-options">
                <label className={`cd-payment-card ${formData.payment === "cod" ? "is-selected" : ""}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={formData.payment === "cod"}
                    onChange={handleInputChange}
                  />
                  <span>Cash on Delivery</span>
                </label>
                <label className={`cd-payment-card ${formData.payment === "card" ? "is-selected" : ""}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={formData.payment === "card"}
                    onChange={handleInputChange}
                  />
                  <span>Card on Delivery</span>
                </label>
              </div>
            </div>

            <div className="cd-footer">
              <button
                type="submit"
                disabled={isSubmitting}
                className="cd-btn cd-btn--primary cd-btn--block"
              >
                {isSubmitting ? "Placing Order..." : `Confirm & Place Order (${money(total)})`}
              </button>
              <button
                type="button"
                className="cd-btn cd-btn--ghost cd-btn--block"
                onClick={() => setStep("cart")}
              >
                Back to Cart
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: ORDER SUCCESS */}
        {step === "success" && (
          <div className="cd-body cd-success-view">
            <img
              src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80"
              alt="Order Confirmed"
              className="cd-success-img"
              loading="lazy"
            />
            <h3 className="cd-success-title">Thank You, {formData.name}!</h3>
            <p className="cd-success-subtitle">
              Your gourmet meal order has been received and sent to the kitchen.
            </p>

            <div className="cd-order-card">
              <div className="cd-order-row">
                <span>Order ID:</span>
                <strong>{orderId}</strong>
              </div>
              <div className="cd-order-row">
                <span>Estimated Delivery:</span>
                <strong className="cd-eta">30 – 40 mins</strong>
              </div>
              <div className="cd-order-row">
                <span>Delivery Address:</span>
                <span>{formData.address}</span>
              </div>
              <div className="cd-order-row">
                <span>Payment Method:</span>
                <span>{formData.payment === "cod" ? "Cash on Delivery" : "Card on Delivery"}</span>
              </div>
            </div>

            <p className="cd-success-note">
              We'll send SMS updates to <strong>{formData.phone}</strong> as your order is being prepared and dispatched.
            </p>

            <button
              type="button"
              className="cd-btn cd-btn--primary cd-btn--block"
              onClick={onClose}
            >
              Continue Browsing
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const css = `
.cd-overlay {
  position: fixed; inset: 0; z-index: 999;
  background: rgba(10, 14, 12, 0.72);
  backdrop-filter: blur(6px);
  display: flex; justify-content: flex-end;
  animation: cd-fade-in 240ms ease-out;
}
@keyframes cd-fade-in { from { opacity: 0; } to { opacity: 1; } }

.cd-drawer {
  width: 100%; max-width: 460px; height: 100%;
  background: ${COLORS.bg};
  color: ${COLORS.cream};
  box-shadow: -10px 0 40px rgba(0, 0, 0, 0.55);
  display: flex; flex-direction: column;
  animation: cd-slide-in 320ms ${EASE};
  font-family: "Inter", "Segoe UI", system-ui, sans-serif;
  overflow: hidden;
}
@keyframes cd-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }

/* Header */
.cd-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px;
  background: ${COLORS.surface};
  border-bottom: 1px solid rgba(244, 234, 213, 0.1);
}
.cd-header-left { display: flex; align-items: center; gap: 12px; }
.cd-title {
  margin: 0; font-family: "Playfair Display", Georgia, serif;
  font-size: 22px; font-weight: 700; color: ${COLORS.cream};
}
.cd-badge {
  padding: 4px 10px; border-radius: 999px;
  background: rgba(217, 164, 65, 0.15); color: ${COLORS.amber};
  font-size: 12px; font-weight: 700;
}
.cd-close-btn {
  padding: 6px 14px; border-radius: 6px;
  background: rgba(244, 234, 213, 0.08); border: 1px solid rgba(244, 234, 213, 0.15);
  color: ${COLORS.cream}; font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 180ms ease;
}
.cd-close-btn:hover { background: rgba(244, 234, 213, 0.18); border-color: ${COLORS.amber}; }

/* Body */
.cd-body {
  flex: 1; overflow-y: auto; padding: 20px 24px;
  display: flex; flex-direction: column; gap: 18px;
}

/* Empty State */
.cd-empty {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; text-align: center;
  padding: 40px 20px;
}
.cd-empty-img {
  width: 140px; height: 140px; border-radius: 50%;
  object-fit: cover; margin-bottom: 18px;
  border: 2px solid rgba(217, 164, 65, 0.35);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}
.cd-empty-title {
  margin: 0 0 8px; font-family: "Playfair Display", Georgia, serif;
  font-size: 24px; color: ${COLORS.cream};
}
.cd-empty-desc {
  margin: 0 0 24px; font-size: 14px; line-height: 1.6;
  color: rgba(244, 234, 213, 0.65); max-width: 280px;
}

/* Delivery bar */
.cd-delivery-bar {
  background: ${COLORS.surface}; border-radius: 8px;
  padding: 12px 16px; border: 1px solid rgba(244, 234, 213, 0.08);
}
.cd-delivery-text { margin: 0 0 8px; font-size: 13px; color: rgba(244, 234, 213, 0.85); }
.cd-delivery-text.is-free { margin: 0; color: #52c41a; font-weight: 600; }
.cd-progress-track {
  height: 6px; border-radius: 999px; background: rgba(244, 234, 213, 0.12);
  overflow: hidden;
}
.cd-progress-fill {
  height: 100%; background: ${COLORS.amber};
  transition: width 350ms ${EASE};
}

/* Items List */
.cd-items-list { display: flex; flex-direction: column; gap: 14px; }
.cd-item {
  display: flex; gap: 14px; padding: 12px;
  background: ${COLORS.surface}; border-radius: 10px;
  border: 1px solid rgba(244, 234, 213, 0.08);
}
.cd-item-img {
  width: 72px; height: 72px; border-radius: 8px;
  object-fit: cover; flex-shrink: 0; background: #111;
}
.cd-item-details { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
.cd-item-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
.cd-item-name { margin: 0; font-size: 15px; font-weight: 700; color: ${COLORS.cream}; }
.cd-item-remove {
  background: none; border: 0; color: rgba(244, 234, 213, 0.5);
  cursor: pointer; font-size: 12px; font-weight: 600; text-decoration: underline;
  padding: 2px 4px;
  transition: color 150ms ease;
}
.cd-item-remove:hover { color: ${COLORS.danger}; }
.cd-item-price { font-size: 13px; color: ${COLORS.amber}; font-weight: 600; }
.cd-item-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; }

/* Qty selector */
.cd-qty-selector {
  display: flex; align-items: center; gap: 8px;
  background: rgba(244, 234, 213, 0.06); border-radius: 6px;
  padding: 3px 6px;
}
.cd-qty-btn {
  width: 24px; height: 24px; border: 0; border-radius: 4px;
  background: rgba(244, 234, 213, 0.12); color: ${COLORS.cream};
  cursor: pointer; font-weight: 700; font-size: 14px;
  display: flex; align-items: center; justify-content: center;
  transition: background 150ms ease;
}
.cd-qty-btn:hover { background: ${COLORS.amber}; color: ${COLORS.bg}; }
.cd-qty-val { font-size: 13px; font-weight: 700; min-width: 18px; text-align: center; }
.cd-item-subtotal { font-size: 15px; font-weight: 700; color: ${COLORS.cream}; }

/* Promo */
.cd-promo { display: flex; gap: 8px; margin-top: 4px; }
.cd-promo-input {
  flex: 1; padding: 10px 14px; border-radius: 6px;
  background: ${COLORS.surface}; border: 1px solid rgba(244, 234, 213, 0.15);
  color: ${COLORS.cream}; font-size: 13px; outline: none;
}
.cd-promo-input:focus { border-color: ${COLORS.amber}; }
.cd-promo-btn {
  padding: 10px 18px; border-radius: 6px; border: 1px solid ${COLORS.amber};
  background: transparent; color: ${COLORS.amber}; font-weight: 700;
  font-size: 13px; cursor: pointer; transition: all 180ms ease;
}
.cd-promo-btn:hover { background: ${COLORS.amber}; color: ${COLORS.bg}; }
.cd-promo-msg { margin: -8px 0 0; font-size: 12px; }
.cd-promo-msg.is-error { color: ${COLORS.danger}; }
.cd-promo-msg.is-success { color: #52c41a; }

/* Summary */
.cd-summary {
  background: ${COLORS.surface}; border-radius: 8px;
  padding: 16px; border: 1px solid rgba(244, 234, 213, 0.08);
  display: flex; flex-direction: column; gap: 10px;
}
.cd-summary-row {
  display: flex; justify-content: space-between;
  font-size: 14px; color: rgba(244, 234, 213, 0.75);
}
.cd-summary-row.is-discount { color: #52c41a; }
.cd-summary-row.is-total {
  border-top: 1px solid rgba(244, 234, 213, 0.12);
  padding-top: 10px; margin-top: 2px;
  font-size: 16px; font-weight: 700; color: ${COLORS.cream};
}
.cd-total-price { font-size: 20px; color: ${COLORS.amber}; }

/* Form */
.cd-checkout-summary {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 16px; background: rgba(217, 164, 65, 0.12);
  border: 1px solid rgba(217, 164, 65, 0.3); border-radius: 8px;
}
.cd-checkout-label { font-size: 14px; font-weight: 600; color: ${COLORS.cream}; }
.cd-checkout-amount { font-size: 22px; font-weight: 800; color: ${COLORS.amber}; }

.cd-user-info-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; background: rgba(31, 74, 56, 0.35);
  border: 1px solid rgba(217, 164, 65, 0.3); border-radius: 8px; font-size: 13px;
}
.cd-role-tag {
  padding: 2px 8px; border-radius: 4px; background: ${COLORS.amber};
  color: ${COLORS.bg}; font-size: 11px; font-weight: 700; text-transform: uppercase;
}
.cd-guest-banner {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 10px 14px; background: rgba(244, 234, 213, 0.05);
  border: 1px dashed rgba(217, 164, 65, 0.4); border-radius: 8px; font-size: 13px;
}
.cd-auth-link {
  background: none; border: 0; padding: 0; color: ${COLORS.amber};
  font-weight: 700; font-size: 13px; cursor: pointer; text-decoration: underline;
}
.cd-auth-link:hover { color: #fff; }

.cd-form-group { display: flex; flex-direction: column; gap: 6px; }
.cd-label { font-size: 13px; font-weight: 600; color: rgba(244, 234, 213, 0.85); }
.cd-input {
  padding: 11px 14px; border-radius: 6px;
  background: ${COLORS.surface}; border: 1px solid rgba(244, 234, 213, 0.15);
  color: ${COLORS.cream}; font-size: 14px; outline: none; font-family: inherit;
  transition: border-color 180ms ease;
}
.cd-input:focus { border-color: ${COLORS.amber}; }
.cd-textarea { resize: vertical; min-height: 70px; }

.cd-payment-options { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.cd-payment-card {
  display: flex; align-items: center; gap: 8px; padding: 12px;
  background: ${COLORS.surface}; border: 1px solid rgba(244, 234, 213, 0.12);
  border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600;
  transition: all 180ms ease;
}
.cd-payment-card.is-selected {
  border-color: ${COLORS.amber}; background: rgba(217, 164, 65, 0.1);
}

/* Success View */
.cd-success-view {
  display: flex; flex-direction: column; align-items: center; text-align: center;
  padding: 40px 10px; justify-content: center;
}
.cd-success-img {
  width: 120px; height: 120px; border-radius: 50%;
  object-fit: cover; margin-bottom: 20px;
  border: 3px solid ${COLORS.amber};
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  animation: cd-pop 450ms ${EASE};
}
@keyframes cd-pop { 0% { transform: scale(0.4); opacity: 0; } 80% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }
.cd-success-title {
  margin: 0 0 8px; font-family: "Playfair Display", Georgia, serif;
  font-size: 26px; color: ${COLORS.cream};
}
.cd-success-subtitle {
  margin: 0 0 24px; font-size: 14px; line-height: 1.6;
  color: rgba(244, 234, 213, 0.7); max-width: 320px;
}
.cd-order-card {
  width: 100%; background: ${COLORS.surface}; border-radius: 10px;
  border: 1px solid rgba(244, 234, 213, 0.1); padding: 18px;
  display: flex; flex-direction: column; gap: 10px; text-align: left;
  margin-bottom: 20px;
}
.cd-order-row { display: flex; justify-content: space-between; font-size: 14px; color: rgba(244, 234, 213, 0.75); }
.cd-order-row strong { color: ${COLORS.cream}; }
.cd-eta { color: ${COLORS.amber}; }
.cd-success-note { font-size: 13px; line-height: 1.6; color: rgba(244, 234, 213, 0.6); margin: 0 0 28px; }

/* Buttons */
.cd-footer {
  display: flex; flex-direction: column; gap: 10px; margin-top: auto;
  padding-top: 10px;
}
.cd-btn {
  padding: 13px 24px; border-radius: 8px; font-size: 15px; font-weight: 700;
  cursor: pointer; font-family: inherit; transition: all 180ms ease;
  border: 0; text-align: center;
}
.cd-btn--block { width: 100%; }
.cd-btn--lg { padding: 14px 32px; font-size: 16px; }
.cd-btn--primary {
  background: ${COLORS.amber}; color: ${COLORS.bg};
}
.cd-btn--primary:hover {
  background: ${COLORS.amberHover}; transform: translateY(-1px);
}
.cd-btn--primary:disabled {
  opacity: 0.6; cursor: not-allowed; transform: none;
}
.cd-btn--ghost {
  background: transparent; color: rgba(244, 234, 213, 0.7);
  border: 1px solid rgba(244, 234, 213, 0.15);
}
.cd-btn--ghost:hover {
  background: rgba(244, 234, 213, 0.08); color: ${COLORS.cream};
}
`;
