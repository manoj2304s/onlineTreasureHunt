import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.routes";
import authRoutes from "./routes/auth.routes";
import gameRoutes from "./routes/game.routes";
import adminRoutes from "./routes/admin.routes";

const app = express();
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());

app.use("/health", healthRoutes);
app.use("/auth", authRoutes);
app.use("/gameplay", gameRoutes);
app.use("/admin", adminRoutes);

export default app;


