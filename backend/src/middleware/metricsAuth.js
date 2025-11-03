// backend/src/middlewares/metricsAuth.js
export function metricsAuth(req, res, next) {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "";

  const isLocal =
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("::ffff:127.0.0.1");

  // dev local: allow
  if (isLocal) return next();

  // require token for non-local
  const token = req.header("X-Metrics-Token");
  const configured = process.env.METRICS_TOKEN;

  if (!configured) {
    // ไม่มี token ให้ใช้ → ปฏิเสธจากภายนอก
    return res.status(403).send("metrics disabled");
  }

  if (token !== configured) {
    return res.status(401).send("unauthorized");
  }

  return next();
}
