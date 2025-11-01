import cors from "cors";
export function corsMiddleware() {
  const origin = process.env.CORS_ORIGIN || "*";
  return cors({ origin, credentials: true });
}
