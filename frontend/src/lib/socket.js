import { io } from "socket.io-client";

const BASE = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");

export const socket = io(BASE, {
  withCredentials: true,
  transports: ["websocket"],
});

export function joinRoom(roomId) {
  if (!roomId) return;
  socket.emit("join_room", roomId);
}
