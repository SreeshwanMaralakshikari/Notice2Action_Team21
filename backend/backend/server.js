import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import noticeRouter from "./APIs/NoticeAPI.js";

dotenv.config();

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/notice-api", noticeRouter);

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

// ── DB + listen ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.DB_URL)
  .then(() => {
    console.log("✅  MongoDB connected");
    app.listen(PORT, () => console.log(`🚀  Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("❌  MongoDB connection failed:", err.message);
    process.exit(1);
  });
