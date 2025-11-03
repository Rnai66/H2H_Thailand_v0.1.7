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
const allow = (process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:5173"]).map(s => s.trim());

app.use(cors({ origin: allow, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// small helpers
app.get("/", (_req, res) => res.json({ ok: true, name: "H2H API" }));
app.get("/favicon.ico", (_req, res) => res.status(204).end()); // กัน 404 favicon
app.get("/health", (_req, res) => res.json({ ok: true }));     // liveness เบื้องต้น

// ==== REST routes ====
app.use("/api/health", healthRoutes);       // /live, /ready, /db
app.use("/api/auth", authRoutes);
app.use("/api/items", itemsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/tokens", tokensRoutes);
app.use("/api/profiles", profilesRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/metrics", metricsRoutes);

// 404 fallback
app.use((_req, res) => res.status(404).json({ message: "Not Found" }));

// ==== HTTP + Socket.IO ====
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: allow, credentials: true },
  path: "/socket.io",
});

io.on("connection", (socket) => {
  console.log("💬 user connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("❌ user disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 H2H Backend running on port ${PORT}`));
