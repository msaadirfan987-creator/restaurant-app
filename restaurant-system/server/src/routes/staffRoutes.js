import { Router } from "express";
import bcryptjs from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/user.js";
import { authenticateToken, requireAdmin, verifyCsrf } from "../middleware/auth.js";

const router = Router();
router.use(authenticateToken, requireAdmin);

const ROLES = ["admin", "cashier", "kitchen", "waiter"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const sanitize = (v, max = 100) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// GET /api/staff — List staff members
router.get("/", async (req, res, next) => {
  try {
    const filter = { role: { $in: ROLES } };
    const search = sanitize(req.query.search, 80);
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: rx }, { email: rx }];
    }
    if (ROLES.includes(req.query.role)) filter.role = req.query.role;
    if (req.query.status === "active") filter.isActive = true;
    if (req.query.status === "inactive") filter.isActive = false;

    const staff = await User.find(filter)
      .select("name email phone role isActive tokenVersion createdAt updatedAt lastLoginAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({ staff });
  } catch (err) {
    next(err);
  }
});

// POST /api/staff — Create new staff member
router.post("/", verifyCsrf, async (req, res, next) => {
  try {
    const name = sanitize(req.body.name, 80);
    const email = sanitize(req.body.email, 120).toLowerCase();
    const role = req.body.role || "cashier";
    const password = req.body.password;

    if (!name || name.length < 2) {
      return res.status(400).json({ message: "Name must be at least 2 characters." });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ message: "A valid email is required." });
    }
    if (!ROLES.includes(role)) {
      return res.status(400).json({ message: `Role must be one of: ${ROLES.join(", ")}` });
    }
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "A user with this email already exists." });
    }

    const passwordHash = await bcryptjs.hash(password, 12);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role,
      isActive: true,
      tokenVersion: 0,
    });

    return res.status(201).json({
      message: "Staff member created successfully.",
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/staff/:id — Edit staff profile or role
router.patch("/:id", verifyCsrf, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid staff ID." });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "Staff member not found." });

    if (req.body.name !== undefined) {
      const name = sanitize(req.body.name, 80);
      if (name.length < 2) return res.status(400).json({ message: "Name must be at least 2 characters." });
      user.name = name;
    }

    if (req.body.email !== undefined) {
      const email = sanitize(req.body.email, 120).toLowerCase();
      if (!EMAIL_RE.test(email)) return res.status(400).json({ message: "A valid email is required." });
      if (email !== user.email && (await User.exists({ email, _id: { $ne: user._id } }))) {
        return res.status(409).json({ message: "A user with this email already exists." });
      }
      user.email = email;
    }

    if (req.body.role !== undefined && req.body.role !== user.role) {
      if (!ROLES.includes(req.body.role)) return res.status(400).json({ message: "Invalid role." });
      if (String(user._id) === String(req.user.id || req.user._id)) {
        return res.status(400).json({ message: "You cannot change your own role." });
      }
      if (user.role === "admin") {
        const remainingAdmins = await User.countDocuments({ role: "admin", isActive: true, _id: { $ne: user._id } });
        if (remainingAdmins === 0) {
          return res.status(400).json({ message: "At least one active admin must remain." });
        }
      }
      user.role = req.body.role;
      user.tokenVersion = (user.tokenVersion || 0) + 1; // Invalidate current sessions
    }

    await user.save();
    return res.status(200).json({
      message: "Staff member updated successfully.",
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/staff/:id/status — Toggle active status
router.patch("/:id/status", verifyCsrf, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid staff ID." });
    if (typeof req.body.isActive !== "boolean") return res.status(400).json({ message: "isActive boolean is required." });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "Staff member not found." });

    if (String(user._id) === String(req.user.id || req.user._id)) {
      return res.status(400).json({ message: "You cannot deactivate your own account." });
    }
    if (user.role === "admin" && !req.body.isActive) {
      const remainingAdmins = await User.countDocuments({ role: "admin", isActive: true, _id: { $ne: user._id } });
      if (remainingAdmins === 0) {
        return res.status(400).json({ message: "At least one active admin must remain." });
      }
    }

    user.isActive = req.body.isActive;
    user.tokenVersion = (user.tokenVersion || 0) + 1; // Terminate sessions immediately
    await user.save();

    return res.status(200).json({
      message: `Staff member ${user.isActive ? "activated" : "deactivated"} successfully.`,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/staff/:id/reset-password — Admin reset staff password
router.post("/:id/reset-password", verifyCsrf, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid staff ID." });
    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "Staff member not found." });

    user.passwordHash = await bcryptjs.hash(newPassword, 12);
    user.tokenVersion = (user.tokenVersion || 0) + 1; // Terminate sessions
    await user.save();

    return res.status(200).json({ message: "Staff password reset successfully." });
  } catch (err) {
    next(err);
  }
});

export default router;
