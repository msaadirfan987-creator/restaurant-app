import { createRequire } from "module";
import dns from "node:dns";
import mongoose from "mongoose";

const require = createRequire(import.meta.url);
require("dotenv").config();

dns.setServers(["8.8.8.8", "1.1.1.1"]);

import connectDB from "../config/db.js";
import Table from "../models/Table.js";

async function seed() {
  await connectDB();
  const count = await Table.countDocuments();
  if (count > 0) {
    console.log(`ℹ️ Tables already exist (${count} found). Skipping table seed.`);
    await mongoose.disconnect();
    process.exit(0);
  }

  const tables = [];
  for (let i = 1; i <= 10; i++) {
    tables.push({
      number: i,
      tableNumber: i,
      seats: i <= 4 ? 2 : i <= 8 ? 4 : 6,
      capacity: i <= 4 ? 2 : i <= 8 ? 4 : 6,
      status: "available",
      isActive: true,
    });
  }

  await Table.insertMany(tables);
  console.log("✅ Seeded 10 restaurant tables (Tables 1 - 10)");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Table seeding error:", err);
  process.exit(1);
});
