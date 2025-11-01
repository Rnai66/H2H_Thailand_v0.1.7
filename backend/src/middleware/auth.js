import jwt from "jsonwebtoken";


export function protect(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.substring(7) : null;
  if (!token) return res.status(401).json({ message: "No token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role || "user" };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }
    next();
  };
}

export function ownerOrAdmin(getOwnerId) {
  return async (req, res, next) => {
    try {
      if (req.user?.role === "admin") return next();
      const ownerId = await getOwnerId(req);
      if (ownerId && String(ownerId) === String(req.user?.id)) return next();
      return res.status(403).json({ message: "Forbidden: owner or admin only" });
    } catch (e) {
      return res.status(500).json({ message: "Owner check failed", error: e.message });
    }
  };
}
