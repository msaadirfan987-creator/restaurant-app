import { Router } from "express";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import { authenticateToken, requireAdmin, verifyCsrf } from "../middleware/auth.js";

const router = Router();

// Public route for menu browsing
router.get("/", getCategories);

// Protected admin routes
router.post("/", authenticateToken, requireAdmin, verifyCsrf, createCategory);
router.put("/:id", authenticateToken, requireAdmin, verifyCsrf, updateCategory);
router.delete("/:id", authenticateToken, requireAdmin, verifyCsrf, deleteCategory);

export default router;
