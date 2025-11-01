export function getToken() {
  return localStorage.getItem("token") || "";
}

export function setToken(t) {
  if (t) localStorage.setItem("token", t);
  else localStorage.removeItem("token");
}

export function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export function getCurrentUser() {
  const t = getToken();
  const p = decodeJwt(t);
  if (!p) return null;
  return { id: p.id, email: p.email, role: p.role || "user", exp: p.exp };
}
