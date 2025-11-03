import { Router } from "express";
import { getConnection, DBNAMES } from "../config/dbPool.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// ===== config & cache =====
const TTL_MS = 10_000; // cache 10 วิ สำหรับแดชบอร์ดสด
let cache = { ts: 0, payload: null, warmup: false };

const collNames = {
  users: "users",
  items: "items",
  payments: "payments",
  tokens: "tokens",
  profiles: "profiles",
};

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function tryGetConn(name) {
  try {
    const c = getConnection(name);
    if (!c?.db) throw new Error("no db handle");
    return c;
  } catch {
    return null;
  }
}

async function countCol(conn, collName, filter = {}) {
  if (!conn) return 0;
  try {
    return await conn.db.collection(collName).countDocuments(filter);
  } catch {
    return 0;
  }
}

async function sumPaymentsToday(conn) {
  if (!conn) return 0;
  try {
    const today = startOfToday();
    const agg = await conn.db.collection(collNames.payments).aggregate([
      { $match: { status: "paid", createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
      { $project: { _id: 0, total: 1 } },
    ]).toArray();
    return agg?.[0]?.total ?? 0;
  } catch {
    return 0;
  }
}

// ===== routes =====
// ต้องล็อกอินก่อนดูสรุป (ถ้าจะจำกัดเฉพาะ admin ให้เปลี่ยนเป็น: protect, authorize("admin"))
router.get("/summary", protect, async (req, res) => {
  const noCache = String(req.query.nocache || "0") === "1";
  const now = Date.now();

  // 1) serve cache หากยังสด
  if (!noCache && cache.payload && now - cache.ts < TTL_MS) {
    return res.json({ ...cache.payload, cache: true, warmup: cache.warmup });
  }

  // 2) เตรียมคอนเนกชัน (ไม่มี/ยังไม่พร้อม -> คืน 0)
  const userConn    = tryGetConn(DBNAMES.USER);
  const itemConn    = tryGetConn(DBNAMES.ITEM);
  const paymentConn = tryGetConn(DBNAMES.PAYMENT);
  const tokenConn   = tryGetConn(DBNAMES.TOKEN);
  const profileConn = tryGetConn(DBNAMES.PROFILE);

  // 3) query ขนาน
  const jobs = [
    countCol(userConn,    collNames.users),                                   // 0 usersTotal
    countCol(itemConn,    collNames.items),                                   // 1 itemsTotal
    countCol(itemConn,    collNames.items,   { status: "active" }),           // 2 itemsActive
    countCol(itemConn,    collNames.items,   { status: "sold" }),             // 3 itemsSold
    countCol(paymentConn, collNames.payments),                                 // 4 paymentsTotal
    sumPaymentsToday(paymentConn),                                            // 5 revenueToday
    countCol(tokenConn,   collNames.tokens),                                   // 6 tokensTotal
    countCol(profileConn, collNames.profiles),                                 // 7 profilesTotal
    countCol(itemConn,    collNames.items,   { createdAt: { $gte: startOfToday() } }), // 8 itemsToday
  ];

  const results = await Promise.allSettled(jobs);
  const val = (i, d = 0) => (results[i].status === "fulfilled" ? results[i].value : d);

  const payload = {
    usersTotal:    val(0),
    itemsTotal:    val(1),
    itemsActive:   val(2),
    itemsSold:     val(3),
    paymentsTotal: val(4),
    revenueToday:  val(5),
    tokensTotal:   val(6),
    profilesTotal: val(7),
    itemsToday:    val(8),
    ts: new Date().toISOString(),
  };

  const warmup = results.some(r => r.status !== "fulfilled");

  // 4) เก็บ cache แล้วตอบ
  cache = { ts: now, payload, warmup };
  return res.status(200).json({ ...payload, cache: false, warmup });
});

export default router;
