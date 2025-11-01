import { Router } from "express";
import mongoose from "mongoose";
import { protect } from "../middleware/auth.js";
import { getConn } from "../config/db.js";
import { getItemModel } from "../models/Item.js";

const router = Router();
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id || "");

const parsePaging = (req) => {
  const page = Math.max(parseInt(req.query.page ?? "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit ?? "10", 10), 1), 100);
  const skip = (page - 1) * limit;
  const sortIn = typeof req.query.sort === "string" ? req.query.sort : "-createdAt";
  const sort = sortIn.startsWith("-") ? { [sortIn.slice(1)]: -1 } : { [sortIn]: 1 };
  return { page, limit, skip, sort };
};

const buildFilters = (req) => {
  const f = {};
  if (req.query.q) {
    const q = String(req.query.q);
    f.$or = [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
    ];
  }
  if (req.query.status && ["active","inactive","sold"].includes(req.query.status)) {
    f.status = req.query.status;
  }
  if (req.query.includeDeleted !== "true") {
    f.isDeleted = { $ne: true };
  }
  if (req.query.sellerId && isValidObjectId(req.query.sellerId)) {
    f.sellerId = req.query.sellerId;
  }
  return f;
};

// GET /api/items
router.get("/", async (req, res) => {
  try {
    const { page, limit, skip, sort } = parsePaging(req);
    const filter = buildFilters(req);
    const conn = await getConn(process.env.DB_ITEM || "item_db");
    const Item = getItemModel(conn);

    const [items, total] = await Promise.all([
      Item.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Item.countDocuments(filter),
    ]);
    res.json({ page, limit, total, items });
  } catch (e) {
    console.error("❌ items.index error:", e);
    res.status(500).json({ message: "Failed to list items", error: e.message });
  }
});

// GET /api/items/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid item id" });
    const conn = await getConn(process.env.DB_ITEM || "item_db");
    const Item = getItemModel(conn);

    const item = await Item.findById(id).lean();
    if (!item || item.isDeleted) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (e) {
    console.error("❌ items.show error:", e);
    res.status(500).json({ message: "Failed to get item", error: e.message });
  }
});

// POST /api/items  (ใช้ sellerId จาก token)
router.post("/", protect, async (req, res) => {
  try {
    const conn = await getConn(process.env.DB_ITEM || "item_db");
    const Item = getItemModel(conn);

    const body = req.body || {};
    const created = await Item.create({
      title: body.title?.trim(),
      description: body.description ?? "",
      price: Number(body.price ?? 0),
      status: ["active","inactive","sold"].includes(body.status) ? body.status : "active",
      images: Array.isArray(body.images) ? body.images : [],
      sellerId: req.user.id,
    });
    res.status(201).json({ item: created });
  } catch (e) {
    console.error("❌ items.create error:", e);
    res.status(500).json({ message: "Failed to create item", error: e.message });
  }
});

// PUT /api/items/:id
router.put("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid item id" });

    const conn = await getConn(process.env.DB_ITEM || "item_db");
    const Item = getItemModel(conn);

    const existing = await Item.findById(id);
    if (!existing) return res.status(404).json({ message: "Item not found" });
    if (String(existing.sellerId) !== String(req.user.id) && req.user?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const patch = {};
    if (typeof req.body.title === "string") patch.title = req.body.title.trim();
    if (typeof req.body.description === "string") patch.description = req.body.description;
    if (req.body.price != null) patch.price = Number(req.body.price);
    if (["active","inactive","sold"].includes(req.body.status)) patch.status = req.body.status;
    if (Array.isArray(req.body.images)) patch.images = req.body.images;
    if (req.body.isDeleted === true) { patch.isDeleted = true; patch.deletedAt = new Date(); }
    if (req.body.isDeleted === false) { patch.isDeleted = false; patch.deletedAt = null; }

    const updated = await Item.findByIdAndUpdate(id, patch, { new: true, lean: true });
    res.json({ item: updated });
  } catch (e) {
    console.error("❌ items.update error:", e);
    res.status(500).json({ message: "Failed to update item", error: e.message });
  }
});

// DELETE /api/items/:id (soft)
router.delete("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid item id" });

    const conn = await getConn(process.env.DB_ITEM || "item_db");
    const Item = getItemModel(conn);

    const existing = await Item.findById(id);
    if (!existing) return res.status(404).json({ message: "Item not found" });
    if (String(existing.sellerId) !== String(req.user.id) && req.user?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const deleted = await Item.findByIdAndUpdate(
      id, { isDeleted: true, deletedAt: new Date() }, { new: true, lean: true }
    );
    res.json({ message: "Item soft-deleted", item: deleted });
  } catch (e) {
    console.error("❌ items.delete error:", e);
    res.status(500).json({ message: "Failed to delete item", error: e.message });
  }
});

export default router;
