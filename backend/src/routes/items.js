// backend/src/routes/items.js
import { Router } from "express";
import mongoose from "mongoose";
import { getConn } from "../config/db.js";
import { getItemModel } from "../models/Item.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const r = Router();
const SAFE_SORT_FIELDS = new Set(["createdAt", "updatedAt", "price", "title", "_id"]);

async function getItem() {
  const conn = await getConn(process.env.DB_ITEM || "item_db");
  return getItemModel(conn);
}

function parseBool(v) {
  return v === "1" || v === "true" || v === true;
}

function parsePaging(q) {
  let page = Number(q.page || 1);
  let limit = Number(q.limit || 10);
  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(limit) || limit < 1) limit = 10;
  if (limit > 100) limit = 100; // กันยิงหนัก
  return { page, limit };
}

function parseSort(q) {
  const param = String(q.sort || "-createdAt");
  // รองรับรูปแบบ: -createdAt, createdAt, price, -price, ...
  const desc = param.startsWith("-");
  const field = desc ? param.slice(1) : param;
  if (!SAFE_SORT_FIELDS.has(field)) {
    return { createdAt: -1 }; // fallback ปลอดภัย
  }
  return { [field]: desc ? -1 : 1 };
}

// ---------- List (public) ----------
r.get("/", async (req, res) => {
  try {
    const Item = await getItem();
    const { page, limit } = parsePaging(req.query);
    const sort = parseSort(req.query);

    const q = (req.query.q || "").toString().trim();
    const status = (req.query.status || "").toString().trim();
    const includeDeleted = parseBool(req.query.includeDeleted);

    const where = {};
    if (!includeDeleted) where.isDeleted = false;
    if (status) where.status = status;
    if (q) where.title = { $regex: q, $options: "i" };

    const [items, total] = await Promise.all([
      Item.find(where).sort(sort).skip((page - 1) * limit).limit(limit).lean().exec(),
      Item.countDocuments(where).exec(),
    ]);

    res.json({ page, limit, total, items });
  } catch (e) {
    res.status(500).json({ message: e?.message || "List failed" });
  }
});

// ---------- Get one (public) ----------
r.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "invalid id" });
    }
    const Item = await getItem();
    const doc = await Item.findById(id).lean().exec();
    if (!doc || doc.isDeleted) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: e?.message || "Fetch failed" });
  }
});

// ---------- Create (protected) ----------
r.post("/", requireAuth, async (req, res) => {
  try {
    const { title, price, description, sellerId } = req.body || {};
    if (!title || typeof title !== "string" || title.trim().length < 1) {
      return res.status(400).json({ message: "title required" });
    }
    const priceNum = Number(price ?? 0);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      return res.status(400).json({ message: "price invalid" });
    }

    const Item = await getItem();
    const it = await Item.create({
      title: title.trim(),
      price: priceNum,
      description: typeof description === "string" ? description : "",
      sellerId: sellerId || req.user?.id,
      status: "active",
      isDeleted: false,
    });
    res.json(it);
  } catch (e) {
    res.status(500).json({ message: e?.message || "Create failed" });
  }
});

// ---------- Update (protected) ----------
r.put("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "invalid id" });
    }

    const allowed = ["title", "price", "description", "status"];
    const patch = {};
    for (const k of allowed) {
      if (req.body?.[k] !== undefined) patch[k] = req.body[k];
    }
    if (patch.title) {
      if (typeof patch.title !== "string" || !patch.title.trim()) {
        return res.status(400).json({ message: "title invalid" });
      }
      patch.title = patch.title.trim();
    }
    if (patch.price != null) {
      const n = Number(patch.price);
      if (!Number.isFinite(n) || n < 0) return res.status(400).json({ message: "price invalid" });
      patch.price = n;
    }
    if (patch.description != null && typeof patch.description !== "string") {
      return res.status(400).json({ message: "description invalid" });
    }
    if (patch.status && !["active", "sold", "hidden"].includes(patch.status)) {
      return res.status(400).json({ message: "status invalid" });
    }

    patch.updatedAt = new Date();

    const Item = await getItem();
    const it = await Item.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      patch,
      { new: true }
    ).lean().exec();

    if (!it) return res.status(404).json({ message: "Not found" });
    res.json(it);
  } catch (e) {
    res.status(500).json({ message: e?.message || "Update failed" });
  }
});

// ---------- Soft-delete (protected) ----------
r.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "invalid id" });
    }

    const Item = await getItem();
    const it = await Item.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { isDeleted: true, deletedAt: new Date(), updatedAt: new Date() },
      { new: true }
    ).lean().exec();

    if (!it) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e?.message || "Delete failed" });
  }
});

export default r;
