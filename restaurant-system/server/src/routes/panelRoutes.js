import { Router } from "express";
import Order from "../models/Order.js";
import Table from "../models/Table.js";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import { authenticateToken, verifyCsrf } from "../middleware/auth.js";
import { changeStatus } from "../services/orderService.js";

const router = Router();
router.use(authenticateToken);

// Helper to get start of today in local time
function getStartOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─────────────────────────────────────────────────────────────────────────────
// KITCHEN DISPLAY SYSTEM (KDS) ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/panels/kitchen — 3 Queues: New, Preparing, Ready + Today's stats
router.get("/kitchen", async (req, res, next) => {
  try {
    const today = getStartOfToday();

    const [orders, completedTodayCount] = await Promise.all([
      Order.find({
        status: { $in: ["pending", "confirmed", "preparing", "ready"] },
      })
        .sort({ createdAt: 1 }) // Oldest on top
        .populate("table", "number seats status")
        .populate("createdBy", "name role"),
      Order.countDocuments({
        status: "completed",
        updatedAt: { $gte: today },
      }),
    ]);

    // Group into 3 queues:
    const newOrders = orders.filter((o) => ["pending", "confirmed"].includes(o.status));
    const preparingOrders = orders.filter((o) => o.status === "preparing");
    const readyOrders = orders.filter((o) => o.status === "ready");

    return res.status(200).json({
      newOrders,
      preparingOrders,
      readyOrders,
      totalActive: orders.length,
      completedTodayCount,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/panels/kitchen/:id/status — Status transition (bidirectional for undo)
router.patch("/kitchen/:id/status", verifyCsrf, async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ["pending", "preparing", "ready"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status for kitchen transition." });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found." });

    order.status = status;
    await order.save();

    return res.status(200).json({ message: `Order status changed to ${status}.`, order });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Failed to update order status." });
  }
});

// PATCH /api/panels/kitchen/:id/reject — Cannot prepare / reject order with reason
router.patch("/kitchen/:id/reject", verifyCsrf, async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "Reason is required to reject order." });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found." });

    order.status = "cancelled";
    order.cancelReason = `Kitchen: ${reason.trim()}`;
    await order.save();

    return res.status(200).json({ message: "Order rejected and cancelled.", order });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Failed to reject order." });
  }
});

// GET /api/panels/kitchen/completed-today — Read-only completed orders list
router.get("/kitchen/completed-today", async (req, res, next) => {
  try {
    const today = getStartOfToday();
    const orders = await Order.find({
      status: "completed",
      updatedAt: { $gte: today },
    })
      .sort({ updatedAt: -1 })
      .populate("table", "number seats")
      .populate("createdBy", "name role")
      .limit(100);

    return res.status(200).json({ orders });
  } catch (err) {
    next(err);
  }
});

// GET /api/panels/kitchen/products — All products for 86 (stock) management
router.get("/kitchen/products", async (req, res, next) => {
  try {
    const products = await Product.find({})
      .populate("category", "name")
      .sort({ "category.name": 1, name: 1 });

    return res.status(200).json({ products });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/panels/kitchen/products/:id/toggle-86 — 86 / Unavailable toggle
router.patch("/kitchen/products/:id/toggle-86", verifyCsrf, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found." });

    product.isAvailable = !product.isAvailable;
    await product.save();

    return res.status(200).json({
      message: `Product is now marked as ${product.isAvailable ? "Available" : "86 / Unavailable"}.`,
      product,
    });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Failed to update item availability." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// WAITER SERVICE PANEL ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/panels/waiter — Full table overview + ready alerts + active catalog + my orders
router.get("/waiter", async (req, res, next) => {
  try {
    const today = getStartOfToday();

    const [tables, activeOrders, readyOrders, myOrders, products, categories] = await Promise.all([
      Table.find({ isActive: true }).sort({ number: 1 }),
      Order.find({
        status: { $in: ["pending", "confirmed", "preparing", "ready"] },
        type: "dine-in",
      })
        .populate("table", "number")
        .populate("createdBy", "name"),
      Order.find({ status: "ready", type: "dine-in" })
        .sort({ updatedAt: -1 })
        .populate("table", "number seats")
        .populate("createdBy", "name"),
      Order.find({
        createdBy: req.user.id,
        createdAt: { $gte: today },
      })
        .sort({ createdAt: -1 })
        .populate("table", "number seats"),
      Product.find({ isAvailable: true })
        .populate("category", "name")
        .sort({ name: 1 }),
      Category.find({ isActive: true }).sort({ name: 1 }),
    ]);

    // Map each table to its current status:
    // "free" | "occupied" | "food_ready" | "bill_requested"
    const tablesWithStatus = tables.map((t) => {
      const tableOrder = activeOrders.find(
        (o) => o.table && o.table._id.toString() === t._id.toString()
      );

      let computedStatus = "free";
      if (tableOrder) {
        if (tableOrder.billRequested) {
          computedStatus = "bill_requested";
        } else if (tableOrder.status === "ready") {
          computedStatus = "food_ready";
        } else {
          computedStatus = "occupied";
        }
      }

      return {
        _id: t._id,
        number: t.number,
        seats: t.seats || t.capacity || 4,
        status: computedStatus,
        activeOrder: tableOrder || null,
      };
    });

    return res.status(200).json({
      tables: tablesWithStatus,
      readyOrders,
      myOrders,
      menu: products,
      categories,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/panels/waiter/order — Place a new order for a table (with notes & round: 1)
router.post("/waiter/order", verifyCsrf, async (req, res, next) => {
  try {
    const { tableId, items, guestCount = 1, notes = "", clientKey } = req.body;

    if (!tableId) return res.status(400).json({ message: "Table selection is required." });
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Order must contain at least one item." });
    }

    // Check duplicate clientKey
    if (clientKey) {
      const existing = await Order.findOne({ clientKey });
      if (existing) {
        return res.status(200).json({ message: "Order already placed.", order: existing });
      }
    }

    const table = await Table.findById(tableId);
    if (!table) return res.status(404).json({ message: "Selected table not found." });

    // Format items with round = 1 and notes
    const formattedItems = items.map((i) => ({
      menuItem: i.productId || i.id,
      id: i.id || i.productId,
      name: i.name,
      price: Number(i.price),
      quantity: Number(i.quantity || i.qty || 1),
      qty: Number(i.quantity || i.qty || 1),
      image: i.image || "",
      notes: (i.notes || "").trim(),
      round: 1,
    }));

    const subtotal = formattedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = new Order({
      clientKey: clientKey || `waiter-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      source: "pos",
      type: "dine-in",
      table: table._id,
      guestCount: Math.max(1, Number(guestCount) || 1),
      items: formattedItems,
      subtotal,
      total: subtotal,
      status: "pending",
      paymentStatus: "unpaid",
      customer: {
        name: `Table ${table.number} (Guests: ${guestCount})`,
        notes: notes ? notes.trim() : "",
      },
      instructions: notes ? notes.trim() : "",
      createdBy: req.user.id,
    });

    await order.save();

    // Mark table as occupied
    table.status = "occupied";
    await table.save();

    return res.status(201).json({ message: "Order sent to kitchen.", order });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Failed to create order." });
  }
});

// POST /api/panels/waiter/order/:id/add-items — Add items to existing running order as a new round
router.post("/waiter/order/:id/add-items", verifyCsrf, async (req, res, next) => {
  try {
    const { items, clientKey } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Please provide items to add." });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found." });

    if (["completed", "cancelled"].includes(order.status)) {
      return res.status(400).json({ message: "Cannot add items to a completed or cancelled order." });
    }

    // Determine highest round so far:
    const currentMaxRound = order.items.reduce((max, it) => Math.max(max, it.round || 1), 1);
    const newRound = currentMaxRound + 1;

    const newFormattedItems = items.map((i) => ({
      menuItem: i.productId || i.id,
      id: i.id || i.productId,
      name: i.name,
      price: Number(i.price),
      quantity: Number(i.quantity || i.qty || 1),
      qty: Number(i.quantity || i.qty || 1),
      image: i.image || "",
      notes: (i.notes || "").trim(),
      round: newRound,
    }));

    order.items.push(...newFormattedItems);

    // Recalculate subtotal & total
    const subtotal = order.items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
    order.subtotal = subtotal;
    order.total = subtotal; // Waiter cannot apply discounts

    // If order was ready or preparing, re-flag as preparing/pending so kitchen sees new round!
    if (order.status === "ready") {
      order.status = "preparing";
    }

    await order.save();

    return res.status(200).json({
      message: `Round ${newRound} sent to kitchen.`,
      order,
    });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Failed to add items to order." });
  }
});

// DELETE /api/panels/waiter/order/:id/item/:itemIndex — Remove item only if kitchen hasn't started preparing
router.delete("/api/panels/waiter/order/:id/item/:itemIndex", verifyCsrf, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found." });

    // Strict rule: only pending orders can have items removed by waiter
    if (order.status !== "pending") {
      return res.status(403).json({
        message: "Kitchen has already started preparing this order! Contact Cashier or Admin to modify.",
      });
    }

    const idx = parseInt(req.params.itemIndex, 10);
    if (isNaN(idx) || idx < 0 || idx >= order.items.length) {
      return res.status(400).json({ message: "Invalid item index." });
    }

    if (order.items.length <= 1) {
      return res.status(400).json({ message: "Cannot remove all items. Cancel order instead." });
    }

    order.items.splice(idx, 1);
    const subtotal = order.items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
    order.subtotal = subtotal;
    order.total = subtotal;

    await order.save();

    return res.status(200).json({ message: "Item removed.", order });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Failed to remove item." });
  }
});

// PATCH /api/panels/waiter/order/:id/bill-request — Request bill for table (alerts cashier)
router.patch("/waiter/order/:id/bill-request", verifyCsrf, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found." });

    order.billRequested = true;
    order.billRequestedAt = new Date();
    await order.save();

    return res.status(200).json({ message: "Bill requested! Cashier has been notified.", order });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Failed to request bill." });
  }
});

// PATCH /api/panels/waiter/:id/complete — Waiter marks ready order as served
router.patch("/waiter/:id/complete", verifyCsrf, async (req, res, next) => {
  try {
    const order = await changeStatus(req.params.id, "completed");

    // If order was on a table, check if any other active orders exist on that table
    if (order.table) {
      const remainingActive = await Order.countDocuments({
        table: order.table,
        status: { $in: ["pending", "confirmed", "preparing", "ready"] },
        _id: { $ne: order._id },
      });
      if (remainingActive === 0) {
        await Table.findByIdAndUpdate(order.table, { status: "available" });
      }
    }

    return res.status(200).json({ message: "Order marked as served.", order });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Failed to mark order as served." });
  }
});

export default router;
