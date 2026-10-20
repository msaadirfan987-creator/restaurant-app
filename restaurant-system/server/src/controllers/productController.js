import mongoose from "mongoose";
import Product from "../models/Product.js";
import Category from "../models/Category.js";

const sanitizeString = (str) =>
  typeof str === "string" ? str.replace(/[<>]/g, "").trim() : "";

// GET /api/products — Public queryable catalog endpoint
export const getProducts = async (req, res, next) => {
  try {
    const { category, featured, search } = req.query;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const skip = (page - 1) * limit;

    const filter = {};

    // Filter by category
    if (category && mongoose.Types.ObjectId.isValid(category)) {
      filter.category = new mongoose.Types.ObjectId(category);
    }

    // Filter by featured
    if (featured === "true" || featured === true) {
      filter.isFeatured = true;
    }

    // Filter by search query (prevent regex injection by escaping special characters)
    if (search && typeof search === "string" && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.name = { $regex: new RegExp(escaped, "i") };
    }

    // If customer query (not explicitly asking for admin view), show only available
    if (!req.user || req.user.role !== "admin") {
      filter.isAvailable = true;
    }

    const [items, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name")
        .sort({ isFeatured: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    const formatted = items.map((p) => ({
      id: p._id.toString(),
      _id: p._id.toString(),
      name: p.name,
      description: p.description || "",
      price: p.price,
      discountPrice: p.discountPrice != null ? p.discountPrice : null,
      category: p.category
        ? {
            id: p.category._id?.toString() || p.category.toString(),
            name: p.category.name || "General",
          }
        : null,
      images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [],
      isFeatured: Boolean(p.isFeatured),
      isAvailable: Boolean(p.isAvailable),
      createdAt: p.createdAt,
    }));

    return res.status(200).json({
      items: formatted,
      total,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/products/:id — Single product
export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID." });
    }

    const product = await Product.findById(id).populate("category", "name");
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    return res.status(200).json({
      product: {
        id: product._id.toString(),
        _id: product._id.toString(),
        name: product.name,
        description: product.description,
        price: product.price,
        discountPrice: product.discountPrice,
        category: product.category
          ? { id: product.category._id.toString(), name: product.category.name }
          : null,
        images: product.images,
        isFeatured: product.isFeatured,
        isAvailable: product.isAvailable,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/products — Admin only
export const createProduct = async (req, res, next) => {
  try {
    const name = sanitizeString(req.body?.name);
    const description = sanitizeString(req.body?.description);
    const price = Number(req.body?.price);
    const discountPrice =
      req.body?.discountPrice != null && req.body?.discountPrice !== ""
        ? Number(req.body.discountPrice)
        : null;
    const categoryId = req.body?.category || req.body?.categoryId;
    const images = Array.isArray(req.body?.images)
      ? req.body.images.filter((img) => typeof img === "string" && img.trim())
      : [];
    const isFeatured = Boolean(req.body?.isFeatured);
    const isAvailable = req.body?.isAvailable !== undefined ? Boolean(req.body.isAvailable) : true;

    const errors = {};
    if (!name || name.length < 2) errors.name = "Product name must be at least 2 characters.";
    if (isNaN(price) || price < 0) errors.price = "Price must be a positive number.";
    if (discountPrice != null && (isNaN(discountPrice) || discountPrice < 0 || discountPrice >= price)) {
      errors.discountPrice = "Discount price must be less than the regular price.";
    }
    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
      errors.category = "Please select a valid category.";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      return res.status(400).json({ errors: { category: "Selected category does not exist." } });
    }

    const product = await Product.create({
      name,
      description,
      price,
      discountPrice,
      category: categoryId,
      images,
      isFeatured,
      isAvailable,
    });

    await Category.findByIdAndUpdate(categoryId, { $inc: { productCount: 1 } });

    return res.status(201).json({
      message: "Product created successfully.",
      product: {
        id: product._id.toString(),
        _id: product._id.toString(),
        name: product.name,
        description: product.description,
        price: product.price,
        discountPrice: product.discountPrice,
        category: { id: categoryExists._id.toString(), name: categoryExists.name },
        images: product.images,
        isFeatured: product.isFeatured,
        isAvailable: product.isAvailable,
      },
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/products/:id — Admin only
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID." });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const name = sanitizeString(req.body?.name);
    const description = sanitizeString(req.body?.description);
    const price = req.body?.price != null ? Number(req.body.price) : product.price;
    const discountPrice =
      req.body?.discountPrice !== undefined
        ? req.body.discountPrice === null || req.body.discountPrice === ""
          ? null
          : Number(req.body.discountPrice)
        : product.discountPrice;
    const categoryId = req.body?.category || req.body?.categoryId || product.category;
    const images = Array.isArray(req.body?.images) ? req.body.images : product.images;
    const isFeatured =
      req.body?.isFeatured !== undefined ? Boolean(req.body.isFeatured) : product.isFeatured;
    const isAvailable =
      req.body?.isAvailable !== undefined ? Boolean(req.body.isAvailable) : product.isAvailable;

    const errors = {};
    if (name && name.length < 2) errors.name = "Product name must be at least 2 characters.";
    if (isNaN(price) || price < 0) errors.price = "Price must be a positive number.";
    if (discountPrice != null && (isNaN(discountPrice) || discountPrice < 0 || discountPrice >= price)) {
      errors.discountPrice = "Discount price must be less than the regular price.";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    product.price = price;
    product.discountPrice = discountPrice;
    product.images = images;
    product.isFeatured = isFeatured;
    product.isAvailable = isAvailable;

    if (categoryId && categoryId.toString() !== product.category.toString()) {
      await Category.findByIdAndUpdate(product.category, { $inc: { productCount: -1 } });
      product.category = categoryId;
      await Category.findByIdAndUpdate(categoryId, { $inc: { productCount: 1 } });
    }

    await product.save();
    await product.populate("category", "name");

    return res.status(200).json({
      message: "Product updated successfully.",
      product: {
        id: product._id.toString(),
        _id: product._id.toString(),
        name: product.name,
        description: product.description,
        price: product.price,
        discountPrice: product.discountPrice,
        category: product.category
          ? { id: product.category._id.toString(), name: product.category.name }
          : null,
        images: product.images,
        isFeatured: product.isFeatured,
        isAvailable: product.isAvailable,
      },
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/products/:id — Admin only
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID." });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    await Category.findByIdAndUpdate(product.category, { $inc: { productCount: -1 } });
    await Product.findByIdAndDelete(id);

    return res.status(200).json({ message: "Product deleted successfully." });
  } catch (err) {
    next(err);
  }
};
