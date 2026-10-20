import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import multer from "multer";
import { uploadDir } from "../config/paths.js";

// Multer storage with randomized UUID filename to prevent path traversal
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    } catch (err) {
      cb(err, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext) ? ext : ".jpg";
    const uniqueName = `${crypto.randomUUID()}${safeExt}`;
    cb(null, uniqueName);
  },
});

// File filter restricting to JPG, PNG, and WebP
const fileFilter = (req, file, cb) => {
  const allowedMime = ["image/jpeg", "image/png", "image/webp"];
  if (allowedMime.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG or WebP images are allowed."));
  }
};

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter,
}).single("file");

// POST /api/upload — Secure image uploader
export const handleUpload = (req, res) => {
  uploadMiddleware(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "Image must be 5 MB or smaller." });
      }
      return res.status(400).json({ message: err.message || "Upload failed." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file was uploaded." });
    }

    // Relative URL served by static middleware
    const fileUrl = `/uploads/${req.file.filename}`;

    return res.status(200).json({
      url: fileUrl,
      publicId: req.file.filename,
      filename: req.file.filename,
      size: req.file.size,
    });
  });
};
