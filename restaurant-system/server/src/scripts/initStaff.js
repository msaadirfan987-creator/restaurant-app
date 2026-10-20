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

async function setupStaff() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ No MONGO_URI found in .env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");

  const staffList = [
    {
      name: "Floor Waiter",
      email: "waiter@restaurant.com",
      password: "Waiter@Secure123!",
      role: "waiter",
      phone: "+92 300 1122334",
    },
    {
      name: "Head Chef (Kitchen)",
      email: "kitchen@restaurant.com",
      password: "Kitchen@Secure123!",
      role: "kitchen",
      phone: "+92 300 8887766",
    },
    {
      name: "Hamza Cashier",
      email: "hamza123@gmail.com",
      password: "Cashier@Secure123!",
      role: "cashier",
      phone: "+92 300 5544332",
    },
    {
      name: "System Admin",
      email: "admin@restaurant.com",
      password: "Admin@Secure123!",
      role: "admin",
      phone: "+92 300 9988776",
    },
  ];

  for (const s of staffList) {
    const hash = await bcryptjs.hash(s.password, 12);
    let user = await User.findOne({ email: s.email });
    if (user) {
      user.name = s.name;
      user.role = s.role;
      user.passwordHash = hash;
      user.isActive = true;
      user.tokenVersion = 0;
      await user.save();
      console.log(`✅ Updated account: [${s.role.toUpperCase()}] ${s.email} (${s.name})`);
    } else {
      await User.create({
        name: s.name,
        email: s.email,
        passwordHash: hash,
        role: s.role,
        phone: s.phone,
        isActive: true,
        tokenVersion: 0,
      });
      console.log(`✅ Created account: [${s.role.toUpperCase()}] ${s.email} (${s.name})`);
    }
  }

  await mongoose.disconnect();
  console.log("All staff accounts synchronized successfully.");
}

setupStaff().catch((err) => {
  console.error("Error setting up staff:", err);
  process.exit(1);
});
