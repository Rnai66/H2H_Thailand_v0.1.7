const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export function getToken() {
  return localStorage.getItem("token") || "";
}

export function setToken(t) {
  if (t) localStorage.setItem("token", t);
  else localStorage.removeItem("token");
}

export async function api(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const tk = getToken();
    if (tk) headers["Authorization"] = `Bearer ${tk}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data;
}
