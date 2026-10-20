import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config();

// Custom DNS fallback for local dev if needed
if (!process.env.VERCEL) {
  try {
    const dns = await import("node:dns");
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  } catch {
    // Ignore DNS override errors
  }
}

import connectDB from "./src/config/db.js";
import app from "./src/app.js";

// Ensure DB is connected before handling any incoming serverless request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("❌ MongoDB Connection Error in Request:", error.message);
    res.status(500).json({ error: "Database connection failed" });
  }
});

const PORT = process.env.PORT || 5000;

// Only listen locally, Vercel invokes exported app serverlessly
if (!process.env.VERCEL) {
  const startServer = async () => {
    try {
      await connectDB();
      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
      });
    } catch (err) {
      console.error("Failed to start local server:", err);
    }
  };

  startServer();
}

export default app;
