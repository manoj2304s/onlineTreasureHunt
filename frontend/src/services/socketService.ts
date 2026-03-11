import { io } from "socket.io-client";

export const socket = io(process.env.EXPO_PUBLIC_SOCKET_URL, {
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("Socket connected:", socket.id);
});

socket.on("disconnect", () => {
  console.log("Socket disconnected");
});
