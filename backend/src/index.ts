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

io.on("connection", async (socket) => {
  const leaderboard = await getLeaderboardService();
  socket.emit("leaderboard:update", leaderboard);
  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);
  });
});

const startServer = async () => {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
