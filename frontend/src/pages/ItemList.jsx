// frontend/src/pages/ItemList.jsx
import { useEffect, useState } from "react";
import api from "../lib/api";

export default function ItemList() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setErr("");
      setLoading(true);
      const data = await api("/api/items");
      setItems(Array.isArray(data) ? data : (data?.items ?? []));
    } catch (e) {
      setErr(e?.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <div className="p-4">กำลังโหลด...</div>;
  if (err) return <div className="p-4 text-red-600">❌ {err}</div>;
  if (!items.length) return <div className="p-4">ยังไม่มีสินค้า</div>;

  return (
    <div className="p-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => (
        <div key={it._id} className="card">
          <div className="font-semibold">{it.title || it.name}</div>
          <div className="text-sm opacity-80">{it.description}</div>
          <div className="mt-2">฿ {(it.price ?? 0).toLocaleString()} • {it.status || "active"}</div>
        </div>
      ))}
    </div>
  );
}
