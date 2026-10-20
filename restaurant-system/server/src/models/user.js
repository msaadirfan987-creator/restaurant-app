import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
      minlength: [2, "Name must be at least 2 characters."],
      maxlength: [60, "Name cannot exceed 60 characters."],
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [254, "Email address cannot exceed 254 characters."],
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address."],
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [25, "Phone number cannot exceed 25 characters."],
      default: "",
    },
    passwordHash: {
      type: String,
      select: false, // Never returned in default queries
    },
    password: {
      type: String,
      select: false, // Legacy field fallback
    },
    role: {
      type: String,
      enum: ["customer", "admin", "kitchen", "cashier", "waiter", "user"],
      default: "customer",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Method to verify candidate password against stored passwordHash (or legacy password) using bcrypt
userSchema.methods.comparePassword = async function (candidatePassword) {
  const hash = this.passwordHash || this.password;
  if (!hash || typeof candidatePassword !== "string") return false;
  const isMatch = await bcryptjs.compare(candidatePassword, hash);
  if (isMatch && !this.passwordHash && this.password) {
    // Automatically migrate legacy password field to passwordHash
    this.passwordHash = this.password;
    if (this.role === "user") this.role = "customer";
    await this.save().catch(() => {});
  }
  return isMatch;
};

// Static helper to hash passwords securely (12 rounds)
userSchema.statics.hashPassword = async function (plainPassword) {
  return await bcryptjs.hash(plainPassword, 12);
};

// Ensure password and passwordHash are never leaked in JSON serialization
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.password;
    delete ret.__v;
    if (ret.role === "user") ret.role = "customer";
    return ret;
  },
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
