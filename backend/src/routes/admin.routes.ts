import { Router } from "express";
import {
  createLevel,
  deleteLevel,
  endGame,
  exportLeaderboard,
  getGameStatus,
  getLevels,
  resetGame,
  startGame,
  updateLevel,
} from "../controllers/admin.controller";
import { adminMiddleware } from "../middlewares/admin.middleware";
import { protect } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createLevelSchema,
  updateLevelSchema,
  adminActionSchema,
} from "../validators/admin.validator";

const router = Router();

router.post(
  "/levels",
  protect,
  adminMiddleware,
  validate(createLevelSchema),
  createLevel,
);
router.get("/levels", protect, adminMiddleware, getLevels);
router.put(
  "/levels/:id",
  protect,
  adminMiddleware,
  validate(updateLevelSchema),
  updateLevel,
);
router.delete("/levels/:id", protect, adminMiddleware, deleteLevel);
router.post(
  "/gameplay/start",
  protect,
  adminMiddleware,
  validate(adminActionSchema),
  startGame,
);
router.post(
  "/gameplay/end",
  protect,
  adminMiddleware,
  validate(adminActionSchema),
  endGame,
);
router.get("/gameplay/status", protect, adminMiddleware, getGameStatus);
router.post(
  "/reset-game",
  protect,
  adminMiddleware,
  validate(adminActionSchema),
  resetGame,
);
router.get("/export-leaderboard", protect, adminMiddleware, exportLeaderboard);

export default router;
