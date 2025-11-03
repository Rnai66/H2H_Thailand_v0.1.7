// backend/src/config/db.js
import mongoose from "mongoose";

const cache = new Map();

export async function getConn(dbName) {
  if (!dbName) throw new Error("dbName is required");
  if (cache.has(dbName)) return cache.get(dbName);

  const {
    MONGO_USER,
    MONGO_PASS,
    MONGO_CLUSTER,
    NODE_ENV = "development",
  } = process.env;

  const db = encodeURIComponent(dbName);
  const auth = `${encodeURIComponent(MONGO_USER)}:${encodeURIComponent(MONGO_PASS)}`;
  const uri = `mongodb+srv://${auth}@${MONGO_CLUSTER}/${db}?retryWrites=true&w=majority`;

  const conn = mongoose.createConnection(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: NODE_ENV === "development" ? 5000 : 15000,
  });

  conn.on("connected", () => console.log(`✅ [DB] connected: ${dbName}`));
  conn.on("error", (e) => console.error(`❌ [DB] error(${dbName}):`, e?.message || e));

  cache.set(dbName, conn);
  return conn;
}
