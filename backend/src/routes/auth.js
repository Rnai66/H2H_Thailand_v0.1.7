// backend/src/routes/auth.js
import { Router } from "express";
import jwt from "jsonwebtoken";
import { requireAuth } from "../middlewares/requireAuth.js";

const r = Router();

/** DEV login (ใช้ JWT จริงจาก JWT_SECRET)
 * body: { email, password }
 * *ยังไม่ผูก User DB จริง เพื่อเริ่มงานโพสต์ขายได้ก่อน*
 */
r.post("/login", (req, res) => {
  const { email = "login@test.com", password } = req.body || {};
  const user = {
    id: "6902f3370b58aadf3954565d",
    email,
    name: "LoginTester",
    role: "admin",
  };
  const token = jwt.sign(user, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "90d",
  });
  res.json({ message: "✅ Login success", token, user });
});

r.get("/profile", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default r;
