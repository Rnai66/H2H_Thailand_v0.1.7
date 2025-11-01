import { Server } from "socket.io";

export function initChatSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  console.log("✅ Chat socket initialized");

  io.on("connection", (socket) => {
    console.log("💬 user connected:", socket.id);

    socket.on("join_room", (roomId) => {
      socket.join(roomId);
      console.log(`✅ User ${socket.id} joined room ${roomId}`);
    });

    socket.on("send_message", (data) => {
      const { roomId, user, message } = data;
      console.log(`[${roomId}] ${user}: ${message}`);
      io.to(roomId).emit("receive_message", { user, message });
    });

    socket.on("disconnect", () => {
      console.log(`❌ user disconnected: ${socket.id}`);
    });
  });
}
