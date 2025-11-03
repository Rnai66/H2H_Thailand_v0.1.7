// backend/src/routes/metrics.js
import { Router } from "express";
import client from "prom-client";
import { getConnection, DBNAMES } from "../config/dbPool.js";
import { metricsAuth } from "../middlewares/metricsAuth.js";

const router = Router();
const register = new client.Registry();

// default labels (ช่วยแยกหลาย instance ได้ง่าย)
register.setDefaultLabels({ app: "h2h_thailand" });

// default process/app metrics with prefix
client.collectDefaultMetrics({ register, prefix: "h2h_" });

// ===== helpers (sync with dashboard summary logic) =====
const collNames = {
  users: "users",
  items: "items",
  payments: "payments",
  tokens: "tokens",
  profiles: "profiles",
};

const TTL_MS = 10_000;
let cache = { ts: 0, summary: null, healthUp: 0 };

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
  try { return await conn.db.collection(collName).countDocuments(filter); }
  catch { return 0; }
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
  } catch { return 0; }
}
async function pingOk(conn) {
  if (!conn) return false;
  try { await conn.db.command({ ping: 1 }); return true; } catch { return false; }
}

async function collectSummary() {
  const now = Date.now();
  if (cache.summary && now - cache.ts < TTL_MS) return cache;

  const userConn    = tryGetConn(DBNAMES.USER);
  const itemConn    = tryGetConn(DBNAMES.ITEM);
  const paymentConn = tryGetConn(DBNAMES.PAYMENT);
  const tokenConn   = tryGetConn(DBNAMES.TOKEN);
  const profileConn = tryGetConn(DBNAMES.PROFILE);

  const results = await Promise.allSettled([
    countCol(userConn,    collNames.users),                                   // 0
    countCol(itemConn,    collNames.items),                                   // 1
    countCol(itemConn,    collNames.items, { status: "active" }),             // 2
    countCol(itemConn,    collNames.items, { status: "sold" }),               // 3
    countCol(paymentConn, collNames.payments),                                 // 4
    sumPaymentsToday(paymentConn),                                             // 5
    countCol(tokenConn,   collNames.tokens),                                   // 6
    countCol(profileConn, collNames.profiles),                                 // 7
    countCol(itemConn,    collNames.items, { createdAt: { $gte: startOfToday() } }), // 8
    pingOk(userConn), pingOk(itemConn), pingOk(paymentConn),
    pingOk(tokenConn), pingOk(profileConn),                                    // 9-13
  ]);
  const val = (i, d = 0) => results[i].status === "fulfilled" ? results[i].value : d;

  const summary = {
    usersTotal:    val(0),
    itemsTotal:    val(1),
    itemsActive:   val(2),
    itemsSold:     val(3),
    paymentsTotal: val(4),
    revenueToday:  val(5),
    tokensTotal:   val(6),
    profilesTotal: val(7),
    itemsToday:    val(8),
  };
  const healthUp = [9,10,11,12,13].every(i => !!val(i, false)) ? 1 : 0;

  cache = { ts: now, summary, healthUp };
  return cache;
}

// ===== gauges =====
const gUsersTotal     = new client.Gauge({ name: "h2h_users_total", help: "Total users", registers: [register] });
const gItemsTotal     = new client.Gauge({ name: "h2h_items_total", help: "Total items", registers: [register] });
const gItemsActive    = new client.Gauge({ name: "h2h_items_active", help: "Active items", registers: [register] });
const gItemsSold      = new client.Gauge({ name: "h2h_items_sold", help: "Sold items", registers: [register] });
const gPaymentsTotal  = new client.Gauge({ name: "h2h_payments_total", help: "Total payments", registers: [register] });
const gRevenueToday   = new client.Gauge({ name: "h2h_revenue_today", help: "Revenue today (sum of PAID)", registers: [register] });
const gTokensTotal    = new client.Gauge({ name: "h2h_tokens_total", help: "Total tokens", registers: [register] });
const gProfilesTotal  = new client.Gauge({ name: "h2h_profiles_total", help: "Total profiles", registers: [register] });
const gItemsToday     = new client.Gauge({ name: "h2h_items_today", help: "Items created today", registers: [register] });
const gHealthUp       = new client.Gauge({ name: "h2h_health_up", help: "1 if all DBs healthy, else 0", registers: [register] });

async function updateAllGauges() {
  const { summary, healthUp } = await collectSummary();
  gUsersTotal.set(Number(summary.usersTotal)    || 0);
  gItemsTotal.set(Number(summary.itemsTotal)    || 0);
  gItemsActive.set(Number(summary.itemsActive)  || 0);
  gItemsSold.set(Number(summary.itemsSold)      || 0);
  gPaymentsTotal.set(Number(summary.paymentsTotal) || 0);
  gRevenueToday.set(Number(summary.revenueToday)   || 0);
  gTokensTotal.set(Number(summary.tokensTotal)  || 0);
  gProfilesTotal.set(Number(summary.profilesTotal) || 0);
  gItemsToday.set(Number(summary.itemsToday)    || 0);
  gHealthUp.set(Number(healthUp) ? 1 : 0);
}

// ===== single route with auth =====
router.get("/", metricsAuth, async (_req, res) => {
  try {
    await updateAllGauges();
    res.set("Content-Type", register.contentType);
    res.set("Cache-Control", "no-store");
    res.send(await register.metrics());
  } catch (e) {
    res.status(500).send(`# metrics error: ${e?.message || e}`);
  }
});

export default router;
