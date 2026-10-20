import express from "express";
import cors from "cors";
import helmet from "helmet";
import connectDB from "./config/db.js";

// Import all API routes
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import panelRoutes from "./routes/panelRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import cashierRoutes from "./routes/cashierRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import tableRoutes from "./routes/tableRoutes.js";
import settingRoutes from "./routes/settingRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

const app = express();

// ── Security & Headers ───────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS with credentials for cookies and authorization headers
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5000",
  "https://restaurant-app-eight-nu.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Lightweight cookie parsing middleware
app.use((req, res, next) => {
  if (!req.cookies) {
    req.cookies = {};
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      cookieHeader.split(";").forEach((pair) => {
        const idx = pair.indexOf("=");
        if (idx > -1) {
          const key = pair.substring(0, idx).trim();
          const val = pair.substring(idx + 1).trim();
          try {
            req.cookies[key] = decodeURIComponent(val);
          } catch {
            req.cookies[key] = val;
          }
        }
      });
    }
  }
  next();
});

// ── Root Test Route & Health Check ───────────────────────────
app.get("/", (req, res) => {
  res.status(200).send("API running");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Restruent API is healthy",
    timestamp: new Date().toISOString(),
  });
});

// ── Database Connection Middleware (Serverless Cached) ───────
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    res.status(500).json({ error: "Database connection failed", message: err.message });
  }
});

// ── Mount All API Routes ─────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/panels", panelRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cashier", cashierRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/upload", uploadRoutes);

// ── Error Handling Middleware ────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Express unhandled error:", err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: err.message || "Internal server error occurred.",
  });
});

export default app;
