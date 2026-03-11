import { Router } from "express";
import {
  getGameStats,
  getLevelAnalytics,
  getPlayerProgress,
  getActivities,
} from "../controllers/admin.monitor.controller";
import { adminMiddleware } from "../middlewares/admin.middleware";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.get("/stats", protect, adminMiddleware, getGameStats);
router.get("/players", protect, adminMiddleware, getPlayerProgress);
router.get("/levels/analytics", protect, adminMiddleware, getLevelAnalytics);
router.get("/activities", protect, adminMiddleware, getActivities);

export default router;
