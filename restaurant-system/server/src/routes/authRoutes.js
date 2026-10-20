import { Router } from "express";
import { register, login, logout, getMe } from "../controllers/authController.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";
import { authenticateToken, verifyCsrf } from "../middleware/auth.js";

const router = Router();

// Rate-limited & CSRF-protected public auth endpoints
router.post("/register", verifyCsrf, authRateLimiter, register);
router.post("/signup", verifyCsrf, authRateLimiter, register);
router.post("/login", verifyCsrf, authRateLimiter, login);

// Session endpoints
router.post("/logout", verifyCsrf, logout);
router.get("/me", authenticateToken, getMe);

export default router;
