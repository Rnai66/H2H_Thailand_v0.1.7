import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { socket, joinRoom } from "../lib/socket";

export default function ChatPage({ me }) {
  const { roomId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // === เข้าห้องและฟังข้อความใหม่ ===
  useEffect(() => {
    if (!roomId) return;

    joinRoom(roomId);
    console.log("🟡 joinRoom:", roomId);

    socket.on("receive_message", (data) => {
      console.log("🟢 receive_message:", data);
      setMessages((prev) => [...prev, data]);
    });

    // cleanup
    return () => socket.off("receive_message");
  }, [roomId]);

  // === scroll อัตโนมัติเมื่อมีข้อความใหม่ ===
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage() {
    if (!input.trim()) return;
    const msgData = {
      roomId,
      user: me?.email || "Guest",
      message: input.trim(),
    };
    socket.emit("send_message", msgData);
    console.log("🟣 send_message:", msgData);
    setMessages((prev) => [...prev, msgData]);
    setInput("");
  }

  return (
    <div className="section page-fade">
      <div className="max-w-3xl mx-auto bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] shadow-xl">
        <h1 className="title-glow text-xl mb-3">💬 Chat Room: {roomId}</h1>

        {/* กล่องข้อความ */}
        <div className="h-[60vh] overflow-y-auto bg-[var(--bg-soft)] rounded-xl p-4 space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
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
                <div className="text-xs opacity-70 mb-1">{msg.user}</div>
                <div>{msg.message}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* ช่องพิมพ์ */}
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
