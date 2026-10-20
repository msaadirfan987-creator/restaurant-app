import mongoose from "mongoose";

// Menu item ka structure (restaurant ka khaana)
const menuItemSchema = new mongoose.Schema(
  {
    // Item ka naam (e.g. "Chicken Burger")
    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
    },

    // Short description (optional)
    description: {
      type: String,
    },

    // Price — 0 ya usse zyada hona chahiye
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },

    // Category (e.g. Starters, Main Course, Drinks, Desserts)
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },

    // Image ka URL (optional)
    image: {
      type: String,
    },

    // Item available hai ya nahi
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const MenuItem = mongoose.model("MenuItem", menuItemSchema);

export default MenuItem;
