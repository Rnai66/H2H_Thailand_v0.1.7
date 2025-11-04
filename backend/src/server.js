// backend/src/server.js
import express from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { Server as SocketIOServer } from "socket.io";

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

dotenv.config();

const app = express();

// ===== CORS allow-list (comma-separated) =====
const allow = (process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:5173"])
  .map(s => s.trim())
  .filter(Boolean);

// If you want to allow credentials with multiple origins, provide a function:
const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true); // allow non-browser tools (curl/postman)
    const ok = allow.includes(origin);
    callback(ok ? null : new Error("CORS blocked: " + origin), ok);
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // preflight for all

// ===== parsers / logging =====
app.use(express.json({ limit: "1mb" })); // adjust if you need bigger
app.use(cookieParser());
app.use(morgan("dev"));

// ===== small helpers =====
app.get("/", (_req, res) => res.json({ ok: true, name: "H2H API" }));
app.get("/favicon.ico", (_req, res) => res.status(204).end()); // avoid 404 noise
app.get("/health", (_req, res) => res.json({ ok: true }));     // simple liveness

// Optional readiness (extend in healthRoutes to check DB later)
app.get("/api/health/ready", (_req, res) => res.json({ ready: true }));

// ===== REST routes =====
app.use("/api/health", healthRoutes);       // e.g., /live, /ready, /db (as you implemented)
app.use("/api/auth", authRoutes);
app.use("/api/items", itemsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/tokens", tokensRoutes);
app.use("/api/profiles", profilesRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/metrics", metricsRoutes);

// ===== 404 fallback =====
app.use((_req, res) => res.status(404).json({ message: "Not Found" }));

// ===== error handler (must be after routes) =====
/* eslint-disable no-unused-vars */
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const msg = err.message || "Internal Server Error";
  if (process.env.NODE_ENV !== "test") {
    console.error("❌ Error:", msg);
  }
  res.status(status).json({ error: msg });
});
/* eslint-enable no-unused-vars */

// ===== HTTP + Socket.IO =====
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { ...corsOptions },
  path: "/socket.io",
});

io.on("connection", (socket) => {
  console.log("💬 user connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ user disconnected:", socket.id);
  });
});

// ===== boot & gracef
// ===== boot & graceful shutdown =====
import { connectAll, closeAll } from "./config/db.js";

const PORT = process.env.PORT || 4000;

server.listen(PORT, async () => {
  try {
    await connectAll(); // เชื่อม DB พื้นฐานให้พร้อมก่อนรับโหลด
    console.log(`🚀 H2H Backend running on port ${PORT}`);
  } catch (err) {
    console.error("❌ DB init failed:", err?.message || err);
    process.exit(1);
  }
});

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

  // กันแขวน
  setTimeout(() => {
    console.warn("⏱ Force exit.");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// (optional) export for tests
export { app, server, io };
