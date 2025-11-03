// controllers/dashboardController.js
import Item from "../models/ItemDefault.js";   // ถ้าใช้โมเดลแบบ default connection
import User from "../models/User.js";          // แก้ path ตามโปรเจกต์จริง
import Payment from "../models/Payment.js";    // แก้ path ตามโปรเจกต์จริง

export const getSummary = async (_req, res) => {
  try {
    const results = await Promise.allSettled([
      Item.countDocuments({}),
      User.countDocuments({}),
      Payment.aggregate([
        { $match: { status: "PAID", createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) } } },
        { $group: { _id: null, revenue: { $sum: "$amount" } } }
      ])
    ]);

    const val = (i, def = 0) => results[i].status === "fulfilled" ? results[i].value : def;
    const items = val(0, 0);
    const users = val(1, 0);
    const revenueToday = (val(2, [])?.[0]?.revenue) ?? 0;

    return res.status(200).json({ items, users, revenueToday });
  } catch {
    // ไม่ให้ 500 ช่วงวอร์มอัป
    return res.status(200).json({ items: 0, users: 0, revenueToday: 0, note: "warmup" });
  }
};
