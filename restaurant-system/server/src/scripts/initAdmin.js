import { createRequire } from "module";
import dns from "node:dns";
import mongoose from "mongoose";

const require = createRequire(import.meta.url);
require("dotenv").config();

// Ensure Google DNS for Atlas SRV lookup
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import connectDB from "../config/db.js";
import User from "../models/user.js";

async function initializeAdmin() {
  console.log("==================================================");
  console.log(" Restaurant System: Initial Admin Setup Script   ");
  console.log("==================================================");

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error("❌ ERROR: ADMIN_EMAIL and ADMIN_PASSWORD must be configured in your .env file.");
    console.error("Example:");
    console.error("  ADMIN_EMAIL=admin@restaurant.com");
    console.error("  ADMIN_PASSWORD=YourSecurePassword123!");
    process.exit(1);
  }

  if (adminPassword.length < 6) {
    console.error("❌ ERROR: ADMIN_PASSWORD must be at least 6 characters long.");
    process.exit(1);
  }

  try {
    await connectDB();

    // 1. Check if an admin already exists
    const existingAdminByRole = await User.findOne({ role: "admin" });
    if (existingAdminByRole) {
      console.log(`ℹ️ Admin account already exists with email: ${existingAdminByRole.email}`);
      console.log("🔒 Preserved existing admin. Initialization will not overwrite existing admin.");
      await mongoose.disconnect();
      process.exit(0);
    }

    // 2. Check if the specified email is already in use by another account
    const existingUserByEmail = await User.findOne({ email: adminEmail });
    if (existingUserByEmail) {
      console.error(`❌ ERROR: An account with email ${adminEmail} already exists with role: ${existingUserByEmail.role}`);
      await mongoose.disconnect();
      process.exit(1);
    }

    // 3. Hash password with bcrypt (12 rounds)
    const passwordHash = await User.hashPassword(adminPassword);

    // 4. Create the initial admin account
    const admin = await User.create({
      name: "Administrator",
      email: adminEmail,
      passwordHash,
      role: "admin",
    });

    console.log("✅ Admin account initialized successfully!");
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role:  ${admin.role}`);
    console.log("   Status: Active & Protected");
    console.log("==================================================");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to initialize admin account:", err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

initializeAdmin();
