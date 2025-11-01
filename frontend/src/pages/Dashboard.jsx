// frontend/src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import api from "../lib/api";
import { H2HCard } from "../ui";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [sum, setSum] = useState({
    users: 0,
    items: 0,
    payments: 0,
    tokens: 0,
    latestUsers: [],
    latestItems: [],
  });

  async function load() {
    setErr("");
    setLoading(true);
    try {
      // ✅ backend มี /api/dashboard/summary อยู่แล้ว
      const res = await api("/api/dashboard/summary");
      // เผื่อ endpoint คืนฟิลด์ไม่ครบ ให้เติมค่าเริ่มต้นกันล้ม
      setSum({
        users: res.users ?? 0,
        items: res.items ?? 0,
        payments: res.payments ?? 0,
        tokens: res.tokens ?? 0,
        latestUsers: Array.isArray(res.latestUsers) ? res.latestUsers : [],
        latestItems: Array.isArray(res.latestItems) ? res.latestItems : [],
      });
    } catch (e) {
      setErr(e.message || "load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="section page-fade grid gap-4">
      <div className="mb-2">
        <h1 className="title-glow">Dashboard</h1>
        <p className="subtitle">ภาพรวมระบบ H2H Thailand</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Users" value={sum.users} />
        <StatCard label="Items" value={sum.items} />
        <StatCard label="Payments" value={sum.payments} />
        <StatCard label="Tokens" value={sum.tokens} />
      </div>

      {/* Recent lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <H2HCard>
          <h3 className="text-xl mb-2">ล่าสุด - Users</h3>
          <ul className="space-y-2">
            {sum.latestUsers?.length ? (
              sum.latestUsers.map((u) => (
                <li key={u._id} className="flex justify-between border-b border-white/10 pb-2">
                  <span>{u.name || u.email || u._id}</span>
                  <span className="text-sm text-[var(--fg-muted)] font-mono">{u._id}</span>
                </li>
              ))
            ) : (
              <li className="text-[var(--fg-muted)]">— ไม่มีข้อมูล —</li>
            )}
          </ul>
        </H2HCard>

        <H2HCard>
          <h3 className="text-xl mb-2">ล่าสุด - Items</h3>
          <ul className="space-y-2">
            {sum.latestItems?.length ? (
              sum.latestItems.map((it) => (
                <li key={it._id} className="flex justify-between border-b border-white/10 pb-2">
                  <span>{it.title || it._id}</span>
                  <span className="text-sm text-[var(--fg-muted)]">{(it.price ?? 0).toLocaleString()} ฿</span>
                </li>
              ))
            ) : (
              <li className="text-[var(--fg-muted)]">— ไม่มีข้อมูล —</li>
            )}
          </ul>
        </H2HCard>
      </div>

      {/* Footer / actions */}
      <div className="flex items-center gap-3">
        <button className="btn btn-primary" onClick={load} disabled={loading}>
          {loading ? "Loading..." : "↻ Reload"}
        </button>
        {err && <span className="text-red-400">❌ {err}</span>}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <H2HCard className="flex flex-col gap-1">
      <div className="text-sm text-[var(--fg-muted)]">{label}</div>
      <div className="text-3xl font-semibold">{value ?? 0}</div>
    </H2HCard>
  );
}
