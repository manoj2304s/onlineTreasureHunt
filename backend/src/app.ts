import express from "express";
import cors from "cors";
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

const app = express();
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json());

app.use("/health", healthRoutes);
app.use("/auth", authRoutes);
app.use("/gameplay", gameRoutes);
app.use("/admin", adminRoutes);
app.use("/admin", adminMonitorRoutes);
app.use("/admin", adminControlRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
