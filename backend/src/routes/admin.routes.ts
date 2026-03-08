import { Router } from "express";
import {
  createLevel,
  deleteLevel,
  endGame,
  getGameStatus,
  getLevels,
  resetGame,
  startGame,
  updateLevel,
} from "../controllers/admin.controller";
import { adminMiddleware } from "../middlewares/admin.middleware";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.post("/levels", protect, adminMiddleware, createLevel);
router.get("/levels", protect, adminMiddleware, getLevels);
router.put("/levels/:id", protect, adminMiddleware, updateLevel);
router.delete("/levels/:id", protect, adminMiddleware, deleteLevel);
router.post("/game/start", protect, adminMiddleware, startGame);
router.post("/game/end", protect, adminMiddleware, endGame);
router.get("/game/status", protect, adminMiddleware, getGameStatus);
router.post("/reset-game", protect, adminMiddleware, resetGame);

export default router;
