import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const cache = new Map();

function buildUri(dbName) {
  const user = process.env.MONGO_USER;
  const pass = process.env.MONGO_PASS;
  const cluster = process.env.MONGO_CLUSTER; // ex: cluster0.rasol58.mongodb.net
  if (user && pass && cluster) {
    return `mongodb+srv://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${cluster}/${dbName}?retryWrites=true&w=majority&appName=h2h`;
  }
  // ถ้า env ไม่ครบ ค่อย fallback (แต่จะแจ้งเตือน)
  console.warn("⚠️ Missing MONGO_USER/MONGO_PASS/MONGO_CLUSTER — fallback to mongodb://127.0.0.1:27017");
  return `mongodb://127.0.0.1:27017/${dbName}`;
}

export async function getConn(dbName) {
  if (cache.has(dbName)) return cache.get(dbName);
  const uri = buildUri(dbName);

  const conn = await mongoose.createConnection(uri, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 10,
  }).asPromise();

  conn.on("connected", () => console.log(`✅ [DB] connected: ${dbName}`));
  conn.on("error", (err) => console.error(`❌ [DB] error (${dbName}):`, err.message));

  cache.set(dbName, conn);
  return conn;
}
