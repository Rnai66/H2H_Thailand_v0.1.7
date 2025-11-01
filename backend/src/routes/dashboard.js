import { Router } from "express";
import { getConnection, DBNAMES } from "../config/dbPool.js";

const router = Router();

async function countCol(conn, collName, filter = {}) {
  return conn.db.collection(collName).countDocuments(filter);
}

router.get("/summary", async (_req, res) => {
  try {
    // ใช้ชื่อ collection พื้นฐานตามที่โมเดล Mongoose จะสร้าง (lowercase + plural)
    const userConn = getConnection(DBNAMES.USER);
    const itemConn = getConnection(DBNAMES.ITEM);
    const paymentConn = getConnection(DBNAMES.PAYMENT);
    const tokenConn = getConnection(DBNAMES.TOKEN);
    const profileConn = getConnection(DBNAMES.PROFILE);

    const [
      usersTotal,
      itemsTotal,
      itemsActive,
      itemsSold,
      paymentsTotal,
      tokensTotal,
      profilesTotal,
    ] = await Promise.all([
      countCol(userConn, "users"),
      countCol(itemConn, "items"),
      countCol(itemConn, "items", { status: "active" }),
      countCol(itemConn, "items", { status: "sold" }),
      countCol(paymentConn, "payments"),
      countCol(tokenConn, "tokens"),
      countCol(profileConn, "profiles"),
    ]);

    res.json({
      usersTotal,
      itemsTotal,
      itemsActive,
      itemsSold,
      paymentsTotal,
      tokensTotal,
      profilesTotal,
      ts: new Date().toISOString(),
    });
  } catch (e) {
    res.status(500).json({ message: "Failed to get dashboard summary", error: e.message });
  }
});

export default router;
