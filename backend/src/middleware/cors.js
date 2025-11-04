// src/middleware/cors.js
import cors from "cors";

/**
 * Build allowed origins from env (comma-separated) + safe defaults.
 * Example ENV:
 *   CORS_ORIGIN=https://h2h-frontend-v0-1-7.vercel.app,http://localhost:5173
 */
function buildAllowedOrigins() {
  const fromEnv = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
  const defaults = [
    "http://localhost:5173",
  ];
  // Ensure uniqueness
  return Array.from(new Set([...defaults, ...fromEnv]));
}

const allowedOrigins = buildAllowedOrigins();

export const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser clients (curl, Postman) with no Origin
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.log("❌ CORS blocked:", origin, "Allowed:", allowedOrigins);
    return callback(new Error("CORS blocked: " + origin));
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

export default cors(corsOptions);
