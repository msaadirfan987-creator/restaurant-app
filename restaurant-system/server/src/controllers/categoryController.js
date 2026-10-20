import mongoose from "mongoose";
import Category from "../models/Category.js";
import Product from "../models/Product.js";

// Helper: Sanitize string input against HTML/script injection
const sanitizeString = (str) =>
  typeof str === "string" ? str.replace(/[<>]/g, "").trim() : "";

// GET /api/categories — Public endpoint
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ createdAt: 1 });

    // Compute live productCount for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const count = await Product.countDocuments({
          category: cat._id,
          isAvailable: true,
        });
        return {
          id: cat._id.toString(),
          _id: cat._id.toString(),
          name: cat.name,
          description: cat.description || "",
          image: cat.image?.url ? cat.image : null,
          productCount: count,
          createdAt: cat.createdAt,
        };
      })
    );

    return res.status(200).json({ items: categoriesWithCount });
  } catch (err) {
    next(err);
  }
};

// POST /api/categories — Admin only
export const createCategory = async (req, res, next) => {
  try {
    const name = sanitizeString(req.body?.name);
    const description = sanitizeString(req.body?.description);
    const image = req.body?.image; // { url, publicId } or null

    if (!name || name.length < 2) {
      return res.status(400).json({
        errors: { name: "Category name must be at least 2 characters." },
      });
    }

    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });
    if (existing) {
      return res.status(409).json({
        errors: { name: "A category with this name already exists." },
      });
    }

    const category = await Category.create({
      name,
      description,
      image: image?.url ? { url: image.url, publicId: image.publicId || "" } : null,
    });

    return res.status(201).json({
      message: "Category created successfully.",
      category: {
        id: category._id.toString(),
        _id: category._id.toString(),
        name: category.name,
        description: category.description,
        image: category.image,
        productCount: 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/categories/:id — Admin only
export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid category ID." });
    }

    const name = sanitizeString(req.body?.name);
    const description = sanitizeString(req.body?.description);
    const image = req.body?.image;

    if (name && name.length < 2) {
      return res.status(400).json({
        errors: { name: "Category name must be at least 2 characters." },
      });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (image !== undefined) {
      category.image = image?.url ? { url: image.url, publicId: image.publicId || "" } : null;
    }

    await category.save();

    const count = await Product.countDocuments({ category: category._id, isAvailable: true });

    return res.status(200).json({
      message: "Category updated successfully.",
      category: {
        id: category._id.toString(),
        _id: category._id.toString(),
        name: category.name,
        description: category.description,
        image: category.image,
        productCount: count,
      },
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/categories/:id — Admin only
export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid category ID." });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    // Safety check: Prevent deletion if products are assigned
    const assignedProducts = await Product.countDocuments({ category: id });
    if (assignedProducts > 0) {
      return res.status(409).json({
        message: `Category "${category.name}" still has ${assignedProducts} product(s). Move or delete them first.`,
      });
    }

    await Category.findByIdAndDelete(id);

    return res.status(200).json({ message: "Category deleted successfully." });
  } catch (err) {
    next(err);
  }
};
