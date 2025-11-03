// backend/src/routes/tokens.js
import { Router } from "express";
import { getConnection, DBNAMES } from "../config/dbPool.js";
import { TokenModel } from "../models/Token.js";
import { protect, authorize, ownerOrAdmin } from "../middleware/auth.js";
import { parsePaging } from "../helpers/pagination.js";
import { tokenCreateSchema, tokenUpdateSchema } from "../validation/tokens.js";
import mongoose from "mongoose";

const router = Router();
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id || "");

// GET /api/tokens (admin only)
router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { page, limit, skip } = parsePaging(req);
    const conn = getConnection(DBNAMES.TOKEN);
    const Token = TokenModel(conn);

    const where = { isDeleted: { $ne: true } };

    const [tokens, total] = await Promise.all([
      Token.find(where).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Token.countDocuments(where),
    ]);

    res.json({ page, limit, total, tokens });
  } catch (e) {
    res.status(500).json({ message: "Failed to list tokens", error: e.message });
  }
});

// GET /api/tokens/:id (owner or admin)
router.get(
  "/:id",
  protect,
  ownerOrAdmin(async (req) => {
    if (!isValidObjectId(req.params.id)) return null;
    const conn = getConnection(DBNAMES.TOKEN);
    const Token = TokenModel(conn);
    const t = await Token.findById(req.params.id).lean();
    return t?.ownerId; // ownerOrAdmin จะเช็กให้
  }),
  async (req, res) => {
    try {
      if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid token id" });
      }
      const conn = getConnection(DBNAMES.TOKEN);
      const Token = TokenModel(conn);
      const token = await Token.findById(req.params.id).lean();
      if (!token || token.isDeleted) return res.status(404).json({ message: "Token not found" });
      res.json({ token });
    } catch (e) {
      res.status(500).json({ message: "Failed to get token", error: e.message });
    }
  }
);

// POST /api/tokens (owner or admin)
router.post("/", protect, async (req, res) => {
  try {
    const parsed = tokenCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });
    }
    const data = parsed.data;

    // ต้องเป็นเจ้าของเอง ยกเว้น role = admin
    if (String(data.ownerId) !== String(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "ownerId must match your user id unless admin" });
    }

    const conn = getConnection(DBNAMES.TOKEN);
    const Token = TokenModel(conn);
    const t = await Token.create(data);
    res.status(201).json({ token: t.toObject() });
  } catch (e) {
    res.status(500).json({ message: "Failed to create token", error: e.message });
  }
});

// PUT /api/tokens/:id (owner or admin)
router.put(
  "/:id",
  protect,
  ownerOrAdmin(async (req) => {
    if (!isValidObjectId(req.params.id)) return null;
    const conn = getConnection(DBNAMES.TOKEN);
    const Token = TokenModel(conn);
    const t = await Token.findById(req.params.id).lean();
    return t?.ownerId;
  }),
  async (req, res) => {
    try {
      if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid token id" });
      }

      const parsed = tokenUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });
      }
      const update = { ...parsed.data };

      // soft-delete normalize
      if (update.isDeleted === true) update.deletedAt = new Date();
      if (update.isDeleted === false) update.deletedAt = null;

      const conn = getConnection(DBNAMES.TOKEN);
      const Token = TokenModel(conn);
      const t = await Token.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
      if (!t) return res.status(404).json({ message: "Token not found" });
      res.json({ token: t });
    } catch (e) {
      res.status(500).json({ message: "Failed to update token", error: e.message });
    }
  }
);

// DELETE /api/tokens/:id (owner or admin, soft-delete)
router.delete(
  "/:id",
  protect,
  ownerOrAdmin(async (req) => {
    if (!isValidObjectId(req.params.id)) return null;
    const conn = getConnection(DBNAMES.TOKEN);
    const Token = TokenModel(conn);
    const t = await Token.findById(req.params.id).lean();
    return t?.ownerId;
  }),
  async (req, res) => {
    try {
      if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid token id" });
      }
      const conn = getConnection(DBNAMES.TOKEN);
      const Token = TokenModel(conn);
      const t = await Token.findByIdAndUpdate(
        req.params.id,
        { isDeleted: true, deletedAt: new Date() },
        { new: true }
      ).lean();
      if (!t) return res.status(404).json({ message: "Token not found" });
      res.json({ message: "Token soft-deleted", token: t });
    } catch (e) {
      res.status(500).json({ message: "Failed to delete token", error: e.message });
    }
  }
);

export default router;
