import app from "./app";
import connectDB from "./config/database";
import http from "http";
import { Server } from "socket.io";
import { getLeaderboardService } from "./services/leaderboard.service";
import { env } from "./config/env";

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: env.CORS_ORIGIN,
  },
  transports: ["websocket"],
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  getLeaderboardService()
    .then((leaderboard) => {
      socket.emit("leaderboard:update", leaderboard);
    })
    .catch((err) => {
      console.error("Leaderboard error:", err);
    });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

const startServer = async () => {
  await connectDB();

  server.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
