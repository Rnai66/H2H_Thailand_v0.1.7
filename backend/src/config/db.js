// backend/src/config/db.js
import mongoose from "mongoose";

const cache = new Map();

/**
 * คืน (และแคช) mongoose.Connection สำหรับ dbName ที่ระบุ
 */
export async function getConn(dbName) {
  if (!dbName) throw new Error("dbName is required");

  // ถ้ามีอยู่แล้วและยัง ready ให้ใช้ต่อ
  if (cache.has(dbName)) {
    const c = cache.get(dbName);
    if (c.readyState === 1) return c;
  }

  const {
    MONGO_USER,
    MONGO_PASS,
    MONGO_CLUSTER,
    NODE_ENV = "development",
  } = process.env;

  if (!MONGO_USER || !MONGO_PASS || !MONGO_CLUSTER) {
    throw new Error("Missing Mongo credentials (MONGO_USER/MONGO_PASS/MONGO_CLUSTER)");
  }

  const db = encodeURIComponent(dbName);
  const auth = `${encodeURIComponent(MONGO_USER)}:${encodeURIComponent(MONGO_PASS)}`;
  const uri = `mongodb+srv://${auth}@${MONGO_CLUSTER}/${db}?retryWrites=true&w=majority`;

  // ใช้ .asPromise() เพื่อให้ await แล้ว "เชื่อมสำเร็จจริง" ค่อยคืนค่า
  const conn = await mongoose.createConnection(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: NODE_ENV === "development" ? 5000 : 15000,
  }).asPromise();

  conn.on("connected", () => console.log(`✅ [DB] connected: ${dbName}`));
  conn.on("error", (e) => console.error(`❌ [DB] error(${dbName}):`, e?.message || e));
  conn.on("disconnected", () => console.warn(`⚠️ [DB] disconnected: ${dbName}`));

  cache.set(dbName, conn);
  return conn;
}

/**
 * ต่อฐานข้อมูลหลักๆ ตั้งแต่บูต
 */
export async function connectAll() {
  const names = [
    process.env.DB_USER || "user_db",
    process.env.DB_ITEM || "item_db",
    process.env.DB_PAYMENT || "payment_db",
    process.env.DB_TOKEN || "token_db",
    process.env.DB_PROFILE || "profile_db",
  ];
  // ต่อทุกตัวพร้อมกัน
  await Promise.all(names.map((n) => getConn(n)));
}

/**
 * ปิดทุก connection อย่างนิ่มนวล (ใช้ตอน graceful shutdown)
 */
export async function closeAll() {
  for (const [name, conn] of cache.entries()) {
    try {
      await conn.close();
      console.log(`🔒 [DB] closed: ${name}`);
    } catch (e) {
      console.warn(`⚠️ [DB] failed to close ${name}:`, e?.message || e);
    }
  }
  cache.clear();
}
