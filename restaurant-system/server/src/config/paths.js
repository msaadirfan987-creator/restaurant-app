import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// On Vercel serverless functions, the root filesystem is read-only except /tmp
export const uploadDir = process.env.VERCEL
  ? "/tmp/uploads"
  : path.join(__dirname, "..", "..", "uploads");

// Ensure upload directory exists inside try/catch so failure never crashes startup
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  console.warn("⚠️ Warning: Could not create upload directory at startup:", err.message);
}
