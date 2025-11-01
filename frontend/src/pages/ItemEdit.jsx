// frontend/src/pages/ItemEdit.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export default function ItemEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", price: 0, status: "active", images: []
  });
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setError("");
        const res = await fetch(`${API_BASE}/api/items/${id}`);
        if (!res.ok) throw new Error(`Load failed (${res.status})`);
        const data = await res.json();
        const item = data.item || data; // รองรับทั้งสองแบบ
        if (alive) {
          setForm({
            title: item.title ?? "",
            description: item.description ?? "",
            price: item.price ?? 0,
            status: item.status ?? "active",
            images: Array.isArray(item.images) ? item.images : [],
          });
          setLoading(false);
        }
      } catch (e) {
        setError(e.message);
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: name === "price" ? Number(value) : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true); setOk(""); setError("");
      const res = await fetch(`${API_BASE}/api/items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const t = await res.json().catch(() => ({}));
        throw new Error(t.message || `Save failed (${res.status})`);
      }
      setOk("บันทึกสำเร็จ");
      setTimeout(() => navigate(-1), 600);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4">กำลังโหลด...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-semibold">แก้ไขสินค้า</h1>

      {error && <div className="p-3 border border-red-300 rounded">❌ {error}</div>}
      {ok && <div className="p-3 border border-green-300 rounded">✅ {ok}</div>}

      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">ชื่อสินค้า</label>
          <input name="title" value={form.title} onChange={onChange} className="w-full border rounded p-2" required />
        </div>
        <div>
          <label className="block text-sm mb-1">รายละเอียด</label>
          <textarea name="description" value={form.description} onChange={onChange} className="w-full border rounded p-2 min-h-28" />
        </div>
        <div>
          <label className="block text-sm mb-1">ราคา</label>
          <input type="number" name="price" value={form.price} onChange={onChange} className="w-full border rounded p-2" min={0} step={1} />
        </div>
        <div>
          <label className="block text-sm mb-1">สถานะ</label>
          <select name="status" value={form.status} onChange={onChange} className="w-full border rounded p-2">
            <option value="active">active</option>
            <option value="inactive">inactive</option>
            <option value="sold">sold</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">รูปภาพ (คั่นด้วย ,)</label>
          <input
            name="imagesCsv"
            value={(form.images || []).join(",")}
            onChange={(e) =>
              setForm((s) => ({
                ...s,
                images: e.target.value.split(",").map((v) => v.trim()).filter(Boolean),
              }))
            }
            className="w-full border rounded p-2"
          />
        </div>

        <div className="flex gap-2">
          <button disabled={saving} className="px-4 py-2 rounded bg-black text-white">
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 rounded border">
            ยกเลิก
          </button>
        </div>
      </form>
    </div>
  );
}
