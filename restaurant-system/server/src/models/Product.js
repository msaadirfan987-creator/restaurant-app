import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required."],
      trim: true,
      minlength: [2, "Name must be at least 2 characters."],
      maxlength: [100, "Name cannot exceed 100 characters."],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters."],
      default: "",
    },
    price: {
      type: Number,
      required: [true, "Price is required."],
      min: [0, "Price cannot be negative."],
      max: [1000000, "Price exceeds allowed limit."],
    },
    discountPrice: {
      type: Number,
      default: null,
      min: [0, "Discount price cannot be negative."],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required."],
    },
    images: {
      type: [String],
      default: [],
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    if (ret.category && typeof ret.category === "object" && ret.category._id) {
      ret.category = {
        id: ret.category._id.toString(),
        name: ret.category.name,
      };
    }
    return ret;
  },
});

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
export default Product;
