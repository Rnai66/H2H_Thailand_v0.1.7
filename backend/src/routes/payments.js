// backend/src/routes/payments.js
import { Router } from "express";
import mongoose from "mongoose";
import { getConnection, DBNAMES } from "../config/dbPool.js";
import { PaymentModel } from "../models/Payment.js";
import { protect } from "../middleware/auth.js";

// --- helpers ---
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id || "");
}
function parsePaging(req) {
  const page = Math.max(parseInt(req.query.page ?? "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit ?? "10", 10), 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

const router = Router();

/**
 * GET /api/payments
 * รายการแบบเบาๆ (ต้องล็อกอิน แต่ไม่ต้องเป็นแอดมิน)
 */
router.get("/", protect, async (req, res) => {
  try {
    const { page, limit, skip } = parsePaging(req);
    const conn = getConnection(DBNAMES.PAYMENT);
    const Payment = PaymentModel(conn);

    const [rows, total] = await Promise.all([
      Payment.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Payment.countDocuments(),
    ]);

    res.json({ page, limit, total, payments: rows });
  } catch (e) {
    res.status(500).json({ message: "Failed to list payments", error: e.message });
  }
});

/**
 * POST /api/payments
 * body: { orderId (string), amount (number>0), method? ('cash'|'card'|'brocoin'|'other'), meta? (object) }
 */
router.post("/", protect, async (req, res) => {
  try {
    const { orderId, amount, method = "other", meta = {} } = req.body || {};
    if (!orderId || typeof orderId !== "string") {
      return res.status(400).json({ message: "orderId is required" });
    }
    const nAmount = Number(amount);
    if (!Number.isFinite(nAmount) || nAmount <= 0) {
      return res.status(400).json({ message: "amount must be > 0" });
    }
    if (!["cash", "card", "brocoin", "other"].includes(method)) {
      return res.status(400).json({ message: "invalid method" });
    }

    const conn = getConnection(DBNAMES.PAYMENT);
    const Payment = PaymentModel(conn);

    const doc = await Payment.create({
      orderId,
      amount: nAmount,
      method,
      status: "pending",
      meta: {
        ...meta,
        createdBy: { id: req.user.id, email: req.user.email, role: req.user.role },
      },
    });

    res.status(201).json({
      message: "Payment created",
      payment: { id: doc._id, ...doc.toObject() },
    });
  } catch (e) {
    res.status(500).json({ message: "Failed to create payment", error: e.message });
  }
});

/**
 * GET /api/payments/:id
 */
router.get("/:id", protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid payment id" });
    }
    const conn = getConnection(DBNAMES.PAYMENT);
    const Payment = PaymentModel(conn);
    const p = await Payment.findById(req.params.id).lean();
    if (!p) return res.status(404).json({ message: "Payment not found" });
    res.json({ payment: p });
  } catch (e) {
    res.status(500).json({ message: "Failed to get payment", error: e.message });
  }
});

/**
 * PATCH /api/payments/:id/pay
 * body: { status?: 'paid' }  (demo: บังคับเป็น paid)
 */
router.patch("/:id/pay", protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid payment id" });
    }
    const conn = getConnection(DBNAMES.PAYMENT);
    const Payment = PaymentModel(conn);

    const p = await Payment.findByIdAndUpdate(
      req.params.id,
      { status: "paid" },
      { new: true }
    );
    if (!p) return res.status(404).json({ message: "Payment not found" });

    res.json({ message: "Payment paid", payment: p });
  } catch (e) {
    res.status(500).json({ message: "Pay failed", error: e.message });
  }
});

export default router;
