import jwt from "jsonwebtoken";
import User from "../models/user.js";

// Helper: Email format regex validation
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Helper: Set secure HttpOnly cookie for session token
const setTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// ─────────────────────────────────────────────────────────────
//  POST /api/auth/register (or /api/auth/signup)
// ─────────────────────────────────────────────────────────────
export const register = async (req, res) => {
  const isDev = process.env.NODE_ENV !== "production";
  try {
    const { name, email, password, confirmPassword, confirm, phone } = req.body || {};

    // 1. Strict type checking — prevents NoSQL operator injection (e.g. { $gt: "" })
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({ message: "Name, email, and password must be valid strings." });
    }

    // 2. Validate required fields
    const trimmedName = name.trim();
    const normalizedEmail = email.toLowerCase().trim();

    if (!trimmedName || !normalizedEmail || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    // 3. Length validation (Bcrypt DoS mitigation & RFC standards)
    if (trimmedName.length < 2 || trimmedName.length > 60) {
      return res.status(400).json({ message: "Name must be between 2 and 60 characters." });
    }

    if (normalizedEmail.length > 254 || !isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    if (password.length > 72) {
      return res.status(400).json({ message: "Password cannot exceed 72 characters." });
    }

    // 4. Validate password confirmation if provided
    const confirmation = confirmPassword || confirm;
    if (confirmation !== undefined && confirmation !== password) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    // 5. Optional phone validation
    let validPhone = "";
    if (phone !== undefined) {
      if (typeof phone !== "string") {
        return res.status(400).json({ message: "Phone number must be a valid string." });
      }
      validPhone = phone.trim();
      if (validPhone.length > 25) {
        return res.status(400).json({ message: "Phone number cannot exceed 25 characters." });
      }
    }

    // 6. Check for duplicate email (using strict string primitive to avoid injection)
    const existing = await User.findOne({ email: String(normalizedEmail) });
    if (existing) {
      console.error(`[AUTH SIGNUP] Duplicate registration attempt for email: ${normalizedEmail}`);
      return res.status(409).json({ message: "Email is already registered. Please sign in." });
    }

    // Check JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error("[AUTH SIGNUP] FATAL: JWT_SECRET environment variable is missing!");
      return res.status(500).json({
        message: isDev ? "Server configuration error: JWT_SECRET missing." : "Signup service error.",
      });
    }

    // 7. Hash password before storing — never store plain text
    const passwordHash = await User.hashPassword(password);

    // 8. SECURITY: Force role to 'customer' exclusively.
    // Public signups can NEVER assign themselves admin or any other elevated role.
    const user = await User.create({
      name: trimmedName,
      email: normalizedEmail,
      phone: validPhone,
      passwordHash,
      role: "customer",
    });

    // 9. Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 10. Set HttpOnly cookie
    setTokenCookie(res, token);

    // 11. Return response without password or passwordHash
    return res.status(201).json({
      message: "Customer account created successfully.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      console.error(`[AUTH SIGNUP] Duplicate key error (11000) for email: ${req.body?.email}`);
      return res.status(409).json({ message: "Email is already registered. Please sign in." });
    }

    console.error("[AUTH SIGNUP] Database/server error during signup:", err.message);
    return res.status(500).json({
      message: isDev ? `DB error: ${err.message}` : "Internal server error. Please try again later.",
    });
  }
};

// ─────────────────────────────────────────────────────────────
//  POST /api/auth/login
// ─────────────────────────────────────────────────────────────
export const login = async (req, res) => {
  const isDev = process.env.NODE_ENV !== "production";
  try {
    const { email, password } = req.body || {};

    // 1. Strict type checking
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Email and password must be valid strings." });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    if (password.length > 72) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // 2. Fetch user with passwordHash/password using strict string filter
    const user = await User.findOne({ email: String(normalizedEmail) }).select("+passwordHash +password");

    if (!user) {
      console.error(`[AUTH LOGIN] User not found for email: ${normalizedEmail}`);
      return res.status(401).json({
        message: isDev ? "User not found with this email." : "Invalid email or password.",
      });
    }

    // 3. Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.error(`[AUTH LOGIN] Password mismatch for email: ${normalizedEmail}`);
      return res.status(401).json({
        message: isDev ? "Incorrect password." : "Invalid email or password.",
      });
    }

    // 4. Verify user status
    if (user.isActive === false) {
      console.error(`[AUTH LOGIN] Account is inactive/disabled: ${normalizedEmail}`);
      return res.status(403).json({
        message: isDev ? "Account is disabled." : "Account is disabled. Please contact administration.",
      });
    }

    // 5. Verify JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error("[AUTH LOGIN] FATAL: JWT_SECRET environment variable is missing!");
      return res.status(500).json({
        message: isDev ? "Server configuration error: JWT_SECRET missing." : "Authentication service error.",
      });
    }

    const effectiveRole = user.role === "user" ? "customer" : user.role;

    // 6. Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: effectiveRole },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 7. Set HttpOnly cookie
    setTokenCookie(res, token);

    // 8. Return response without password or passwordHash
    return res.status(200).json({
      message: "Signed in successfully.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("[AUTH LOGIN] Database error during login:", err.message);
    return res.status(500).json({
      message: isDev ? `DB error: ${err.message}` : "Internal server error. Please try again later.",
    });
  }
};

// ─────────────────────────────────────────────────────────────
//  POST /api/auth/logout
// ─────────────────────────────────────────────────────────────
export const logout = (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });
  return res.status(200).json({ message: "Signed out successfully." });
};

// ─────────────────────────────────────────────────────────────
//  GET /api/auth/me (Verify active session)
// ─────────────────────────────────────────────────────────────
export const getMe = (req, res) => {
  // req.user is verified and attached by authenticateToken middleware
  return res.status(200).json({ user: req.user });
};
