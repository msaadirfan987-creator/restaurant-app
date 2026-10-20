import { Router } from "express";
import {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/orderController.js";
import { authenticateToken, requireAdmin, verifyCsrf } from "../middleware/auth.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/user.js";

const router = Router();

// Middleware: Soft authentication (if user has cookie/token, attach user; else allow guest)
const optionalAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.admin_session || req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded?.id || decoded?.sub;
      if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        const user = await User.findById(userId).select("-passwordHash");
        if (user) {
          req.user = { id: user._id, name: user.name, email: user.email, role: user.role };
        }
      }
    }
  } catch {
    // Continue as guest
  }
  return next();
};

// Public endpoint to place order with CSRF check
router.post("/", verifyCsrf, optionalAuth, createOrder);

// Customer data ownership: Fetch current user's own orders
router.get("/my-orders", authenticateToken, getMyOrders);

// Fetch single order with ownership validation (IDOR protected)
router.get("/:id", authenticateToken, getOrderById);

// Protected endpoints for admin
router.get("/", authenticateToken, requireAdmin, getAllOrders);
router.patch("/:id/status", authenticateToken, requireAdmin, verifyCsrf, updateOrderStatus);

export default router;
