import { Router } from "express";
import Order from "../models/Order.js";
import Table from "../models/Table.js";
import { authenticateToken, verifyCsrf } from "../middleware/auth.js";
import { changeStatus } from "../services/orderService.js";

const router = Router();
router.use(authenticateToken);

// GET /api/panels/kitchen — Kitchen live KOT (orders needing preparation)
router.get("/kitchen", async (req, res, next) => {
  try {
    const orders = await Order.find({
      status: { $in: ["pending", "preparing"] },
    })
      .sort({ createdAt: 1 })
      .populate("table", "number seats");

    return res.status(200).json({ orders });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/panels/kitchen/:id/status — Kitchen update (e.g. mark ready or preparing)
router.patch("/kitchen/:id/status", verifyCsrf, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["preparing", "ready"].includes(status)) {
      return res.status(400).json({ message: "Kitchen can only mark orders as preparing or ready." });
    }
    const order = await changeStatus(req.params.id, status);
    return res.status(200).json({ message: `Order marked as ${status}.`, order });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Failed to update order status." });
  }
});

// GET /api/panels/waiter — Waiter active tables & ready orders
router.get("/waiter", async (req, res, next) => {
  try {
    const [tables, readyOrders] = await Promise.all([
      Table.find({ isActive: true }).sort({ number: 1 }),
      Order.find({ status: "ready" }).sort({ updatedAt: -1 }).populate("table", "number seats"),
    ]);

    return res.status(200).json({ tables, readyOrders });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/panels/waiter/:id/complete — Waiter marks ready order as completed / served
router.patch("/waiter/:id/complete", verifyCsrf, async (req, res, next) => {
  try {
    const order = await changeStatus(req.params.id, "completed");
    return res.status(200).json({ message: "Order marked as served and completed.", order });
  } catch (err) {
    return res.status(400).json({ message: err.message || "Failed to complete order." });
  }
});

export default router;
