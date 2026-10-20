import { Router } from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { authenticateToken, requireAdmin, verifyCsrf } from "../middleware/auth.js";

const router = Router();

// Public routes for catalog and single product
router.get("/", getProducts);
router.get("/:id", getProductById);

// Protected admin routes
router.post("/", authenticateToken, requireAdmin, verifyCsrf, createProduct);
router.put("/:id", authenticateToken, requireAdmin, verifyCsrf, updateProduct);
router.delete("/:id", authenticateToken, requireAdmin, verifyCsrf, deleteProduct);

export default router;
