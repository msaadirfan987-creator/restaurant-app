import bcryptjs from "bcryptjs";
import Setting from "../models/Setting.js";
import User from "../models/user.js";

const sanitizeString = (str) =>
  typeof str === "string" ? str.replace(/[<>]/g, "").trim() : "";

// GET /api/settings — Public settings
export const getSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }
    return res.status(200).json({ settings });
  } catch (err) {
    next(err);
  }
};

// PUT /api/settings — Admin only
export const updateSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting();
    }

    const {
      restaurantName,
      tagline,
      phone,
      email,
      address,
      openingHours,
      deliveryFee,
      minOrderAmount,
    } = req.body || {};

    if (restaurantName) settings.restaurantName = sanitizeString(restaurantName);
    if (tagline !== undefined) settings.tagline = sanitizeString(tagline);
    if (phone !== undefined) settings.phone = sanitizeString(phone);
    if (email !== undefined) settings.email = sanitizeString(email).toLowerCase();
    if (address !== undefined) settings.address = sanitizeString(address);
    if (openingHours !== undefined) settings.openingHours = sanitizeString(openingHours);
    if (deliveryFee !== undefined && !isNaN(Number(deliveryFee))) {
      settings.deliveryFee = Math.max(0, Number(deliveryFee));
    }
    if (minOrderAmount !== undefined && !isNaN(Number(minOrderAmount))) {
      settings.minOrderAmount = Math.max(0, Number(minOrderAmount));
    }

    await settings.save();

    return res.status(200).json({
      message: "Restaurant settings updated successfully.",
      settings,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/settings/change-password — Admin password update
export const changeAdminPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body || {};

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      typeof confirmPassword !== "string"
    ) {
      return res.status(400).json({ message: "All password fields are required." });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords do not match." });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters long." });
    }

    if (newPassword.length > 72) {
      return res.status(400).json({ message: "Password cannot exceed 72 characters." });
    }

    const user = await User.findById(req.user.id).select("+passwordHash");
    if (!user) {
      return res.status(404).json({ message: "Admin account not found." });
    }

    const passwordOk = await bcryptjs.compare(currentPassword, user.passwordHash);
    if (!passwordOk) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    user.passwordHash = await bcryptjs.hash(newPassword, 12);
    user.tokenVersion = (user.tokenVersion || 0) + 1; // Invalidate previous tokens
    await user.save();

    return res.status(200).json({
      message: "Password changed successfully. Please log in again with your new password.",
    });
  } catch (err) {
    next(err);
  }
};
