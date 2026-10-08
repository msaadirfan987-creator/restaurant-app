require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const connectDB = require("./config/db");

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Base route
app.get("/", (req, res) => {
  res.json({ message: "🍽️ Restruent API is running..." });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
