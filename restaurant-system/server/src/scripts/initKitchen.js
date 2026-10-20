import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import User from "../models/user.js";

async function setupKitchenUser() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ No MONGO_URI found in .env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB Atlas.");

  const kitchenEmail = "kitchen@restaurant.com";
  const kitchenPassword = "Kitchen@Secure123!";
  const kitchenName = "Head Chef (Kitchen)";

  let user = await User.findOne({ email: kitchenEmail });
  const hash = await bcryptjs.hash(kitchenPassword, 12);

  if (user) {
    user.name = kitchenName;
    user.role = "kitchen";
    user.passwordHash = hash;
    user.isActive = true;
    user.tokenVersion = 0;
    await user.save();
    console.log("✅ Updated existing kitchen account:");
  } else {
    user = await User.create({
      name: kitchenName,
      email: kitchenEmail,
      passwordHash: hash,
      role: "kitchen",
      phone: "+92 300 8887766",
      isActive: true,
      tokenVersion: 0,
    });
    console.log("✅ Created new kitchen account:");
  }

  console.log("   Email:    ", user.email);
  console.log("   Password: ", kitchenPassword);
  console.log("   Role:     ", user.role);
  console.log("   Name:     ", user.name);

  await mongoose.disconnect();
  console.log("Done.");
}

setupKitchenUser().catch((err) => {
  console.error("Error setting up kitchen user:", err);
  process.exit(1);
});
