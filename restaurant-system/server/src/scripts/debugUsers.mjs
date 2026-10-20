import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load from server root .env
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../restaurant-system/server/.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error("❌ MONGO_URI not found in .env");
  process.exit(1);
}

await mongoose.connect(MONGO_URI);
console.log("✅ Connected to MongoDB");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  passwordHash: String,
  isActive: Boolean,
  tokenVersion: Number,
  createdAt: Date,
});

const User = mongoose.model("User", userSchema);
const users = await User.find({}).sort({ createdAt: -1 }).limit(15).lean();

console.log("\n=== Recent Users in Database ===");
if (users.length === 0) {
  console.log("  No users found!");
} else {
  users.forEach((u) => {
    const hashPreview = u.passwordHash ? u.passwordHash.substring(0, 10) + "..." : "NO HASH!";
    console.log(
      `  [${u.role?.toUpperCase() || "??"}] ${u.name} | ${u.email} | active: ${u.isActive} | hash: ${hashPreview}`
    );
  });
}

await mongoose.disconnect();
console.log("\nDone.");
