/**
 * env.js — Server Environment Configuration & Startup Validator
 * Validates that all critical secrets and settings exist before booting.
 */

const requiredVars = ["MONGO_URI", "JWT_SECRET"];

export function validateEnv() {
  const missing = requiredVars.filter((v) => !process.env[v] || process.env[v].trim() === "");

  if (missing.length > 0) {
    console.error("❌ FATAL CONFIGURATION ERROR: Missing required environment variables:");
    missing.forEach((v) => console.error(`   - ${v}`));
    console.error("Please ensure your server/.env file contains all required keys.");
    process.exit(1);
  }

  // Warn if JWT_SECRET is too short or insecure in production
  if (process.env.JWT_SECRET.length < 32) {
    console.warn("⚠️  WARNING: JWT_SECRET should be at least 32 characters long for production security.");
  }
}

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  adminEmail: process.env.ADMIN_EMAIL || "admin@restaurant.com",
  adminPassword: process.env.ADMIN_PASSWORD || "",
};
