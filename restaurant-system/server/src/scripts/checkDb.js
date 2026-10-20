import { createRequire } from "module";
import dns from "node:dns";
import mongoose from "mongoose";

const require = createRequire(import.meta.url);
require("dotenv").config();
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import connectDB from "../config/db.js";
import User from "../models/user.js";
import Order from "../models/Order.js";

async function check() {
  await connectDB();
  console.log("Database Name:", mongoose.connection.name);
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log("Collections:", collections.map(c => c.name));

  const userCount = await User.countDocuments();
  console.log(`Total Users in '${mongoose.connection.name}.users':`, userCount);
  const users = await User.find({}).select("name email role createdAt").lean();
  console.log("Users:", users);

  const orderCount = await Order.countDocuments();
  console.log(`Total Orders in '${mongoose.connection.name}.orders':`, orderCount);
  const orders = await Order.find({}).lean();
  console.log("Orders:", orders.map(o => ({
    orderId: o.orderId,
    customerName: o.customerName,
    phone: o.phone,
    total: o.total,
    itemsCount: o.items.length,
    status: o.status,
    createdAt: o.createdAt
  })));

  await mongoose.disconnect();
}

check().catch(console.error);
