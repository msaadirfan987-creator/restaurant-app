import express from "express";
import cors from "cors";
import helmet from "helmet";

const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "🍽️ Restruent API is healthy",
    timestamp: new Date().toISOString(),
  });
});

export default app;
