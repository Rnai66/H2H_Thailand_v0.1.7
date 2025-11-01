import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { socket } from "../lib/socket";

export default function ChatPage({ me }) {
  const { roomId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!roomId || !me) return;

    // ✅ join ห้องเพียงครั้งเดียว
    if (socket.joinedRoom !== roomId) {
      socket.emit("join_room", roomId);
      socket.joinedRoom = roomId;
      console.log("🟡 joined room:", roomId);
    }

    // ✅ clear listener เดิมก่อนทุกครั้ง
    socket.off("receive_message");
    socket.on("receive_message", (data) => {
      console.log("🟢 receive_message:", data);

      // ✅ ป้องกันข้อความซ้ำ
      setMessages((prev) => {
        const exists = prev.some(
          (m) =>
            (m._localId && data._localId && m._localId === data._localId) ||
            (m.user === data.user &&
              m.message === data.message &&
              Math.abs(new Date(m.time) - new Date(data.time)) < 1000)
        );
        return exists ? prev : [...prev, data];
      });
    });

    return () => socket.off("receive_message");
  }, [roomId, me]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const msgData = {
      roomId,
      user: me?.email || "Guest",
      message: input.trim(),
      time: new Date().toISOString(),
      _localId: Date.now() + "-" + Math.random().toString(36).slice(2, 8),
    };

    // ✅ ส่งไป server เท่านั้น (ไม่ append local ทันที)
    socket.emit("send_message", msgData);
    setInput("");
  };

  return (
    <div className="page-fade flex justify-center py-6">
      <div className="w-full max-w-3xl bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <h2 className="title-glow text-2xl mb-4">💬 Chat Room #{roomId}</h2>

        <div className="h-[60vh] overflow-y-auto bg-[var(--bg-soft)] rounded-xl p-4 space-y-3">
          {messages.map((msg, i) => (
            <div
              key={msg._localId || i}
              className={`flex ${
                msg.user === me?.email ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-4 py-2 rounded-2xl max-w-[75%] ${
                  msg.user === me?.email
                    ? "bg-gradient-to-r from-[#f2c14e] to-[#f2b84e] text-black"
                    : "bg-[#1a1f2c] text-white"
                }`}
              >
                <div className="text-xs opacity-70 mb-1">
                  {msg.user === me?.email ? "You" : msg.user}
                </div>
                <div>{msg.message}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="mt-4 flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="พิมพ์ข้อความ..."
            className="flex-1 input rounded-xl"
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#f2c14e] to-[#f2b84e] text-black hover:opacity-90"
          >
            ส่ง
          </button>
        </div>
      </div>
    </div>
  );
}
