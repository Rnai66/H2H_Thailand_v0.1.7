import express from "express";
import http from "http";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";
import { corsOptions } from "./middleware/cors.js"; // ✅ ใช้ตัวเดียวพอ

// ===== routes =====
import authRoutes from "./routes/auth.js";
import itemsRoutes from "./routes/items.js";
import usersRoutes from "./routes/users.js";
import paymentsRoutes from "./routes/payments.js";
import tokensRoutes from "./routes/tokens.js";
import profilesRoutes from "./routes/profiles.js";
import healthRoutes from "./routes/healthRoutes.js";
import dashboardRoutes from "./routes/dashboard.js";
import metricsRoutes from "./routes/metrics.js";

import { connectAll, closeAll } from "./config/db.js";

dotenv.config();

const app = express();

// ===== CORS (เปิดใช้งานก่อนทุกอย่าง) =====
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Preflight สำหรับทุก route

// ===== parsers / logging =====
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(morgan("dev"));

// ===== basic routes =====
app.get("/", (_req, res) => res.json({ ok: true, name: "H2H API" }));
app.get("/favicon.ico", (_req, res) => res.status(204).end());
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/api/health/ready", (_req, res) => res.json({ ready: true }));

// ===== main REST routes =====
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/items", itemsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/tokens", tokensRoutes);
app.use("/api/profiles", profilesRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/metrics", metricsRoutes);

// ===== fallback =====
app.use((_req, res) => res.status(404).json({ message: "Not Found" }));

// ===== error handler =====
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const msg = err.message || "Internal Server Error";
  console.error("❌ Error:", msg);
  res.status(status).json({ error: msg });
});

// ===== HTTP + Socket.IO =====
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: corsOptions,
  path: "/socket.io",
});

io.on("connection", (socket) => {
  console.log("💬 user connected:", socket.id);
  socket.on("disconnect", () => console.log("❌ user disconnected:", socket.id));
});

// ===== start server =====
const PORT = process.env.PORT || 4000;
server.listen(PORT, async () => {
  try {
    await connectAll();
    console.log(`🚀 H2H Backend running on port ${PORT}`);
  } catch (err) {
    console.error("❌ DB init failed:", err?.message || err);
    process.exit(1);
  }
});

// ===== graceful shutdown =====
function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  io.close(() => {
    server.close(async () => {
      try {
        await closeAll();
        console.log("✅ HTTP & DB closed.");
      } catch (e) {
        console.warn("⚠️ closeAll error:", e?.message || e);
      }
      process.exit(0);
    });
  });
  setTimeout(() => {
    console.warn("⏱ Force exit.");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

export { app, server, io };
