import mongoose from "mongoose";
import { nextOrderNumber } from "./Counter.js";

export const ORDER_TYPES = ["dine-in", "takeaway", "delivery"];
export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "completed",
  "cancelled",
];

const itemSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    id: { type: String },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, default: 1, min: 1 },
    qty: { type: Number, default: 1, min: 1 },
    image: { type: String, default: "" },
    notes: { type: String, default: "" },
    round: { type: Number, default: 1 },
  },
  { _id: false }
);

itemSchema.pre("validate", function () {
  if (this.qty && !this.quantity) this.quantity = this.qty;
  if (this.quantity && !this.qty) this.qty = this.quantity;
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: Number, unique: true, sparse: true },
    orderId: { type: String, unique: true, index: true },
    clientKey: { type: String, unique: true, sparse: true },

    source: { type: String, enum: ["online", "pos"], default: "online" },
    type: { type: String, enum: ORDER_TYPES, default: "delivery" },
    table: { type: mongoose.Schema.Types.ObjectId, ref: "Table" },
    guestCount: { type: Number, default: 1, min: 1 },
    billRequested: { type: Boolean, default: false },
    billRequestedAt: { type: Date },

    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    customer: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      address: { type: String, default: "" },
      notes: { type: String, default: "" },
    },

    customerName: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    instructions: { type: String, default: "" },

    items: {
      type: [itemSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "Order must contain at least one item.",
      },
    },

    subtotal: { type: Number, required: true, min: 0 },
    discountType: { type: String, enum: ["none", "percent", "amount"], default: "none" },
    discountValue: { type: Number, default: 0 },
    discount: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0 },
    tax: { type: Number, default: 0, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },

    status: { type: String, enum: ORDER_STATUSES, default: "pending" },
    cancelReason: { type: String, default: "" },

    paymentStatus: { type: String, enum: ["unpaid", "paid"], default: "unpaid" },
    paymentMethod: { type: String, enum: ["cash", "cod", "card"], default: "cash" },
    paidAt: { type: Date },
    amountReceived: { type: Number },
    changeGiven: { type: Number },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

orderSchema.pre("validate", async function () {
  // Sync legacy customer fields
  if (this.customerName && !this.customer?.name) {
    if (!this.customer) this.customer = {};
    this.customer.name = this.customerName;
  }
  if (this.phone && !this.customer?.phone) {
    if (!this.customer) this.customer = {};
    this.customer.phone = this.phone;
  }
  if (this.address && !this.customer?.address) {
    if (!this.customer) this.customer = {};
    this.customer.address = this.address;
  }
  if (this.instructions && !this.customer?.notes) {
    if (!this.customer) this.customer = {};
    this.customer.notes = this.instructions;
  }

  if (this.customer?.name && !this.customerName) this.customerName = this.customer.name;
  if (this.customer?.phone && !this.phone) this.phone = this.customer.phone;
  if (this.customer?.address && !this.address) this.address = this.customer.address;
  if (this.customer?.notes && !this.instructions) this.instructions = this.customer.notes;

  // Generate sequential orderNumber if new
  if (this.isNew && !this.orderNumber) {
    this.orderNumber = await nextOrderNumber();
  }
  if (!this.orderId) {
    this.orderId = this.orderNumber ? `#${this.orderNumber}` : `BH-${Date.now()}`;
  }
});

orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, paymentStatus: 1 });
orderSchema.index({ source: 1, status: 1 });

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;
