import { Router } from "express";
import {
  getSettings,
  updateSettings,
  changeAdminPassword,
} from "../controllers/settingController.js";
import { authenticateToken, requireAdmin, verifyCsrf } from "../middleware/auth.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// Public restaurant configuration
router.get("/", getSettings);

// Protected admin settings
router.put("/", authenticateToken, requireAdmin, verifyCsrf, updateSettings);
router.post(
  "/change-password",
  authenticateToken,
  requireAdmin,
  verifyCsrf,
  authRateLimiter,
  changeAdminPassword
);

export default router;
