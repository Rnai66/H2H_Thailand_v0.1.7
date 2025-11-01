// ======= socket/chat.js =======
import { Server } from "socket.io";

export function initChat(server) {
  const io = new Server(server, {
    cors: { origin: ["http://localhost:5173"], methods: ["GET", "POST"] },
  });

  console.log("✅ Chat socket initialized");

  io.on("connection", (socket) => {
    console.log("💬 user connected:", socket.id);

    socket.on("join_room", (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on("send_message", (data) => {
      const { roomId, user, message } = data;
      if (!roomId || !user || !message) return;
      console.log(`[${roomId}] ${user}: ${message}`);
      io.to(roomId).emit("receive_message", data);

      // 🔔 broadcast แจ้งเตือน “ผู้ใช้คนอื่นในระบบ”
      socket.broadcast.emit("new_message_alert", {
        roomId,
        user,
        message,
        time: Date.now(),
      });
    });

    socket.on("disconnect", () => {
      console.log("❌ user disconnected:", socket.id);
    });
  });
}
