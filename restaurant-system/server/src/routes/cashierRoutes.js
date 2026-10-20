import { Router } from "express";
import bcryptjs from "bcryptjs";
import mongoose from "mongoose";
import Order, { ORDER_STATUSES, ORDER_TYPES } from "../models/Order.js";
import User from "../models/user.js";
import { authenticateToken, verifyCsrf } from "../middleware/auth.js";
import { createOrder, recordCashPayment, changeStatus } from "../services/orderService.js";

const router = Router();

// Middleware: Require Cashier or Admin role
const requireCashierOrAdmin = (req, res, next) => {
  if (!req.user || !["cashier", "admin"].includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied. Cashier privileges required." });
  }
  next();
};

router.use(authenticateToken, requireCashierOrAdmin);

const populateFields = [
  { path: "table", select: "number tableNumber seats capacity status" },
  { path: "receivedBy", select: "name email role" },
  { path: "createdBy", select: "name email role" },
];

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// GET /api/cashier/stats — Shift and daily cashier metrics
router.get("/stats", async (req, res, next) => {
  try {
    const today = startOfToday();
    const [ordersToday, cash, pending, completedToday, unpaidActive, onlinePending] =
      await Promise.all([
        Order.countDocuments({ createdAt: { $gte: today }, status: { $ne: "cancelled" } }),
        Order.aggregate([
          { $match: { paymentStatus: "paid", paidAt: { $gte: today } } },
          { $group: { _id: null, sum: { $sum: "$total" }, count: { $sum: 1 } } },
        ]),
        Order.countDocuments({ status: "pending" }),
        Order.countDocuments({ status: "completed", updatedAt: { $gte: today } }),
        Order.countDocuments({ paymentStatus: "unpaid", status: { $nin: ["cancelled", "completed"] } }),
        Order.countDocuments({ source: "online", status: "pending" }),
      ]);

    return res.status(200).json({
      ordersToday,
      cashSalesToday: cash[0]?.sum || 0,
      paymentsToday: cash[0]?.count || 0,
      pending,
      completedToday,
      unpaidActive,
      onlinePending,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/cashier/orders — Queryable POS & Website orders
router.get("/orders", async (req, res, next) => {
  try {
    const q = req.query;
    const filter = {};

    if (["online", "pos"].includes(q.source)) filter.source = q.source;
    if (ORDER_TYPES.includes(q.type)) filter.type = q.type;
    if (["unpaid", "paid"].includes(q.paymentStatus)) filter.paymentStatus = q.paymentStatus;
    if (ORDER_STATUSES.includes(q.status)) filter.status = q.status;

    if (q.group === "active") filter.status = { $in: ["pending", "preparing", "ready"] };
    else if (q.group === "past") filter.status = { $in: ["completed", "cancelled"] };

    if (q.from || q.to) {
      filter.createdAt = {};
      if (q.from && !isNaN(new Date(q.from))) filter.createdAt.$gte = new Date(`${q.from}T00:00:00`);
      if (q.to && !isNaN(new Date(q.to))) filter.createdAt.$lte = new Date(`${q.to}T23:59:59.999`);
      if (!Object.keys(filter.createdAt).length) delete filter.createdAt;
    }

    if (q.search && typeof q.search === "string" && q.search.trim()) {
      const escaped = q.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(escaped, "i");
      const orClauses = [{ "customer.name": rx }, { "customer.phone": rx }, { customerName: rx }, { phone: rx }];
      const num = Number(q.search.replace("#", "").trim());
      if (Number.isInteger(num)) orClauses.push({ orderNumber: num });
      filter.$or = orClauses;
    }

    const page = Math.max(1, parseInt(q.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(q.limit, 10) || 20));

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate(populateFields),
      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      orders,
      items: orders,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/cashier/orders/:id — Single order details
router.get("/orders/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    let order = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id).populate(populateFields);
    }
    if (!order) {
      order = await Order.findOne({ $or: [{ orderId: id }, { orderNumber: Number(id) || -1 }] }).populate(populateFields);
    }
    if (!order) return res.status(404).json({ message: "Order not found." });

    return res.status(200).json({ order });
  } catch (err) {
    next(err);
  }
});

// POST /api/cashier/orders — POS order creation
router.post("/orders", verifyCsrf, async (req, res, next) => {
  try {
    const { order, duplicate } = await createOrder({
      source: "pos",
      body: req.body,
      user: req.user,
    });
    await order.populate(populateFields);
    return res.status(duplicate ? 200 : 201).json({ order, duplicate });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Failed to create POS order." });
  }
});

// POST /api/cashier/orders/:id/pay — Record cash payment
router.post("/orders/:id/pay", verifyCsrf, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amountReceived } = req.body || {};
    const order = await recordCashPayment(id, amountReceived, req.user);
    await order.populate(populateFields);
    return res.status(200).json({ message: "Payment recorded successfully.", order });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Payment processing failed." });
  }
});

// PATCH /api/cashier/orders/:id/status — Transition order status
router.patch("/orders/:id/status", verifyCsrf, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body || {};
    const order = await changeStatus(id, status, reason);
    await order.populate(populateFields);
    return res.status(200).json({ message: "Order status updated.", order });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Status update failed." });
  }
});

// GET /api/cashier/profile — Current cashier user profile
router.get("/profile", async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id || req.user._id);
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/cashier/profile — Update cashier name / change password
router.patch("/profile", verifyCsrf, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id || req.user._id).select("+passwordHash");
    if (!user) return res.status(404).json({ message: "User not found." });

    if (req.body.name && typeof req.body.name === "string" && req.body.name.trim().length >= 2) {
      user.name = req.body.name.trim();
    }

    if (req.body.newPassword) {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required to set a new password." });
      }
      const ok = await bcryptjs.compare(currentPassword, user.passwordHash);
      if (!ok) {
        return res.status(401).json({ message: "Current password is incorrect." });
      }
      if (typeof newPassword !== "string" || newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters long." });
      }
      user.passwordHash = await bcryptjs.hash(newPassword, 12);
      user.tokenVersion = (user.tokenVersion || 0) + 1;
    }

    await user.save();
    return res.status(200).json({ message: "Profile updated successfully.", user });
  } catch (err) {
    next(err);
  }
});

export default router;
