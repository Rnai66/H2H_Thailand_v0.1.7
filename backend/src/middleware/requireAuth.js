// backend/src/middleware/requireAuth.js
import jwt from "jsonwebtoken";
export function requireAuth(req, res, next) {
  const h = req.headers.authorization || "";
  const [, token] = h.split(" ");
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    req.user = { id: payload.id, email: payload.email, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
