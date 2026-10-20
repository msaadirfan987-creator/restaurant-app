import { Router } from "express";
import {
  adminLogin,
  adminLogout,
  adminMe,
  getCustomers,
} from "../controllers/adminController.js";
import { authenticateToken, requireAdmin, verifyCsrf } from "../middleware/auth.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// Dedicated Admin Authentication Routes
router.post("/login", verifyCsrf, authRateLimiter, adminLogin);
router.post("/logout", verifyCsrf, adminLogout);

// Protected Admin Routes
router.get("/me", authenticateToken, requireAdmin, adminMe);
router.get("/customers", authenticateToken, requireAdmin, getCustomers);

export default router;
