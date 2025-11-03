export function metricsAuth(req, res, next) {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress || "";

  const isLocal =
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("::ffff:127.0.0.1");

  // ✅ อนุญาต localhost ทั้งหมด (เช่น Prometheus รันในเครื่องเดียวกัน)
  if (isLocal) return next();

  const configured = String(process.env.METRICS_TOKEN || "").trim();
  if (!configured) {
    return res.status(403).send("# metrics disabled");
  }

  // ✅ รองรับหลายรูปแบบ
  const tokenHeader = req.header("X-Metrics-Token");
  const authHeader = req.header("Authorization");
  const queryToken = req.query.token;

  const bearer =
    authHeader && authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : "";

  const provided = tokenHeader || bearer || queryToken;

  if (provided && provided === configured) return next();

  return res.status(401).send("# unauthorized metrics");
}
