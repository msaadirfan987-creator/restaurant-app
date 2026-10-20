import jwt from "jsonwebtoken";
import User from "../models/user.js";

// Helper: Email format regex validation
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Helper: Set secure HttpOnly cookie for session token
const setTokenCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// ─────────────────────────────────────────────────────────────
//  POST /api/auth/register (or /api/auth/signup)
// ─────────────────────────────────────────────────────────────
export const register = async (req, res) => {
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
      return res.status(409).json({ message: "Email is already registered. Please sign in." });
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
      return res.status(409).json({ message: "Email is already registered. Please sign in." });
    }

    console.error("Signup error:", err.message);
    return res.status(500).json({ message: "Internal server error. Please try again later." });
  }
};

// ─────────────────────────────────────────────────────────────
//  POST /api/auth/login
// ─────────────────────────────────────────────────────────────
export const login = async (req, res) => {
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

    // 3. Generic safe check — never leak if email or password was the cause
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const effectiveRole = user.role === "user" ? "customer" : user.role;

    // 4. Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: effectiveRole },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 5. Set HttpOnly cookie
    setTokenCookie(res, token);

    // 6. Return response without password or passwordHash
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
    console.error("Login error:", err.message);
    return res.status(500).json({ message: "Internal server error. Please try again later." });
  }
};

// ─────────────────────────────────────────────────────────────
//  POST /api/auth/logout
// ─────────────────────────────────────────────────────────────
export const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
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
