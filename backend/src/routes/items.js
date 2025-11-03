// backend/src/routes/items.js
import { Router } from "express";
import { getConn } from "../config/db.js";
import { getItemModel } from "../models/Item.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const r = Router();

async function getItem() {
  const conn = await getConn(process.env.DB_ITEM || "item_db");
  return getItemModel(conn);
}

// List (public)
r.get("/", async (req, res) => {
  try {
    const Item = await getItem();
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const sort = String(req.query.sort || "-createdAt");
    const q = (req.query.q || "").toString().trim().toLowerCase();
    const status = (req.query.status || "").toString().trim();
    const includeDeleted = req.query.includeDeleted === "1";

    const where = {};
    if (!includeDeleted) where.isDeleted = false;
    if (status) where.status = status;
    if (q) where.title = { $regex: q, $options: "i" };

    const [items, total] = await Promise.all([
      Item.find(where)
        .sort(sort.replace("-", "-"))
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      Item.countDocuments(where).exec(),
    ]);

    res.json({ page, limit, total, items });
  } catch (e) {
    res.status(500).json({ message: e?.message || "List failed" });
  }
});

// Create (protected)
r.post("/", requireAuth, async (req, res) => {
  try {
    const { title, price, description, sellerId } = req.body || {};
    if (!title) return res.status(400).json({ message: "title required" });

    const Item = await getItem();
    const it = await Item.create({
      title,
      price: Number(price || 0),
      description: description || "",
      sellerId: sellerId || req.user?.id,
      status: "active",
      isDeleted: false,
    });
    res.json(it);
  } catch (e) {
    res.status(500).json({ message: e?.message || "Create failed" });
  }
});

// Update (protected)
r.put("/:id", requireAuth, async (req, res) => {
  try {
    const Item = await getItem();
    const patch = req.body || {};
    if (patch.price != null) patch.price = Number(patch.price);
    patch.updatedAt = new Date();

    const it = await Item.findByIdAndUpdate(req.params.id, patch, { new: true }).lean().exec();
    if (!it) return res.status(404).json({ message: "Not found" });
    res.json(it);
  } catch (e) {
    res.status(500).json({ message: e?.message || "Update failed" });
  }
});

// Soft-delete (protected)
r.delete("/:id", requireAuth, async (req, res) => {
  try {
    const Item = await getItem();
    const it = await Item.findById(req.params.id).exec();
    if (!it) return res.status(404).json({ message: "Not found" });
    it.isDeleted = true;
    it.deletedAt = new Date();
    await it.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e?.message || "Delete failed" });
  }
});

export default r;
