// backend/src/routes/profiles.js
import { Router } from "express";
import { getConnection, DBNAMES } from "../config/dbPool.js";
import { ProfileModel } from "../models/Profile.js";
import { protect, authorize } from "../middleware/auth.js";
import { parsePaging } from "../helpers/pagination.js";
import mongoose from "mongoose";

const router = Router();
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id || "");

// --------- My Profile ---------
router.get("/me", protect, async (req, res) => {
  try {
    const conn = getConnection(DBNAMES.PROFILE);
    const Profile = ProfileModel(conn);

    let p = await Profile.findOne({ userId: req.user.id }).lean();
    if (!p) {
      p = await Profile.create({ userId: req.user.id });
      p = p.toObject();
    }
    res.json({ profile: p });
  } catch (e) {
    res.status(500).json({ message: "Get my profile failed", error: e.message });
  }
});

router.put("/me", protect, async (req, res) => {
  try {
    const conn = getConnection(DBNAMES.PROFILE);
    const Profile = ProfileModel(conn);

    const allowed = ["displayName", "bio", "avatarUrl", "phone", "address", "socials"];
    const update = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) {
        // trim แบบเบาๆ สำหรับ string
        update[k] = typeof req.body[k] === "string" ? req.body[k].trim() : req.body[k];
      }
    }

    const p = await Profile.findOneAndUpdate(
      { userId: req.user.id },
      { $set: update },
      { new: true, upsert: true }
    ).lean();

    res.json({ profile: p });
  } catch (e) {
    res.status(500).json({ message: "Update my profile failed", error: e.message });
  }
});

// --------- Admin Only ---------
router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { page, limit, skip, sort } = parsePaging(req); // ถ้ามี sort ใน helper จะใช้เลย
    const conn = getConnection(DBNAMES.PROFILE);
    const Profile = ProfileModel(conn);

    const [rows, total] = await Promise.all([
      Profile.find().sort(sort || { createdAt: -1 }).skip(skip).limit(limit).lean(),
      Profile.countDocuments(),
    ]);

    res.json({ page, limit, total, profiles: rows });
  } catch (e) {
    res.status(500).json({ message: "List profiles failed", error: e.message });
  }
});

router.get("/:userId", protect, authorize("admin"), async (req, res) => {
  try {
    const { userId } = req.params;
    const conn = getConnection(DBNAMES.PROFILE);
    const Profile = ProfileModel(conn);

    // รองรับทั้งกรณี userId เป็น ObjectId หรือเก็บเป็น string
    const query = isValidObjectId(userId)
      ? { $or: [{ userId }, { userId: new mongoose.Types.ObjectId(userId) }] }
      : { userId };

    const p = await Profile.findOne(query).lean();
    if (!p) return res.status(404).json({ message: "Profile not found" });
    res.json({ profile: p });
  } catch (e) {
    res.status(500).json({ message: "Get profile failed", error: e.message });
  }
});

router.delete("/:userId", protect, authorize("admin"), async (req, res) => {
  try {
    const { userId } = req.params;
    const conn = getConnection(DBNAMES.PROFILE);
    const Profile = ProfileModel(conn);

    const query = isValidObjectId(userId)
      ? { $or: [{ userId }, { userId: new mongoose.Types.ObjectId(userId) }] }
      : { userId };

    const r = await Profile.findOneAndDelete(query);
    if (!r) return res.status(404).json({ message: "Profile not found" });
    res.json({ message: "Profile deleted" });
  } catch (e) {
    res.status(500).json({ message: "Delete profile failed", error: e.message });
  }
});

export default router;
