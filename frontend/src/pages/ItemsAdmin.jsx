// frontend/src/pages/ItemsAdmin.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../lib/api";
import {
  H2HCard,
  H2HButton,
  H2HModal,
  H2HTableRow,
  H2HTag,
  H2HSkeleton,
} from "../ui";

export default function ItemsAdmin({ me, toast }) {
  const [q, setQ] = useState("Blue");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [sort, setSort] = useState("-createdAt");
  const [status, setStatus] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [draft, setDraft] = useState({ title: "", price: 0, description: "" });
  const [editId, setEditId] = useState(null);

  const canCreate = !!me;

  const params = useMemo(() => {
    const u = new URLSearchParams({ page, limit, sort });
    if (q) u.set("q", q);
    if (status) u.set("status", status);
    if (includeDeleted) u.set("includeDeleted", "1");
    return u.toString();
  }, [q, page, limit, sort, status, includeDeleted]);

  async function load() {
    setMsg("");
    setLoading(true);
    try {
      const res = await api(`/api/items?${params}`);
      setRows(res.items || []);
      setTotal(res.total || 0);
    } catch (e) {
      setMsg(e.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [params]);

  function openNew() {
    if (!me) return toast?.error?.("Please login first");
    setDraft({ title: "", price: 0, description: "" });
    setOpenCreate(true);
  }

  async function submitNew(e) {
    e.preventDefault();
    try {
      const payload = { ...draft, price: Number(draft.price), sellerId: me._id };
      await api("/api/items", { method: "POST", body: payload, auth: true });
      toast?.success?.("Created");
      setOpenCreate(false);
      load();
    } catch (e) {
      toast?.error?.(e.message);
    }
  }

  function openEditItem(item) {
    setEditId(item._id);
    setDraft({
      title: item.title,
      price: item.price,
      description: item.description || "",
    });
    setOpenEdit(true);
  }

  async function submitEdit(e) {
    e.preventDefault();
    try {
      await api(`/api/items/${editId}`, {
        method: "PUT",
        body: { ...draft, price: Number(draft.price) },
        auth: true,
      });
      toast?.success?.("Updated");
      setOpenEdit(false);
      setEditId(null);
      load();
    } catch (e) {
      toast?.error?.(e.message);
    }
  }

  async function softDelete(id) {
    if (!confirm("Soft-delete this item?")) return;
    try {
      await api(`/api/items/${id}`, { method: "DELETE", auth: true });
      toast?.("Soft-deleted");
      load();
    } catch (e) {
      toast?.error?.(e.message);
    }
  }

  async function softRestore(id) {
    try {
      await api(`/api/items/${id}`, {
        method: "PUT",
        body: { isDeleted: false },
        auth: true,
      });
      toast?.success?.("Restored");
      load();
    } catch (e) {
      toast?.error?.(e.message);
    }
  }

  const pages = Math.max(1, Math.ceil(total / limit));
  const statusColor = (s) => (s === "active" ? "blue" : s === "sold" ? "gold" : "gray");

  return (
    <div className="section page-fade grid gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h1 className="title-glow">Items (Admin)</h1>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <input
            className="input w-48"
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            placeholder="search q"
          />
          <select
            className="select"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="">status: all</option>
            <option value="active">active</option>
            <option value="sold">sold</option>
            <option value="inactive">inactive</option>
          </select>
          <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="-createdAt">Newest</option>
            <option value="createdAt">Oldest</option>
            <option value="-price">Price high → low</option>
            <option value="price">Price low → high</option>
          </select>
          <label className="flex items-center gap-2 text-white/80">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => setIncludeDeleted(e.target.checked)}
            />
            Include Deleted
          </label>
          <H2HButton variant="primary" onClick={load}>
            ↻ Reload
          </H2HButton>
          <H2HButton variant="gold" onClick={openNew} disabled={!canCreate}>
            + New
          </H2HButton>
        </div>
      </div>

      {/* Table */}
      <H2HCard className="overflow-x-auto">
        <table className="table min-w-[800px]">
          <thead>
            <tr>
              <th className="th">ID</th>
              <th className="th">Title</th>
              <th className="th">Price</th>
              <th className="th">Status</th>
              <th className="th">Seller</th>
              <th className="th text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="td" colSpan={6}>
                    <H2HSkeleton height="30px" />
                  </td>
                </tr>
              ))
            ) : msg ? (
              <tr>
                <td className="td text-red-400" colSpan={6}>
                  ❌ {msg}
                </td>
              </tr>
            ) : rows.length ? (
              rows.map((r) => (
                <H2HTableRow
                  key={r._id}
                  cells={[
                    <span className="font-mono" key="id">
                      {r._id}
                    </span>,
                    r.title,
                    <span key="price" className="num">
                      {(r.price ?? 0).toLocaleString()}
                    </span>,
                    <H2HTag key="status" text={r.status || "inactive"} color={statusColor(r.status)} />,
                    <span className="font-mono" key="seller">
                      {r.sellerId}
                    </span>,
                    <div className="flex justify-end gap-2" key="action">
                      {!r.isDeleted ? (
                        <>
                          <H2HButton variant="primary" onClick={() => openEditItem(r)}>
                            Edit
                          </H2HButton>
                          <H2HButton variant="ghost" onClick={() => softDelete(r._id)}>
                            Soft-delete
                          </H2HButton>
                        </>
                      ) : (
                        <H2HButton variant="gold" onClick={() => softRestore(r._id)}>
                          Restore
                        </H2HButton>
                      )}
                    </div>,
                  ]}
                />
              ))
            ) : (
              <tr>
                <td className="td text-center text-[var(--fg-muted)] italic" colSpan={6}>
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </H2HCard>

      {/* Pager */}
      <div className="ml-auto flex items-center gap-2">
        <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Prev
        </button>
        <span className="text-white/70">
          {page} / {Math.max(1, Math.ceil(total / limit))}
        </span>
        <button className="btn btn-ghost" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
          Next
        </button>
      </div>

      {/* Create */}
      <H2HModal show={openCreate} onClose={() => setOpenCreate(false)} title="Create Item">
        <form onSubmit={submitNew} className="grid gap-3">
          <input
            className="input"
            required
            value={draft.title}
            onChange={(e) => setDraft((s) => ({ ...s, title: e.target.value }))}
            placeholder="title"
          />
          <input
            className="input"
            required
            type="number"
            min="0"
            value={draft.price}
            onChange={(e) => setDraft((s) => ({ ...s, price: e.target.value }))}
            placeholder="price"
          />
          <textarea
            className="textarea"
            value={draft.description}
            onChange={(e) => setDraft((s) => ({ ...s, description: e.target.value }))}
            placeholder="description"
            rows={3}
          />
          <div className="flex gap-2 justify-end">
            <H2HButton type="button" variant="ghost" onClick={() => setOpenCreate(false)}>
              Cancel
            </H2HButton>
            <H2HButton type="submit" variant="gold">
              Create
            </H2HButton>
          </div>
        </form>
      </H2HModal>

      {/* Edit */}
      <H2HModal show={openEdit} onClose={() => setOpenEdit(false)} title="Edit Item">
        <form onSubmit={submitEdit} className="grid gap-3">
          <input
            className="input"
            required
            value={draft.title}
            onChange={(e) => setDraft((s) => ({ ...s, title: e.target.value }))}
            placeholder="title"
          />
          <input
            className="input"
            required
            type="number"
            min="0"
            value={draft.price}
            onChange={(e) => setDraft((s) => ({ ...s, price: e.target.value }))}
            placeholder="price"
          />
          <textarea
            className="textarea"
            value={draft.description}
            onChange={(e) => setDraft((s) => ({ ...s, description: e.target.value }))}
            placeholder="description"
            rows={3}
          />
          <div className="flex gap-2 justify-end">
            <H2HButton type="button" variant="ghost" onClick={() => setOpenEdit(false)}>
              Cancel
            </H2HButton>
            <H2HButton type="submit" variant="gold">
              Save
            </H2HButton>
          </div>
        </form>
      </H2HModal>
    </div>
  );
}
