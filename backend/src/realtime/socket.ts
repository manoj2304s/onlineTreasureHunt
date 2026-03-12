import http from "http";
import { Server } from "socket.io";
import { env } from "../config/env";
import { logger } from "../utils/logger";

let ioInstance: Server | null = null;

export const initSocket = (server: http.Server) => {
  ioInstance = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || env.CORS_ORIGINS.includes(origin)) {
          callback(null, true);
          return;
        }

        logger.warn("socket_cors_blocked", {
          origin,
          allowedOrigins: env.CORS_ORIGINS,
        });
        callback(new Error("Not allowed by socket CORS"));
      },
    },
    transports: ["websocket"],
  });

  return ioInstance;
};

export const getIO = () => ioInstance;

export const emitSocket = (event: string, payload: unknown) => {
  ioInstance?.emit(event, payload);
};
