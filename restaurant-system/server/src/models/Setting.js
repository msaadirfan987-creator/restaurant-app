import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    restaurantName: {
      type: String,
      default: "Burger House",
      trim: true,
      maxlength: [100, "Restaurant name cannot exceed 100 characters."],
    },
    tagline: {
      type: String,
      default: "Artisanal Crafted Burgers & Cafe",
      trim: true,
      maxlength: [150, "Tagline cannot exceed 150 characters."],
    },
    phone: {
      type: String,
      default: "+92 300 1234567",
      trim: true,
      maxlength: [30, "Phone cannot exceed 30 characters."],
    },
    email: {
      type: String,
      default: "contact@burgerhouse.com",
      trim: true,
      maxlength: [100, "Email cannot exceed 100 characters."],
    },
    address: {
      type: String,
      default: "Plot 12-C, Food Street, Phase 5, DHA, Karachi",
      trim: true,
      maxlength: [200, "Address cannot exceed 200 characters."],
    },
    openingHours: {
      type: String,
      default: "12:00 PM – 02:00 AM Daily",
      trim: true,
      maxlength: [100, "Opening hours cannot exceed 100 characters."],
    },
    deliveryFee: {
      type: Number,
      default: 150,
      min: 0,
      max: 10000,
    },
    minOrderAmount: {
      type: Number,
      default: 500,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Setting = mongoose.models.Setting || mongoose.model("Setting", settingSchema);
export default Setting;
