// frontend/src/pages/Login.jsx
import React, { useState } from "react";
import api from "../lib/api";            // ✅ default import ถูกต้อง + path ถูก
import { setToken } from "../lib/auth";  // ✅ เก็บ token สำหรับครั้งถัดไป
import { H2HCard, H2HButton } from "../ui";
import { Link } from "react-router-dom";

export default function Login({ onLoggedIn }) {
  const [email, setEmail] = useState("demo@h2h.app");
  const [password, setPassword] = useState("pass1234");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      const res = await api("/api/auth/login", {
        method: "POST",
        body: { email, password },
        auth: false,                 // ✅ login ไม่ต้องแนบ Bearer
      });
      setToken(res.token);           // ✅ เก็บ token ลง storage
      onLoggedIn?.(res.token);       // (ถ้ามี parent จะได้อัปเดต state ต่อ)
    } catch (e) {
      setMsg(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center page-fade">
      <H2HCard className="max-w-md w-full p-6 shadow-lg backdrop-blur-lg">
        <h1 className="title-glow text-center mb-2">Welcome Back</h1>
        <p className="subtitle text-center mb-6 text-[var(--fg-muted)]">
          เข้าสู่ระบบ H2H Thailand (Digital Silk UI)
        </p>

        <form onSubmit={submit} className="grid gap-4">
          <div>
            <label className="block text-sm mb-1 text-[var(--fg-muted)]">Email</label>
            <input
              className="input"
              type="email"                      // ✅ type email
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              autoComplete="username"          // ✅ ช่วย autofill
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-[var(--fg-muted)]">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              required
              autoComplete="current-password"  // ✅ ช่วย autofill
            />
          </div>

          {msg && <div className="text-red-400 text-sm text-center mt-1">❌ {msg}</div>}

          <H2HButton type="submit" variant="gold" className="mt-3" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </H2HButton>
        </form>

        <div className="mt-4 text-center text-sm text-[var(--fg-muted)]">
          ยังไม่มีบัญชี?{" "}
          <Link to="/register" className="text-[var(--accent)] hover:underline hover:text-[var(--accent2)]">
            สร้างบัญชีใหม่
          </Link>
        </div>
      </H2HCard>
    </div>
  );
}
