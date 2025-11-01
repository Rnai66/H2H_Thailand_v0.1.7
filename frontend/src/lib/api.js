// frontend/src/lib/api.js
import { getToken } from "./auth";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export default async function api(path, opts = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const headers = new Headers(opts.headers || {});
  if (opts.body && !(opts.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // ถ้าไม่ได้ส่ง opts.auth=false ให้แนบ Bearer token โดยอัตโนมัติ
  const wantAuth = opts.auth !== false;
  const token = getToken();
  if (wantAuth && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, {
    method: opts.method || "GET",
    headers,
    body: opts.body
      ? opts.body instanceof FormData
        ? opts.body
        : JSON.stringify(opts.body)
      : undefined,
    // ถ้า backend ใช้ cookie ก็เปิด `credentials: "include"`
    // credentials: "include",
  });

  let data = null;
  const tx = res.headers.get("content-type") || "";
  if (tx.includes("application/json")) {
    data = await res.json().catch(() => null);
  } else {
    data = await res.text().catch(() => "");
  }

  if (!res.ok) {
    const err = new Error((data && data.message) || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}
