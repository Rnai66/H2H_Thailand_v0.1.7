// frontend/src/pages/Checkout.jsx
import React, { useMemo, useState } from "react";
import api from "../lib/api"; // ✅ default export
import { useNavigate, useLocation } from "react-router-dom";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function Checkout({ toast = console }) {
  const q = useQuery();
  const navigate = useNavigate();

  const itemId = q.get("itemId") || "";
  const initAmount = Number(q.get("amount") || 0);
  const initTitle = q.get("title") || "";

  const [amount, setAmount] = useState(initAmount);
  const [method, setMethod] = useState("other");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [paymentId, setPaymentId] = useState(null);
  const [status, setStatus] = useState("draft"); // draft -> created -> paid/failed

  async function createPayment(e) {
    e.preventDefault();
    if (!itemId) return toast?.error?.("Missing itemId");
    if (!amount || amount <= 0) return toast?.error?.("Invalid amount");

    setLoading(true);
    try {
      const res = await api("/api/payments", {
        method: "POST",
        auth: true,
        body: {
          orderId: itemId,           // ใช้ itemId เป็นออเดอร์ไอดีง่ายๆ
          amount: Number(amount),
          method,                    // "cash" | "card" | "brocoin" | "other"
          meta: { note, title: initTitle },
        },
      });
      setPaymentId(res?.payment?.id || res?.payment?._id);
      setStatus("created");
      toast?.success?.("Payment created");
    } catch (e) {
      toast?.error?.(e.message || "Create payment failed");
    } finally {
      setLoading(false);
    }
  }

  async function confirmPay() {
    if (!paymentId) return;
    setLoading(true);
    try {
      const res = await api(`/api/payments/${paymentId}/pay`, {
        method: "PATCH",
        auth: true,
        body: { status: "paid" },
      });
      setStatus("paid");
      toast?.success?.("Payment paid ✅");
      // กลับไปหน้า items หลังชำระสำเร็จ
      setTimeout(() => navigate("/items"), 650);
    } catch (e) {
      setStatus("failed");
      toast?.error?.(e.message || "Pay failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="section page-fade">
      <div className="mb-6">
        <h1 className="title-glow mb-1">Checkout</h1>
        <p className="subtitle text-[var(--fg-muted)]">
          ยืนยันการสั่งซื้อ/ชำระเงิน สำหรับสินค้า: <span className="badge">{initTitle || itemId}</span>
        </p>
      </div>

      <div className="card grid gap-3 max-w-xl">
        <div className="grid gap-2">
          <label className="text-sm text-[var(--fg-muted)]">Item ID</label>
          <input className="input" value={itemId} readOnly />
        </div>
        <div className="grid gap-2">
          <label className="text-sm text-[var(--fg-muted)]">Amount</label>
          <input
            className="input"
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value || 0))}
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm text-[var(--fg-muted)]">Method</label>
          <select className="select" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="other">Other</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="brocoin">BroCoin</option>
          </select>
        </div>
        <div className="grid gap-2">
          <label className="text-sm text-[var(--fg-muted)]">Note (optional)</label>
          <textarea
            className="textarea"
            rows={3}
            placeholder="เช่น นัดรับ / ที่อยู่ / ข้อความถึงผู้ขาย"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {!paymentId ? (
          <div className="flex justify-end gap-2">
            <button className="btn btn-ghost" onClick={() => navigate(-1)}>Back</button>
            <button className="btn btn-gold" onClick={createPayment} disabled={loading}>
              {loading ? "Creating..." : "Create Payment"}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <div className="badge">Payment ID</div>
              <div className="font-mono">{paymentId}</div>
              <div className="text-sm text-[var(--fg-muted)]">status: {status}</div>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-ghost" onClick={() => navigate(-1)} disabled={loading}>
                Cancel
              </button>
              <button className="btn btn-gold" onClick={confirmPay} disabled={loading || status === "paid"}>
                {loading ? "Paying..." : status === "paid" ? "Paid ✅" : "Confirm Pay"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
