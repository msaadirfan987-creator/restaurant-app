import mongoose from "mongoose";
import Order from "../models/Order.js";

const FREE_DELIVERY_THRESHOLD = 2000;
const STANDARD_DELIVERY_FEE = 150;

// ─────────────────────────────────────────────────────────────
//  POST /api/orders — Create and store new customer order in MongoDB
// ─────────────────────────────────────────────────────────────
export const createOrder = async (req, res) => {
  try {
    const {
      name,
      customerName,
      phone,
      address,
      instructions,
      items,
      paymentMethod,
      payment,
      promoCode,
    } = req.body || {};

    const rawCustomerName = customerName || name;
    if (typeof rawCustomerName !== "string" || !rawCustomerName.trim()) {
      return res.status(400).json({ message: "Customer name must be a valid string." });
    }
    if (typeof phone !== "string" || !phone.trim()) {
      return res.status(400).json({ message: "Phone number must be a valid string." });
    }
    if (typeof address !== "string" || !address.trim()) {
      return res.status(400).json({ message: "Delivery address must be a valid string." });
    }

    const finalCustomerName = rawCustomerName.trim().slice(0, 100);
    const finalPhone = phone.trim().slice(0, 30);
    const finalAddress = address.trim().slice(0, 300);
    const finalInstructions = typeof instructions === "string" ? instructions.trim().slice(0, 500) : "";

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Your order must contain at least one item." });
    }

    if (items.length > 50) {
      return res.status(400).json({ message: "Order exceeds maximum allowed item count." });
    }

    // Sanitize and validate items structure
    const sanitizedItems = [];
    let calculatedSubtotal = 0;

    for (const i of items) {
      if (!i || typeof i !== "object") {
        return res.status(400).json({ message: "Invalid item format in order." });
      }

      const itemName = typeof i.name === "string" ? i.name.trim().slice(0, 100) : "Menu Item";
      const itemPrice = Math.max(0, Number(i.price) || 0);
      const itemQty = Math.min(50, Math.max(1, Math.floor(Number(i.qty) || 1)));
      const itemImage = typeof i.image === "string" ? i.image.slice(0, 500) : "";

      calculatedSubtotal += itemPrice * itemQty;

      sanitizedItems.push({
        id: String(i.id || itemName).slice(0, 80),
        name: itemName,
        price: itemPrice,
        qty: itemQty,
        image: itemImage,
      });
    }

    // Server-side Promo validation
    let discountPercent = 0;
    if (typeof promoCode === "string") {
      const code = promoCode.trim().toUpperCase();
      if (code === "BURGER10" || code === "WELCOME10") discountPercent = 10;
      else if (code === "BURGER20" || code === "COMBO20") discountPercent = 20;
    }

    const calculatedDiscount = Math.round((calculatedSubtotal * discountPercent) / 100);
    const calculatedDelivery = calculatedSubtotal >= FREE_DELIVERY_THRESHOLD || calculatedSubtotal === 0 ? 0 : STANDARD_DELIVERY_FEE;
    const calculatedTotal = Math.max(0, calculatedSubtotal - calculatedDiscount + calculatedDelivery);

    // Generate readable order ID
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const orderId = `BH-${Date.now().toString().slice(-6)}-${randomSuffix}`;

    // DATA OWNERSHIP: If user is authenticated, attach verified req.user.id
    const newOrder = await Order.create({
      orderId,
      user: req.user ? req.user.id : null,
      customerName: finalCustomerName,
      phone: finalPhone,
      address: finalAddress,
      instructions: finalInstructions,
      items: sanitizedItems,
      subtotal: calculatedSubtotal,
      deliveryFee: calculatedDelivery,
      discount: calculatedDiscount,
      total: calculatedTotal,
      paymentMethod: payment === "card" || paymentMethod === "card" ? "card" : "cod",
      status: "pending",
    });

    console.log(`✅ Order ${orderId} saved to MongoDB for ${finalCustomerName} (${finalPhone})`);

    return res.status(201).json({
      success: true,
      message: "Order placed and saved to MongoDB successfully.",
      orderId: newOrder.orderId,
      order: {
        orderId: newOrder.orderId,
        customerName: newOrder.customerName,
        phone: newOrder.phone,
        address: newOrder.address,
        items: newOrder.items,
        total: newOrder.total,
        status: newOrder.status,
        createdAt: newOrder.createdAt,
      },
    });
  } catch (err) {
    console.error("Create order error:", err.message);
    // Safe generic message — never expose stack traces or err.message
    return res.status(500).json({
      message: "Failed to place order. Please try again later.",
    });
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/orders/my-orders — Fetch current user's own orders (Data Ownership)
// ─────────────────────────────────────────────────────────────
export const getMyOrders = async (req, res) => {
  try {
    // Uses verified req.user.id from JWT token — never trusts client-supplied query/body id
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (err) {
    console.error("Get my orders error:", err.message);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/orders/:id — Fetch single order with ownership check
// ─────────────────────────────────────────────────────────────
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    let order = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id);
    }
    if (!order) {
      order = await Order.findOne({ orderId: String(id) });
    }

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // DATA OWNERSHIP: Customer can ONLY access their own order. Admin can view any order.
    const isOwner = req.user && order.user && order.user.equals(req.user.id);
    const isAdmin = req.user && req.user.role === "admin";

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "Access denied. You do not have permission to view this order." });
    }

    return res.status(200).json({ success: true, order });
  } catch (err) {
    console.error("Get order by ID error:", err.message);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/orders — Fetch all orders (Protected for Admin)
// ─────────────────────────────────────────────────────────────
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
      items: orders,
    });
  } catch (err) {
    console.error("Get all orders error:", err.message);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────
//  PATCH /api/orders/:id/status — Admin update order status
// ─────────────────────────────────────────────────────────────
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    const validStatuses = [
      "pending",
      "confirmed",
      "preparing",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status value." });
    }

    let order = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id);
    }
    if (!order) {
      order = await Order.findOne({ orderId: String(id) });
    }

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    order.status = status;
    await order.save();

    return res.status(200).json({
      message: "Order status updated successfully.",
      order,
    });
  } catch (err) {
    console.error("Update order status error:", err.message);
    return res.status(500).json({ message: "Internal server error." });
  }
};

