import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from server root or parent
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!MONGO_URI) {
  console.error("❌ ERROR: MONGO_URI environment variable is missing.");
  process.exit(1);
}

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("❌ ERROR: ADMIN_EMAIL and ADMIN_PASSWORD must be configured.");
  console.error("Example: ADMIN_EMAIL=admin@restaurant.com ADMIN_PASSWORD=Admin@Secure123!");
  process.exit(1);
}

if (ADMIN_PASSWORD.length < 6) {
  console.error("❌ ERROR: ADMIN_PASSWORD must be at least 6 characters.");
  process.exit(1);
}

// User schema matching server/src/models/user.js
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    passwordHash: { type: String },
    password: { type: String },
    role: {
      type: String,
      enum: ["customer", "admin", "kitchen", "cashier", "waiter", "user"],
      default: "customer",
    },
    isActive: { type: Boolean, default: true },
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

async function seedAdmin() {
  console.log("==================================================");
  console.log("  Restaurant System: Seed / Update Admin Account  ");
  console.log("==================================================");

  try {
    console.log("⏳ Connecting to MongoDB Atlas...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Hash password with bcrypt (12 salt rounds)
    const salt = await bcryptjs.genSalt(12);
    const passwordHash = await bcryptjs.hash(ADMIN_PASSWORD, salt);

    // Check if user with target admin email already exists
    let user = await User.findOne({ email: ADMIN_EMAIL });

    if (user) {
      console.log(`ℹ️ User found with email: ${ADMIN_EMAIL}. Updating to admin role and updating password...`);
      user.passwordHash = passwordHash;
      user.password = undefined; // Clear legacy plain text / old field if any
      user.role = "admin";
      user.isActive = true;
      user.tokenVersion = (user.tokenVersion || 0) + 1; // Invalidate any stale JWTs
      await user.save();
      console.log(`✅ Admin account updated successfully!`);
    } else {
      console.log(`ℹ️ No user found with email: ${ADMIN_EMAIL}. Creating new admin account...`);
      user = await User.create({
        name: "Administrator",
        email: ADMIN_EMAIL,
        passwordHash,
        role: "admin",
        isActive: true,
      });
      console.log(`✅ Admin account created successfully!`);
    }

    console.log(`   Email: ${user.email}`);
    console.log(`   Role:  ${user.role}`);
    console.log(`   Active: ${user.isActive}`);
    console.log("==================================================");
  } catch (err) {
    console.error("❌ Failed to seed/update admin account:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB.");
  }
}

seedAdmin();
