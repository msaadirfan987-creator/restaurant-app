import { Router } from "express";
import { handleUpload } from "../controllers/uploadController.js";
import { authenticateToken, requireAdmin, verifyCsrf } from "../middleware/auth.js";

const router = Router();

// Protected upload endpoint for admins with CSRF validation
router.post("/", authenticateToken, requireAdmin, verifyCsrf, handleUpload);

export default router;
