import express from "express";
import healthRoutes from "./routes/health.routes";
import authRoutes from "./routes/auth.routes";
import gameRoutes from "./routes/game.routes";
import adminRoutes from "./routes/admin.routes";

const app = express();
app.use(express.json());

app.use("/health", healthRoutes);
app.use("/auth", authRoutes);
app.use("/game", gameRoutes);
app.use("/admin", adminRoutes);

export default app;
