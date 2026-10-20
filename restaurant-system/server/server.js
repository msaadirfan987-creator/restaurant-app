import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config();

// Custom DNS fallback for local dev if needed
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  try {
    const dns = await import("node:dns");
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  } catch {
    // Ignore DNS override errors
  }
}

import app from "./src/app.js";

// Only call app.listen() when NODE_ENV is not "production"
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running locally on port ${PORT}`);
  });
}

// Export the Express app for Vercel serverless invocation
export default app;
