import React, { useState } from "react";
import { api } from "../api";
import { H2HCard, H2HButton } from "../ui";
import { Link } from "react-router-dom";

export default function Register({ onLoggedIn }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      const res = await api("/api/auth/register", {
        method: "POST",
        body: { name, email, password },
      });
      onLoggedIn(res.token);
    } catch (e) {
      setMsg(e.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center page-fade">
      <H2HCard className="max-w-md w-full p-6 shadow-lg backdrop-blur-lg">
        <h1 className="title-glow text-center mb-2">Create Account</h1>
        <p className="subtitle text-center mb-6 text-[var(--fg-muted)]">
          สมัครสมาชิกใหม่ในระบบ H2H Thailand
        </p>

        <form onSubmit={submit} className="grid gap-4">
          <div>
            <label className="block text-sm mb-1 text-[var(--fg-muted)]">
              Name
            </label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-[var(--fg-muted)]">
              Email
            </label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-[var(--fg-muted)]">
              Password
            </label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              required
            />
          </div>

          {msg && (
            <div className="text-red-400 text-sm text-center mt-1">{msg}</div>
          )}

          <H2HButton
            type="submit"
            variant="gold"
            className="mt-3"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </H2HButton>
        </form>

        <div className="mt-4 text-center text-sm text-[var(--fg-muted)]">
          มีบัญชีอยู่แล้ว?{" "}
          <Link
            to="/login"
            className="text-[var(--accent)] hover:underline hover:text-[var(--accent2)]"
          >
            เข้าสู่ระบบ
          </Link>
        </div>
      </H2HCard>
    </div>
  );
}
