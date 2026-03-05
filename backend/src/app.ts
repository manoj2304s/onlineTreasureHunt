import express from "express";
import healthRoutes from "./routes/health.routes";
import authRoutes from "./routes/auth.routes";

const app = express();
app.use(express.json());

app.use("/health", healthRoutes);
app.use("/auth", authRoutes);

export default app;
