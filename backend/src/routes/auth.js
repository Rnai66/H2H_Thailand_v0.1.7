import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getConnection, DBNAMES } from "../config/dbPool.js";
import { UserModel } from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = Router();

/* 🔐 สร้าง JWT */
function signToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role || "user",
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "90d" }
  );
}

/* ================================
   POST /api/auth/login
   - ตรวจอีเมล + รหัสผ่าน
   - คืน token + ข้อมูลผู้ใช้
================================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const conn = getConnection(DBNAMES.USER);
    const User = UserModel(conn);

    const user = await User.findOne({ email: String(email).toLowerCase() }).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid password" });

    const token = signToken(user);

    res.json({
      message: "✅ Login success",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    res.status(500).json({ message: "Login failed", error: e.message });
  }
});

/* ================================
   GET /api/auth/profile
   - ใช้ token (ผ่าน protect)
   - คืนข้อมูลโปรไฟล์ของ user
================================== */
router.get("/profile", protect, async (req, res) => {
  try {
    const conn = getConnection(DBNAMES.USER);
    const User = UserModel(conn);
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (e) {
    res.status(500).json({ message: "Failed to get profile", error: e.message });
  }
});

export default router;
