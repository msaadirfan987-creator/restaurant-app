import mongoose from "mongoose";
import Product from "../models/Product.js";
import MenuItem from "../models/MenuItem.js";
import Table from "../models/Table.js";
import Order, { ORDER_TYPES } from "../models/Order.js";
import Setting from "../models/Setting.js";

export const TRANSITIONS = {
  pending: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed"],
  completed: [],
  cancelled: [],
};

const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const str = (v, max = 255) => (typeof v === "string" ? v.trim().slice(0, max) : "");

async function getTaxRate() {
  const setting = await Setting.findOne();
  return setting?.taxRate != null ? setting.taxRate : 0.05; // 5% default tax
}

// Build order lines using DB prices only (tamper-proof)
async function buildItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new Error("Order must contain at least one item.");
  }
  if (rawItems.length > 60) {
    throw new Error("Too many items in one order.");
  }

  const merged = new Map();
  for (const it of rawItems) {
    const qty = Number(it?.quantity || it?.qty);
    const id = it?.menuItem || it?.id || it?._id;
    if (!id || isNaN(qty) || qty < 1 || qty > 50) {
      throw new Error("Invalid item or quantity (1-50 allowed per item).");
    }
    const key = String(id);
    merged.set(key, (merged.get(key) || 0) + qty);
  }

  // Look up in Product collection, fallback to MenuItem
  const ids = [...merged.keys()].filter((id) => mongoose.Types.ObjectId.isValid(id));
  const [products, menuItems] = await Promise.all([
    Product.find({ _id: { $in: ids } }),
    MenuItem.find({ _id: { $in: ids } }),
  ]);

  const byId = new Map();
  products.forEach((p) => byId.set(String(p._id), p));
  menuItems.forEach((m) => {
    if (!byId.has(String(m._id))) byId.set(String(m._id), m);
  });

  const items = [];
  for (const [id, qty] of merged) {
    const d = byId.get(id);
    if (!d) throw new Error("One of the selected items is no longer on the menu.");
    if (d.isAvailable === false) throw new Error(`"${d.name}" is currently out of stock.`);

    const effectivePrice = d.discountPrice != null ? d.discountPrice : d.price;
    items.push({
      menuItem: d._id,
      id: String(d._id),
      name: d.name,
      price: effectivePrice,
      quantity: qty,
      qty,
      image: Array.isArray(d.images) && d.images[0] ? d.images[0] : d.image || "",
    });
  }
  return items;
}

export async function computeTotals(items, discountType = "none", discountValue = 0) {
  const taxRate = await getTaxRate();
  const subtotal = r2(items.reduce((s, i) => s + i.price * i.quantity, 0));
  let discount = 0;
  const value = Number(discountValue) || 0;

  if (discountType === "percent" || discountType === "amount") {
    if (value < 0) throw new Error("Discount cannot be negative.");
    discount = discountType === "percent" ? subtotal * (value / 100) : value;
    const maxDiscount = subtotal * 0.5; // Max 50% discount cap
    if (discount > maxDiscount + 0.001) {
      throw new Error("Discount exceeds the maximum allowed limit (50%).");
    }
    discount = r2(discount);
  } else if (discountType !== "none") {
    throw new Error("Invalid discount type.");
  }

  const taxable = Math.max(0, subtotal - discount);
  const tax = r2(taxable * taxRate);
  const total = r2(taxable + tax);
  return { subtotal, discount, taxRate, tax, total };
}

export async function createOrder({ source, body, user = null }) {
  const isPos = source === "pos";
  const type = body.type || (isPos ? "takeaway" : "delivery");

  const allowedTypes = isPos ? ["dine-in", "takeaway"] : ORDER_TYPES;
  if (!allowedTypes.includes(type)) {
    throw new Error(`Order type must be one of: ${allowedTypes.join(", ")}`);
  }

  const clientKey = str(body.clientKey, 64);
  if (clientKey) {
    const existing = await Order.findOne({ clientKey });
    if (existing) return { order: existing, duplicate: true };
  }

  const items = await buildItems(body.items);
  const totals = await computeTotals(items, body.discountType, body.discountValue);

  let tableDoc = null;
  if (type === "dine-in") {
    if (!body.table) throw new Error("Table is required for dine-in orders.");
    tableDoc = await Table.findById(body.table);
    if (!tableDoc || !tableDoc.isActive) throw new Error("Selected table does not exist.");
  }

  const customer = {
    name: str(body.customer?.name || body.customerName, 80),
    phone: str(body.customer?.phone || body.phone, 20),
    address: str(body.customer?.address || body.address, 200),
    notes: str(body.customer?.notes || body.instructions, 200),
  };

  const payNow = Boolean(body.payNow);
  const amountReceived = Number(body.amountReceived);

  if (payNow) {
    if (isNaN(amountReceived) || amountReceived < totals.total) {
      throw new Error("Cash received must be at least equal to the total amount.");
    }
  }

  const orderData = {
    clientKey: clientKey || undefined,
    source,
    type,
    table: tableDoc?._id,
    customer,
    items,
    ...totals,
    status: isPos ? "preparing" : "pending",
    paymentStatus: payNow ? "paid" : "unpaid",
    paymentMethod: "cash",
    createdBy: user?._id || user?.id,
  };

  if (payNow) {
    orderData.amountReceived = r2(amountReceived);
    orderData.changeGiven = r2(amountReceived - totals.total);
    orderData.paidAt = new Date();
    orderData.receivedBy = user?._id || user?.id;
  }

  const order = await Order.create(orderData);

  if (tableDoc) {
    tableDoc.status = "occupied";
    await tableDoc.save();
  }

  return { order, duplicate: false };
}

export async function recordCashPayment(orderId, amountReceived, user) {
  const amount = Number(amountReceived);
  if (isNaN(amount) || amount <= 0) {
    throw new Error("A valid cash amount received is required.");
  }

  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found.");
  if (order.status === "cancelled") throw new Error("Cannot receive payment for a cancelled order.");
  if (order.paymentStatus === "paid") throw new Error("This order is already marked as paid.");
  if (amount < order.total) throw new Error("Cash received must cover the entire order total.");

  order.paymentStatus = "paid";
  order.amountReceived = r2(amount);
  order.changeGiven = r2(amount - order.total);
  order.paidAt = new Date();
  order.receivedBy = user?._id || user?.id;
  await order.save();

  return order;
}

export async function changeStatus(orderId, newStatus, reason = "") {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found.");

  const current = order.status;
  if (current === newStatus) return order;

  // Validate allowed transitions
  const allowed = TRANSITIONS[current] || [];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Cannot transition order from "${current}" to "${newStatus}".`);
  }

  if (newStatus === "completed" && order.paymentStatus !== "paid") {
    throw new Error("Order must be paid before it can be marked as completed.");
  }

  order.status = newStatus;
  if (newStatus === "cancelled") {
    order.cancelReason = str(reason, 200) || "Cancelled by staff";
  }

  await order.save();

  // Free table if dine-in order finishes or is cancelled
  if ((newStatus === "completed" || newStatus === "cancelled") && order.table) {
    await Table.findByIdAndUpdate(order.table, { status: "available" });
  }

  return order;
}
