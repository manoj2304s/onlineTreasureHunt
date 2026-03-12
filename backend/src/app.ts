import express from "express";
import cors from "cors";
import helmet from "helmet";
import healthRoutes from "./routes/health.routes";
import authRoutes from "./routes/auth.routes";
import gameRoutes from "./routes/game.routes";
import adminRoutes from "./routes/admin.routes";
import adminMonitorRoutes from "./routes/admin.monitor.routes";
import adminControlRoutes from "./routes/admin.control.routes";
import { env } from "./config/env";
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware";
import { requestContext } from "./middlewares/requestContext.middleware";
import { requestLogger } from "./middlewares/requestLogger.middleware";
import { logger } from "./utils/logger";

const isOriginAllowed = (origin: string | undefined) => {
  if (!origin) {
    // Native apps / non-browser clients may not send Origin.
    return true;
  }
  return env.CORS_ORIGINS.includes(origin);
};

const app = express();
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
        return;
      }

      logger.warn("cors_blocked", {
        origin,
        allowedOrigins: env.CORS_ORIGINS,
      });
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: env.BODY_LIMIT }));
app.use(requestContext);
app.use(requestLogger);

app.use("/health", healthRoutes);
app.use("/auth", authRoutes);
app.use("/gameplay", gameRoutes);
app.use("/admin", adminRoutes);
app.use("/admin", adminMonitorRoutes);
app.use("/admin", adminControlRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
