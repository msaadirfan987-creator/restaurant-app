import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/user.js";

// Authenticate user via HttpOnly cookie (admin_session or token) or Authorization Bearer header
export const authenticateToken = async (req, res, next) => {
  try {
    let token = null;

    // Check Authorization header first (most reliable on cross-origin Vercel deployment)
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1]?.trim();
    }

    // Fallback to HttpOnly cookies
    if (!token) {
      token = req.cookies?.admin_session || req.cookies?.token;
    }

    if (!token) {
      return res.status(401).json({ message: "Authentication required. Please sign in." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    const userId = decoded?.id || decoded?.sub;

    // Validate MongoDB ObjectId format to prevent CastErrors
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ message: "Invalid authentication session." });
    }

    // Verify user still exists in database and is active
    const user = await User.findById(userId).select("-passwordHash");
    if (!user || user.isActive === false) {
      return res.status(401).json({ message: "User account no longer exists or is disabled." });
    }

    // Verify token version if token includes tv claim
    if (decoded.tv !== undefined && user.tokenVersion !== decoded.tv) {
      return res.status(401).json({ message: "Session revoked. Please sign in again." });
    }

    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: user.role === "user" ? "customer" : user.role,
    };

    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired. Please sign in again." });
    }
    return res.status(401).json({ message: "Invalid authentication token." });
  }
};

// Require Admin authorization
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Administrator privileges required." });
  }
  return next();
};

// CSRF Defense middleware for state-changing requests
export const verifyCsrf = (req, res, next) => {
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // 1. If request uses custom Authorization Bearer token, it is inherently immune to CSRF
  // because browsers never automatically attach Bearer headers cross-site.
  if (req.headers.authorization?.startsWith("Bearer ")) {
    return next();
  }

  // 2. Custom header check (Standard for SPA fetch clients; browsers disallow cross-origin
  // custom headers without CORS preflight approval)
  const customHeader = req.headers["x-requested-with"];
  if (customHeader === "XMLHttpRequest" || customHeader === "BurgerHouseClient") {
    return next();
  }

  // 3. Origin check against allowed origins
  const origin = req.headers.origin || req.headers.referer;
  const allowed = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  if (origin && allowed.some((a) => origin.startsWith(a))) {
    return next();
  }

  return res.status(403).json({ message: "Cross-site request blocked (CSRF validation failed)." });
};
