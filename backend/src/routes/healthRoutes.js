// backend/src/routes/healthRoutes.js
import { Router } from "express";
import { getConnection, DBNAMES } from "../config/dbPool.js";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pkg = require("../package.json");

const router = Router();

// ==== config ====
const TTL_MS = 5_000; // cache 5s พอสำหรับ health
const NAMES = [
  ["user_db", DBNAMES.USER],
  ["item_db", DBNAMES.ITEM],
  ["payment_db", DBNAMES.PAYMENT],
  ["token_db", DBNAMES.TOKEN],
  ["profile_db", DBNAMES.PROFILE],
];

// ==== helpers ====
function tryGetConn(name) {
  try {
    const c = getConnection(name);
    if (!c?.db) throw new Error("no db handle");
    return c;
  } catch {
    return null;
  }
}

async function pingDb(conn) {
  if (!conn) return { ok: false, latencyMs: null, error: "no-connection" };
  const t0 = Date.now();
  try {
    await conn.db.command({ ping: 1 });
    return { ok: true, latencyMs: Date.now() - t0 };
  } catch (e) {
    return { ok: false, latencyMs: Date.now() - t0, error: e?.message || "ping-failed" };
  }
}

async function buildChecks() {
  const checks = {};
  await Promise.all(
    NAMES.map(async ([label, key]) => {
      checks[label] = await pingDb(tryGetConn(key));
    })
  );
  return checks;
}

function summarize(checks) {
  const oks = Object.values(checks).filter(c => c.ok).length;
  const total = Object.keys(checks).length;
  const status = oks === total ? "ok" : oks > 0 ? "degraded" : "down";
  // readiness: "ok" = 200, อื่นๆ = 503
  const http = status === "ok" ? 200 : 503;
  return { status, http };
}

// simple in-memory cache สำหรับ /ready และ /
let cache = { ts: 0, payload: null };

// ==== routes ====

// liveness — แค่ดูว่าโปรเซสยังหายใจ
router.get("/live", (_req, res) => {
  res.status(200).json({
    status: "ok",
    uptimeSec: Math.round(process.uptime()),
    time: new Date().toISOString(),
  });
});

// readiness — ต้องพร้อมทุก DB
router.get("/ready", async (req, res) => {
  const noCache = String(req.query.nocache || "0") === "1";
  const now = Date.now();

  if (!noCache && cache.payload && now - cache.ts < TTL_MS) {
    const { payload } = cache;
    return res.status(payload.http).json(payload.body);
  }

  const checks = await buildChecks();
  const { status, http } = summarize(checks);
  const body = {
    status,
    uptimeSec: Math.round(process.uptime()),
    version: pkg.version,
    time: new Date().toISOString(),
    checks,
  };

  cache = { ts: now, payload: { http, body } };
  return res.status(http).json(body);
});

// รายละเอียด DB แบบสด (ไม่ใช้ cache)
router.get("/db", async (_req, res) => {
  const checks = await buildChecks();
  res.json({ time: new Date().toISOString(), checks });
});

// root = ใช้ readiness logic เดิม (คำนวณตรง ๆ ไม่เรียก router.handle)
router.get("/", async (req, res) => {
  const noCache = String(req.query.nocache || "0") === "1";
  const now = Date.now();

  if (!noCache && cache.payload && now - cache.ts < TTL_MS) {
    const { payload } = cache;
    return res.status(payload.http).json(payload.body);
  }

  const checks = await buildChecks();
  const { status, http } = summarize(checks);
  const body = {
    status,
    uptimeSec: Math.round(process.uptime()),
    version: pkg.version,
    time: new Date().toISOString(),
    checks,
  };

  cache = { ts: now, payload: { http, body } };
  return res.status(http).json(body);
});

export default router;
