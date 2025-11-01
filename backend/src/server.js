// backend/src/server.js
import express from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import itemsRoutes from "./routes/items.js";
import paymentsRoutes from "./routes/payments.js";
import tokensRoutes from "./routes/tokens.js";
import profilesRoutes from "./routes/profiles.js";
import dashboardRoutes from "./routes/dashboard.js";
import { initChatSocket } from "./socket/chatSocket.js";

import { getConn } from "./config/db.js";
import { getItemModel } from "./models/Item.js";

// load env ก่อนใช้ process.env
dotenv.config();

const app = express();
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:5173"]).map(s=>s.trim()),
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/items", itemsRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/tokens", tokensRoutes);
app.use("/api/profiles", profilesRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (_req, res) =>
  res.json({ message:"✅ H2H API is running" })
);
app.get("/favicon.ico", (_req, res)=>res.status(204).end());

app.use((_req,res)=>res.status(404).json({message:"Not Found"}));

const server = http.createServer(app);
initChatSocket(server);

const PORT = Number(process.env.PORT || 4000);
server.listen(PORT, async () => {
  console.log(`🚀 H2H Backend running on port ${PORT}`);
  // warm ทุกคอนเนคชัน + โมเดล item กัน timeout
  try {
    await Promise.all([
      getConn(process.env.DB_USER || "user_db"),
      getConn(process.env.DB_ITEM || "item_db"),
      getConn(process.env.DB_PAYMENT || "payment_db"),
      getConn(process.env.DB_TOKEN || "token_db"),
      getConn(process.env.DB_PROFILE || "profile_db"),
    ]);
    const itemConn = await getConn(process.env.DB_ITEM || "item_db");
    const Item = getItemModel(itemConn);
    await Item.findOne().lean().exec();
    console.log("✅ [DB] item_db warm OK");
  } catch (e) {
    console.warn("⚠️ [DB] warm failed:", e.message);
  }
});
