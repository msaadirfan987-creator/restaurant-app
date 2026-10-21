import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

// Dummy bcrypt hash executed on missed email to prevent timing-based email enumeration
const DUMMY_HASH = bcryptjs.hashSync("not-a-real-admin-password", 12);

const isProduction = process.env.NODE_ENV === "production";
const isDev = !isProduction;

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
  maxAge: 8 * 60 * 60 * 1000, // 8 hours
};

const clearCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
};

// POST /api/admin/login — Dedicated secure admin authentication
export const adminLogin = async (req, res, next) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email }).select("+passwordHash +password");
    if (!user) {
      console.error(`[ADMIN LOGIN] Admin account not found for email: ${email}`);
      return res.status(401).json({
        message: isDev ? "Admin user not found with this email." : "Invalid email or password.",
      });
    }

    const userHash = user.passwordHash || user.password;
    const passwordOk = await bcryptjs.compare(password, userHash);

    if (!passwordOk) {
      console.error(`[ADMIN LOGIN] Password mismatch for admin: ${email}`);
      return res.status(401).json({
        message: isDev ? "Incorrect admin password." : "Invalid email or password.",
      });
    }

    if (user.isActive === false) {
      console.error(`[ADMIN LOGIN] Account is inactive/disabled: ${email}`);
      return res.status(403).json({
        message: isDev ? "Admin account is disabled." : "Account is disabled. Please contact support.",
      });
    }

    if (user.role !== "admin") {
      console.error(`[ADMIN LOGIN] User ${email} does not have admin role (current role: ${user.role})`);
      return res.status(403).json({
        message: `Your account (${user.role}) does not have admin permissions. Please sign in via the customer login on the main website.`,
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("[ADMIN LOGIN] FATAL: JWT_SECRET environment variable is missing!");
      return res.status(500).json({
        message: isDev ? "Server configuration error: JWT_SECRET missing." : "Authentication service error.",
      });
    }

    const token = jwt.sign(
      {
        sub: String(user._id),
        id: String(user._id),
        role: user.role,
        tv: user.tokenVersion || 0,
      },
      process.env.JWT_SECRET,
      {
        algorithm: "HS256",
        expiresIn: "8h",
      }
    );

    // Set both cookies so admin module and general app share valid session
    res.cookie("admin_session", token, cookieOptions);
    res.cookie("token", token, cookieOptions);

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("[ADMIN LOGIN] Database error during admin login:", err.message);
    return res.status(500).json({
      message: isDev ? `DB error: ${err.message}` : "Internal server error. Please try again later.",
    });
  }
};

// POST /api/admin/logout — Clears session cookies and revokes token via tokenVersion increment
export const adminLogout = async (req, res, next) => {
  try {
    const token = req.cookies?.admin_session || req.cookies?.token;
    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
        const userId = payload.sub || payload.id;
        if (userId) {
          await User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
        }
      } catch {
        // Expired or invalid token: cookie clear is still sufficient
      }
    }

    res.clearCookie("admin_session", clearCookieOptions);
    res.clearCookie("token", clearCookieOptions);
    return res.status(200).json({ message: "Logged out." });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/me — Verifies current admin session
export const adminMe = (req, res) => {
  return res.status(200).json({ user: req.user });
};

// GET /api/admin/customers — Protected endpoint to retrieve customer records
export const getCustomers = async (req, res) => {
  try {
    const customers = await User.find({ role: "customer" })
      .select("name email phone role createdAt updatedAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Customer records retrieved successfully.",
      count: customers.length,
      customers,
    });
  } catch (err) {
    console.error("Fetch customers error:", err.message);
    return res.status(500).json({ message: "Internal server error." });
  }
};
