import app from "./app";
import connectDB from "./config/database";
import http from "http";
import mongoose from "mongoose";
import { getLeaderboardService } from "./services/leaderboard.service";
import { env } from "./config/env";
import { initSocket } from "./realtime/socket";
import { logger } from "./utils/logger";

const server = http.createServer(app);

const io = initSocket(server);

io.on("connection", (socket) => {
  logger.info("socket_connected", { socketId: socket.id });

  getLeaderboardService()
    .then((leaderboard) => {
      socket.emit("leaderboard:update", leaderboard);
    })
    .catch((err) => {
      logger.error("leaderboard_emit_failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    });

  socket.on("disconnect", () => {
    logger.info("socket_disconnected", { socketId: socket.id });
  });
});

let isShuttingDown = false;
let shutdownTimer: NodeJS.Timeout | null = null;

const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  logger.info("graceful_shutdown_started", { signal });

  shutdownTimer = setTimeout(() => {
    logger.error("graceful_shutdown_forced_exit");
    process.exit(1);
  }, 10000);

  try {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
    io.close();
    await mongoose.connection.close(false);
    logger.info("graceful_shutdown_completed");
    if (shutdownTimer) {
      clearTimeout(shutdownTimer);
    }
    process.exit(0);
  } catch (error) {
    logger.error("graceful_shutdown_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    if (shutdownTimer) {
      clearTimeout(shutdownTimer);
    }
    process.exit(1);
  }
};

process.on("SIGINT", () => {
  void gracefulShutdown("SIGINT");
});
process.on("SIGTERM", () => {
  void gracefulShutdown("SIGTERM");
});
process.on("uncaughtException", (error) => {
  logger.error("uncaught_exception", { error: error.message });
  void gracefulShutdown("uncaughtException");
});
process.on("unhandledRejection", (reason) => {
  logger.error("unhandled_rejection", {
    reason: reason instanceof Error ? reason.message : String(reason),
  });
  void gracefulShutdown("unhandledRejection");
});

const startServer = async () => {
  await connectDB();

  server.listen(env.PORT, () => {
    logger.info("server_started", { port: env.PORT });
  });
};

startServer().catch((error) => {
  logger.error("server_start_failed", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
