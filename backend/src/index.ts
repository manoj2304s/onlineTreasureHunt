import dotenv from "dotenv";
import app from "./app";
import connectDB from "./config/database";
import http from "http";
import { Server } from "socket.io";
import { getLeaderboardService } from "./services/leaderboard.service";

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "*",
  },
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

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
