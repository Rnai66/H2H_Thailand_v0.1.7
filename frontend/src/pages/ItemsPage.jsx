// frontend/src/pages/ItemsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../lib/api"; // ✅ ใช้ default import เท่านั้น

// --- Fallback UI (ไม่มีการพึ่ง Modal/Skeleton ภายนอก) ---
function SimpleDialog({ open, onClose, title, children }) {
  // ใช้ <dialog> ง่าย ๆ กันพัง
  return (
    <div
      style={{
        display: open ? "grid" : "none",
        placeItems: "center",
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.35)",
        zIndex: 50,
        padding: 16,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="card" style={{ width: "min(560px,95vw)" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-semibold">{title}</h3>
          <button className="btn btn-ghost" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function LoadingRows({ rows = 5, cols = 6 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          <td className="td" colSpan={cols}>
            <div className="skeleton" style={{ height: 28 }} />
          </td>
        </tr>
      ))}
    </>
  );
}

export default function ItemsPage({ me, toast = console }) {
  // ======= Query state =======
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [sort, setSort] = useState("-createdAt");
  const [status, setStatus] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);

  // ======= Data state =======
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  // ======= Forms / Dialogs =======
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [draft, setDraft] = useState({ title: "", price: 0, description: "" });
  const [editId, setEditId] = useState(null);

  const canCreate = !!me; // POST/PUT/DELETE ต้อง auth; GET เปิดได้

  const params = useMemo(() => {
    const u = new URLSearchParams({ page, limit, sort });
    if (q) u.set("q", q);
    if (status) u.set("status", status);
    if (includeDeleted) u.set("includeDeleted", "1");
    return u.toString();
  }, [q, page, limit, sort, status, includeDeleted]);

  // ======= Load list =======
  async function load() {
    setMsg("");
    setLoading(true);
    try {
      const res = await api(`/api/items?${params}`); // ✅ default api()
      setRows(res.items || []);
      setTotal(res.total || 0);
    } catch (e) {
      setMsg(e.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [params]);

  // ======= Handlers =======
  function openNew() {
    if (!me) { toast.error?.("Please login first"); return; }
    setDraft({ title: "", price: 0, description: "" });
    setOpenCreate(true);
  }

  async function submitNew(e) {
    e.preventDefault();
    try {
      const payload = {
        ...draft,
        price: Number(draft.price || 0),
        sellerId: me?._id, // backend เช็ค ownerOrAdmin ด้วย
      };
      await api("/api/items", { method: "POST", body: payload, auth: true });
      toast.success?.("Created");
      setOpenCreate(false);
      load();
    } catch (e) {
      toast.error?.(e.message);
    }
  }

  function openEditItem(item) {
    setEditId(item._id);
    setDraft({
      title: item.title || "",
      price: item.price || 0,
      description: item.description || "",
    });
    setOpenEdit(true);
  }

  async function submitEdit(e) {
    e.preventDefault();
    try {
      await api(`/api/items/${editId}`, {
        method: "PUT",
        body: { ...draft, price: Number(draft.price || 0) },
        auth: true,
      });
      toast.success?.("Updated");
      setOpenEdit(false);
      setEditId(null);
      load();
    } catch (e) {
      toast.error?.(e.message);
    }
  }

  async function softDelete(id) {
    if (!confirm("Soft-delete this item?")) return;
    try {
      await api(`/api/items/${id}`, { method: "DELETE", auth: true });
      toast?.success?.("Soft-deleted");
      load();
    } catch (e) {
      toast.error?.(e.message);
    }
  }

  async function softRestore(id) {
    try {
      await api(`/api/items/${id}`, { method: "PUT", body: { isDeleted: false }, auth: true });
      toast.success?.("Restored");
      load();
    } catch (e) {
      toast.error?.(e.message);
    }
  }

  const pages = Math.max(1, Math.ceil(total / limit));

  // ======= UI =======
  return (
    <div className="section page-fade">
      <div className="mb-6">
        <h1 className="title-glow mb-1">Items</h1>
        <p className="subtitle text-[var(--fg-muted)]">
          จัดการรายการสินค้าภายใต้ระบบ H2H Thailand Marketplace
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 items-center">
          <input
            className="input w-56"
            value={q}
            onChange={(e) => { setPage(1); setQ(e.target.value); }}
            placeholder="Search title…"
          />
          <select
            className="select"
            value={status}
            onChange={(e) => { setPage(1); setStatus(e.target.value); }}
          >
            <option value="">status: all</option>
            <option value="active">active</option>
            <option value="sold">sold</option>
            <option value="inactive">inactive</option>
          </select>
          <select
            className="select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="-createdAt">Newest</option>
            <option value="createdAt">Oldest</option>
            <option value="-price">Price high → low</option>
            <option value="price">Price low → high</option>
          </select>
          <label className="flex items-center gap-2 text-[var(--fg-muted)]">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => setIncludeDeleted(e.target.checked)}
            />
            Include Deleted
          </label>
        </div>

        <div className="flex gap-2">
          <button className="btn btn-gold" onClick={openNew} disabled={!canCreate}>
            + New
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto card">
        <table className="table">
          <thead>
            <tr>
              <th className="th">ID</th>
              <th className="th">Title</th>
              <th className="th">Price</th>
              <th className="th">Status</th>
              <th className="th">Seller</th>
              <th className="th">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingRows rows={5} cols={6} />
            ) : rows.length ? (
              rows.map((r) => (
                <tr key={r._id}>
                  <td className="td font-mono">{r._id}</td>
                  <td className="td">{r.title}</td>
                  <td className="td">{r.price}</td>
                  <td className="td">{r.status}</td>
                  <td className="td font-mono">{r.sellerId}</td>
                  <td className="td">
                    {!r.isDeleted ? (
                      <>
                        <button className="btn btn-ghost" onClick={() => openEditItem(r)}>
                          Edit
                        </button>{" "}
                        <button className="btn btn-primary" onClick={() => softDelete(r._id)}>
                          Soft-delete
                        </button>
                      </>
                    ) : (
                      <button className="btn btn-gold" onClick={() => softRestore(r._id)}>
                        Restore
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td className="td text-center" colSpan={6}>No items</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pager */}
      <div className="ml-auto mt-3 flex items-center gap-2">
        <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Prev
        </button>
        <span className="text-[var(--fg-muted)]">
          {page} / {pages}
        </span>
        <button className="btn btn-ghost" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
          Next
        </button>
      </div>

      {msg && <div className="text-red-400 mt-2">❌ {msg}</div>}

      {/* Create */}
      <SimpleDialog open={openCreate} onClose={() => setOpenCreate(false)} title="Create Item">
        <form onSubmit={submitNew} className="grid gap-3">
          <input className="input" required placeholder="title"
            value={draft.title} onChange={(e) => setDraft((s) => ({ ...s, title: e.target.value }))} />
          <input className="input" required type="number" min="0" placeholder="price"
            value={draft.price} onChange={(e) => setDraft((s) => ({ ...s, price: e.target.value }))} />
          <textarea className="textarea" rows={3} placeholder="description"
            value={draft.description} onChange={(e) => setDraft((s) => ({ ...s, description: e.target.value }))} />
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-ghost" onClick={() => setOpenCreate(false)}>Cancel</button>
            <button type="submit" className="btn btn-gold">Create</button>
          </div>
        </form>
      </SimpleDialog>

      {/* Edit */}
      <SimpleDialog open={openEdit} onClose={() => setOpenEdit(false)} title="Edit Item">
        <form onSubmit={submitEdit} className="grid gap-3">
          <input className="input" required placeholder="title"
            value={draft.title} onChange={(e) => setDraft((s) => ({ ...s, title: e.target.value }))} />
          <input className="input" required type="number" min="0" placeholder="price"
            value={draft.price} onChange={(e) => setDraft((s) => ({ ...s, price: e.target.value }))} />
          <textarea className="textarea" rows={3} placeholder="description"
            value={draft.description} onChange={(e) => setDraft((s) => ({ ...s, description: e.target.value }))} />
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-ghost" onClick={() => setOpenEdit(false)}>Cancel</button>
            <button type="submit" className="btn btn-gold">Save</button>
          </div>
        </form>
      </SimpleDialog>
    </div>
  );
}
